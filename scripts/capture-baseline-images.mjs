import { BrowserAuditClient } from './comprehensive-browser-audit.mjs';
import fs from 'fs';
import path from 'path';

const BASELINE_DIR = path.resolve('audit_evidence', 'screenshots', 'baseline');
if (!fs.existsSync(BASELINE_DIR)) {
  fs.mkdirSync(BASELINE_DIR, { recursive: true });
}

async function captureBaseline() {
  console.log('--- CAPTURING CURRENT BASELINE SCREENSHOTS ---');
  const client = new BrowserAuditClient(9222);
  await client.launch();

  try {
    // 1. Authenticate with pilot tenant
    const loginRes = await fetch('http://localhost:5043/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'pilot-auditor@sparovia.com',
        password: 'StrongPassword123!'
      })
    });
    const { accessToken } = await loginRes.json();
    console.log('✓ Obtained auth token');

    // Setup browser session with token
    await client.setViewport(1440, 900);
    await client.navigate('http://localhost:3001/login', 500);
    await client.evaluate(`localStorage.setItem('accessToken', '${accessToken}')`);

    // Helper for saving to baseline dir
    const takeBaselineScreenshot = async (name) => {
      const res = await client.sendSession('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: false,
      });
      const filePath = path.join(BASELINE_DIR, name);
      fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
      console.log(`Saved baseline: ${name}`);
      return filePath;
    };

    // 2. Images Library - Desktop 1440px
    await client.setViewport(1440, 900);
    await client.navigate('http://localhost:3001/admin/images', 2000);
    await takeBaselineScreenshot('baseline-images-desktop-1440.png');

    // 3. Images Library - 1024px, 768px, 375px, 320px
    await client.setViewport(1024, 768);
    await new Promise(r => setTimeout(r, 400));
    await takeBaselineScreenshot('baseline-images-desktop-1024.png');

    await client.setViewport(768, 1024);
    await new Promise(r => setTimeout(r, 400));
    await takeBaselineScreenshot('baseline-images-tablet-768.png');

    await client.setViewport(375, 812);
    await new Promise(r => setTimeout(r, 400));
    await takeBaselineScreenshot('baseline-images-mobile-375.png');

    await client.setViewport(320, 568);
    await new Promise(r => setTimeout(r, 400));
    await takeBaselineScreenshot('baseline-images-mobile-320.png');

    // 4. Open Upload Modal (Desktop 1440px)
    await client.setViewport(1440, 900);
    await client.evaluate(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const uploadBtn = btns.find(b => b.innerText.includes('Upload'));
      if (uploadBtn) uploadBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 800));
    await takeBaselineScreenshot('baseline-upload-modal-desktop.png');

    // Close upload modal
    await client.evaluate(`(() => {
      const closeBtn = document.querySelector('button[aria-label="Close dialog"]');
      if (closeBtn) closeBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 500));

    // 5. Open Image Studio Workspace (Desktop 1440px)
    const openedStudio = await client.evaluate(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const studioBtn = btns.find(b => b.innerText.trim() === 'Studio' || b.innerText.includes('Studio') || b.title?.includes('Studio'));
      if (studioBtn) {
        studioBtn.click();
        return true;
      }
      return false;
    })()`);
    console.log('Opened Studio:', openedStudio);
    await new Promise(r => setTimeout(r, 1200));
    await takeBaselineScreenshot('baseline-studio-desktop-1440.png');

    // 6. Image Studio - Mobile 375px
    await client.setViewport(375, 812);
    await new Promise(r => setTimeout(r, 600));
    await takeBaselineScreenshot('baseline-studio-mobile-375.png');

    // 7. Check modal positioning and metrics
    const studioMetrics = await client.evaluate(`(() => {
      const modal = document.querySelector('[role="dialog"]');
      if (!modal) return null;
      const rect = modal.getBoundingClientRect();
      const card = modal.querySelector('.max-w-7xl') || modal.firstElementChild;
      const cardRect = card ? card.getBoundingClientRect() : null;
      return {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        dialogRect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        cardRect: cardRect ? { top: cardRect.top, left: cardRect.left, width: cardRect.width, height: cardRect.height } : null
      };
    })()`);
    console.log('Studio modal metrics:', studioMetrics);

  } catch (err) {
    console.error('Error during baseline capture:', err);
  } finally {
    await client.close();
    console.log('--- BASELINE CAPTURE FINISHED ---');
  }
}

captureBaseline();
