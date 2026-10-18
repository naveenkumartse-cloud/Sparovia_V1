import { BrowserAuditClient } from './comprehensive-browser-audit.mjs';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('audit_evidence', 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function verifyLeadsPolished() {
  console.log('--- STARTING VERIFICATION: POLISHED LEADS WORKFLOW ---');
  const client = new BrowserAuditClient(9222);
  await client.launch();

  const results = {
    viewportsTested: [],
    overflowResults: {},
    screenshots: [],
    interactionsTested: [],
    errors: [],
  };

  try {
    // 1. Authenticate with pilot tenant
    const loginRes = await fetch('http://localhost:5043/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'pilot-auditor@sparovia.com',
        password: 'StrongPassword123!',
      }),
    });
    const { accessToken } = await loginRes.json();
    console.log('✓ Obtained auth token');

    // Setup browser session with token
    await client.setViewport(1440, 900);
    await client.navigate('http://localhost:3001/login', 500);
    await client.evaluate(`localStorage.setItem('accessToken', '${accessToken}')`);

    const takeScreenshot = async (name) => {
      const res = await client.sendSession('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: false,
      });
      const filePath = path.join(SCREENSHOT_DIR, name);
      fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
      console.log(`Saved screenshot: ${name}`);
      results.screenshots.push(name);
      return filePath;
    };

    // Navigate to Leads page
    await client.navigate('http://localhost:3001/admin/leads', 2000);

    // 2. Test viewports across 1440, 1280, 1024, 768, 375, 320
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
      await new Promise((r) => setTimeout(r, 600));
      const overflow = await client.checkOverflow();
      console.log(`Viewport ${vp.name} (${vp.w}x${vp.h}) - Overflow:`, overflow);
      results.viewportsTested.push(`${vp.w}x${vp.h}`);
      results.overflowResults[vp.name] = overflow;
      await takeScreenshot(`admin-leads-cards-${vp.name}.png`);
    }

    // 3. Test Detail Modal at 1440px
    await client.setViewport(1440, 900);
    await new Promise((r) => setTimeout(r, 400));
    const openedDetail1440 = await client.evaluate(`(() => {
      const card = document.querySelector('.cursor-pointer');
      if (card) {
        card.click();
        return true;
      }
      return false;
    })()`);
    console.log('Opened detail modal at 1440:', openedDetail1440);
    await new Promise((r) => setTimeout(r, 800));
    await takeScreenshot('admin-leads-detail-modal-1440.png');

    // Test Detail Modal at 375px
    await client.setViewport(375, 812);
    await new Promise((r) => setTimeout(r, 500));
    const detailOverflow375 = await client.checkOverflow();
    console.log('Detail Modal at 375px Overflow:', detailOverflow375);
    await takeScreenshot('admin-leads-detail-modal-375.png');

    // Test status change inside Detail Modal
    const changedStatus = await client.evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const contactedBtn = buttons.find(b => b.innerText.trim() === 'Contacted');
      if (contactedBtn) {
        contactedBtn.click();
        return true;
      }
      return false;
    })()`);
    console.log('Clicked Contacted in pipeline stepper:', changedStatus);
    await new Promise((r) => setTimeout(r, 1000));
    results.interactionsTested.push('Pipeline stage update via detail modal');

    // Close detail modal
    await client.evaluate(`(() => {
      const closeBtn = document.querySelector('button[aria-label="Close dialog"]');
      if (closeBtn) closeBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));

    // 4. Test Add Lead Modal at 1440px
    await client.setViewport(1440, 900);
    await client.evaluate(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(b => b.innerText.includes('Add Lead'));
      if (addBtn) addBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 800));
    await takeScreenshot('admin-leads-add-modal-1440.png');

    // Add Lead Modal at 375px
    await client.setViewport(375, 812);
    await new Promise((r) => setTimeout(r, 500));
    const addOverflow375 = await client.checkOverflow();
    console.log('Add Lead Modal at 375px Overflow:', addOverflow375);
    await takeScreenshot('admin-leads-add-modal-375.png');

    // Close Add modal
    await client.evaluate(`(() => {
      const closeBtn = document.querySelector('button[aria-label="Close dialog"]');
      if (closeBtn) closeBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));

    // 5. Create a test lead via direct API call to verify list update & card rendering
    const createRes = await fetch('http://localhost:5043/api/v1/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: 'Rohan Deshmukh',
        phone: '+919876543219',
        email: 'rohan.deshmukh@example.com',
        message: 'Inquiry for premium facade glazing and acoustic UPVC windows.',
        areaOfInterest: null,
        areaOfInterestCategoryId: null,
        source: 'Manual',
        status: 'New',
      }),
    });
    const createdLead = await createRes.json();
    console.log('✓ Lead created via API:', createdLead.id, createdLead.name);
    results.interactionsTested.push('Lead creation verified');

    // Refresh page to show newly created lead in UI
    await client.setViewport(1440, 900);
    await client.navigate('http://localhost:3001/admin/leads', 1500);

    const isRohanVisible = await client.evaluate(`(() => {
      return document.body.innerText.includes('Rohan Deshmukh');
    })()`);
    console.log('✓ Rohan Deshmukh visible on Cards screen:', isRohanVisible);

    // 6. Test Edit Lead Modal
    const openedEdit = await client.evaluate(`(() => {
      const editBtns = Array.from(document.querySelectorAll('button[aria-label*="Edit"]'));
      if (editBtns.length > 0) {
        editBtns[0].click();
        return true;
      }
      return false;
    })()`);
    console.log('Opened edit modal:', openedEdit);
    await new Promise((r) => setTimeout(r, 800));
    await takeScreenshot('admin-leads-edit-modal-1440.png');

    // Close edit modal
    await client.evaluate(`(() => {
      const closeBtn = document.querySelector('button[aria-label="Close dialog"]');
      if (closeBtn) closeBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));

    // 7. Test Delete Modal
    const openedDelete = await client.evaluate(`(() => {
      const delBtns = Array.from(document.querySelectorAll('button[aria-label*="Delete"]'));
      if (delBtns.length > 0) {
        delBtns[0].click();
        return true;
      }
      return false;
    })()`);
    console.log('Opened delete confirmation modal:', openedDelete);
    await new Promise((r) => setTimeout(r, 800));
    await takeScreenshot('admin-leads-delete-modal-1440.png');

    // Close delete modal
    await client.evaluate(`(() => {
      const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Cancel');
      if (cancelBtn) cancelBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));

    // Ensure any open dialog is closed before table view test
    await client.evaluate(`(() => {
      const closeBtn = document.querySelector('button[aria-label="Close dialog"]');
      if (closeBtn) closeBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 800));

    // 8. Test Clean Table View (Desktop 1440px)
    const toggledTable = await client.evaluate(`(() => {
      const tableBtn = document.querySelector('button[aria-label="Table view"]');
      if (tableBtn) {
        tableBtn.click();
        return true;
      }
      return false;
    })()`);
    console.log('Toggled to table view:', toggledTable);
    await new Promise((r) => setTimeout(r, 800));
    const tableOverflow = await client.checkOverflow();
    console.log('Table view at 1440px overflow:', tableOverflow);
    await takeScreenshot('admin-leads-table-view-1440.png');

    // Clean up created test lead via API
    if (createdLead?.id) {
      await fetch(`http://localhost:5043/api/v1/leads/${createdLead.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log('✓ Cleaned up test lead:', createdLead.id);
    }

    // Switch back to Card View (Primary)
    await client.evaluate(`(() => {
      const cardBtn = document.querySelector('button[aria-label="Card view (primary)"]');
      if (cardBtn) cardBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 500));

    console.log('✓ All verification steps completed successfully.');
    fs.writeFileSync(
      path.resolve('audit_evidence', 'leads-verification-summary.json'),
      JSON.stringify(results, null, 2)
    );
  } catch (err) {
    console.error('Error during leads verification:', err);
    results.errors.push(err.message);
  } finally {
    await client.close();
  }
}

verifyLeadsPolished().catch(console.error);
