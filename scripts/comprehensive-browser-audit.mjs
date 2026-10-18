import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';

const EVIDENCE_DIR = path.resolve('audit_evidence', 'screenshots');
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

class BrowserAuditClient {
  constructor(port = 9222) {
    this.port = port;
    this.ws = null;
    this.msgId = 1;
    this.callbacks = new Map();
    this.events = new Map();
    this.sessionId = null;
    this.consoleLogs = [];
    this.networkErrors = [];
    this.targetId = null;
  }

  async launch() {
    const tempProfile = path.join(os.tmpdir(), `sparovia_audit_prof_${Date.now()}`);
    this.tempProfile = tempProfile;
    this.browserProcess = spawn(
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      [
        '--headless=new',
        `--remote-debugging-port=${this.port}`,
        `--user-data-dir=${tempProfile}`,
        '--no-first-run',
        '--disable-gpu',
        '--no-default-browser-check',
        '--window-size=1440,900',
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] }
    );

    let attempts = 0;
    while (attempts < 20) {
      try {
        const res = await fetch(`http://127.0.0.1:${this.port}/json/version`);
        if (res.ok) {
          const json = await res.json();
          this.wsUrl = json.webSocketDebuggerUrl;
          break;
        }
      } catch {
        await new Promise((r) => setTimeout(r, 200));
      }
      attempts++;
    }

    if (!this.wsUrl) throw new Error('Could not connect to Chrome CDP endpoint.');

    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        else resolve(msg.result);
      } else if (msg.method) {
        if (msg.method === 'Runtime.consoleAPICalled') {
          const text = msg.params?.args?.map((a) => a.value || a.description || '').join(' ');
          this.consoleLogs.push({ type: msg.params.type, text, timestamp: Date.now() });
        } else if (msg.method === 'Runtime.exceptionThrown') {
          const text = msg.params?.exceptionDetails?.text || msg.params?.exceptionDetails?.exception?.description || 'Exception';
          this.consoleLogs.push({ type: 'error', text, timestamp: Date.now() });
        } else if (msg.method === 'Network.loadingFailed') {
          this.networkErrors.push({ url: msg.params.requestId, error: msg.params.errorText });
        }
      }
    };

    // Attach to initial page target
    const target = await this.sendBrowser('Target.createTarget', { url: 'about:blank' });
    this.targetId = target.targetId;

    const attached = await this.sendBrowser('Target.attachToTarget', {
      targetId: this.targetId,
      flatten: true,
    });
    this.sessionId = attached.sessionId;

    await this.sendSession('Page.enable');
    await this.sendSession('Runtime.enable');
    await this.sendSession('DOM.enable');
    await this.sendSession('Network.enable');
  }

  sendBrowser(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  sendSession(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, sessionId: this.sessionId, method, params }));
    });
  }

  async setViewport(width, height) {
    await this.sendSession('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });
    await new Promise((r) => setTimeout(r, 150));
  }

  async navigate(url, waitTime = 1200) {
    this.consoleLogs = [];
    this.networkErrors = [];
    await this.sendSession('Page.navigate', { url });
    await new Promise((r) => setTimeout(r, waitTime));
  }

  async evaluate(expression) {
    const res = await this.sendSession('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res?.result?.value;
  }

  async screenshot(filename) {
    const res = await this.sendSession('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    const filePath = path.join(EVIDENCE_DIR, filename);
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    return filePath;
  }

  async checkOverflow() {
    return await this.evaluate(`(() => {
      const docW = document.documentElement.scrollWidth;
      const winW = window.innerWidth;
      const hasOverflow = docW > winW;
      let overflowingSelector = null;
      if (hasOverflow) {
        const all = document.querySelectorAll('*');
        for (const el of all) {
          const rect = el.getBoundingClientRect();
          if (rect.right > winW + 1) {
            overflowingSelector = el.tagName + (el.className ? '.' + String(el.className).split(' ').slice(0, 2).join('.') : '');
            break;
          }
        }
      }
      return { hasOverflow, docW, winW, overflowingSelector };
    })()`);
  }

  async getAccessibilityIssues() {
    return await this.evaluate(`(() => {
      const issues = [];
      // 1. Missing alt on images
      document.querySelectorAll('img:not([alt])').forEach(img => {
        issues.push({ type: 'img-alt-missing', src: img.src });
      });
      // 2. Buttons without accessible names
      document.querySelectorAll('button').forEach(btn => {
        const name = btn.innerText?.trim() || btn.getAttribute('aria-label') || btn.title;
        if (!name) issues.push({ type: 'button-name-missing', html: btn.outerHTML.slice(0, 80) });
      });
      // 3. Inputs without associated labels or aria-label
      document.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach(input => {
        const id = input.id;
        const hasLabel = id && document.querySelector('label[for="' + id + '"]');
        const ariaLabel = input.getAttribute('aria-label') || input.getAttribute('aria-labelledby');
        const placeholder = input.placeholder;
        if (!hasLabel && !ariaLabel && !placeholder) {
          issues.push({ type: 'input-label-missing', name: input.name || input.id });
        }
      });
      return issues;
    })()`);
  }

  async close() {
    if (this.ws) this.ws.close();
    if (this.browserProcess) this.browserProcess.kill();
    try {
      if (this.tempProfile && fs.existsSync(this.tempProfile)) {
        fs.rmSync(this.tempProfile, { recursive: true, force: true });
      }
    } catch {}
  }
}

export { BrowserAuditClient, EVIDENCE_DIR };
