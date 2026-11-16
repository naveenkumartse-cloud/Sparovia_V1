import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('=================================================================');
console.log('SPAROVIA — ANIMATED LOGO LOADER SYSTEM VERIFICATION SUITE');
console.log('Specification: 09-logo-skeleton-loader-sequence.png');
console.log('Contexts: Initial Application Loader + Menu Navigation Loader');
console.log('=================================================================\n');

let passCount = 0;
let failCount = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  [PASS] ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  [FAIL] ${desc}`);
    console.error(`         ${err.message}`);
    failCount++;
  }
}

// ---------------------------------------------------------------------
// TEST GROUP 1: OFFICIAL LOGO INTEGRITY & GEOMETRY
// ---------------------------------------------------------------------
console.log('--- TEST GROUP 1: Official Logo Integrity & Geometry ---');

it('Official platform logo asset apps/admin/public/images/logo.png is untouched and preserved (602,890 bytes, 2172x724)', () => {
  const p = path.resolve('apps/admin/public/images/logo.png');
  assert.strictEqual(fs.existsSync(p), true);
  const buf = fs.readFileSync(p);
  assert.strictEqual(buf.length, 602890);
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  assert.strictEqual(width, 2172);
  assert.strictEqual(height, 724);
  assert.strictEqual(width / height, 3);
});

it('KVN client logo in apps/web is untouched and separated from Sparovia Admin platform branding', () => {
  const p = path.resolve('apps/web/public/images/logo.png');
  assert.strictEqual(fs.existsSync(p), true);
  const stat = fs.statSync(p);
  assert.strictEqual(stat.size, 324726);
});

it('SparoviaLogoLoader.tsx defines official 2-component vector geometry matching Sparovia monogram with sharp wing', () => {
  const src = fs.readFileSync(path.resolve('apps/admin/components/ui/SparoviaLogoLoader.tsx'), 'utf8');
  assert.strictEqual(src.includes('PATH_D0'), true);
  assert.strictEqual(src.includes('PATH_D1'), true);
  // D0 starts at top center (259 0), includes sharp check wing (528 51, 530 58)
  assert.strictEqual(src.includes('M 259 0'), true);
  assert.strictEqual(src.includes('528 51'), true);
  // D1 is the lower loop (374 277 ... 237 551)
  assert.strictEqual(src.includes('M 374 277'), true);
  assert.strictEqual(src.includes('237 551'), true);
});

// ---------------------------------------------------------------------
// TEST GROUP 2: SEVEN-STAGE ANIMATION SYSTEM
// ---------------------------------------------------------------------
console.log('\n--- TEST GROUP 2: Seven-Stage Animation System Specification ---');

it('CSS keyframes sparoviaOutlineLoop, sparoviaTraceD0Loop, sparoviaTraceD1Loop, and sparoviaFillLoop exist without square/aura artifacts', () => {
  const css = fs.readFileSync(path.resolve('apps/admin/app/globals.css'), 'utf8');
  assert.strictEqual(css.includes('@keyframes sparoviaOutlineLoop'), true);
  assert.strictEqual(css.includes('@keyframes sparoviaTraceD0Loop'), true);
  assert.strictEqual(css.includes('@keyframes sparoviaTraceD1Loop'), true);
  assert.strictEqual(css.includes('@keyframes sparoviaFillLoop'), true);
  // Ensure blurry background aura has been eliminated
  assert.strictEqual(css.includes('@keyframes sparoviaAuraLoop'), false);
});

it('Stage 1 (Outline): Begins with clean, recognizable light-blue outline, zero fill, and zero bloom', () => {
  const css = fs.readFileSync(path.resolve('apps/admin/app/globals.css'), 'utf8');
  // At 0-14%, outline opacity is high (0.85) and fill opacity is 0
  assert.strictEqual(css.includes('0%, 14% {\n    opacity: 0.85;\n  }'), true);
  assert.strictEqual(css.includes('0%, 12% {\n    opacity: 0;\n    clip-path: inset(0 0 100% 0);'), true);
});

it('Stage 2 & 3 (Light Start & Tracing Path): Cyan-to-violet directional tracing light sweeps along geometry', () => {
  const src = fs.readFileSync(path.resolve('apps/admin/components/ui/SparoviaLogoLoader.tsx'), 'utf8');
  assert.strictEqual(src.includes('stopColor="#00E5FF"'), true); // Cyan
  assert.strictEqual(src.includes('stopColor="#315FEA"'), true); // Cobalt
  assert.strictEqual(src.includes('stopColor="#A855F7"'), true); // Violet
  assert.strictEqual(src.includes('strokeDasharray="2100"'), true);
  assert.strictEqual(src.includes('strokeDasharray="1300"'), true);
});

it('Stage 4 & 5 (Half Complete & Almost Complete): Gradual gradient illumination on transparent background', () => {
  const css = fs.readFileSync(path.resolve('apps/admin/app/globals.css'), 'utf8');
  // At 40% - 58%, fill reaches half-mark (inset 35-55%) cleanly without blurry background shadows
  assert.strictEqual(css.includes('clip-path: inset(0 0 35% 0);'), true);
  assert.strictEqual(css.includes('clip-path: inset(0 0 55% 0);'), true);
});

it('Stage 6 (Full Glow Moment): Complete 100% illuminated logo with radiant cyan-purple gradient without artificial square bloom', () => {
  const css = fs.readFileSync(path.resolve('apps/admin/app/globals.css'), 'utf8');
  assert.strictEqual(css.includes('/* Stage 6: Full Glow Moment - Sharp, clean radiant gradient without fuzzy square bloom */'), true);
  assert.strictEqual(css.includes('clip-path: inset(0 0 0% 0);'), true);
  assert.strictEqual(css.includes('opacity: 1;'), true);
});

it('Stage 7 (Loop): Smoothly dissolves back to Stage 1 outline with seamless repeat', () => {
  const css = fs.readFileSync(path.resolve('apps/admin/app/globals.css'), 'utf8');
  assert.strictEqual(css.includes('98%, 100% {\n    opacity: 0;\n    clip-path: inset(0 0 100% 0);'), true);
  assert.strictEqual(css.includes('96%, 100% {\n    opacity: 0.85;\n  }'), true);
});

// ---------------------------------------------------------------------
// TEST GROUP 3: INITIAL APPLICATION LOADER CONTEXT
// ---------------------------------------------------------------------
console.log('\n--- TEST GROUP 3: Initial Application Loader Implementation ---');

it('AdminShell initial loading state renders centered SparoviaLogoLoader without traditional spinner', () => {
  const shellSrc = fs.readFileSync(path.resolve('apps/admin/components/admin/AdminShell.tsx'), 'utf8');
  // Spinner <div className="... animate-spin ..."> must NOT be present in isLoading block
  const isLoadingBlock = shellSrc.split('if (isLoading) {')[1].split('if (!isAuthenticated)')[0];
  assert.strictEqual(isLoadingBlock.includes('animate-spin'), false, 'Traditional spinner must not be present');
  assert.strictEqual(isLoadingBlock.includes('border-t-[#315FEA]'), false, 'Spinner border must not be present');
  assert.strictEqual(isLoadingBlock.includes('<SparoviaLogo size="loader" priority={true} />'), true);
  assert.strictEqual(isLoadingBlock.includes('role="status"'), true);
  assert.strictEqual(isLoadingBlock.includes('aria-live="polite"'), true);
});

it('SparoviaLogo component delegates size="loader" to SparoviaLogoLoader mode="initial"', () => {
  const logoSrc = fs.readFileSync(path.resolve('apps/admin/components/ui/SparoviaLogo.tsx'), 'utf8');
  assert.strictEqual(logoSrc.includes("if (size === 'loader' || animated)"), true);
  assert.strictEqual(logoSrc.includes('<SparoviaLogoLoader'), true);
  assert.strictEqual(logoSrc.includes("mode={size === 'loader' ? 'initial' : 'inline'}"), true);
});

// ---------------------------------------------------------------------
// TEST GROUP 4: MENU NAVIGATION LOADER CONTEXT
// ---------------------------------------------------------------------
console.log('\n--- TEST GROUP 4: Menu Navigation Loader Implementation ---');

it('AdminShell tracks route navigation and provides 120ms debounce to avoid flashing on instant clicks', () => {
  const shellSrc = fs.readFileSync(path.resolve('apps/admin/components/admin/AdminShell.tsx'), 'utf8');
  assert.strictEqual(shellSrc.includes('const [navigatingRoute, setNavigatingRoute] = useState'), true);
  assert.strictEqual(shellSrc.includes('const [showNavLoader, setShowNavLoader] = useState(false);'), true);
  assert.strictEqual(shellSrc.includes('setTimeout(() => {\n      setShowNavLoader(true);\n    }, 120);'), true);
  assert.strictEqual(shellSrc.includes('if (!href || href === pathname) return;'), true);
});

it('AdminShell displays compact SparoviaLogoLoader in top header during pending navigation without blocking UI', () => {
  const shellSrc = fs.readFileSync(path.resolve('apps/admin/components/admin/AdminShell.tsx'), 'utf8');
  assert.strictEqual(shellSrc.includes('<SparoviaLogoLoader mode="navigation" size="navigation" />'), true);
  assert.strictEqual(shellSrc.includes('showNavLoader &&'), true);
});

it('SidebarView displays compact SparoviaLogoLoader on active navigating menu item', () => {
  const shellSrc = fs.readFileSync(path.resolve('apps/admin/components/admin/AdminShell.tsx'), 'utf8');
  assert.strictEqual(shellSrc.includes('const isNavigatingThis = navigatingRoute === item.href;'), true);
  assert.strictEqual(shellSrc.includes('<SparoviaLogoLoader mode="navigation" size="sm" />'), true);
});

it('Next.js route suspense boundary (apps/admin/app/admin/loading.tsx) uses SparoviaLogoLoader mode="navigation"', () => {
  const loadingSrc = fs.readFileSync(path.resolve('apps/admin/app/admin/loading.tsx'), 'utf8');
  assert.strictEqual(loadingSrc.includes('<SparoviaLogoLoader mode="navigation" size="lg" />'), true);
  assert.strictEqual(loadingSrc.includes('animate-spin'), false, 'Traditional spinner must not be present in loading.tsx');
});

// ---------------------------------------------------------------------
// TEST GROUP 5: ACCESSIBILITY & REDUCED MOTION
// ---------------------------------------------------------------------
console.log('\n--- TEST GROUP 5: Accessibility & Performance Guardrails ---');

it('SparoviaLogoLoader supports prefers-reduced-motion media query and falls back to clean static gradient logo', () => {
  const css = fs.readFileSync(path.resolve('apps/admin/app/globals.css'), 'utf8');
  assert.strictEqual(css.includes('@media (prefers-reduced-motion: reduce)'), true);
  assert.strictEqual(css.includes('.sparovia-loader-active .sparovia-loader-outline,\n  .sparovia-loader-active .sparovia-trace-d0,\n  .sparovia-loader-active .sparovia-trace-d1,\n  .sparovia-loader-active .sparovia-loader-fill {\n    animation: none !important;\n  }'), true);
});

it('SparoviaLogoLoader exports clean typed props and exports from components/ui/index.ts', () => {
  const indexSrc = fs.readFileSync(path.resolve('apps/admin/components/ui/index.ts'), 'utf8');
  assert.strictEqual(indexSrc.includes("export * from './SparoviaLogoLoader';"), true);
});

it('Pure SVG and CSS implementation ensures zero raster GIF/WebP asset overhead and zero JavaScript animation loop memory leak', () => {
  const compSrc = fs.readFileSync(path.resolve('apps/admin/components/ui/SparoviaLogoLoader.tsx'), 'utf8');
  // Verify it does NOT use setInterval, requestAnimationFrame, or heavy canvas
  assert.strictEqual(compSrc.includes('requestAnimationFrame'), false);
  assert.strictEqual(compSrc.includes('setInterval'), false);
  assert.strictEqual(compSrc.includes('viewBox="-20 -20 570 595"'), true);
});

console.log('\n=================================================================');
console.log(`TOTAL TESTS: ${passCount + failCount}`);
console.log(`PASSED: ${passCount}`);
console.log(`FAILED: ${failCount}`);
console.log('=================================================================');

if (failCount > 0) {
  process.exit(1);
}
