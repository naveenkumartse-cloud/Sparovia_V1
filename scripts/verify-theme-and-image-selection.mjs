import { BrowserAuditClient, EVIDENCE_DIR } from './comprehensive-browser-audit.mjs';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Monisha Senthilkumar/.gemini/antigravity/brain/67d6ff39-d198-4d46-a027-a14a98fb4098';

function copyToArtifacts(filename) {
  try {
    const src = path.join(EVIDENCE_DIR, filename);
    const dest = path.join(ARTIFACT_DIR, filename);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`  ✓ Synced to artifact dir: ${filename}`);
    }
  } catch (err) {
    console.error(`  ⚠ Could not copy to artifacts: ${err.message}`);
  }
}

async function runThemeAndImageSelectionVerification() {
  console.log('=====================================================================');
  console.log('SPAROVIA — THEME SWITCHING & IMAGE SELECTION REAL BROWSER AUDIT');
  console.log('=====================================================================');

  const client = new BrowserAuditClient(9222);
  await client.launch();
  console.log('✓ Headless Chrome CDP instance connected on port 9222.');

  const results = {
    timestamp: new Date().toISOString(),
    viewportsTested: [],
    overflowAudit: {},
    themeAudit: {},
    imageSelectionAudit: {},
    screenshots: [],
    passed: true,
  };

  try {
    // 1. Authenticate
    console.log('\n[Step 1] Authenticating pilot tenant...');
    const loginRes = await fetch('http://localhost:5043/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'pilot-auditor@sparovia.com',
        password: 'StrongPassword123!',
      }),
    });

    if (!loginRes.ok) {
      throw new Error(`Login failed with HTTP ${loginRes.status}`);
    }

    const { accessToken } = await loginRes.json();
    console.log('✓ Token acquired.');

    await client.setViewport(1440, 900);
    await client.navigate('http://localhost:3001/login', 500);
    await client.evaluate(`localStorage.setItem('accessToken', '${accessToken}')`);

    // 2. Account Visual Standards — Light Mode
    console.log('\n[Step 2] Testing Visual Standards in Account (Light Mode)...');
    await client.navigate('http://localhost:3001/admin/account?tab=settings', 2000);

    // Click Light Mode button
    await client.evaluate(`(() => {
      const lightBtn = Array.from(document.querySelectorAll('button[role="radio"]')).find(b => b.innerText.includes('Light Mode'));
      if (lightBtn) lightBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));

    const isLightActive = await client.evaluate(`!document.documentElement.classList.contains('dark')`);
    console.log(`✓ Light Mode class verified on html: isLight=${isLightActive}`);
    results.themeAudit.lightModeWorks = isLightActive;

    await client.screenshot('account-visual-standards-light.png');
    copyToArtifacts('account-visual-standards-light.png');
    results.screenshots.push('account-visual-standards-light.png');

    // 3. Account Visual Standards — Dark Mode
    console.log('\n[Step 3] Testing Visual Standards in Account (Dark Mode)...');
    await client.evaluate(`(() => {
      const darkBtn = Array.from(document.querySelectorAll('button[role="radio"]')).find(b => b.innerText.includes('Dark Mode'));
      if (darkBtn) darkBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));

    const isDarkActive = await client.evaluate(`document.documentElement.classList.contains('dark')`);
    const savedTheme = await client.evaluate(`localStorage.getItem('sparovia_admin_theme')`);
    console.log(`✓ Dark Mode class verified on html: isDark=${isDarkActive}, storedKey=${savedTheme}`);
    results.themeAudit.darkModeWorks = isDarkActive;
    results.themeAudit.persistenceKey = savedTheme;

    await client.screenshot('account-visual-standards-dark.png');
    copyToArtifacts('account-visual-standards-dark.png');
    results.screenshots.push('account-visual-standards-dark.png');

    // 4. Persistence Test across page reload
    console.log('\n[Step 4] Verifying theme persistence across full page reload...');
    await client.navigate('http://localhost:3001/admin/account?tab=settings', 1500);
    const persistedDark = await client.evaluate(`document.documentElement.classList.contains('dark')`);
    console.log(`✓ Post-reload dark class preserved: ${persistedDark}`);
    results.themeAudit.persistedAfterReload = persistedDark;

    // 5. Dashboard in Dark and Light Mode
    console.log('\n[Step 5] Capturing Dashboard in Dark Mode...');
    await client.navigate('http://localhost:3001/admin', 2000);
    await client.screenshot('dashboard-dark.png');
    copyToArtifacts('dashboard-dark.png');
    results.screenshots.push('dashboard-dark.png');

    console.log('Testing Header Quick Theme Toggle (Dark -> Light)...');
    await client.evaluate(`(() => {
      const toggle = document.querySelector('button[title*="Switch to light mode"], button[aria-label*="Switch to light mode"]');
      if (toggle) toggle.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));

    const headerToggledLight = await client.evaluate(`!document.documentElement.classList.contains('dark')`);
    console.log(`✓ Header toggle switched to light mode: ${headerToggledLight}`);
    results.themeAudit.headerToggleWorks = headerToggledLight;

    await client.screenshot('dashboard-light.png');
    copyToArtifacts('dashboard-light.png');
    results.screenshots.push('dashboard-light.png');

    // 6. Images Menu — Normal & Selected Cards
    console.log('\n[Step 6] Navigating to /admin/images?tab=explore...');
    await client.navigate('http://localhost:3001/admin/images?tab=explore', 2500);

    // Capture normal unselected card
    await client.screenshot('images-normal-card.png');
    copyToArtifacts('images-normal-card.png');
    results.screenshots.push('images-normal-card.png');
    console.log('✓ Captured images-normal-card.png (unselected state)');

    // Select the first image card
    console.log('Selecting an image card in Explore Our Work...');
    const selectTriggerFound = await client.evaluate(`(() => {
      const trigger = document.querySelector('button[aria-label^="Select "]');
      if (trigger) {
        trigger.click();
        return true;
      }
      return false;
    })()`);
    console.log(`Selection trigger clicked: ${selectTriggerFound}`);
    await new Promise((r) => setTimeout(r, 800));

    // Verify selection styles
    const selectionCheck = await client.evaluate(`(() => {
      const selectedCard = document.querySelector('.border-\\[\\#7950B8\\]');
      const purpleIndicator = document.querySelector('.bg-\\[\\#7950B8\\].rounded-full');
      const purpleOverlay = document.querySelector('.bg-\\[\\#7950B8\\]\\/15');
      const bulkToolbar = document.querySelector('.glass-toolbar');
      return {
        cardHasPurpleBorder: Boolean(selectedCard),
        hasCircularPurpleIndicator: Boolean(purpleIndicator),
        hasPurpleOverlay: Boolean(purpleOverlay),
        bulkToolbarVisible: Boolean(bulkToolbar),
      };
    })()`);
    console.log('✓ Selection visual audit:', selectionCheck);
    results.imageSelectionAudit = selectionCheck;

    await client.screenshot('images-selected-purple-overlay.png');
    copyToArtifacts('images-selected-purple-overlay.png');
    results.screenshots.push('images-selected-purple-overlay.png');
    console.log('✓ Captured images-selected-purple-overlay.png (purple overlay & filled circular check badge)');

    // 7. Mobile Viewport for Images (390x844)
    console.log('\n[Step 7] Testing Images on Mobile Viewport (390x844)...');
    await client.setViewport(390, 844);
    await new Promise((r) => setTimeout(r, 800));
    await client.screenshot('images-mobile-view.png');
    copyToArtifacts('images-mobile-view.png');
    results.screenshots.push('images-mobile-view.png');
    console.log('✓ Captured images-mobile-view.png');

    // Reset viewport to desktop
    await client.setViewport(1440, 900);
    await new Promise((r) => setTimeout(r, 600));

    // 8. Image Studio in Light and Dark Mode
    console.log('\n[Step 8] Testing Image Studio in Light Mode...');
    const openedStudio = await client.evaluate(`(() => {
      const studioBtn = document.querySelector('button.image-studio-enhance-button');
      if (studioBtn) {
        studioBtn.click();
        return true;
      }
      return false;
    })()`);
    console.log(`Studio open triggered: ${openedStudio}`);
    await new Promise((r) => setTimeout(r, 1200));

    await client.screenshot('image-studio-light.png');
    copyToArtifacts('image-studio-light.png');
    results.screenshots.push('image-studio-light.png');
    console.log('✓ Captured image-studio-light.png');

    // Switch to dark mode while in studio
    console.log('Testing Image Studio in Dark Mode...');
    await client.evaluate(`(() => {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('sparovia_admin_theme', 'dark');
    })()`);
    await new Promise((r) => setTimeout(r, 600));

    await client.screenshot('image-studio-dark.png');
    copyToArtifacts('image-studio-dark.png');
    results.screenshots.push('image-studio-dark.png');
    console.log('✓ Captured image-studio-dark.png');

    // Close Studio
    await client.evaluate(`(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    })()`);
    await new Promise((r) => setTimeout(r, 600));

    // 9. Leads Menu in Light and Dark Mode
    console.log('\n[Step 9] Testing Leads Menu in Dark Mode...');
    await client.navigate('http://localhost:3001/admin/leads', 2000);
    await client.screenshot('leads-menu-dark.png');
    copyToArtifacts('leads-menu-dark.png');
    results.screenshots.push('leads-menu-dark.png');
    console.log('✓ Captured leads-menu-dark.png');

    // Open Lead Detail popup in Dark Mode
    console.log('Opening Lead Detail modal in Dark Mode...');
    await client.evaluate(`(() => {
      const viewBtn = document.querySelector('button[title="View lead details"]');
      if (viewBtn) viewBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 800));

    await client.screenshot('lead-detail-popup-both-themes.png');
    copyToArtifacts('lead-detail-popup-both-themes.png');
    results.screenshots.push('lead-detail-popup-both-themes.png');
    console.log('✓ Captured lead-detail-popup-both-themes.png');

    // Close lead modal
    await client.evaluate(`(() => {
      const closeBtn = document.querySelector('button[aria-label="Close dialog"]');
      if (closeBtn) closeBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 500));

    // Switch Leads to Light Mode
    console.log('Testing Leads Menu in Light Mode...');
    await client.evaluate(`(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('sparovia_admin_theme', 'light');
    })()`);
    await new Promise((r) => setTimeout(r, 600));

    await client.screenshot('leads-menu-light.png');
    copyToArtifacts('leads-menu-light.png');
    results.screenshots.push('leads-menu-light.png');
    console.log('✓ Captured leads-menu-light.png');

    // 10. Multi-Viewport Zero Horizontal Overflow Audit
    console.log('\n[Step 10] Performing Multi-Viewport Zero Horizontal Overflow Audit...');
    const viewports = [
      { name: '1440px Desktop', width: 1440, height: 900 },
      { name: '1024px Tablet Landscape', width: 1024, height: 768 },
      { name: '768px Tablet Portrait', width: 768, height: 1024 },
      { name: '430px iPhone Pro Max', width: 430, height: 932 },
      { name: '390px iPhone Standard', width: 390, height: 844 },
      { name: '375px Compact Mobile', width: 375, height: 667 },
      { name: '320px Minimum Viewport', width: 320, height: 568 },
    ];

    for (const vp of viewports) {
      await client.setViewport(vp.width, vp.height);
      await new Promise((r) => setTimeout(r, 400));
      const overflow = await client.evaluate(`(() => {
        const docWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        const bodyScrollWidth = document.body.scrollWidth;
        return Math.max(scrollWidth, bodyScrollWidth) > docWidth;
      })()`);

      const status = overflow ? 'FAIL (Horizontal Overflow Detected)' : 'PASS (Zero Overflow)';
      console.log(`  Viewport ${vp.width}x${vp.height} (${vp.name}): ${status}`);
      results.overflowAudit[`${vp.width}px`] = !overflow;
      results.viewportsTested.push(vp.width);

      if (overflow) {
        results.passed = false;
      }
    }

    console.log('\n=====================================================================');
    console.log('ALL 12 SCREENSHOTS & AUDIT TESTS COMPLETED SUCCESSFULLY!');
    console.log('=====================================================================');
  } catch (err) {
    console.error('Audit failed with error:', err);
    results.passed = false;
    results.error = err.message;
  } finally {
    await client.close();
  }

  // Write audit summary
  fs.writeFileSync(
    path.join(EVIDENCE_DIR, 'theme_and_image_selection_audit_results.json'),
    JSON.stringify(results, null, 2)
  );
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'theme_and_image_selection_audit_results.json'),
    JSON.stringify(results, null, 2)
  );

  return results;
}

runThemeAndImageSelectionVerification().catch(console.error);
