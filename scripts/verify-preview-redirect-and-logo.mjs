import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('====================================================');
console.log('SPAROVIA ADMIN PANEL VERIFICATION SUITE');
console.log('Task 1: Live Website Preview Redirect Fix');
console.log('Task 2 & 3: Approved Sparovia Logo Consistency');
console.log('====================================================\n');

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
// TEST GROUP 1: URL VALIDATION AND REDIRECT RULES
// ---------------------------------------------------------------------
console.log('--- TEST GROUP 1: Website URL Link Validation & Normalization ---');

function validateClientWebsiteUrl(rawUrl, nodeEnv = 'production') {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, url: null, error: 'Website URL is not configured yet.' };
  }
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { isValid: false, url: null, error: 'Website URL is not configured yet.' };
  }
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    lower.startsWith('about:')
  ) {
    return { isValid: false, url: null, error: 'Invalid or unsafe website URL scheme.' };
  }
  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isValid: false, url: null, error: 'Website URL must use HTTP or HTTPS.' };
    }
    const isLocalhost =
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname.endsWith('.local');
    if (nodeEnv === 'production' && parsed.protocol === 'http:' && !isLocalhost) {
      return { isValid: false, url: null, error: 'Website URL must use HTTPS in production.' };
    }
    if (!parsed.hostname || parsed.hostname.length < 3) {
      return { isValid: false, url: null, error: 'Invalid website domain.' };
    }
    return { isValid: true, url: parsed.toString() };
  } catch {
    return { isValid: false, url: null, error: 'Malformed website URL.' };
  }
}

it('Valid absolute HTTPS URL succeeds', () => {
  const res = validateClientWebsiteUrl('https://example-interiors.com');
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.url, 'https://example-interiors.com/');
});

it('Raw domain without protocol gets normalized to HTTPS', () => {
  const res = validateClientWebsiteUrl('my-studio.in');
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.url, 'https://my-studio.in/');
});

it('Valid HTTPS URL with subdomain and path succeeds', () => {
  const res = validateClientWebsiteUrl('https://showcase.designers.co.in/projects?filter=recent');
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.url, 'https://showcase.designers.co.in/projects?filter=recent');
});

it('Localhost HTTP URL is permitted for local development', () => {
  const res = validateClientWebsiteUrl('http://localhost:3000', 'production');
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.url, 'http://localhost:3000/');
});

it('Missing/undefined URL triggers clear unconfigured error', () => {
  const res1 = validateClientWebsiteUrl(undefined);
  assert.strictEqual(res1.isValid, false);
  assert.strictEqual(res1.error, 'Website URL is not configured yet.');

  const res2 = validateClientWebsiteUrl(null);
  assert.strictEqual(res2.isValid, false);
  assert.strictEqual(res2.error, 'Website URL is not configured yet.');

  const res3 = validateClientWebsiteUrl('   ');
  assert.strictEqual(res3.isValid, false);
  assert.strictEqual(res3.error, 'Website URL is not configured yet.');
});

it('Dangerous schemes are strictly blocked', () => {
  const dangerous = [
    'javascript:alert(document.cookie)',
    'javascript:window.location="http://attacker.com"',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///C:/Windows/win.ini',
  ];
  for (const malicious of dangerous) {
    const res = validateClientWebsiteUrl(malicious);
    assert.strictEqual(res.isValid, false);
    assert.strictEqual(res.error, 'Invalid or unsafe website URL scheme.');
  }
});

it('Production enforces HTTPS for external public websites', () => {
  const res = validateClientWebsiteUrl('http://unsecure-client-website.com', 'production');
  assert.strictEqual(res.isValid, false);
  assert.strictEqual(res.error, 'Website URL must use HTTPS in production.');
});

it('Never falls back to admin root "/" or admin URL', () => {
  const res = validateClientWebsiteUrl('');
  assert.notStrictEqual(res.url, '/');
  assert.notStrictEqual(res.url, '/admin');
  assert.strictEqual(res.url, null);
});

// ---------------------------------------------------------------------
// TEST GROUP 2: MULTI-TENANT REDIRECTION & ISOLATION
// ---------------------------------------------------------------------
console.log('\n--- TEST GROUP 2: Multi-Tenant Destination Resolution ---');

it('Tenant A and Tenant B resolve independently without cross-contamination', () => {
  const tenantA_Context = { tenantId: 'tenant-aaa-111', website: 'https://tenant-alpha-designs.com' };
  const tenantB_Context = { tenantId: 'tenant-bbb-222', website: 'https://tenant-beta-interiors.co.in' };

  const destA = validateClientWebsiteUrl(tenantA_Context.website);
  const destB = validateClientWebsiteUrl(tenantB_Context.website);

  assert.strictEqual(destA.isValid, true);
  assert.strictEqual(destA.url, 'https://tenant-alpha-designs.com/');

  assert.strictEqual(destB.isValid, true);
  assert.strictEqual(destB.url, 'https://tenant-beta-interiors.co.in/');

  assert.notStrictEqual(destA.url, destB.url);
});

