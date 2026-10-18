import { BrowserAuditClient } from './comprehensive-browser-audit.mjs';
import fs from 'fs';
import path from 'path';

async function testImageLifecycle() {
  console.log('--- STARTING IMAGE STUDIO LIFECYCLE TEST ---');
  const client = new BrowserAuditClient(9222);
  await client.launch();

  try {
    // 1. Authenticate
    const loginRes = await fetch('http://localhost:5043/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'pilot-auditor@sparovia.com',
        password: 'StrongPassword123!'
      })
    });
    const { accessToken } = await loginRes.json();
    console.log('✓ Obtained token for image upload');

    // 2. Upload test image via API multipart form
    const imageFilePath = path.resolve('test.png');
    const imageBuffer = fs.readFileSync(imageFilePath);
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    const formData = new FormData();
    formData.append('File', blob, 'architectural-facade.png');
    formData.append('UsageType', 'WebsiteImage');
    formData.append('Slot', 'heroImage');

    const uploadRes = await fetch('http://localhost:5043/api/v1/website/images', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });
    const uploadData = await uploadRes.json();
    console.log('Upload result status:', uploadRes.status, 'ImageId:', uploadData?.data?.id || uploadData?.id);
    const imageId = uploadData?.data?.id || uploadData?.id;

    // 3. Open Admin Images in browser
    await client.setViewport(1440, 900);
    await client.navigate('http://localhost:3001/login', 500);
    await client.evaluate(`localStorage.setItem('accessToken', '${accessToken}')`);

    await client.navigate('http://localhost:3001/admin/images', 2000);
    await client.screenshot('admin-images-slot-uploaded.png');

    // 4. Click slot to open ImageStudioWorkspace
    const openStudio = await client.evaluate(`(() => {
      // Find the slot card for heroImage or click button "Studio"
      const studioBtn = document.querySelector('button[title*="Studio" i], button:has(svg)');
      const slotCard = Array.from(document.querySelectorAll('.grid > div')).find(el => el.innerText.includes('Hero Background'));
      if (slotCard) {
        slotCard.click();
        return { success: true, method: 'slotCard' };
      }
      return { success: false };
    })()`);

    console.log('Open studio in browser:', openStudio);
    await new Promise(r => setTimeout(r, 1200));
    await client.screenshot('image-studio-modal-opened.png');

    // 5. Inspect Workspace Controls (Verify Seven Ops are hidden from primary flow, only Enhance for Website button is present)
    const studioInspection = await client.evaluate(`(() => {
      const allButtons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim());
      const hasEnhanceForWebsite = allButtons.some(t => t.includes('Enhance for Website'));
      const hasClassicLook = allButtons.some(t => t === 'Classic Look');
      const hasModernLook = allButtons.some(t => t === 'Modern Look');
      const hasWebOptimize = allButtons.some(t => t === 'Web Optimize');
      return {
        hasEnhanceForWebsite,
        hasClassicLook,
        hasModernLook,
        hasWebOptimize,
        allButtons: allButtons.filter(Boolean).slice(0, 15)
      };
    })()`);
    console.log('Image Studio Primary Flow Inspection:', studioInspection);

    // 6. Click "Enhance for Website" button
    const enhanceClicked = await client.evaluate(`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Enhance for Website'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    })()`);

    console.log('Enhance button clicked:', enhanceClicked);
    // Wait for deterministic enhancement pipeline to finish
    await new Promise(r => setTimeout(r, 4000));
    await client.screenshot('image-studio-after-enhancement.png');

    // 7. Verify Candidate details & Review Controls (Keep Enhanced vs Discard)
    const reviewControls = await client.evaluate(`(() => {
      const allButtons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim());
      const hasKeep = allButtons.some(t => t.includes('Keep Enhanced'));
      const hasDiscard = allButtons.some(t => t.includes('Discard'));
      const candidateStatus = document.body.innerText.includes('Candidate Generated') || document.body.innerText.includes('Candidate Ready');
      return { hasKeep, hasDiscard, candidateStatus, allButtons };
    })()`);
    console.log('Candidate Review Controls:', reviewControls);

    // 8. Click "Keep Enhanced"
    const keepClicked = await client.evaluate(`(() => {
      const keepBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Keep Enhanced'));
      if (keepBtn) {
        keepBtn.click();
        return true;
      }
      return false;
    })()`);
    console.log('Keep Enhanced clicked:', keepClicked);
    await new Promise(r => setTimeout(r, 2000));
    await client.screenshot('image-studio-candidate-approved.png');

    // 9. Verify candidate is now "Approved" and separate "Publish to Live Website" button is active
    const publishControls = await client.evaluate(`(() => {
      const allButtons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim());
      const hasPublish = allButtons.some(t => t.includes('Publish to Live Website') || t.includes('Publish'));
      const isApproved = document.body.innerText.includes('Candidate Approved') || document.body.innerText.includes('Ready to Live');
      return { hasPublish, isApproved };
    })()`);
    console.log('Separate Publishing Boundary verified:', publishControls);

    // 10. Click "Publish to Live Website"
    const publishClicked = await client.evaluate(`(() => {
      const pubBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Publish to Live Website') || b.innerText.includes('Publish'));
      if (pubBtn) {
        pubBtn.click();
        return true;
      }
      return false;
    })()`);
    console.log('Publish button clicked:', publishClicked);
    await new Promise(r => setTimeout(r, 2500));
    await client.screenshot('image-studio-published-live.png');

    // 11. Verify on public website
    await client.navigate('http://localhost:3000', 2000);
    const publicHeroImage = await client.evaluate(`(() => {
      const heroImg = document.querySelector('#hero img, section:first-of-type img');
      return {
        found: !!heroImg,
        src: heroImg ? heroImg.src : null,
      };
    })()`);
    console.log('Public website hero image after publication:', publicHeroImage);
    await client.screenshot('public-website-hero-published.png');

  } finally {
    await client.close();
  }
}

testImageLifecycle();
