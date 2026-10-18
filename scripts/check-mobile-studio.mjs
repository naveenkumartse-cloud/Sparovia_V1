import { BrowserAuditClient } from './comprehensive-browser-audit.mjs';

async function checkMobileStudio() {
  const client = new BrowserAuditClient(9222);
  await client.launch();
  try {
    const loginRes = await fetch('http://localhost:5043/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'pilot-auditor@sparovia.com', password: 'StrongPassword123!' })
    });
    const { accessToken } = await loginRes.json();
    await client.setViewport(375, 812);
    await client.navigate('http://localhost:3001/login', 500);
    await client.evaluate(`localStorage.setItem('accessToken', '${accessToken}')`);
    await client.navigate('http://localhost:3001/admin/images', 2000);
    await client.evaluate(`(() => {
      const studioBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Studio' || b.innerText.includes('Studio'));
      if (studioBtn) studioBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 1200));

    const check = await client.evaluate(`(() => {
      const aside = document.querySelector('aside');
      const dialog = document.querySelector('[role="dialog"]');
      const card = dialog ? dialog.querySelector('.max-w-7xl') : null;
      const primaryBtn = Array.from(document.querySelectorAll('button')).find(b =>
        b.innerText.includes('Publish to Live Website') ||
        b.innerText.includes('Update Live Website') ||
        b.innerText.includes('Keep Enhanced')
      );
      const rect = primaryBtn ? primaryBtn.getBoundingClientRect() : null;
      return {
        asideScrollHeight: aside ? aside.scrollHeight : 0,
        asideClientHeight: aside ? aside.clientHeight : 0,
        cardHeight: card ? card.clientHeight : 0,
        primaryBtnText: primaryBtn ? primaryBtn.innerText.trim() : null,
        primaryBtnRect: rect ? { top: rect.top, bottom: rect.bottom, height: rect.height } : null,
        windowHeight: window.innerHeight,
        isButtonVisibleInViewport: rect ? (rect.bottom <= window.innerHeight && rect.top >= 0) : false
      };
    })()`);
    console.log('Mobile Studio Check Result:', check);
  } finally {
    await client.close();
  }
}

checkMobileStudio();
