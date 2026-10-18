import { BrowserAuditClient } from './comprehensive-browser-audit.mjs';

async function testQuote() {
  const client = new BrowserAuditClient(9222);
  await client.launch();
  try {
    await client.setViewport(1440, 900);
    await client.navigate('http://localhost:3000', 2000);

    const result = await client.evaluate(`(async () => {
      const contactEl = document.getElementById('contact');
      if (contactEl) contactEl.scrollIntoView();

      const name = document.getElementById('user-name');
      const phone = document.getElementById('user-phone');
      const email = document.getElementById('user-email');
      const message = document.getElementById('user-message');
      const form = document.querySelector('#contact form');
      const submitBtn = document.querySelector('#contact form button[type="submit"]');

      if (!name || !phone || !message || !submitBtn) {
        return { found: false };
      }

      function setReactValue(el, val) {
        const proto = el instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        const set = Object.getOwnPropertyDescriptor(proto, 'value').set;
        set.call(el, val);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }

      setReactValue(name, 'Aarav Mehta');
      setReactValue(phone, '9876543210');
      if (email) setReactValue(email, 'aarav.mehta@example.com');
      setReactValue(message, 'Interested in acoustic UPVC sliding windows for villa in Whitefield.');

      await new Promise(r => setTimeout(r, 400));
      submitBtn.click();
      await new Promise(r => setTimeout(r, 3000));

      const contactText = document.getElementById('contact')?.innerText || '';
      const confirmation = contactText.includes('Thank you') || contactText.includes('received') || contactText.includes('Enquiry') || contactText.includes('submitted');
      return {
        found: true,
        confirmation,
        snippet: contactText.slice(0, 500)
      };
    })()`);

    console.log('Quote Submission Test Result:', result);
    await client.screenshot('public-quote-submitted-verified.png');
  } finally {
    await client.close();
  }
}

testQuote();
