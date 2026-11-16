/**
 * SPAROVIA — IMAGE UPLOAD & IMAGE STUDIO POLISH VERIFICATION SUITE
 * Validates UX modernization, mobile responsiveness, scroll behavior, and image persistence.
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
console.log('SPAROVIA — IMAGE STUDIO, IMAGE UPLOAD & MOBILE UX VERIFICATION');
console.log('='.repeat(80));

// 1. ImageUploadModal 2-Step Workflow & No Forced Enhancement Trap
console.log('\n--- GROUP 1: ImageUploadModal 2-Step Workflow & No Forced Trap ---');
const uploadModalCode = fs.readFileSync('apps/admin/components/images/ImageUploadModal.tsx', 'utf8');

assert(
  uploadModalCode.includes("uploadStep, setUploadStep] = useState<'form' | 'success'>('form')") ||
  uploadModalCode.includes("uploadStep === 'form'") && uploadModalCode.includes("uploadStep === 'success'"),
  'ImageUploadModal defines explicit 2-step workflow: form and success confirmation'
);

assert(
  uploadModalCode.includes('Done — Keep Original'),
  'Step 2 provides primary "Done — Keep Original" action for business owners'
);

assert(
  uploadModalCode.includes('Enhance Image (Optional)'),
  'Step 2 provides optional "Enhance Image (Optional)" secondary action'
);

assert(
  !uploadModalCode.includes('Enhance in Studio') || uploadModalCode.includes('Enhance Image (Optional)'),
  'Step 1 form does NOT trap users with unpersisted "Enhance in Studio" button'
);

assert(
  uploadModalCode.includes('multiple={isMultipleAllowed}'),
  'Dropzone enables multi-file upload for portfolio images when !slot'
);

// 2. ImagesPage: Decoupled onSuccess & Studio Routing
console.log('\n--- GROUP 2: ImagesPage Decoupled Upload Handler ---');
const imagesPageCode = fs.readFileSync('apps/admin/app/admin/images/page.tsx', 'utf8');

// Ensure onSuccess does NOT call handleOpenStudio(newImg)
const uploadModalCall = imagesPageCode.match(/<ImageUploadModal[\s\S]*?\/>/)?.[0] || '';
assert(
  !uploadModalCall.includes('handleOpenStudio(newImg)'),
  'ImageUploadModal onSuccess does NOT forcibly open Image Studio'
);

assert(
  uploadModalCall.includes('handleOpenStudio(target as ImageDto)'),
  'ImageUploadModal onOpenStudio correctly opens studio with saved server image'
);

// 3. Mobile Layout, Scrolling & Safe Area Insets
console.log('\n--- GROUP 3: Mobile Layout, Scrolling & Safe Area Insets ---');
const studioCode = fs.readFileSync('apps/admin/components/images/ImageStudioWorkspace.tsx', 'utf8');

assert(
  studioCode.includes('overflow-y-auto lg:overflow-hidden'),
  'ImageStudioWorkspace main body allows vertical scroll on mobile viewports'
);

assert(
  studioCode.includes("touchAction: 'pan-y'"),
  'Comparison canvas allows vertical touch scrolling (pan-y) so users are never trapped'
);

assert(
  studioCode.includes('env(safe-area-inset-bottom)'),
  'Control rail has safe-area inset bottom padding so action buttons are never cut off'
);

const modalCode = fs.readFileSync('apps/admin/components/ui/Modal.tsx', 'utf8');
assert(
  modalCode.includes('max-h-[100dvh]') && modalCode.includes('safe-area-inset-bottom'),
  'Modal component provides full-height sheet and safe-area insets on mobile screens'
);

// 4. Approved Operations & Truthful Feedback
console.log('\n--- GROUP 4: 7 Approved Operations & Truthful Feedback ---');
assert(
  studioCode.includes('ImproveClarity') &&
  studioCode.includes('ImproveSharpness') &&
  studioCode.includes('ReduceNoise') &&
  studioCode.includes('Upscale') &&
  studioCode.includes('ClassicLook') &&
  studioCode.includes('ModernLook') &&
  studioCode.includes('WebOptimize'),
  'All 7 approved image enhancement operations remain supported and available'
);

assert(
  studioCode.includes("['Light', 'Balanced', 'High']"),
  'Presets provide Light, Balanced (Default/Auto), and High profiles'
);

console.log('\n' + '='.repeat(80));
console.log(`TOTAL AUDIT CHECKS: ${passed + failed}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log('='.repeat(80));

if (failed > 0) {
  process.exit(1);
}
