import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';

class SimpleCDP {
  constructor(port = 9222) {
    this.port = port;
    this.ws = null;
    this.msgId = 1;
    this.callbacks = new Map();
    this.consoleLogs = [];
    this.networkErrors = [];
  }

  async startBrowser() {
    const tempProfile = path.join(os.tmpdir(), `sparovia_audit_profile_${Date.now()}`);
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
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] }
    );

    // wait for cdp to be ready
    let attempts = 0;
    while (attempts < 20) {
      try {
        const res = await fetch(`http://127.0.0.1:${this.port}/json/version`);
        if (res.ok) {
          const json = await res.json();
          this.wsUrl = json.webSocketDebuggerUrl;
          break;
        }
      } catch (e) {
        await new Promise((r) => setTimeout(r, 250));
      }
      attempts++;
    }

    if (!this.wsUrl) {
      throw new Error('Failed to connect to Chrome DevTools port');
    }

    // Connect websocket
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
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async close() {
    if (this.ws) {
      this.ws.close();
    }
    if (this.browserProcess) {
      this.browserProcess.kill();
    }
    try {
      if (this.tempProfile && fs.existsSync(this.tempProfile)) {
        fs.rmSync(this.tempProfile, { recursive: true, force: true });
      }
    } catch {}
  }
}

async function run() {
  const cdp = new SimpleCDP();
  try {
    await cdp.startBrowser();
    console.log('Browser started with WebSocket:', cdp.wsUrl);
    // Create new target
    const target = await cdp.send('Target.createTarget', { url: 'http://localhost:3000' });
    console.log('Target created:', target.targetId);
  } catch (err) {
    console.error('Run failed:', err);
  } finally {
    await cdp.close();
  }
}

run();