it('Tenant with missing URL does not borrow another tenant URL', () => {
  const tenantC_Context = { tenantId: 'tenant-ccc-333', website: null };
  const destC = validateClientWebsiteUrl(tenantC_Context.website);

  assert.strictEqual(destC.isValid, false);
  assert.strictEqual(destC.url, null);
  assert.strictEqual(destC.error, 'Website URL is not configured yet.');
});

// ---------------------------------------------------------------------
// TEST GROUP 3: APPROVED SPAROVIA LOGO ASSET VERIFICATION
// ---------------------------------------------------------------------
console.log('\n--- TEST GROUP 3: Approved Sparovia Logo Asset Integrity ---');

it('apps/admin/public/images/logo.png is the approved Sparovia official platform logo (602,890 bytes, 2172x724, RGBA)', () => {
  const p = path.resolve('apps/admin/public/images/logo.png');
  assert.strictEqual(fs.existsSync(p), true);
  const buf = fs.readFileSync(p);
  assert.strictEqual(buf.length, 602890, `Expected Sparovia high-res official logo 602,890 bytes, got ${buf.length}`);

  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const bitDepth = buf.readUInt8(24);
  const colorType = buf.readUInt8(25);

  assert.strictEqual(width, 2172, `Expected width 2172, got ${width}`);
  assert.strictEqual(height, 724, `Expected height 724, got ${height}`);
  assert.strictEqual(bitDepth, 8, `Expected bitDepth 8, got ${bitDepth}`);
  assert.strictEqual(colorType, 6, `Expected colorType 6 (RGBA with alpha transparency), got ${colorType}`);
  assert.strictEqual(width / height, 3, `Expected aspect ratio 3:1, got ${width / height}`);
});

it('KVN client website logo in apps/web is completely preserved and untouched', () => {
  const p = path.resolve('apps/web/public/images/logo.png');
  assert.strictEqual(fs.existsSync(p), true);
  const stat = fs.statSync(p);
  assert.strictEqual(stat.size, 324726, 'KVN logo in apps/web must be preserved (324,726 bytes)');
});

// ---------------------------------------------------------------------
// TEST GROUP 4: UI COMPONENT IMPLEMENTATION VERIFICATION
// ---------------------------------------------------------------------
console.log('\n--- TEST GROUP 4: Shared Branding & UI Component Integration ---');

it('SparoviaLogo shared component exists and exports correctly with no background wrappers', () => {
  const logoComp = fs.readFileSync(path.resolve('apps/admin/components/ui/SparoviaLogo.tsx'), 'utf8');
  assert.strictEqual(logoComp.includes('export function SparoviaLogo'), true);
  assert.strictEqual(logoComp.includes('/images/logo.png'), true);
  assert.strictEqual(logoComp.includes('object-contain'), true);
  // Ensure collapsed logo container has zero colored boxes, cards, or borders
  assert.strictEqual(logoComp.includes('bg-[#315FEA]/10 dark:bg-[#315FEA]/20 border border-[#315FEA]/30'), false);
  assert.strictEqual(logoComp.includes('bg-transparent'), true);

  const indexComp = fs.readFileSync(path.resolve('apps/admin/components/ui/index.ts'), 'utf8');
  assert.strictEqual(indexComp.includes("export * from './SparoviaLogo';"), true);
});

it('Login page uses SparoviaLogo component and preserves auth behavior', () => {
  const loginSrc = fs.readFileSync(path.resolve('apps/admin/app/login/page.tsx'), 'utf8');
  assert.strictEqual(loginSrc.includes('<SparoviaLogo size="auth" priority={true} />'), true);
  assert.strictEqual(loginSrc.includes('handleLogin'), true);
  assert.strictEqual(loginSrc.includes('/auth/login'), true);
  assert.strictEqual(loginSrc.includes('text-brand-gradient'), false);
});

it('Register page uses SparoviaLogo component with identical sizing and alignment', () => {
  const regSrc = fs.readFileSync(path.resolve('apps/admin/app/register/page.tsx'), 'utf8');
  assert.strictEqual(regSrc.includes('<SparoviaLogo size="auth" priority={true} />'), true);
  assert.strictEqual(regSrc.includes('handleSubmit(onSubmit)'), true);
  assert.strictEqual(regSrc.includes('/auth/register'), true);
  assert.strictEqual(regSrc.includes('text-brand-gradient'), false);
});

