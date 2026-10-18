import { BrowserAuditClient } from './comprehensive-browser-audit.mjs';

async function testLeadsWorkflow() {
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

    // Navigate to /admin/leads
    await client.navigate('http://localhost:3001/admin/leads', 2000);

    const leadsData = await client.evaluate(`(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr')).map(tr => ({
        text: tr.innerText.replace(/\\n/g, ' | '),
      }));
      const kpis = Array.from(document.querySelectorAll('h3, .text-2xl, .text-xl')).map(el => el.innerText.trim()).filter(Boolean);
      return { rowCount: rows.length, rows, kpis };
    })()`);

    console.log('Admin Leads Table in Browser:', leadsData);
    await client.screenshot('admin-leads-table-rendered.png');

    // Click the lead row to open Lead Detail Drawer
    const detailOpened = await client.evaluate(`(() => {
      const firstRow = document.querySelector('tbody tr');
      if (firstRow) {
        firstRow.click();
        return true;
      }
      return false;
    })()`);

    if (detailOpened) {
      await new Promise(r => setTimeout(r, 800));
      await client.screenshot('admin-leads-detail-drawer.png');
      console.log('✓ Lead Detail Drawer opened & captured.');
    }

    // Test mobile cards viewport at 375px
    await client.setViewport(375, 812);
    await client.navigate('http://localhost:3001/admin/leads', 1500);
    const overflow = await client.checkOverflow();
    await client.screenshot('admin-leads-mobile-cards-375.png');
    console.log('✓ Mobile Leads Cards at 375px captured. Overflow:', overflow);

  } finally {
    await client.close();
  }
}

testLeadsWorkflow();
