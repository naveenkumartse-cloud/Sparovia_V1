You are implementing the **Sparovia V1 Image Quality Studio Rebuild**.

Use the existing Sparovia source-of-truth documentation, approved `docs/DESIGN.md`, and actual repository implementation as the authority. This is an implementation task, not a planning-only task. Inspect existing systems first, then make the approved changes, run verification, and report actual results.

==================================================
BUILD
==================================================

Image Quality Studio Rebuild

==================================================
1. OBJECTIVE
==================================================

Rebuild the existing Image Quality Studio interface into a modern, premium, production-ready image workspace while preserving the working image-processing pipeline, API contracts, storage architecture, security controls, image lifecycle, and publishing boundaries.

The target is not a basic upload form or a generic admin page.

The experience must emphasize:
- Genuine image quality improvement
- A compelling and accurate before/after comparison
- Adaptive enhancement operations
- Clear processing explanations
- Explicit human review and approval
- Safe, separate publishing workflow
- Responsive and accessible interactions

Do not rewrite working backend functionality merely to modernize the UI.

==================================================
2. SOURCE-OF-TRUTH DOCUMENTATION
==================================================

Read the canonical source-of-truth documents before editing:

- `docs/DESIGN.md` (Approved visual design authority)
- `docs/PILOT_V1_PRODUCT_SPECIFICATION.md` (Product scope and business constraints)
- `docs/PILOT_V1_DOMAIN_DATA_MODEL.md` (Domain entities, invariants, and lifecycle)
- `docs/PILOT_V1_API_SPECIFICATION.md` (API contracts and authorization)
- `docs/PILOT_V1_UX_SCREEN_SPECIFICATION.md` (Screen structure, journeys, and states)
- `docs/PILOT_V1_IMPLEMENTATION_PLAN.md` (Implementation sequencing and verification)
- Relevant project rules, architecture, and implementation notes

*(Historical note: Legacy specifications `PILOT_V1_AI_IMAGE_SPECIFICATION.md` and `PILOT_V1_SPAROVIA_THEME.md` have been retired and superseded by this document and `docs/DESIGN.md` respectively.)*

Inspect the actual repository as well. Documentation may describe earlier states; do not assume historical test results or implementation status are current.

If documentation conflicts with a locked decision or existing implementation:
1. Identify the conflict.
2. Preserve explicitly approved product decisions.
3. Reuse valid working implementation where possible.
4. Avoid breaking API, database, storage, or publishing contracts.
5. Do not silently change unrelated source-of-truth documents.
6. Report unresolved conflicts that require a product decision.

==================================================
3. INSPECT EXISTING IMPLEMENTATION FIRST
==================================================

Before editing, inspect:

- Image Studio route/page
- Image Quality Studio modal/panel and shared UI components
- Existing upload and batch-upload flow
- Local preview implementation
- Image validation
- Image categories and tenant-specific category management
- Image API controllers and DTOs
- Image application services and repositories
- Deterministic image-processing service
- Image enhancement operations and operation mapping
- Image original/variant lifecycle
- Supabase Storage integration and bucket configuration
- Preview URL generation and expiration behavior
- Approval and rejection operations
- Website image publishing workflow
- Tenant resolution and authorization
- Audit and processing metadata
- Existing tests and benchmark suite
- Existing responsive and accessibility patterns

Search for existing equivalents before creating any new component, service, endpoint, DTO, state model, processor, or storage abstraction.

Do not create duplicate image infrastructure.

==================================================
4. APPROVED VISUAL DESIGN
==================================================

Use `docs/DESIGN.md` as the authority for Sparovia's approved visual theme.

Locked color values:

- Primary cobalt: `#315FEA`
- Secondary purple: `#7950B8`
- Primary text: `#172033`
- Supporting text: `#475569`
- Main surface: `#FFFFFF`
- Supporting surface: `#F3F6FA`
- Purple-tinted surface: `#F5F0FB`
- Subtle border: `#E3E7ED`
- Default border: `#CBD5E1`
- Strong border: `#64748B`
- Primary action default: `#315FEA`
- Primary action hover: `#254EDB`
- Primary action pressed: `#1E40AF`
- Focus/selected accent candidate: `#1D4ED8`
- Success: `#15803D`
- Warning: `#B45309`
- Error: `#B91C1C`
- Information: `#1D4ED8`

Typography:
- Inter as the primary typeface.
- Use the approved responsive type scale from `docs/DESIGN.md`.
- Verify font fallback and loading behavior rather than assuming it.