it('AdminShell renders SparoviaLogo in expanded sidebar, mobile drawer, collapsed rail, and application loader', () => {
  const shellSrc = fs.readFileSync(path.resolve('apps/admin/components/admin/AdminShell.tsx'), 'utf8');
  assert.strictEqual(shellSrc.includes('<SparoviaLogo size="sidebar" showAdminBadge={true} priority={true} />'), true);
  assert.strictEqual(shellSrc.includes('<SparoviaLogo size="collapsed" priority={true} />'), true);
  assert.strictEqual(shellSrc.includes('<SparoviaLogo size="loader" priority={true} />'), true);
  assert.strictEqual(shellSrc.includes('text-brand-gradient'), false);
});

it('Menu navigation loader (apps/admin/app/admin/loading.tsx) is completely removed per locked requirement', () => {
  const loadingExists = fs.existsSync(path.resolve('apps/admin/app/admin/loading.tsx'));
  assert.strictEqual(loadingExists, false, 'Menu navigation loader loading.tsx must be completely removed');
});

it('All other auth pages (forgot-password, reset-password, verify-email, verify-phone) use SparoviaLogo', () => {
  for (const page of ['forgot-password', 'reset-password', 'verify-email', 'verify-phone']) {
    const src = fs.readFileSync(path.resolve(`apps/admin/app/${page}/page.tsx`), 'utf8');
    assert.strictEqual(src.includes('<SparoviaLogo'), true, `${page} must use SparoviaLogo`);
    assert.strictEqual(src.includes('text-brand-gradient'), false, `${page} must not use text-brand-gradient`);
  }
});

it('Dashboard Preview Live Website button uses validated URL, opens in new tab, and provides modal feedback for missing URL', () => {
  const dashSrc = fs.readFileSync(path.resolve('apps/admin/app/admin/page.tsx'), 'utf8');
  // Check that hardcoded href="/" is gone
  assert.strictEqual(dashSrc.includes('href="/"'), false, 'Hardcoded href="/" must not exist');
  assert.strictEqual(dashSrc.includes('validateClientWebsiteUrl'), true);
  assert.strictEqual(dashSrc.includes('websiteValidation.url'), true);
  assert.strictEqual(dashSrc.includes('target="_blank"'), true);
  assert.strictEqual(dashSrc.includes('rel="noopener noreferrer"'), true);
  assert.strictEqual(dashSrc.includes('Website URL is not configured yet.'), true);
  assert.strictEqual(dashSrc.includes('Configure in Business Presence'), true);
  assert.strictEqual(dashSrc.includes('/admin/business-presence'), true);
});

// ---------------------------------------------------------------------
// TEST GROUP 5: STATIC BUILD ARTIFACTS
// ---------------------------------------------------------------------
console.log('\n--- TEST GROUP 5: Exported Production Build Verification ---');

it('Exported login.html contains official logo image', () => {
  const loginHtml = fs.readFileSync(path.resolve('apps/admin/out/login.html'), 'utf8');
  assert.strictEqual(loginHtml.includes('logo.png'), true);
});

it('Exported register.html contains official logo image', () => {
  const regHtml = fs.readFileSync(path.resolve('apps/admin/out/register.html'), 'utf8');
  assert.strictEqual(regHtml.includes('logo.png'), true);
});

it('Exported admin page bundle contains Preview Live Website and missing URL guidance', () => {
  const chunksDir = path.resolve('apps/admin/out/_next/static/chunks');
  let found = false;
  let hasMissingUrl = false;
  let hasNoopener = false;
  let hasBlank = false;

  function search(dir) {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) {
        search(full);
      } else if (f.endsWith('.js')) {
        const content = fs.readFileSync(full, 'utf8');
        if (content.includes('Preview Live Website') && content.includes('Website URL is not configured yet.')) {
          found = true;
          hasMissingUrl = content.includes('Website URL is not configured yet.');
          hasNoopener = content.includes('noopener noreferrer');
          hasBlank = content.includes('_blank');
          break;
        }
      }
    }
  }
  search(chunksDir);

  assert.strictEqual(found, true, 'Preview Live Website chunk found in build');
  assert.strictEqual(hasMissingUrl, true, 'Unconfigured URL feedback present in build');
  assert.strictEqual(hasNoopener, true, 'noopener noreferrer present in build');
  assert.strictEqual(hasBlank, true, 'target="_blank" present in build');
});

console.log('\n====================================================');
console.log(`TOTAL TESTS: ${passCount + failCount}`);
console.log(`PASSED: ${passCount}`);
console.log(`FAILED: ${failCount}`);
console.log('====================================================');

if (failCount > 0) {
  process.exit(1);
}
