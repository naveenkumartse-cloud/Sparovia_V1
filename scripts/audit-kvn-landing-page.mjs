import http from 'http';
import fs from 'fs';
import path from 'path';
import { BrowserAuditClient } from './comprehensive-browser-audit.mjs';

const PORT = 3300;
const OUT_DIR = path.resolve('apps', 'web', 'out');
const SCREENSHOT_DIR = path.resolve('audit_evidence', 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Simple static HTTP server for apps/web/out
function startStaticServer() {
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';

    let filePath = path.join(OUT_DIR, reqPath);
    if (!fs.existsSync(filePath)) {
      if (fs.existsSync(path.join(OUT_DIR, reqPath + '.html'))) {
        filePath = path.join(OUT_DIR, reqPath + '.html');
      } else {
        filePath = path.join(OUT_DIR, '404.html');
      }
    }

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    });
    res.end(content);
  });

  return new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`[Static Server] Serving apps/web/out on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

// Local mock API server for published content during audit
function startMockApiServer() {
  const apiServer = http.createServer((req, res) => {
    console.log('[Mock API Request]', req.method, req.url);
    const origin = req.headers.origin || 'http://localhost:3300';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.url.startsWith('/api/v1/website/published-content')) {
      const data = {
        website: {
          id: 'kvn-interior-id',
          name: 'KVN Interior',
          domain: 'kvninterior.com',
          connectionStatus: 'Connected',
          templateId: 'kvn-interiors-v1'
        },
        sections: {
          hero: {
            headline: 'Bespoke Luxury Interiors & Precision uPVC Architecture',
            eyebrow: 'KVN Interior — Engineering Luxury Living',
            subheadline: 'Architectural interior craftsmanship and engineered German uPVC window & door systems designed for enduring beauty and high performance.',
            primaryCta: 'Get a Quote',
            secondaryCta: 'Explore Our Work'
          },
          about: {
            badge: 'About KVN Interior',
            title: 'Architectural Craftsmanship Meets Engineering Precision',
            description: 'At KVN Interior, we merge bespoke interior architecture with precision German-engineered uPVC window and door systems.',
            pillars: ['Bespoke Interior Craftsmanship', 'Engineered uPVC Architecture', 'Turnkey Project Execution']
          },
          services: {
            eyebrow: 'Our Capabilities',
            heading: 'Comprehensive Interior Design & uPVC Systems',
            description: 'From custom modular kitchens to acoustic uPVC profiles, we deliver excellence.',
            categories: [
              { name: 'Modular Kitchens & Living', tagline: 'Italian & German ergonomic finishes', description: 'Custom cabinetry and living units.' },
              { name: 'uPVC Windows & Doors', tagline: 'Multi-chambered acoustic profiles', description: 'High-durability uPVC solutions.' }
            ]
          },
          contact: {
            phone: '+91 98765 43210',
            email: 'contact@kvninterior.com',
            address: 'KVN Interior Studio, Prime Boulevard, City'
          }
        }
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      return;
    }

    if (req.url.startsWith('/api/v1/leads/public')) {
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, leadId: 'audit-test-lead-1' }));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  return new Promise((resolve) => {
    apiServer.listen(5043, () => {
      console.log('[Mock API] Serving published content on http://localhost:5043');
      resolve(apiServer);
    });
  });
}

async function runAudit() {
  const server = await startStaticServer();
  const apiServer = await startMockApiServer();
  const client = new BrowserAuditClient(9222);

  const results = {
    viewports: [],
    cwv: {},
    skeletonCheck: {},
    brandCheck: {},
    navCheck: {},
    formCheck: {},
    consoleErrors: [],
  };

  try {
    await client.launch();
    console.log('[Audit] Chrome CDP client connected.');

    const viewports = [
      { name: '320px_narrow_mobile', width: 320, height: 640 },
      { name: '375px_mobile', width: 375, height: 667 },
      { name: '390px_modern_iphone', width: 390, height: 844 },
      { name: '430px_large_mobile', width: 430, height: 932 },
      { name: '768px_tablet_portrait', width: 768, height: 1024 },
      { name: '1024px_laptop_small', width: 1024, height: 768 },
      { name: '1280px_laptop', width: 1280, height: 800 },
      { name: '1440px_desktop', width: 1440, height: 900 },
    ];

    for (const vp of viewports) {
      await client.setViewport(vp.width, vp.height);
      await client.navigate(`http://localhost:${PORT}`);
      await new Promise((r) => setTimeout(r, 1200));

      const overflow = await client.evaluate(`(() => {
        const doc = document.documentElement;
        const body = document.body;
        const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
        const clientWidth = doc.clientWidth;
        return {
          hasOverflow: scrollWidth > clientWidth + 1,
          scrollWidth,
          clientWidth,
          diff: scrollWidth - clientWidth
        };
      })()`);

      const screenshotFile = `kvn_landing_${vp.name}.png`;
      await client.screenshot(screenshotFile);

      results.viewports.push({
        viewport: vp.name,
        width: vp.width,
        height: vp.height,
        overflow,
        screenshot: screenshotFile,
      });

      console.log(`[Viewport ${vp.width}x${vp.height} (${vp.name})] Overflow: ${overflow.hasOverflow ? 'FAIL (' + overflow.diff + 'px)' : 'PASS (0px)'}`);
    }

    // Comprehensive checks on 1440px Desktop
    await client.setViewport(1440, 900);
    await client.navigate(`http://localhost:${PORT}`);
    await new Promise((r) => setTimeout(r, 1500));

    // 1. Skeleton Screen & Initial Loading Check
    const skeletonCheck = await client.evaluate(`(() => {
      const skeletons = document.querySelectorAll('[role="status"][aria-busy="true"], .animate-pulse, [class*="skeleton"]');
      const hasSkeletonMarkup = skeletons.length > 0;
      const heroHeadline = document.querySelector('h1')?.innerText || '';
      const heroPresent = Boolean(document.getElementById('hero'));
      const navbarPresent = Boolean(document.querySelector('header[role="banner"]'));
      return {
        hasSkeletonMarkup,
        skeletonElementsCount: skeletons.length,
        heroPresent,
        heroHeadline,
        navbarPresent,
      };
    })()`);
    results.skeletonCheck = skeletonCheck;
    console.log('[Check: Skeleton Presence]', skeletonCheck.hasSkeletonMarkup ? 'DETECTED' : 'NONE (PASS)');

    // 2. Brand Identity & Logo Check
    const brandCheck = await client.evaluate(`(() => {
      const logoImg = document.querySelector('header img[alt*="KVN Interior"]');
      const footerLogoImg = document.querySelector('footer img[alt*="KVN Interior"]');
      const logoNaturalWidth = logoImg ? logoImg.naturalWidth : 0;
      const logoNaturalHeight = logoImg ? logoImg.naturalHeight : 0;
      const headerText = document.querySelector('header nav')?.innerText || document.querySelector('header')?.innerText || '';
      const hasDuplicateHeaderText = document.querySelector('header a[href="#hero"]')?.innerText?.includes('KVN') || false;
      const primaryBtn = document.querySelector('header a[href="#contact"]');
      const primaryBtnStyle = primaryBtn ? window.getComputedStyle(primaryBtn) : null;
      return {
        logoFound: Boolean(logoImg),
        logoSrc: logoImg ? logoImg.src : null,
        logoNaturalDimensions: logoNaturalWidth + 'x' + logoNaturalHeight,
        footerLogoFound: Boolean(footerLogoImg),
        hasDuplicateHeaderText,
        primaryBtnBg: primaryBtnStyle ? primaryBtnStyle.backgroundColor : null,
        primaryBtnColor: primaryBtnStyle ? primaryBtnStyle.color : null,
      };
    })()`);
    results.brandCheck = brandCheck;
    console.log('[Check: Brand & Logo]', brandCheck);

    // 3. Navigation Links Check
    const navCheck = await client.evaluate(`(() => {
      const links = Array.from(document.querySelectorAll('header nav a')).map(a => ({
        text: a.innerText.trim(),
        href: a.getAttribute('href')
      }));
      const targetsExist = links.map(l => ({
        name: l.text,
        href: l.href,
        targetExists: Boolean(document.querySelector(l.href))
      }));
      return {
        linksCount: links.length,
        targetsExist
      };
    })()`);
    results.navCheck = navCheck;
    console.log('[Check: Navigation Links]', navCheck);

    // 4. Contact Enquiry Form Submission Validation Check
    const formCheck = await client.evaluate(`(async () => {
      const contactSec = document.getElementById('contact');
      if (!contactSec) return { found: false };

      const nameInput = document.getElementById('user-name');
      const phoneInput = document.getElementById('user-phone');
      const messageInput = document.getElementById('user-message');
      const submitBtn = contactSec.querySelector('button[type="submit"]');

      if (!nameInput || !phoneInput || !messageInput || !submitBtn) {
        return { found: false, missingInputs: true };
      }

      // Check validation on empty submit
      submitBtn.click();
      await new Promise(r => setTimeout(r, 200));
      const errorMsgEl = contactSec.querySelector('.bg-red-50 span');
      const validationErrorTriggered = errorMsgEl ? errorMsgEl.innerText : null;

      // Fill in valid details
      function setVal(el, val) {
        const proto = el instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        const set = Object.getOwnPropertyDescriptor(proto, 'value').set;
        set.call(el, val);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }

      setVal(nameInput, 'Rajesh Kumar');
      setVal(phoneInput, '9876543210');
      setVal(messageInput, 'Seeking consultation for 3BHK modular kitchen and acoustic uPVC casement windows.');

      await new Promise(r => setTimeout(r, 200));

      return {
        found: true,
        validationErrorTriggered,
        nameValue: nameInput.value,
        phoneValue: phoneInput.value,
        messageValue: messageInput.value,
        readyToSubmit: true
      };
    })()`);
    results.formCheck = formCheck;
    console.log('[Check: Contact Enquiry Form]', formCheck);

    // 4b. Window & Door Installation Carousel Navigation Check
    const carouselCheck = await client.evaluate(`(async () => {
      const track = document.getElementById('installation-carousel-track');
      if (!track) return { found: false };

      const prevBtns = Array.from(document.querySelectorAll('button[aria-label="Previous installations"]'));
      const nextBtns = Array.from(document.querySelectorAll('button[aria-label="Next installations"]'));
      const items = Array.from(track.querySelectorAll('[data-carousel-item]'));

      const initialScrollLeft = track.scrollLeft;
      const initialCanPrev = !prevBtns[0]?.disabled;

      // Click next button
      const nextBtn = nextBtns[0];
      if (nextBtn) {
        nextBtn.click();
      }
      await new Promise(r => setTimeout(r, 600));

      const afterNextScrollLeft = track.scrollLeft;
      const advanced = afterNextScrollLeft > initialScrollLeft;

      // Click prev button
      const prevBtn = prevBtns[0];
      if (prevBtn) {
        prevBtn.click();
      }
      await new Promise(r => setTimeout(r, 600));

      const afterPrevScrollLeft = track.scrollLeft;

      const btnStyles = nextBtn ? window.getComputedStyle(nextBtn) : null;

      return {
        found: true,
        itemsCount: items.length,
        prevButtonsCount: prevBtns.length,
        nextButtonsCount: nextBtns.length,
        buttonBgColor: btnStyles ? btnStyles.backgroundColor : null,
        initialScrollLeft,
        afterNextScrollLeft,
        afterPrevScrollLeft,
        navigationWorks: advanced,
        initialCanPrev
      };
    })()`);
    results.carouselCheck = carouselCheck;
    console.log('[Check: Window & Door Installation Carousel]', carouselCheck);

    // 5. Core Web Vitals & Performance Timings
    const cwv = await client.evaluate(`(() => {
      const navEntry = performance.getEntriesByType('navigation')[0];
      const paintEntries = performance.getEntriesByType('paint');
      const fp = paintEntries.find(p => p.name === 'first-paint');
      const fcp = paintEntries.find(p => p.name === 'first-contentful-paint');

      // Approximate LCP from entries
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      const lcp = lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime : (fcp ? fcp.startTime : 0);

      // Layout Shifts
      const layoutShifts = performance.getEntriesByType('layout-shift');
      let cumulativeScore = 0;
      layoutShifts.forEach(shift => {
        if (!shift.hadRecentInput) {
          cumulativeScore += shift.value;
        }
      });

      return {
        ttfb: navEntry ? Math.round(navEntry.responseStart - navEntry.requestStart) : 0,
        domInteractive: navEntry ? Math.round(navEntry.domInteractive) : 0,
        domContentLoaded: navEntry ? Math.round(navEntry.domContentLoadedEventEnd) : 0,
        loadComplete: navEntry ? Math.round(navEntry.loadEventEnd) : 0,
        firstPaint: fp ? Math.round(fp.startTime) : 0,
        firstContentfulPaint: fcp ? Math.round(fcp.startTime) : 0,
        largestContentfulPaint: Math.round(lcp),
        cumulativeLayoutShift: cumulativeScore,
      };
    })()`);
    results.cwv = cwv;
    console.log('[Check: Performance & Core Web Vitals]', cwv);

    // Filter console errors
    results.consoleErrors = client.consoleLogs.filter(l => l.type === 'error');
    console.log(`[Console] Total Errors: ${results.consoleErrors.length}`);

    // Output final JSON artifact
    fs.writeFileSync(
      path.resolve('audit_evidence', 'kvn_landing_page_audit_results.json'),
      JSON.stringify(results, null, 2)
    );
    console.log('[Audit] Results written to audit_evidence/kvn_landing_page_audit_results.json');

  } finally {
    await client.close();
    server.close();
    apiServer.close();
    console.log('[Audit] Server and Chrome closed.');
  }
}

runAudit().catch(err => {
  console.error('[Audit Error]', err);
  process.exit(1);
});
