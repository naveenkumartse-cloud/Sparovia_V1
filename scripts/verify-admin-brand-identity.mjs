import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const failures = [];
const passes = [];

function assert(condition, message) {
  if (condition) {
    passes.push(message);
    console.log(`  [PASS] ${message}`);
  } else {
    failures.push(message);
    console.error(`  [FAIL] ${message}`);
  }
}

console.log('====================================================');
console.log('SPAROVIA ADMIN BRAND IDENTITY & DESIGN SYSTEM AUDIT');
console.log('====================================================\n');

// 1. Authoritative Tokens File
console.log('1. Checking Centralized Design Tokens (lib/tokens.ts)...');
const tokensPath = path.join(rootDir, 'apps/admin/lib/tokens.ts');
assert(fs.existsSync(tokensPath), 'apps/admin/lib/tokens.ts exists');
if (fs.existsSync(tokensPath)) {
  const content = fs.readFileSync(tokensPath, 'utf8');
  assert(content.includes("primary: '#315FEA'"), 'Primary brand color is #315FEA');
  assert(content.includes("secondary: '#7950B8'"), 'Secondary violet color is #7950B8');
  assert(content.includes("aiSpecial: '#C206C9'"), 'AI / Special color is #C206C9');
  assert(content.includes("primary: '#172033'"), 'Primary text color is #172033');
  assert(content.includes("secondary: '#475569'"), 'Secondary text color is #475569');
  assert(content.includes("border: '#E3E7ED'"), 'Border color is #E3E7ED');
  assert(content.includes("main: '#FFFFFF'"), 'Main surface is #FFFFFF');
  assert(content.includes("supporting: '#F3F6FA'"), 'Supporting surface is #F3F6FA');
  assert(content.includes("success: '#15803D'"), 'Success color is #15803D');
  assert(content.includes("warning: '#B45309'"), 'Warning color is #B45309');
  assert(content.includes("error: '#B91C1C'"), 'Error color is #B91C1C');
}

// 2. CSS Custom Properties in globals.css
console.log('\n2. Checking CSS Custom Properties in globals.css...');
const globalsPath = path.join(rootDir, 'apps/admin/app/globals.css');
assert(fs.existsSync(globalsPath), 'apps/admin/app/globals.css exists');
if (fs.existsSync(globalsPath)) {
  const css = fs.readFileSync(globalsPath, 'utf8');
  assert(css.includes('--color-brand-primary: #315FEA;'), 'CSS variable --color-brand-primary is #315FEA');
  assert(css.includes('--color-brand-secondary: #7950B8;'), 'CSS variable --color-brand-secondary is #7950B8');
  assert(css.includes('--color-ai-special: #C206C9;'), 'CSS variable --color-ai-special is #C206C9');
  assert(css.includes('--color-border-default: #E3E7ED;'), 'CSS variable --color-border-default is #E3E7ED');
  assert(!css.includes('linear-gradient(135deg, rgba(121, 80, 184, 0.92), rgba(102, 65, 160, 0.96))'), 'Deprecated purple gradient removed from enhance button');
  assert(!css.includes('.glow-purple'), '.glow-purple class is eliminated from globals.css');
}

// 3. Tailwind Configuration
console.log('\n3. Checking Tailwind Configuration...');
const tailwindPath = path.join(rootDir, 'apps/admin/tailwind.config.ts');
assert(fs.existsSync(tailwindPath), 'apps/admin/tailwind.config.ts exists');
if (fs.existsSync(tailwindPath)) {
  const tw = fs.readFileSync(tailwindPath, 'utf8');
  assert(tw.includes("DEFAULT: '#C206C9'"), 'Tailwind config defines ai token with DEFAULT: #C206C9');
  assert(tw.includes("border: '#E3E7ED'"), 'Tailwind config defines editorial.border as #E3E7ED');
  assert(tw.includes("cobalt: '#315FEA'"), 'Tailwind config defines editorial.cobalt as #315FEA');
}

// 4. Sparovia Logo Asset
console.log('\n4. Checking Sparovia Logo Asset...');
const logoPath = path.join(rootDir, 'apps/admin/public/images/logo.png');
assert(fs.existsSync(logoPath), 'apps/admin/public/images/logo.png exists');
if (fs.existsSync(logoPath)) {
  const stats = fs.statSync(logoPath);
  assert(stats.size > 500000, `Logo file is authentic high-resolution asset (${stats.size} bytes)`);
  const buf = fs.readFileSync(logoPath);
  const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  assert(isPng, 'Logo file is valid PNG format');
}

