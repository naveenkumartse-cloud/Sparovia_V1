import { BrowserAuditClient, EVIDENCE_DIR } from './comprehensive-browser-audit.mjs';
import fs from 'fs';
import path from 'path';

const AUDIT_DATA = {
  timestamp: new Date().toISOString(),
  environment: {
    adminUrl: 'http://localhost:3001',
    publicUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:5043',
  },
  designSystemTokens: {
    primaryBrand: '#315FEA (Editorial Cobalt)',
    secondaryBrand: '#7950B8 (Restrained Purple)',
    whatsapp: '#25D366',
    radiusIndicator: '4px',
    radiusControl: '6px',
    radiusPanel: '8px',
    radiusDialog: '10px',
  },
  routesAudited: [],
  viewportOverflowSummary: [],
  sharedComponentsReuse: {},
  dialogInteractions: [],
  tooltipInteractions: [],
  typographyAudits: [],
  colorAudits: [],
  radiusAudits: [],
  motionAudits: [],
  defects: [],
};

async function getAuthToken() {
  const res = await fetch('http://localhost:5043/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'pilot-auditor@sparovia.com',
      password: 'StrongPassword123!',
    }),
  });
  if (!res.ok) {
    throw new Error(`Login failed with status ${res.status}`);
  }
  const data = await res.json();
  return data.accessToken || data.data?.accessToken;
}

