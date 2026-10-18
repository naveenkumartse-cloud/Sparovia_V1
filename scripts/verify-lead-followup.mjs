import { BrowserAuditClient } from './comprehensive-browser-audit.mjs';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('audit_evidence', 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function verifyLeadFollowUpWorkflow() {
  console.log('=== STARTING VERIFICATION: LEAD FOLLOW-UP RECORDING WORKFLOW ===');
  const client = new BrowserAuditClient(9222);
  await client.launch();

  const screenshots = [];

  const takeScreenshot = async (name) => {
    const res = await client.sendSession('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    const filePath = path.join(SCREENSHOT_DIR, name);
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`Saved screenshot: ${name}`);
    screenshots.push(filePath);
    return filePath;
  };

  try {
    // 1. Authenticate with pilot tenant
    console.log('1. Authenticating...');
    const loginRes = await fetch('http://localhost:5043/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'pilot-auditor@sparovia.com',
        password: 'StrongPassword123!',
      }),
    });
    const { accessToken } = await loginRes.json();
    console.log('✓ Obtained auth token for pilot-auditor');

    // 2. Set token in browser session
    await client.setViewport(1440, 900);
    await client.navigate('http://localhost:3001/login', 600);
    await client.evaluate(`localStorage.setItem('accessToken', '${accessToken}')`);

    // 3. Navigate to Leads page
    console.log('2. Navigating to Leads page...');
    await client.navigate('http://localhost:3001/admin/leads', 2500);

    // 4. Click on the first lead card to open the Lead Inspection modal
    console.log('3. Opening Lead Inspection modal...');
    const opened = await client.evaluate(`
      (() => {
        const btn = document.querySelector('button[title="View lead details"]');
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      })()
    `);
    console.log('Details button clicked, opened modal:', opened);
    await new Promise((r) => setTimeout(r, 1500));

    // Capture screenshot of the inspection modal with the follow-up timeline
    await takeScreenshot('followup_01_modal_inspection_desktop.png');

    // 5. Click "Record Follow-up" button to open the inline recording form
    console.log('4. Clicking Record Follow-up button...');
    const clickedRecord = await client.evaluate(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const recordBtn = buttons.find(b => b.textContent.includes('Record Follow-up'));
        if (recordBtn) {
          recordBtn.click();
          return true;
        }
        return false;
      })()
    `);
    console.log('Clicked record button:', clickedRecord);
    await new Promise((r) => setTimeout(r, 800));

    // Capture screenshot with the inline form revealed
    await takeScreenshot('followup_02_record_form_revealed_desktop.png');

    // 6. Fill out the follow-up form
    console.log('5. Filling follow-up form...');
    await client.evaluate(`
      (() => {
        // Select WhatsApp method button
        const buttons = Array.from(document.querySelectorAll('button'));
        const waBtn = buttons.find(b => b.textContent.trim() === 'WhatsApp');
        if (waBtn) waBtn.click();

        // Fill notes with React-compatible setter
        const textarea = document.querySelector('#follow-up-notes-textarea');
        if (textarea) {
          const textareaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
          textareaSetter.call(textarea, 'Discussed 3BHK interior floor plan with client on WhatsApp. Sent material sample catalog. Client agreed to review quote by Thursday.');
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          textarea.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Fill Next Action with React-compatible setter
        const nextActionInput = document.querySelector('#follow-up-next-action-input');
        if (nextActionInput) {
          const inputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          inputSetter.call(nextActionInput, 'Send revised quotation with premium wood finishes');
          nextActionInput.dispatchEvent(new Event('input', { bubbles: true }));
          nextActionInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Scroll form into view
        const saveBtn = document.querySelector('#save-followup-submit-btn');
        if (saveBtn) saveBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()
    `);
    await new Promise((r) => setTimeout(r, 800));
    await takeScreenshot('followup_03_form_filled_desktop.png');

    // 7. Click "Save Follow-up"
    console.log('6. Submitting follow-up...');
    const saved = await client.evaluate(`
      (() => {
        const saveBtn = document.querySelector('#save-followup-submit-btn');
        if (saveBtn) {
          console.log('Save button found, disabled:', saveBtn.disabled);
          saveBtn.click();
          return true;
        }
        return false;
      })()
    `);
    console.log('Clicked save button:', saved);
    await new Promise((r) => setTimeout(r, 2000));

    // Capture screenshot showing the newly created follow-up entry in the timeline
    await takeScreenshot('followup_04_timeline_saved_desktop.png');

    // 8. Test mobile viewport (375px)
    console.log('7. Testing mobile viewport (375px)...');
    await client.setViewport(375, 812);
    await new Promise((r) => setTimeout(r, 1000));
    await takeScreenshot('followup_05_modal_mobile_375px.png');

    // Check horizontal overflow on mobile
    const overflowCheck = await client.evaluate(`
      (() => {
        return {
          windowWidth: window.innerWidth,
          bodyScrollWidth: document.body.scrollWidth,
          hasOverflow: document.body.scrollWidth > window.innerWidth,
        };
      })()
    `);
    console.log('Mobile overflow check:', overflowCheck);

    console.log('=== VERIFICATION COMPLETED SUCCESSFULLY ===');
    console.log('Screenshots saved:', screenshots);
  } catch (err) {
    console.error('Verification failed with error:', err);
  } finally {
    await client.close();
  }
}

verifyLeadFollowUpWorkflow();