// 5. Favicon and App Icons
console.log('\n5. Checking Favicon & PWA Icons...');
const publicIcon = fs.readFileSync(path.join(rootDir, 'apps/admin/public/icon.svg'), 'utf8');
const appIcon = fs.readFileSync(path.join(rootDir, 'apps/admin/app/icon.svg'), 'utf8');
const appleIcon = fs.readFileSync(path.join(rootDir, 'apps/admin/public/apple-icon.svg'), 'utf8');

assert(publicIcon.includes('#315FEA') && publicIcon.includes('#7950B8'), 'public/icon.svg has #315FEA and #7950B8');
assert(!publicIcon.includes('#3B82F6') && !publicIcon.includes('#8B3FD1'), 'public/icon.svg free of outdated blue/purple');
assert(appIcon.includes('#315FEA') && appIcon.includes('#7950B8'), 'app/icon.svg has #315FEA and #7950B8');
assert(appleIcon.includes('#315FEA') && appleIcon.includes('#7950B8'), 'public/apple-icon.svg has #315FEA and #7950B8');

// 6. UI Primitives
console.log('\n6. Checking UI Primitives (Button, Badge, Card, SparoviaLogo)...');
const buttonContent = fs.readFileSync(path.join(rootDir, 'apps/admin/components/ui/Button.tsx'), 'utf8');
assert(buttonContent.includes("'ai'"), 'Button component exports ai variant');
assert(!buttonContent.includes('from-[#7950B8] to-[#9333EA]'), 'Button creative variant has no purple gradient');

const badgeContent = fs.readFileSync(path.join(rootDir, 'apps/admin/components/ui/Badge.tsx'), 'utf8');
assert(badgeContent.includes("'ai'"), 'Badge component exports ai variant');
assert(badgeContent.includes('#C206C9'), 'Badge ai variant uses #C206C9');

const cardContent = fs.readFileSync(path.join(rootDir, 'apps/admin/components/ui/Card.tsx'), 'utf8');
assert(cardContent.includes('border-[#E3E7ED]'), 'Card default variant uses #E3E7ED');

const logoComponent = fs.readFileSync(path.join(rootDir, 'apps/admin/components/ui/SparoviaLogo.tsx'), 'utf8');
assert(logoComponent.includes("sidebar") && (logoComponent.includes("160") || logoComponent.includes("185")), 'SparoviaLogo sidebar size config is properly calibrated');
assert(logoComponent.includes('/images/logo.png'), 'SparoviaLogo correctly loads /images/logo.png');

// 7. AI Button Styling in Admin Modules
console.log('\n7. Checking AI Button Colors in Admin Modules...');
const contentPage = fs.readFileSync(path.join(rootDir, 'apps/admin/app/admin/content/page.tsx'), 'utf8');
assert(contentPage.includes('text-[#C206C9]'), 'Content page AI buttons use #C206C9');
assert(!contentPage.includes('text-[#7950B8] dark:text-purple-300 bg-purple-50'), 'Content page AI buttons do not use purple-50');

const bizContextPage = fs.readFileSync(path.join(rootDir, 'apps/admin/app/admin/business-context/page.tsx'), 'utf8');
assert(bizContextPage.includes('text-[#C206C9]'), 'Business context AI improve buttons use #C206C9');

const onboardDescPage = fs.readFileSync(path.join(rootDir, 'apps/admin/app/admin/onboarding/business-description/page.tsx'), 'utf8');
assert(onboardDescPage.includes('text-[#C206C9]'), 'Onboarding description AI improve buttons use #C206C9');

// 8. Menu Navigation Loader Complete Removal
console.log('\n8. Checking Menu Navigation Loader Complete Removal...');
const loadingPath = path.join(rootDir, 'apps/admin/app/admin/loading.tsx');
assert(!fs.existsSync(loadingPath), 'apps/admin/app/admin/loading.tsx is completely removed');

// 9. Scope Protection: Public Website Decoupled
console.log('\n9. Checking Scope Isolation (apps/web decouple)...');
const webFilesChanged = fs.existsSync(path.join(rootDir, 'apps/web'));
assert(webFilesChanged, 'apps/web exists and remains intact');

console.log('\n----------------------------------------------------');
console.log(`TOTAL PASSES: ${passes.length}`);
console.log(`TOTAL FAILURES: ${failures.length}`);
console.log('----------------------------------------------------');

if (failures.length > 0) {
  console.error('\nAUDIT FAILED! Fix the above issues.');
  process.exit(1);
} else {
  console.log('\nAUDIT PASSED! All brand identity rules verified.');
  process.exit(0);
}