Approved surfaces, radii, and elevation:
- Mostly white and neutral surfaces.
- Selective purple-tinted surfaces only.
- 4 px indicators, 6 px controls, 8 px panels, 10 px dialogs.
- Tables remain minimal/square.
- Flat surfaces by default.
- Use only the approved subtle and overlay shadow tokens when useful.

Brand restrictions:
- Preserve the approved blue-to-purple SPAROVIA wordmark gradient and light-blue ADMIN badge.
- Do not add decorative purple gradients elsewhere.
- Do not use pill-shaped buttons.
- Use consistent simple line icons, not emoji.
- Keep motion purposeful and respect reduced-motion preferences.
- Do not add fake metrics, AI scores, quality percentages, fabricated claims, generic AI-slop copy, or decorative clutter.
- Do not change locked theme decisions.

Use existing design tokens and shared components wherever available. Do not scatter arbitrary color literals across components.

==================================================
5. MODERN IMAGE STUDIO EXPERIENCE
==================================================

Build a polished, image-first workspace with a clear visual hierarchy.

The image itself must be the primary focus. Avoid a generic settings-heavy admin form.

The UI should clearly communicate:
- Which original image is being edited
- Which enhancement operation is selected
- Whether processing is pending, running, completed, or failed
- Which result is the derived enhanced variant
- Which corrections were actually applied
- Whether the result is awaiting review, approved, rejected, or published

Use the existing application layout and navigation. Do not redesign the entire Admin Panel or add unrelated product features.

Include appropriate:
- Empty state
- Image-selected state
- Uploading state
- Processing state
- Completed state
- Validation-error state
- Processing-failure state
- Pending-review state
- Approved/rejected state
- Responsive state

Do not simulate a successful operation when the backend fails.

==================================================
6. IMAGE UPLOAD AND SELECTION
==================================================

Preserve and verify the existing upload workflow.

Supported formats:
- JPG/JPEG
- PNG
- WebP

Existing limits to preserve:
- 10 MB maximum per image
- 25 megapixels maximum decoded resolution
- 10 images maximum per batch

Requirements:
- Immediate local preview before upload
- Correct preview cleanup when files are removed or replaced
- Clear validation messages
- Correct loading and disabled states
- Duplicate-selection handling consistent with the existing contract
- Safe batch behavior when one or more files fail
- No false success notifications
- No broken or blank previews
- Optional project/work name
- Optional caption
- Tenant-specific category selection/creation where supported
- No hardcoded KVN-specific categories in shared platform behavior

Client-side validation improves usability but does not replace server-side validation.

Inspect existing upload behavior before changing it. Preserve working upload APIs and storage behavior.

==================================================
7. APPROVED ENHANCEMENT OPERATIONS
==================================================

Expose only the seven approved client-facing operations:

1. Improve Clarity
2. Improve Sharpness
3. Reduce Noise
4. Upscale
5. Classic Look
6. Modern Look
7. Web Optimize

Use existing operation identifiers and API contracts. Do not invent replacement identifiers without checking current mappings.

The existing approved V1 image-processing direction is adaptive deterministic enhancement, not generative replacement.

Reuse the existing deterministic processing pipeline where it supports the operation. Inspect the current implementation before making changes.

The previously implemented pipeline included:
- Exposure and highlight protection
- Gentle shadow recovery
- Tonal contrast and clarity
- Texture-aware noise reduction
- Restrained sharpening
- Natural color-balance correction
- Minimal corrections for already-good images

These are intended capabilities, not permission to claim every operation is currently working. Verify each operation against the actual implementation and tests.

The main manual adjustment sliders were previously agreed to be hidden/removed in favor of adaptive processing. Do not reintroduce a slider-heavy editing interface.

If any of the seven operations lacks a genuine end-to-end implementation:
- Do not fake its behavior.
- Do not label a no-op as success.
- Do not silently add a paid AI provider or a new processing architecture.
- Identify the missing capability.
- Implement it only using an approved, safe approach supported by the current architecture, or report it as a blocker requiring a separate decision.

==================================================
8. BEFORE/AFTER COMPARISON
==================================================

This is a mandatory core feature.

The review interface must provide:

- `BEFORE · Original` label
- `AFTER · Enhanced` label
- A real original/derived image comparison
- Side-by-side comparison on suitable screens
- Responsive stacked comparison on narrow screens
- An interactive before/after slider where practical
- Accessible keyboard interaction for the slider
- A side-by-side alternative so comparison is not dependent on dragging
- Correct image aspect ratios
- Useful full-size or zoom inspection where supported
- Loading, unavailable-image, and processing-error states

