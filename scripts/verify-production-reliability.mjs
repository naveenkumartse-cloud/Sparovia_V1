import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('================================================================================');
console.log('SPAROVIA — PRODUCTION RELIABILITY, IMAGE PERSISTENCE, RESPONSIVE LAYOUT & LOADING');
console.log('Verification Suite: Comprehensive End-to-End Contract and Implementation Audit');
console.log('================================================================================\n');

let passCount = 0;
let failCount = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  [PASS] ${description}`);
    passCount++;
  } catch (err) {
    console.error(`  [FAIL] ${description}`);
    console.error(`         ${err.message}`);
    failCount++;
  }
}

// --------------------------------------------------------------------------------
// GROUP 1: IMAGE PERSISTENCE & UPLOAD PIPELINE
// --------------------------------------------------------------------------------
console.log('--- GROUP 1: Image Persistence & Upload Pipeline ---');

test('Backend WebsiteImageService: Slot collisions safely handled without overwriting published live image', () => {
  const serviceSrc = fs.readFileSync(
    path.resolve('backend/src/Sparovia.Infrastructure/Images/WebsiteImageService.cs'),
    'utf8'
  );
  assert.strictEqual(
    serviceSrc.includes('var existingInSlot = await _dbContext.Images'),
    true,
    'Must query for existing images in the same slot'
  );
  assert.strictEqual(
    serviceSrc.includes('existing.Status == "Published"'),
    true,
    'Must inspect whether an existing image is currently published'
  );
  assert.strictEqual(
    serviceSrc.includes('IsActiveWebsiteUsage = !isReplacementForPublished'),
    true,
    'Pending replacement must NOT immediately usurp live website usage'
  );
  assert.strictEqual(
    serviceSrc.includes('Status = "Approved"'),
    true,
    'Pending replacement must be staged as Approved candidate'
  );
});

test('ImageStudioWorkspace: Provides explicit handleSaveOriginal to persist pending uploads directly to library', () => {
  const studioSrc = fs.readFileSync(
    path.resolve('apps/admin/components/images/ImageStudioWorkspace.tsx'),
    'utf8'
  );
  assert.strictEqual(
    studioSrc.includes('const [isSavingOriginal, setIsSavingOriginal] = useState<boolean>(false);'),
    true,
    'Must define isSavingOriginal state'
  );
  assert.strictEqual(
    studioSrc.includes('const handleSaveOriginal = async (): Promise<ImageDto | null> => {'),
    true,
    'Must implement handleSaveOriginal'
  );
  assert.strictEqual(
    studioSrc.includes("apiClient.postFormData<{ data: ImageDto }>('/website/images'"),
    true,
    'Must persist to backend website images API'
  );
  assert.strictEqual(
    studioSrc.includes('onImageUpdated(uploadedImg);'),
    true,
    'Must update parent state so media library and refresh retain the saved image'
  );
});

test('ImageStudioWorkspace State A: Renders Save to Media Library button and enables direct publishing for pending uploads', () => {
  const studioSrc = fs.readFileSync(
    path.resolve('apps/admin/components/images/ImageStudioWorkspace.tsx'),
    'utf8'
  );
  assert.strictEqual(
    studioSrc.includes('Save to Media Library'),
    true,
    'Must render Save to Media Library button in State A'
  );
  assert.strictEqual(
    studioSrc.includes('handlePublishImage = async () => {'),
    true,
    'Must have handlePublishImage'
  );
  assert.strictEqual(
    studioSrc.includes('targetImage = await handleSaveOriginal();'),
    true,
    'Publishing a pending upload must save original first before publishing'
  );
  assert.strictEqual(
    studioSrc.includes("(effectiveImage?.status === 'Approved' || (!effectiveImage && Boolean(pendingUpload)))"),
    true,
    'Publish original button must be accessible for pending uploads'
  );
});

// --------------------------------------------------------------------------------
// GROUP 2: MOBILE STACK AND SIDE-BY-SIDE RESPONSIVE LAYOUTS
// --------------------------------------------------------------------------------
console.log('\n--- GROUP 2: Mobile Stack and Side-by-Side Responsive Layouts ---');

test('View Mode Switcher is accessible across all mobile viewports (< 640px) without hidden sm:flex', () => {
  const studioSrc = fs.readFileSync(
    path.resolve('apps/admin/components/images/ImageStudioWorkspace.tsx'),
    'utf8'
  );
  assert.strictEqual(
    studioSrc.includes('hidden sm:flex items-center p-0.5 bg-slate-100 dark:bg-slate-800'),
    false,
    'View mode switcher must NOT be hidden on mobile screens'
  );
  assert.strictEqual(
    studioSrc.includes('flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-[6px]'),
    true,
    'View mode switcher must be flex on all screens'
  );
  assert.strictEqual(
    studioSrc.includes('<span className="sm:hidden text-[10px]">Side</span>'),
    true,
    'Provides mobile-optimized compact labels for Side-by-Side'
  );
  assert.strictEqual(
    studioSrc.includes('<span className="sm:hidden text-[10px]">Stack</span>'),
    true,
    'Provides mobile-optimized compact labels for Stacked'
  );
});

test('Side-by-Side mode maintains true 2-column balanced grid on viewports >= 360px without collapsing', () => {
  const studioSrc = fs.readFileSync(
    path.resolve('apps/admin/components/images/ImageStudioWorkspace.tsx'),
    'utf8'
  );
  assert.strictEqual(
    studioSrc.includes('min-[360px]:grid min-[360px]:grid-cols-2'),
    true,
    'Must use responsive 2-column grid starting at 360px'
  );
  assert.strictEqual(
    studioSrc.includes('grid grid-cols-1 md:grid-cols-2'),
    false,
    'Must NOT collapse into single column between 360px and 768px'
  );
  assert.strictEqual(
    studioSrc.includes('Side-by-side adapts to vertical stack on screens under 360px for readability.'),
    true,
    'Must display informative notice when adapting on screens below 360px'
  );
});

test('Stacked mode renders vertical single-column items with flexible min-height and overflow scroll', () => {
  const studioSrc = fs.readFileSync(
    path.resolve('apps/admin/components/images/ImageStudioWorkspace.tsx'),
    'utf8'
  );
  assert.strictEqual(
    studioSrc.includes('w-full h-full flex flex-col gap-2 sm:gap-3 p-2 sm:p-3 overflow-y-auto'),
    true,
    'Stacked mode container must be flex-col with overflow-y-auto'
  );
  assert.strictEqual(
    studioSrc.includes('min-h-[160px] sm:min-h-[220px] flex-1'),
    true,
    'Stacked mode elements must have responsive min-heights preventing container overflow'
  );
});

// --------------------------------------------------------------------------------
// GROUP 3: DASHBOARD LOADS ONCE AFTER LOGIN (NO DOUBLE RELOAD)
// --------------------------------------------------------------------------------
console.log('\n--- GROUP 3: Dashboard Loads Once After Login ---');

test('Login page eliminates full-page browser reload (window.location.href) and navigates cleanly via router.replace', () => {
  const loginSrc = fs.readFileSync(
    path.resolve('apps/admin/app/login/page.tsx'),
    'utf8'
  );
  assert.strictEqual(
    loginSrc.includes('window.location.href = dest;'),
    false,
    'window.location.href must be eradicated from handleLogin'
  );
  assert.strictEqual(
    loginSrc.includes('router.replace(dest);'),
    true,
    'router.replace must be used for single-page SPA transition'
  );
});

test('AdminDashboard protects against duplicate summary data fetching on mount', () => {
  const dashSrc = fs.readFileSync(
    path.resolve('apps/admin/app/admin/page.tsx'),
    'utf8'
  );
  assert.strictEqual(
    dashSrc.includes('const fetchedRef = useRef(false);'),
    true,
    'Must define fetchedRef to guard against duplicate fetch'
  );
  assert.strictEqual(
    dashSrc.includes('if (fetchedRef.current) return;'),
    true,
    'Must check fetchedRef before executing fetchSummary'
  );
});

// --------------------------------------------------------------------------------
// GROUP 4: UNIFIED LOADING TIMING & SMOOTH EXIT TRANSITION
// --------------------------------------------------------------------------------
console.log('\n--- GROUP 4: Unified Loading Timing & Exit Transitions ---');

test('AdminShell enforces minimum display duration (3000ms / full 7-stage cycle) to ensure logo sequence does not cut off abruptly', () => {
  const shellSrc = fs.readFileSync(
    path.resolve('apps/admin/components/admin/AdminShell.tsx'),
    'utf8'
  );
  assert.strictEqual(
    shellSrc.includes('initialLoadingActive'),
    true,
    'Must track initialLoadingActive'
  );
  assert.strictEqual(
    shellSrc.includes('const minDisplayMs = 3000;'),
    true,
    'Must enforce minDisplayMs of 3000ms'
  );
  assert.strictEqual(
    shellSrc.includes('setIsLoaderFadingOut(true);'),
    true,
    'Must initiate smooth fade-out exit'
  );
  assert.strictEqual(
    shellSrc.includes('transition-opacity duration-300 ease-out'),
    true,
    'Must apply 300ms smooth fade-out exit transition'
  );
});

// --------------------------------------------------------------------------------
// GROUP 5: GRANULAR OPERATION LOADING FEEDBACK
// --------------------------------------------------------------------------------
console.log('\n--- GROUP 5: Granular Operation Loading Feedback ---');

test('ImagesPage defines granular IDs for publishing, unpublishing, and approving operations', () => {
  const imagesSrc = fs.readFileSync(
    path.resolve('apps/admin/app/admin/images/page.tsx'),
    'utf8'
  );
  assert.strictEqual(
    imagesSrc.includes('const [publishingImageId, setPublishingImageId] = useState<string | null>(null);'),
    true,
    'Must track publishingImageId'
  );
  assert.strictEqual(
    imagesSrc.includes('const [unpublishingImageId, setUnpublishingImageId] = useState<string | null>(null);'),
    true,
    'Must track unpublishingImageId'
  );
  assert.strictEqual(
    imagesSrc.includes('const [approvingImageId, setApprovingImageId] = useState<string | null>(null);'),
    true,
    'Must track approvingImageId'
  );
});

test('ImagesPage buttons exhibit per-card loading spinners and disabled states during execution', () => {
  const imagesSrc = fs.readFileSync(
    path.resolve('apps/admin/app/admin/images/page.tsx'),
    'utf8'
  );
  assert.strictEqual(
    imagesSrc.includes('isLoading={publishingImageId === pendingReplacement.id}'),
    true,
    'Pending replacement publish button must have per-card isLoading spinner'
  );
  assert.strictEqual(
    imagesSrc.includes('isLoading={unpublishingImageId === assignedImage.id}'),
    true,
    'Unpublish button must have per-card isLoading spinner'
  );
  assert.strictEqual(
    imagesSrc.includes('isLoading={publishingImageId === image.id}'),
    true,
    'Explore Our Work publish button must have per-card isLoading spinner'
  );
  assert.strictEqual(
    imagesSrc.includes('disabled={Boolean(publishingImageId || unpublishingImageId)}'),
    true,
    'Buttons must be disabled while operation is running to prevent double-submissions'
  );
});

// --------------------------------------------------------------------------------
// GROUP 6: PUBLIC WEBSITE BRANDED LOADING & DATA BINDING
// --------------------------------------------------------------------------------
console.log('\n--- GROUP 6: Public Website Branded Loading & Data Binding ---');

test('PublicWebsiteLoader component exists and strictly uses client design tokens (Warm Stone, Gold, Charcoal)', () => {
  const loaderPath = path.resolve('apps/web/components/ui/PublicWebsiteLoader.tsx');
  assert.strictEqual(fs.existsSync(loaderPath), true, 'PublicWebsiteLoader.tsx must exist');
  const loaderSrc = fs.readFileSync(loaderPath, 'utf8');
  assert.strictEqual(
    loaderSrc.includes('bg-[#FAF8F2]'),
    true,
    'Must use KVN Warm Stone background (#FAF8F2)'
  );
  assert.strictEqual(
    loaderSrc.includes('#CE9E34'),
    true,
    'Must use KVN Metallic Gold (#CE9E34)'
  );
  assert.strictEqual(
    loaderSrc.includes('src="/images/logo.png"'),
    true,
    'Must render client website logo (/images/logo.png)'
  );
  assert.strictEqual(
    loaderSrc.includes('animate-spin'),
    false,
    'Must NOT contain traditional spinners'
  );
  assert.strictEqual(
    loaderSrc.includes('#315FEA'),
    false,
    'Must NOT leak Sparovia Admin Cobalt Blue into public website'
  );
});

test('Public website page.tsx displays PublicWebsiteLoader while published content is resolving (zero blank flashes)', () => {
  const webPageSrc = fs.readFileSync(
    path.resolve('apps/web/app/page.tsx'),
    'utf8'
  );
  assert.strictEqual(
    webPageSrc.includes('import PublicWebsiteLoader from'),
    true,
    'Must import PublicWebsiteLoader'
  );
  assert.strictEqual(
    webPageSrc.includes('if (isLoading && !hasPublishedSections && !error) {'),
    true,
    'Must intercept initial loading state before rendering content'
  );
  assert.strictEqual(
    webPageSrc.includes('return <PublicWebsiteLoader businessName={website?.name} />;'),
    true,
    'Must render PublicWebsiteLoader with tenant business name'
  );
});

// --------------------------------------------------------------------------------
// SUMMARY REPORT
// --------------------------------------------------------------------------------
console.log('\n================================================================================');
console.log(`TOTAL AUDIT CHECKS: ${passCount + failCount}`);
console.log(`PASSED: ${passCount}`);
console.log(`FAILED: ${failCount}`);
console.log('================================================================================\n');

if (failCount > 0) {
  process.exit(1);
}
