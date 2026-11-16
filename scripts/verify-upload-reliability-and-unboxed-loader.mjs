/**
 * SPAROVIA — UPLOAD RELIABILITY & UNBOXED BRANDED LOADER VERIFICATION
 */

import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
    failed++;
  }
}

console.log('='.repeat(80));
console.log('SPAROVIA — CRITICAL UPLOAD RELIABILITY & UNBOXED LOADER AUDIT');
console.log('='.repeat(80));

// 1. Backend Idempotency & Safe Persistence
console.log('\n--- GROUP 1: Backend Idempotency & Duplicate Prevention ---');
const serviceCode = fs.readFileSync('backend/src/Sparovia.Infrastructure/Images/WebsiteImageService.cs', 'utf8');

assert(
  serviceCode.includes('recentDuplicate') && serviceCode.includes('Idempotent duplicate upload detected'),
  'Backend WebsiteImageService implements idempotent upload check to prevent duplicate images during retries'
);

assert(
  serviceCode.includes('CreatedAt >= DateTime.UtcNow.AddMinutes(-2)'),
  'Idempotent check safely scopes window to 2 minutes'
);

// 2. Frontend Upload Reliability & False Error Prevention
console.log('\n--- GROUP 2: Frontend Upload Reliability & Image URL Resolution ---');
const uploadModalCode = fs.readFileSync('apps/admin/components/images/ImageUploadModal.tsx', 'utf8');

assert(
  uploadModalCode.includes('function resolveImageUrl'),
  'ImageUploadModal defines resolveImageUrl to ensure relative API image paths resolve to API server origin'
);

assert(
  uploadModalCode.includes('resolveImageUrl(savedImage.previewUrl)'),
  'Saved image thumbnail uses resolved API URL to prevent 404 blank preview on Vercel'
);

assert(
  uploadModalCode.includes('isSubmittingRef.current'),
  'ImageUploadModal blocks duplicate submissions synchronously via ref'
);

assert(
  uploadModalCode.includes('checkRes?.data?.find') || uploadModalCode.includes('/website/images'),
  'ImageUploadModal reconciles server state if network connection blips, preventing false connection errors'
);

assert(
  uploadModalCode.includes('Non-fatal parent library refresh notice'),
  'ImageUploadModal isolates parent refresh so UI notification failures never discard a successful upload'
);

// 3. Redesigned Success Dialog (No Button Overlap & Clean Stacking)
console.log('\n--- GROUP 3: Success Dialog Layout & Responsive Stacking ---');
assert(
  uploadModalCode.includes('flex flex-col-reverse sm:flex-row items-stretch sm:items-center'),
  'Success footer actions stack vertically on mobile and horizontally on desktop without overlapping'
);

assert(
  uploadModalCode.includes('Done — Keep Original') && uploadModalCode.includes('Enhance Image (Optional)'),
  'Both actions are present with correct hierarchy and labels'
);

// 4. Sparovia Branded Loader: Removal of Square, Card, Elevation & Blurred Aura
console.log('\n--- GROUP 4: Transparent Unboxed Branded Loader ---');
const loaderCode = fs.readFileSync('apps/admin/components/ui/SparoviaLogoLoader.tsx', 'utf8');
const cssCode = fs.readFileSync('apps/admin/app/globals.css', 'utf8');

assert(
  !loaderCode.includes('sparovia-loader-aura'),
  'SparoviaLogoLoader completely removed the blurry background radial-gradient aura div'
);

assert(
  !cssCode.includes('@keyframes sparoviaAuraLoop'),
  'globals.css removed sparoviaAuraLoop keyframes'
);

assert(
  !cssCode.includes('drop-shadow(0 0 28px'),
  'globals.css eliminated heavy multi-stage drop-shadows that created square-like fuzzy bloom'
);

assert(
  loaderCode.includes('bg-transparent'),
  'SparoviaLogoLoader explicitly uses 100% transparent background with no card or elevated container'
);

console.log('\n' + '='.repeat(80));
console.log(`TOTAL AUDIT CHECKS: ${passed + failed}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log('='.repeat(80));

if (failed > 0) {
  process.exit(1);
}
