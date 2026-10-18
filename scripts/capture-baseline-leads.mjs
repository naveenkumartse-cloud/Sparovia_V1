import { BrowserAuditClient } from './comprehensive-browser-audit.mjs';
import fs from 'fs';
import path from 'path';

const BASELINE_DIR = path.resolve('audit_evidence', 'screenshots', 'baseline');
if (!fs.existsSync(BASELINE_DIR)) {
  fs.mkdirSync(BASELINE_DIR, { recursive: true });
}

async function captureBaselineLeads() {
  console.log('--- CAPTURING CURRENT BASELINE LEADS SCREENSHOTS ---');
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

    // Navigate to Leads page
    await client.navigate('http://localhost:3001/admin/leads', 2000);

    // Check overflow and capture across viewports:
    const viewports = [
      { name: '1440', w: 1440, h: 900 },
      { name: '1280', w: 1280, h: 800 },
      { name: '1024', w: 1024, h: 768 },
      { name: '768', w: 768, h: 1024 },
      { name: '375', w: 375, h: 812 },
      { name: '320', w: 320, h: 568 },
    ];

    for (const vp of viewports) {
      await client.setViewport(vp.w, vp.h);
      await new Promise(r => setTimeout(r, 500));
      const overflow = await client.checkOverflow();
      console.log(`Viewport ${vp.name} (${vp.w}x${vp.h}) - Overflow:`, overflow);
      await takeBaselineScreenshot(`baseline-leads-${vp.name}.png`);
    }

    // Capture Detail modal at 1440
    await client.setViewport(1440, 900);
    await client.evaluate(`(() => {
      const firstRow = document.querySelector('tbody tr') || document.querySelector('.cursor-pointer');
      if (firstRow) firstRow.click();
    })()`);
    await new Promise(r => setTimeout(r, 800));
    await takeBaselineScreenshot('baseline-leads-detail-1440.png');

    // Detail modal at mobile 375
    await client.setViewport(375, 812);
    await new Promise(r => setTimeout(r, 500));
    await takeBaselineScreenshot('baseline-leads-detail-375.png');

    // Close detail modal
    await client.evaluate(`(() => {
      const closeBtn = document.querySelector('button[aria-label="Close dialog"]');
      if (closeBtn) closeBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 500));

    // Capture Add Lead modal at 1440
    await client.setViewport(1440, 900);
    await client.evaluate(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(b => b.innerText.includes('Add Lead'));
      if (addBtn) addBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 800));
    await takeBaselineScreenshot('baseline-leads-add-modal-1440.png');

    // Add Lead modal at 375
    await client.setViewport(375, 812);
    await new Promise(r => setTimeout(r, 500));
    await takeBaselineScreenshot('baseline-leads-add-modal-375.png');

    console.log('✓ All baseline leads screenshots captured successfully.');
  } finally {
    await client.close();
  }
}

captureBaselineLeads().catch(err => {
  console.error('Error capturing baseline leads:', err);
  process.exit(1);
});