Both images must come from the same source image and its actual derived variant. Never use unrelated or illustrative images as a real comparison.

Ensure the preview uses the correct tenant-authorized URLs and handles expired or unavailable signed URLs according to the existing storage architecture.

Do not expose internal storage paths or bypass access controls.

==================================================
9. DETERMINISTIC CORRECTIONS AND METADATA
==================================================

When a processed variant is displayed, include a concise `Deterministic Corrections Applied` section.

Show only corrections supported by actual processing results or persisted metadata. Examples include:
- Highlights protected against blow-out
- Architectural textures preserved
- Controlled edge sharpness applied
- Color balance corrected

Requirements:
- Do not claim a correction occurred unless the processor reports it.
- Use existing metadata such as algorithm version, effective profile, and applied-correction list where available.
- Show the actual engine version when known.
- Preserve source-to-variant relationships.
- Do not invent AI quality scores, percentages, confidence meters, or fake performance indicators.
- Keep technical details understandable to a business user, with technical metadata available only where appropriate.

==================================================
10. IMAGE FIDELITY AND SAFETY
==================================================

Core principle:

“Improve quality, not reality.”

Image enhancement must preserve the factual representation of the original photograph.

Do not:
- Add or remove major objects
- Change architecture or structural elements
- Change materials or product characteristics
- Add or remove people or vehicles
- Invent rooms, buildings, products, or project details
- Turn unfinished work into finished work
- Make one project look like another
- Generate a replacement portfolio photograph
- Overwrite the original image

If a provider-based AI enhancement exists, validate its result before review and preserve human approval. Do not introduce generative image replacement into the V1 portfolio workflow.

==================================================
11. ORIGINAL AND VARIANT LIFECYCLE
==================================================

Preserve the existing image lifecycle and extend it only where necessary.

Conceptual lifecycle:

Original
→ Optional Enhanced Variant
→ Validation
→ Pending Review
→ Approved Variant
→ Website Optimization
→ Explicit Publishing

Rejection must prevent the rejected variant from being applied or published.

Requirements:
- Original uploads are immutable.
- Enhanced images are separate derived variants.
- Every variant references the correct source image and tenant.
- Failed processing must not replace the original or current published image.
- Replacing an image must not destroy the previous source or silently change the live website.
- State transitions must follow existing domain conventions.
- Invalid state transitions must be rejected.
- Do not introduce a duplicate lifecycle model if one already exists.

==================================================
12. APPROVAL AND PUBLISHING BOUNDARY
==================================================

Provide explicit review actions using the existing domain and API conventions.

Approve Enhancement:
- Revalidate ownership and result validity server-side.
- Mark the derived variant approved according to existing domain rules.
- Do not publish automatically.
- Do not modify the original.

Reject Enhancement:
- Mark the result rejected according to existing domain rules.
- Preserve the original and existing published image.
- Prevent rejected output from being published.

Publishing:
- Remains a separate, explicit action.
- Use the existing publishing workflow.
- Do not create a parallel publishing service.
- Preserve the currently live image until a replacement has been explicitly approved and published.

Protect against duplicate actions, invalid transitions, and stale results. Reuse existing concurrency and idempotency mechanisms.

==================================================
13. STORAGE, SECURITY, AND TENANT ISOLATION
==================================================

Preserve the existing Supabase Storage integration and intended private-bucket behavior.

Do not store production uploads on an ephemeral application filesystem.

Server-side validation must verify:
- Actual image format
- MIME type
- Extension consistency
- File size
- Image integrity
- Dimensions and decoded pixel count
- Safe processing capability
- Output format and integrity
- Correct tenant and source-image relationship

Security requirements:
- Use server-controlled storage keys.
- Do not trust client-supplied TenantId as proof of ownership.
- Resolve authenticated user → tenant → image → variant on the server.
- Reject cross-tenant image access, enhancement, approval, rejection, and publishing.
- Enforce backend authorization, not just frontend route protection.
- Do not expose internal storage paths, credentials, secrets, stack traces, or database details.
- Preserve audit metadata and safe operational logging.
- Follow existing retention and deletion behavior.
- Do not delete production data or storage objects as part of this UI rebuild.

==================================================
14. ERROR HANDLING AND RELIABILITY
==================================================

Handle failures without corrupting existing state.

Cover:
- Unsupported file type
- File too large
- Pixel limit exceeded
- Corrupted image
- Upload failure
- Storage failure
- Enhancement failure
- Invalid or corrupted output
- Missing or expired preview URL
- Unauthorized or cross-tenant access
- Approval failure
- Rejection failure
- Publishing failure
- Network interruption
- Duplicate submission

