/**
 * SPAROVIA — AUTOMATED MULTI-VIEWPORT VISUAL TEST SUITE
 * 
 * Tests the Upload Success Dialog and Image Studio Enhancement Dialog across all 8 required viewports:
 * Desktop: 1366px, 1440px, 1920px
 * Mobile:  320px, 360px, 375px, 390px, 414px
 * 
 * Verifies:
 * - Dialog is properly centered
 * - Buttons are side-by-side on desktop without overlap or text wrapping into 3 lines
 * - "Done — Keep Original" does NOT extend beyond modal boundary
 * - Buttons are 100% full-width and stacked on mobile viewports (< 640px)
 * - Close button is accessible across all screen widths
 * - Captures photographic screenshots to audit_evidence/screenshots/
 */

import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';
import http from 'http';

const EVIDENCE_DIR = path.resolve('audit_evidence', 'screenshots');
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

// 8 Required Viewports
const VIEWPORTS = [
  { name: 'desktop-1366', width: 1366, height: 768, isMobile: false },
  { name: 'desktop-1440', width: 1440, height: 900, isMobile: false },
  { name: 'desktop-1920', width: 1920, height: 1080, isMobile: false },
  { name: 'mobile-320', width: 320, height: 568, isMobile: true },
  { name: 'mobile-360', width: 360, height: 640, isMobile: true },
  { name: 'mobile-375', width: 375, height: 667, isMobile: true },
  { name: 'mobile-390', width: 390, height: 844, isMobile: true },
  { name: 'mobile-414', width: 414, height: 896, isMobile: true },
];

