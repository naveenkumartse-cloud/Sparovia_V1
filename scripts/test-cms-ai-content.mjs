import { BrowserAuditClient } from './comprehensive-browser-audit.mjs';

async function testCmsAiContent() {
  console.log('--- STARTING CMS & AI CONTENT MODAL TEST ---');
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

    // Navigate to /admin/content
    await client.navigate('http://localhost:3001/admin/content', 2000);
    await client.screenshot('admin-content-overview.png');

    // Find and click "Improve with AI" button on the first textarea with content
    const clickedAi = await client.evaluate(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const aiBtn = btns.find(b => b.innerText.includes('Improve with AI') && !b.disabled);
      if (aiBtn) {
        aiBtn.click();
        return { success: true, text: aiBtn.innerText };
      }
      return { success: false, availableButtons: btns.map(b => b.innerText.trim()).filter(Boolean) };
    })()`);

    console.log('Clicked Improve with AI:', clickedAi);
    await new Promise(r => setTimeout(r, 1200));
    await client.screenshot('admin-content-ai-modal-open.png');

    // Inspect AI Modal
    const modalInfo = await client.evaluate(`(() => {
      const modal = document.querySelector('[role="dialog"]');
      if (!modal) return { hasModal: false };

      const heading = modal.querySelector('h2, h3')?.innerText;
      const buttons = Array.from(modal.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean);
      const text = modal.innerText;
      return {
        hasModal: true,
        heading,
        buttons,
        snippet: text.slice(0, 300)
      };
    })()`);
    console.log('AI Content Modal Info:', modalInfo);

    // If modal is open, test Generate
    if (modalInfo.hasModal) {
      const generateClicked = await client.evaluate(`(() => {
        const genBtn = Array.from(document.querySelectorAll('[role="dialog"] button')).find(b => b.innerText.includes('Generate') || b.innerText.includes('Improve') || b.innerText.includes('Rewrite'));
        if (genBtn) {
          genBtn.click();
          return true;
        }
        return false;
      })()`);
      console.log('Clicked Generate Suggestion:', generateClicked);

      // Wait for suggestion response
      await new Promise(r => setTimeout(r, 3500));
      await client.screenshot('admin-content-ai-suggestion-result.png');

      const suggestionText = await client.evaluate(`(() => {
        const modal = document.querySelector('[role="dialog"]');
        const text = modal ? modal.innerText : '';
        const hasSafetyGlitch = text.includes('User Safety: safe');
        const hasAcceptBtn = Array.from(modal?.querySelectorAll('button') || []).some(b => b.innerText.includes('Accept'));
        return { hasSafetyGlitch, hasAcceptBtn, textSnippet: text.slice(0, 400) };
      })()`);
      console.log('Suggestion Result Validation:', suggestionText);

      // Close modal
      await client.evaluate(`(() => {
        const closeBtn = document.querySelector('[role="dialog"] button[aria-label*="close" i], [role="dialog"] button:has(svg)');
        if (closeBtn) closeBtn.click();
      })()`);
      await new Promise(r => setTimeout(r, 500));
    }

    // Now test Publish Confirmation Dialog
    const publishDialogOpened = await client.evaluate(`(() => {
      const pubBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Publish') || b.innerText.includes('Publish All'));
      if (pubBtn) {
        pubBtn.click();
        return true;
      }
      return false;
    })()`);
    console.log('Clicked Publish Button:', publishDialogOpened);
    await new Promise(r => setTimeout(r, 1000));
    await client.screenshot('admin-content-publish-dialog.png');

    const publishModalInfo = await client.evaluate(`(() => {
      const modal = document.querySelector('[role="dialog"]');
      if (!modal) return { hasModal: false };
      return {
        hasModal: true,
        text: modal.innerText.slice(0, 300),
        buttons: Array.from(modal.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean)
      };
    })()`);
    console.log('Publish Modal Info:', publishModalInfo);

  } finally {
    await client.close();
  }
}

testCmsAiContent();