Requirements:
- Show a useful, safe message.
- Preserve original and published images.
- Prevent partial state changes where transactions or existing consistency mechanisms apply.
- Allow safe retry where appropriate.
- Prevent accidental duplicate requests.
- Never show success when the operation failed.
- Keep the rest of the platform usable when enhancement fails.

==================================================
15. ACCESSIBILITY AND RESPONSIVE DESIGN
==================================================

Follow `docs/DESIGN.md`.

Verify:
- Keyboard navigation
- Visible keyboard focus
- Accessible comparison slider controls
- Useful labels and alternative text
- Appropriate dialog semantics and focus handling
- Understandable validation errors
- Status updates that are accessible to assistive technology
- State communication that does not rely on color alone
- Reduced-motion behavior
- Actual foreground/background and non-text contrast
- Mobile, tablet, and desktop layouts
- 200% browser zoom where practical

Do not claim WCAG conformance without actual verification.

==================================================
16. TESTING AND REGRESSION PROTECTION
==================================================

Inspect the existing test suite and benchmark tests before changing code.

Add or update relevant tests for:
- Upload validation
- Batch limits
- Pixel limits
- Preview behavior where testable
- Supported operation mapping
- Deterministic output behavior
- Original-image immutability
- Variant/source relationship
- Invalid output rejection
- Tenant isolation
- Authorization
- Approval and rejection
- Duplicate requests
- Invalid state transitions
- Stale-result protection
- Publishing boundary
- Failure handling
- Existing image API regressions

Run the relevant backend build, frontend production build, lint checks, unit tests, and integration tests available in the repository.

Do not delete or weaken tests to make them pass. Fix regressions introduced by this build.

Historical reports of passing tests are not evidence of the current repository state. Report only tests actually run and their observed results.

==================================================
17. IMPLEMENTATION METHOD
==================================================

This is an authorized implementation task.

1. Inspect the actual code and source-of-truth documents.
2. Identify the exact files that control the Image Studio UI and relevant workflows.
3. Record important existing functionality that must be preserved.
4. Implement the modern UI and before/after experience in the existing feature.
5. Reuse existing APIs, deterministic processing, storage, variant lifecycle, and publishing.
6. Make the smallest necessary backend changes only if a verified defect blocks the approved workflow.
7. Run relevant tests and builds.
8. Fix issues introduced by the changes.
9. Review the diff for unrelated changes, hardcoded theme values, duplicated logic, and accidental feature removal.
10. Report completion accurately.

Do not stop after inspection or a proposed plan. Make actual code changes.

Do not expand scope to unrelated Admin Panel redesign, new AI infrastructure, new providers, billing, analytics, or future roadmap features.

If a critical ambiguity makes a safe implementation impossible, stop only that specific change, explain the blocker, and continue with independent approved work.

==================================================
18. REQUIRED FINAL REPORT
==================================================

After implementation, report:

1. Files inspected
2. Files changed
3. UI changes implemented
4. Before/after comparison behavior
5. Enhancement operations verified
6. Existing processing and storage services reused
7. Original/variant lifecycle behavior
8. Approval/rejection/publishing behavior
9. Security and tenant-isolation checks
10. Responsive and accessibility checks
11. Tests and builds actually run
12. Pass/fail results and relevant errors
13. Remaining unsupported operations or defects
14. Documentation/implementation conflicts discovered
15. Confirmation that unrelated features and production data were preserved

Do not claim completion for any unverified requirement.

==================================================
19. FINAL ACCEPTANCE CRITERIA
==================================================

This build is complete only when:

- The actual Image Studio UI has been changed.
- The approved Sparovia theme is applied consistently.
- The interface is modern, responsive, and image-first.
- Upload validation and local preview work.
- Only the approved seven operations are exposed.
- Each exposed operation performs its real supported behavior.
- Original and enhanced variants are compared correctly.
- The comparison slider works where implemented and has an accessible alternative.
- Processing explanations come from actual metadata.
- Original images remain immutable.
- Variants remain separate and tenant-scoped.
- Approval and rejection behave correctly.
- Approval never auto-publishes.
- Rejected variants cannot become published.
- Tenant isolation and backend authorization are preserved.
- Failures preserve existing original and published images.
- Existing image APIs and unrelated website behavior remain intact.
- Relevant builds and tests have been run and results reported.
- No unapproved design decisions or duplicate architecture are introduced.

Do not stop at planning. Implement the approved Image Studio rebuild, verify the actual changes, and report exactly what was completed.