async function runAudit() {
  console.log('=== STARTING SP-T02 SHARED UI/UX CONSISTENCY ACCEPTANCE AUDIT ===\n');
  const client = new BrowserAuditClient(9222);
  await client.launch();
  console.log('✓ Headless Chrome launched and connected via CDP.');

  try {
    const token = await getAuthToken();
    console.log('✓ Retrieved pilot JWT token for tenant verification.');

    // 1. Authenticate admin workspace via localStorage
    await client.setViewport(1440, 900);
    await client.navigate('http://localhost:3001/login', 600);
    await client.evaluate(`localStorage.setItem('accessToken', '${token}')`);
    console.log('✓ Injected session token into admin localStorage.');

    // Viewport matrix
    const viewports = [
      { w: 1440, h: 900, name: '1440px_desktop' },
      { w: 1280, h: 800, name: '1280px_laptop' },
      { w: 1024, h: 768, name: '1024px_tablet_landscape' },
      { w: 768, h: 1024, name: '768px_tablet_portrait' },
      { w: 375, h: 812, name: '375px_mobile' },
      { w: 320, h: 568, name: '320px_narrow_mobile' },
    ];

    // In-scope Admin routes to audit
    const adminRoutes = [
      { path: '/admin', name: 'Command Center / Dashboard', category: 'Admin' },
      { path: '/admin/leads', name: 'Customer Leads', category: 'Admin' },
      { path: '/admin/images', name: 'Images & Image Studio', category: 'Admin' },
      { path: '/admin/content', name: 'Website Content / CMS', category: 'Admin' },
      { path: '/admin/business-presence', name: 'Business Presence & Hours', category: 'Admin' },
      { path: '/admin/business-context', name: 'Business Context & Facts', category: 'Admin' },
      { path: '/admin/account', name: 'Account & Security Settings', category: 'Admin' },
    ];

    console.log('\n--- PHASE 1: RESPONSIVE VIEWPORT & OVERFLOW AUDIT ACROSS IN-SCOPE ROUTES ---');

    for (const route of adminRoutes) {
      console.log(`\nAuditing route: ${route.path} (${route.name})...`);
      for (const vp of viewports) {
        await client.setViewport(vp.w, vp.h);
        await client.navigate(`http://localhost:3001${route.path}`, 1200);

        const overflow = await client.checkOverflow();
        const shotName = `shared_audit_${route.path.replace(/\//g, '_')}_${vp.name}.png`;
        await client.screenshot(shotName);

        const checkRecord = {
          route: route.path,
          routeName: route.name,
          viewport: vp.name,
          width: vp.w,
          height: vp.h,
          hasOverflow: overflow.hasOverflow,
          overflowElement: overflow.overflowingSelector,
          screenshot: shotName,
        };
        AUDIT_DATA.viewportOverflowSummary.push(checkRecord);

        if (overflow.hasOverflow) {
          console.log(`  [FAIL] ${vp.name}: Page has horizontal overflow! (${overflow.overflowingSelector})`);
          AUDIT_DATA.defects.push({
            route: route.path,
            viewport: vp.name,
            issue: `Horizontal overflow detected: ${overflow.overflowingSelector}`,
          });
        } else {
          console.log(`  [PASS] ${vp.name}: Clean (0px overflow)`);
        }
      }
    }

    // Audit Public Website across viewports
    console.log('\nAuditing route: http://localhost:3000 (Public Website)...');
    for (const vp of viewports) {
      await client.setViewport(vp.w, vp.h);
      await client.navigate('http://localhost:3000', 1200);

      const overflow = await client.checkOverflow();
      const shotName = `shared_audit_public_website_${vp.name}.png`;
      await client.screenshot(shotName);

      const checkRecord = {
        route: '/',
        routeName: 'Public Website',
        viewport: vp.name,
        width: vp.w,
        height: vp.h,
        hasOverflow: overflow.hasOverflow,
        overflowElement: overflow.overflowingSelector,
        screenshot: shotName,
      };
      AUDIT_DATA.viewportOverflowSummary.push(checkRecord);

      if (overflow.hasOverflow) {
        console.log(`  [FAIL] ${vp.name}: Page has horizontal overflow! (${overflow.overflowingSelector})`);
        AUDIT_DATA.defects.push({
          route: '/',
          viewport: vp.name,
          issue: `Horizontal overflow detected: ${overflow.overflowingSelector}`,
        });
      } else {
        console.log(`  [PASS] ${vp.name}: Clean (0px overflow)`);
      }
    }

    console.log('\n--- PHASE 2: DESIGN SYSTEM TOKENS & STYLING AUDIT ---');

    // Return to desktop viewport for detailed token sampling
    await client.setViewport(1440, 900);
    await client.navigate('http://localhost:3001/admin/leads', 1200);

    const tokenAuditResult = await client.evaluate(`(() => {
      const results = {
        typography: [],
        buttonRadii: [],
        cardRadii: [],
        badgeRadii: [],
        colorsSampled: [],
        pillShapedButtons: [],
      };

      // 1. Font Family Inspection
      const bodyFont = window.getComputedStyle(document.body).fontFamily;
      const h1El = document.querySelector('h1');
      const h1Font = h1El ? window.getComputedStyle(h1El).fontFamily : null;
      results.typography.push({
        element: 'body',
        fontFamily: bodyFont,
        isInter: bodyFont.toLowerCase().includes('inter'),
      });
      if (h1El) {
        results.typography.push({
          element: 'h1',
          fontFamily: h1Font,
          fontSize: window.getComputedStyle(h1El).fontSize,
          fontWeight: window.getComputedStyle(h1El).fontWeight,
          lineHeight: window.getComputedStyle(h1El).lineHeight,
        });
      }

      // 2. Buttons Inspection (Corner radius, colors, no pill shapes)
      const buttons = Array.from(document.querySelectorAll('button'));
      for (const btn of buttons.slice(0, 20)) {
        const style = window.getComputedStyle(btn);
        const radius = style.borderRadius;
        const bg = style.backgroundColor;
        const text = btn.innerText.trim();
        const isPill = parseFloat(radius) >= 20 || radius.includes('9999');

        results.buttonRadii.push({
          text: text.slice(0, 25),
          borderRadius: radius,
          bg,
          isPill,
        });

        if (isPill) {
          results.pillShapedButtons.push(text || btn.className);
        }
      }

      // 3. Badges Inspection (Radius target: 4px)
      const badges = Array.from(document.querySelectorAll('span.rounded-\\\\[4px\\\\], span[class*="rounded-[4px]"], span[class*="border"]')).slice(0, 10);
      for (const b of badges) {
        const style = window.getComputedStyle(b);
        results.badgeRadii.push({
          text: b.innerText.trim().slice(0, 20),
          borderRadius: style.borderRadius,
          color: style.color,
          bg: style.backgroundColor,
        });
      }

      // 4. Cards Inspection (Radius target: 8px)
      const cards = Array.from(document.querySelectorAll('div[class*="rounded-[8px]"], div[class*="shadow-xs"], div[class*="border-[#CBD5E1]"]')).slice(0, 8);
      for (const c of cards) {
        const style = window.getComputedStyle(c);
        results.cardRadii.push({
          borderRadius: style.borderRadius,
          border: style.border,
          bg: style.backgroundColor,
        });
      }

      return results;
    })()`);

    AUDIT_DATA.typographyAudits = tokenAuditResult.typography;
    AUDIT_DATA.radiusAudits = {
      buttonRadii: tokenAuditResult.buttonRadii,
      badgeRadii: tokenAuditResult.badgeRadii,
      cardRadii: tokenAuditResult.cardRadii,
      pillShapedButtons: tokenAuditResult.pillShapedButtons,
    };

    console.log(`✓ Typography inspected: Body font contains Inter = ${tokenAuditResult.typography[0]?.isInter}`);
    console.log(`✓ Button radii inspected: Sampled ${tokenAuditResult.buttonRadii.length} buttons.`);
    if (tokenAuditResult.pillShapedButtons.length > 0) {
      console.log(`  [FAIL] Detected pill-shaped buttons: ${tokenAuditResult.pillShapedButtons.join(', ')}`);
      AUDIT_DATA.defects.push({
        issue: `Prohibited pill-shaped buttons found: ${tokenAuditResult.pillShapedButtons.join(', ')}`,
      });
    } else {
      console.log(`  [PASS] Zero pill-shaped buttons detected across sampled controls.`);
    }

    console.log('\n--- PHASE 3: MODAL/DIALOG INTERACTION, FOCUS TRAPPING, & STABILITY AUDIT ---');

    // 1. Lead Inspection Dialog Audit
    console.log('\nTesting Lead Inspection Dialog on /admin/leads...');
    await client.navigate('http://localhost:3001/admin/leads', 1000);

    const modalAuditResult = await client.evaluate(`(async () => {
      // Find and click the Details button or interactive card
      const inspectBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.innerText.trim() === 'Details' || b.getAttribute('aria-label')?.includes('View details') || b.getAttribute('title')?.includes('lead details')
      ) || document.querySelector('div[class*="cursor-pointer"]');

      if (!inspectBtn) {
        return { error: 'Details button or interactive card not found on page' };
      }

      // Record active element before clicking
      const initiatingElement = document.activeElement;
      inspectBtn.focus();
      inspectBtn.click();

      // Wait for modal transition
      await new Promise(r => setTimeout(r, 400));

      const modal = document.querySelector('[role="dialog"]');
      if (!modal) {
        return { error: 'Modal dialog element with role="dialog" did not render' };
      }

      const modalTitle = document.getElementById('modal-title')?.innerText;
      const modalDescription = document.getElementById('modal-description')?.innerText;
      const ariaModal = modal.getAttribute('aria-modal');

      // Check focus containment
      const focusables = Array.from(modal.querySelectorAll(
        'button:not([disabled]), [href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter(el => el.offsetParent !== null);

      const activeElementInside = modal.contains(document.activeElement);

      // Measure dimensions
      const rectBefore = modal.getBoundingClientRect();

      // Click to toggle "Record Customer Follow-up" section to test layout stability
      const toggleFollowUpBtn = Array.from(modal.querySelectorAll('button')).find(b => 
        b.innerText.includes('Record Customer Follow-up') || b.innerText.includes('New Follow-up')
      );
      if (toggleFollowUpBtn) {
        toggleFollowUpBtn.click();
        await new Promise(r => setTimeout(r, 300));
      }
      const rectAfter = modal.getBoundingClientRect();
      const widthStable = Math.abs(rectBefore.width - rectAfter.width) <= 2;

      return {
        success: true,
        modalTitle,
        modalDescription,
        ariaModal,
        focusableCount: focusables.length,
        activeElementInside,
        widthStable,
      };
    })()`);

    if (modalAuditResult.success) {
      await client.screenshot('shared_audit_lead_inspection_modal_desktop.png');
      const closeResult = await client.evaluate(`(async () => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await new Promise(r => setTimeout(r, 400));
        return !document.querySelector('[role="dialog"]');
      })()`);
      modalAuditResult.modalClosedOnEscape = closeResult;
    }

    console.log('  Lead Inspection Dialog results:', modalAuditResult);
    AUDIT_DATA.dialogInteractions.push({
      dialog: 'Lead Inspection & Follow-up Modal',
      result: modalAuditResult,
    });

    // 2. AI Content Assistance Modal Audit
    console.log('\nTesting AI Content Assistance Dialog on /admin/content...');
    await client.navigate('http://localhost:3001/admin/content', 1200);

    const aiModalAudit = await client.evaluate(`(async () => {
      const aiBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.innerText.includes('AI') || b.innerText.includes('Rewrite') || b.innerText.includes('Generate')
      );

      if (!aiBtn) {
        return { error: 'AI button not found on content page' };
      }

      aiBtn.click();
      await new Promise(r => setTimeout(r, 500));

      const modal = document.querySelector('[role="dialog"]');
      if (!modal) {
        return { error: 'AI Modal did not open' };
      }

      const modalTitle = document.getElementById('modal-title')?.innerText || modal.querySelector('h2, h3')?.innerText;
      const focusables = Array.from(modal.querySelectorAll('button, input, select, textarea')).length;

      return {
        opened: true,
        modalTitle,
        focusables,
      };
    })()`);

    if (aiModalAudit.opened) {
      await client.screenshot('shared_audit_ai_content_modal_desktop.png');
      const aiCloseResult = await client.evaluate(`(async () => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await new Promise(r => setTimeout(r, 300));
        return !document.querySelector('[role="dialog"]');
      })()`);
      aiModalAudit.closedOnEscape = aiCloseResult;
    }

    console.log('  AI Content Modal results:', aiModalAudit);
    AUDIT_DATA.dialogInteractions.push({
      dialog: 'AI Content Assistance Modal',
      result: aiModalAudit,
    });

    // 3. Image Studio Workspace Modal Audit
    console.log('\nTesting Image Studio Workspace Dialog on /admin/images...');
    await client.navigate('http://localhost:3001/admin/images', 1200);

    const studioModalAudit = await client.evaluate(`(async () => {
      const cardOrSlot = document.querySelector('button[title*="Studio" i], div[class*="group cursor-pointer"], div.grid > div');
      if (!cardOrSlot) {
        return { error: 'Image card or slot not found on /admin/images' };
      }

      cardOrSlot.click();
      await new Promise(r => setTimeout(r, 600));

      const modal = document.querySelector('[role="dialog"]');
      if (!modal) {
        return { error: 'Image Studio Modal did not open' };
      }

      const modalTitle = document.getElementById('modal-title')?.innerText || modal.querySelector('h2, h3')?.innerText;
      const hasEnhanceBtn = Array.from(modal.querySelectorAll('button')).some(b => b.innerText.includes('Enhance for Website'));

      return {
        opened: true,
        modalTitle,
        hasEnhanceBtn,
      };
    })()`);

    if (studioModalAudit.opened) {
      await client.screenshot('shared_audit_image_studio_modal_desktop.png');
      const studioCloseResult = await client.evaluate(`(async () => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await new Promise(r => setTimeout(r, 400));
        return !document.querySelector('[role="dialog"]');
      })()`);
      studioModalAudit.closedOnEscape = studioCloseResult;
    }

    console.log('  Image Studio Modal results:', studioModalAudit);
    AUDIT_DATA.dialogInteractions.push({
      dialog: 'Image Studio Workspace Modal',
      result: studioModalAudit,
    });

    console.log('\n--- PHASE 4: INFOTOOLTIP INTERACTION AUDIT ---');

    console.log('Testing InfoTooltip component on /admin/business-presence...');
    await client.navigate('http://localhost:3001/admin/business-presence', 1200);

    const tooltipAuditResult = await client.evaluate(`(async () => {
      // Find InfoTooltip trigger button
      const tooltipBtn = document.querySelector('button[aria-label="Field information"]');
      if (!tooltipBtn) {
        return { error: 'InfoTooltip button with aria-label="Field information" not found' };
      }

      // Click to open
      tooltipBtn.click();
      await new Promise(r => setTimeout(r, 250));

      const tooltipEl = document.querySelector('[role="tooltip"]');
      const tooltipText = tooltipEl?.innerText?.trim();
      const isVisible = !!tooltipEl && tooltipEl.offsetParent !== null;

      // Close via Escape
      tooltipBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await new Promise(r => setTimeout(r, 200));
      const closed = !document.querySelector('[role="tooltip"]');

      return {
        found: true,
        openedOnClick: isVisible,
        tooltipContent: tooltipText,
        closedOnEscape: closed,
      };
    })()`);

    await client.screenshot('shared_audit_infotooltip_interaction.png');
    console.log('  InfoTooltip results:', tooltipAuditResult);
    AUDIT_DATA.tooltipInteractions.push(tooltipAuditResult);

    console.log('\n--- PHASE 5: MOTION & REDUCED MOTION AUDIT ---');

    const motionAuditResult = await client.evaluate(`(() => {
      // Check for motion-reduce utility classes across DOM
      const motionReducedElements = document.querySelectorAll('[class*="motion-reduce:"]');
      return {
        motionReducedElementsCount: motionReducedElements.length,
        hasReducedMotionClasses: motionReducedElements.length > 0,
      };
    })()`);

    console.log(`  Motion reduce classes found in DOM: ${motionAuditResult.motionReducedElementsCount}`);
    AUDIT_DATA.motionAudits.push(motionAuditResult);

    // Save final audit JSON
    const reportPath = path.resolve('audit_evidence', 'shared-ui-consistency-audit-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(AUDIT_DATA, null, 2));
    console.log(`\n✓ Audit complete! Evidence saved to ${reportPath}`);

  } catch (err) {
    console.error('Audit encountered error:', err);
  } finally {
    await client.close();
  }
}

runAudit();
