import fs from 'fs';

const html = fs.readFileSync('apps/web/out/index.html', 'utf8');

console.log('--- Static HTML Verification ---');
console.log('Length:', html.length, 'bytes');
console.log('Contains Skeleton:', html.includes('PublicWebsiteSkeleton') || html.includes('animate-pulse') || html.includes('Loading website content'));

const sections = ['hero', 'about', 'interiors', 'upvc', 'gallery', 'why-us', 'testimonials', 'faq', 'contact'];
sections.forEach(s => {
  const present = html.includes(`id="${s}"`);
  console.log(`Section #${s}:`, present ? 'FOUND' : 'MISSING');
});

console.log('Footer element:', html.includes('<footer') ? 'FOUND' : 'MISSING');
console.log('KVN Logo image (/images/Logo.jpeg):', html.includes('/images/Logo.jpeg') ? 'FOUND' : 'MISSING');
console.log('KVN Brand Text:', html.includes('KVN') && html.includes('INTERIOR') ? 'FOUND' : 'MISSING');
console.log('Primary CTA "Get a Quote":', html.includes('Get a Quote') ? 'FOUND' : 'MISSING');
console.log('Headline "Transform Your Space.":', html.includes('Transform Your Space.') ? 'FOUND' : 'MISSING');
console.log('Modular Kitchens:', html.includes('Modular Kitchens') ? 'FOUND' : 'MISSING');
console.log('Bespoke Wardrobes:', html.includes('Bespoke Wardrobes') ? 'FOUND' : 'MISSING');
console.log('Living / TV Units:', html.includes('Living / TV Units') ? 'FOUND' : 'MISSING');
console.log('uPVC Window Installations:', html.includes('Window &amp; Door Installations') || html.includes('Window & Door Installations') ? 'FOUND' : 'MISSING');
console.log('Why Choose Us items:', html.includes('Customized Design') ? 'FOUND' : 'MISSING');
console.log('Testimonials present:', html.includes('The modular kitchen and uPVC window installation') ? 'FOUND' : 'MISSING');
console.log('FAQ items present:', html.includes('What solutions does KVN Interior provide?') ? 'FOUND' : 'MISSING');
console.log('Enquiry Form inputs present:', html.includes('user-name') && html.includes('user-phone') && html.includes('user-message') ? 'FOUND' : 'MISSING');