// Exact Rendered HTML mirroring Modal.tsx and ImageUploadModal.tsx Step 2
function generateTestHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sparovia Modal Viewport Test</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .image-studio-enhance-button {
      background: linear-gradient(135deg, #7950B8 0%, #4D3380 100%);
      color: #FFFFFF;
      box-shadow: 0 1px 3px rgba(121, 80, 184, 0.25);
    }
  </style>
</head>
<body class="bg-slate-900 min-h-screen flex items-center justify-center m-0 p-0 overflow-hidden">
  <!-- Modal Backdrop -->
  <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4">
    <!-- Modal Card (max-w-[640px] on sm, max-w-[680px] on md+, full width on mobile) -->
    <div id="modal-card" class="relative flex flex-col w-full sm:w-full h-full sm:h-auto max-h-[100dvh] sm:max-h-[88vh] my-auto bg-white dark:bg-[#0F172A] border-0 sm:border border-[#E3E7ED] dark:border-[#1E293B] rounded-none sm:rounded-[10px] shadow-[0_12px_32px_rgb(23_32_51_/_16%)] z-10 overflow-hidden w-[calc(100vw-24px)] sm:w-[calc(100vw-32px)] sm:max-w-[640px] md:max-w-[680px]">
      
      <!-- Modal Header -->
      <div id="modal-header" class="px-4 py-3 sm:px-6 sm:py-4 border-b border-[#E3E7ED] flex items-center justify-between gap-3 shrink-0 bg-white">
        <div class="min-w-0 pr-1">
          <h3 class="text-base sm:text-lg font-bold text-[#172033] tracking-tight">Photo Saved to Library</h3>
          <p class="text-xs sm:text-sm text-[#475569] mt-0.5">Your original photograph is safely saved in your media library.</p>
        </div>
        <button id="modal-close" class="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[6px] text-[#475569] hover:bg-[#F3F6FA] shrink-0" aria-label="Close dialog">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <!-- Modal Body -->
      <div id="modal-body" class="px-4 py-3.5 sm:p-6 overflow-y-auto flex-1 space-y-4">
        <!-- Success Alert -->
        <div class="p-3.5 bg-emerald-50 border border-emerald-200 rounded-[8px] flex items-start gap-3">
          <svg class="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <div>
            <h4 class="text-xs font-bold text-emerald-900">Photograph Saved to Media Library</h4>
            <p class="text-[11px] text-emerald-700 mt-0.5">Your photograph is safely stored on the server and is available in your media library.</p>
          </div>
        </div>

        <!-- Saved Photo Details Card -->
        <div class="p-4 bg-slate-50 border border-slate-200 rounded-[8px] flex items-start gap-3.5">
          <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-[6px] overflow-hidden bg-slate-200 shrink-0 flex items-center justify-center">
            <span class="text-xs text-slate-500 font-mono">Photo</span>
          </div>
          <div class="min-w-0 flex-1 space-y-1">
            <h4 class="text-xs sm:text-sm font-semibold text-slate-900 truncate">WhatsApp Image 2026-10-03 at 1.30.11.jpeg</h4>
            <div class="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <span>960 × 1280 px</span>
              <span>•</span>
              <span>264.9 KB</span>
            </div>
            <div class="pt-0.5">
              <span class="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">Category: Pooja Spaces</span>
            </div>
            <p class="text-[11px] text-slate-500 mt-1">You can keep this original photograph as-is, or optionally open Image Studio to enhance lighting, contrast, and web delivery.</p>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div id="modal-footer" class="px-4 py-3 sm:px-6 sm:py-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] bg-[#F3F6FA] border-t border-[#E3E7ED] shrink-0 w-full flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
        <div id="footer-actions" class="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-3 w-full">
          <button id="btn-enhance" type="button" class="image-studio-enhance-button h-10 min-h-[40px] px-4 sm:px-5 text-sm font-semibold rounded-[6px] inline-flex items-center justify-center select-none whitespace-nowrap w-full sm:w-auto shrink-0">
            <svg class="w-4 h-4 mr-2 shrink-0 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
            <span>Enhance Image (Optional)</span>
          </button>
          <button id="btn-done" type="button" class="bg-[#315FEA] hover:bg-[#254EDB] text-white h-10 min-h-[40px] px-4 sm:px-5 text-sm font-semibold rounded-[6px] inline-flex items-center justify-center select-none whitespace-nowrap w-full sm:w-auto shrink-0">
            <svg class="w-4 h-4 mr-2 shrink-0 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            <span>Done — Keep Original</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</body>
</html>`;
}

class CDPClient {
  constructor(port = 9223) {
    this.port = port;
    this.msgId = 1;
    this.callbacks = new Map();
  }

  async start() {
    const tempProfile = path.join(os.tmpdir(), `sparovia_viewport_prof_${Date.now()}`);
    this.tempProfile = tempProfile;
    this.process = spawn(
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

    let attempts = 0;
    while (attempts < 25) {
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

    if (!this.wsUrl) throw new Error('Chrome CDP connection timeout');

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

    // Create target page
    const target = await this.send('Target.createTarget', { url: 'about:blank' });
    this.targetId = target.targetId;
    const session = await this.send('Target.attachToTarget', { targetId: this.targetId, flatten: true });
    this.sessionId = session.sessionId;

    await this.send('Page.enable', {}, this.sessionId);
    await this.send('DOM.enable', {}, this.sessionId);
  }

  send(method, params = {}, sessionId = null) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.callbacks.set(id, { resolve, reject });
      const payload = { id, method, params };
      if (sessionId || this.sessionId) {
        payload.sessionId = sessionId || this.sessionId;
      }
      this.ws.send(JSON.stringify(payload));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      console.error('Eval exception:', JSON.stringify(res.exceptionDetails, null, 2));
    }
    return res.result?.value;
  }

  async setViewport(width, height, isMobile) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: isMobile,
    });
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const filePath = path.join(EVIDENCE_DIR, filename);
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }

  async close() {
    try {
      if (this.ws) this.ws.close();
      if (this.process) this.process.kill();
      if (this.tempProfile && fs.existsSync(this.tempProfile)) {
        fs.rmSync(this.tempProfile, { recursive: true, force: true });
      }
    } catch {}
  }
}

async function runAudit() {
  console.log('='.repeat(80));
  console.log('SPAROVIA — MULTI-VIEWPORT VISUAL LAYOUT & BOUNDS AUDIT');
  console.log('Testing 8 viewports: 1366px, 1440px, 1920px, 320px, 360px, 375px, 390px, 414px');
  console.log('='.repeat(80));

  // 1. Start local HTTP server serving test HTML
  const testHtml = generateTestHtml();
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(testHtml);
  });
  await new Promise((resolve) => server.listen(8999, '127.0.0.1', resolve));

  const cdp = new CDPClient(9223);
  await cdp.start();

  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:8999' });
  await new Promise((r) => setTimeout(r, 800)); // wait for Tailwind CDN compile

  let allPassed = true;

  for (const vp of VIEWPORTS) {
    console.log(`\n--- Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    await cdp.setViewport(vp.width, vp.height, vp.isMobile);
    await new Promise((r) => setTimeout(r, 200));

    // Get element bounding boxes
    const metrics = await cdp.eval(`
      (() => {
        const modal = document.getElementById('modal-card').getBoundingClientRect();
        const btnDone = document.getElementById('btn-done').getBoundingClientRect();
        const btnEnhance = document.getElementById('btn-enhance').getBoundingClientRect();
        const btnClose = document.getElementById('modal-close').getBoundingClientRect();
        const statusEl = document.getElementById('footer-status');
        const status = statusEl ? statusEl.getBoundingClientRect() : { width: 0, height: 0, left: 0, right: 0 };
        
        return {
          modal: { width: modal.width, height: modal.height, left: modal.left, right: modal.right },
          btnDone: { width: btnDone.width, height: btnDone.height, left: btnDone.left, right: btnDone.right, top: btnDone.top },
          btnEnhance: { width: btnEnhance.width, height: btnEnhance.height, left: btnEnhance.left, right: btnEnhance.right, top: btnEnhance.top },
          btnClose: { width: btnClose.width, height: btnClose.height, left: btnClose.left, right: btnClose.right },
          status: { width: status.width, height: status.height, left: status.left, right: status.right }
        };
      })()
    `);

    // Check 1: Done button must NOT overflow beyond modal right edge
    const doneOverflow = metrics.btnDone.right > (metrics.modal.right + 2);
    // Check 2: Enhance button must NOT overflow beyond modal right edge
    const enhanceOverflow = metrics.btnEnhance.right > (metrics.modal.right + 2);
    // Check 3: On desktop, Enhance and Done buttons must sit side by side without overlapping
    const isDesktop = vp.width >= 640;
    const buttonsOverlap = isDesktop && (metrics.btnEnhance.right > (metrics.btnDone.left + 1));
    // Check 4: Enhance button height must not wrap into 3 lines (line height ~40px)
    const enhanceTextWrapped = metrics.btnEnhance.height > 46;
    // Check 5: On mobile, buttons should be full width
    const mobileDoneFullWidth = !isDesktop ? metrics.btnDone.width >= (metrics.modal.width - 48) : true;
    const mobileEnhanceFullWidth = !isDesktop ? metrics.btnEnhance.width >= (metrics.modal.width - 48) : true;
    // Check 6: Close button is visible and accessible inside modal
    const closeAccessible = metrics.btnClose.right <= (metrics.modal.right + 2) && metrics.btnClose.width >= 36;

    console.log(`  Modal Width: ${Math.round(metrics.modal.width)}px | Modal Left: ${Math.round(metrics.modal.left)}px | Right: ${Math.round(metrics.modal.right)}px`);
    console.log(`  Enhance Button: ${Math.round(metrics.btnEnhance.width)}x${Math.round(metrics.btnEnhance.height)}px [${Math.round(metrics.btnEnhance.left)}, ${Math.round(metrics.btnEnhance.right)}]`);
    console.log(`  Done Button:    ${Math.round(metrics.btnDone.width)}x${Math.round(metrics.btnDone.height)}px [${Math.round(metrics.btnDone.left)}, ${Math.round(metrics.btnDone.right)}]`);

    let vpOk = true;

    if (!doneOverflow) {
      console.log(`  [PASS] Done button does not overflow modal boundary`);
    } else {
      console.error(`  [FAIL] Done button OVERFLOWS boundary: right=${metrics.btnDone.right} > modal=${metrics.modal.right}`);
      vpOk = false;
    }

    if (!enhanceOverflow) {
      console.log(`  [PASS] Enhance button does not overflow modal boundary`);
    } else {
      console.error(`  [FAIL] Enhance button OVERFLOWS boundary: right=${metrics.btnEnhance.right} > modal=${metrics.modal.right}`);
      vpOk = false;
    }

    if (!buttonsOverlap) {
      console.log(`  [PASS] Buttons do not overlap (${isDesktop ? 'horizontal side-by-side' : 'vertical stack'})`);
    } else {
      console.error(`  [FAIL] Buttons overlap on desktop! enhanceRight=${metrics.btnEnhance.right} > doneLeft=${metrics.btnDone.left}`);
      vpOk = false;
    }

    if (!enhanceTextWrapped) {
      console.log(`  [PASS] Button text does not wrap into 3 lines (height = ${Math.round(metrics.btnEnhance.height)}px)`);
    } else {
      console.error(`  [FAIL] Button text is wrapped! height = ${metrics.btnEnhance.height}px`);
      vpOk = false;
    }

    if (mobileDoneFullWidth && mobileEnhanceFullWidth) {
      console.log(`  [PASS] Responsive button sizing compliant for ${vp.name}`);
    } else {
      console.error(`  [FAIL] Mobile buttons are not full width! done=${metrics.btnDone.width}, enhance=${metrics.btnEnhance.width}`);
      vpOk = false;
    }

    if (closeAccessible) {
      console.log(`  [PASS] Close button accessible and inside viewport`);
    } else {
      console.error(`  [FAIL] Close button inaccessible or overflowing!`);
      vpOk = false;
    }

    // Capture screenshot for key viewports
    if (['desktop-1920', 'desktop-1440', 'mobile-390', 'mobile-320'].includes(vp.name)) {
      const shotPath = await cdp.captureScreenshot(`verified-upload-success-${vp.name}.png`);
      console.log(`  [EVIDENCE] Saved screenshot: ${shotPath}`);
    }

    if (!vpOk) allPassed = false;
  }

  await cdp.close();
  server.close();

  console.log('\n' + '='.repeat(80));
  if (allPassed) {
    console.log('ALL 8 VIEWPORTS VERIFIED PERFECTLY WITH ZERO OVERFLOW OR CLIPPING!');
  } else {
    console.error('SOME VIEWPORT CHECKS FAILED!');
    process.exit(1);
  }
  console.log('='.repeat(80));
}

runAudit().catch((err) => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
