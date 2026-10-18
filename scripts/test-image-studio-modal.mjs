import { BrowserAuditClient } from './comprehensive-browser-audit.mjs';

async function testStudioModal() {
  const client = new BrowserAuditClient(9222);
  await client.launch();

  try {
    const loginRes = await fetch('http://localhost:5043/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'pilot-auditor@sparovia.com',
        password: 'StrongPassword123!'
      })
    });
    const { accessToken } = await loginRes.json();

    await client.setViewport(1440, 900);
    await client.navigate('http://localhost:3001/login', 500);
    await client.evaluate(`localStorage.setItem('accessToken', '${accessToken}')`);

    await client.navigate('http://localhost:3001/admin/images', 2000);

    // Click Studio button
    const clickedStudio = await client.evaluate(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const studioBtn = btns.find(b => b.innerText.trim() === 'Studio' || b.innerText.includes('Studio'));
      if (studioBtn) {
        studioBtn.click();
        return true;
      }
      return false;
    })()`);
    console.log('Clicked Studio Button:', clickedStudio);

    await new Promise(r => setTimeout(r, 1500));

    // Find and click "Enhance for Website" button
    const clickedEnhance = await client.evaluate(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const enhanceBtn = btns.find(b => b.innerText.includes('Enhance for Website'));
      if (enhanceBtn) {
        enhanceBtn.click();
        return true;
      }
      return false;
    })()`);
    console.log('Clicked Enhance Button:', clickedEnhance);

    // Wait for deterministic processing
    await new Promise(r => setTimeout(r, 6000));
    await client.screenshot('image-studio-enhanced-candidate.png');

    const candidateReview = await client.evaluate(`(() => {
      const allButtons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean);
      const hasKeep = allButtons.some(t => t.includes('Keep Enhanced'));
      const hasDiscard = allButtons.some(t => t.includes('Discard'));
      const bodyText = document.body.innerText;
      const isCandidateReady = bodyText.includes('Candidate Ready') || bodyText.includes('Candidate Generated') || bodyText.includes('Review Required');
      return { hasKeep, hasDiscard, isCandidateReady, allButtons: allButtons.slice(0, 20) };
    })()`);
    console.log('Candidate Review Status:', candidateReview);

    // Click "Keep Enhanced"
    const clickedKeep = await client.evaluate(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const keepBtn = btns.find(b => b.innerText.includes('Keep Enhanced'));
      if (keepBtn) {
        keepBtn.click();
        return true;
      }
      return false;
    })()`);
    console.log('Clicked Keep Enhanced Button:', clickedKeep);

    await new Promise(r => setTimeout(r, 2000));
    await client.screenshot('image-studio-candidate-kept.png');

    const approvedState = await client.evaluate(`(() => {
      const allButtons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean);
      const bodyText = document.body.innerText;
      const hasPublishLive = allButtons.some(t => t.includes('Publish to Live Website') || t.includes('Update Live Website'));
      const isApproved = bodyText.includes('Candidate Approved') || bodyText.includes('Ready to Live');
      return { hasPublishLive, isApproved, allButtons };
    })()`);
    console.log('Approved Candidate & Publish Boundary State:', approvedState);

  } finally {
    await client.close();
  }
}

testStudioModal();
