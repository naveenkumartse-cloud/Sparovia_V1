import fs from 'fs';

const html = fs.readFileSync('apps/web/out/index.html', 'utf8');

console.log('--- Static HTML Verification ---');
console.log('Length:', html.length, 'bytes');
console.log('Contains Skeleton:', html.includes('PublicWebsiteSkeleton') || html.includes('animate-pulse') || html.includes('Loading website content'));

const sections = ['hero', 'about', 'interiors', 'upvc', 'gallery', 'why-us', 'faq', 'contact'];
sections.forEach(s => {
  const present = html.includes(`id="${s}"`);
  console.log(`Section #${s}:`, present ? 'FOUND' : 'MISSING');
});

console.log('Footer element:', html.includes('<footer') ? 'FOUND' : 'MISSING');
console.log('KVN Official Logo image (/images/logo.png):', html.includes('/images/logo.png') ? 'FOUND' : 'MISSING');
console.log('Recreated Header KVN letters/text:', html.includes('>KVN</span>') || html.includes('>INTERIOR</span>') ? 'FOUND (ERROR: Duplicate Text)' : 'NONE (CORRECT)');
console.log('Primary CTA "Get a Quote":', html.includes('Get a Quote') ? 'FOUND' : 'MISSING');
console.log('uPVC Window Installations:', html.includes('Window &amp; Door Installations') || html.includes('Window & Door Installations') ? 'FOUND' : 'MISSING');
console.log('Enquiry Form inputs present:', html.includes('user-name') && html.includes('user-phone') && html.includes('user-message') ? 'FOUND' : 'MISSING');

// Verify that contentConfig does not contain fabricated client copy
const contentConfigStr = fs.readFileSync('apps/web/config/contentConfig.ts', 'utf8');
const isCleanBaseline = !contentConfigStr.includes('Transform Your Space.') && !contentConfigStr.includes('What solutions does KVN Interior provide?');
console.log('ContentConfig Baseline Clean (No hardcoded mock masking):', isCleanBaseline ? 'PASS' : 'FAIL');
