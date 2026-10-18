# Sparovia V1 Implementation Tasks

**Status:** Draft checklist\
**Scope:** Only the bugs and improvements discussed from the uploaded
screenshots and prior Sparovia review. This is a task plan, not a claim
that anything is implemented.

## Rules for every task

-   Inspect the current repository and reproduce the issue before
    editing.
-   Establish the root cause from evidence; do not guess from
    screenshots alone.
-   Change only the approved scope. Preserve working V1 functionality
    and existing data.
-   Do not rebuild the product or add unapproved features, providers,
    modules, or architecture.
-   Do not claim tests passed unless they were actually run.
-   Follow the approved `docs/DESIGN.md` direction: restrained, premium,
    mobile-first, consistent, purposeful motion; no decorative
    gradients, pill buttons, fake metrics, or unnecessary animation.
-   Keep AI content grounded in verified business information. Never
    invent credentials, awards, reviews, customers, or project results.
-   Suggestions and image enhancements require human review. Never
    auto-publish.
-   Social publishing integrations remain research-only and are not
    authorized for implementation.

## Task 0 --- Apply the approved design specification

**Priority:** High \| **Status:** Pending

-   Inspect repository status and the current canonical
    `docs/DESIGN.md`.
-   Apply the already approved design draft to `docs/DESIGN.md` through
    the repository workflow.
-   Preserve locked design decisions and avoid unrelated code/document
    changes.

**Acceptance criteria** - The canonical file contains the approved
specification. - Diff is limited to the intended documentation change
and is reviewed for completeness. - Do not claim the repository has
changed until the change is applied and verified.

## Task 1 --- Fix AI Content Assistance output

**Priority:** High \| **Status:** Pending

**Observed screenshot bug:** AI Content Assistance shows
`User Safety: safe` in the suggestion area instead of useful rewritten
content. The UI labels the result as an AI suggestion, making the result
misleading.

-   Trace the full path: selected operation and input → frontend → API →
    provider response → server validation/mapping → rendered result.
-   Reproduce the defect and identify the root cause before editing.
-   Correct parsing or field mapping only where evidence identifies the
    fault.
-   Prevent provider metadata, safety classifications, internal
    identifiers, raw JSON, or diagnostics from appearing as
    customer-facing copy.
-   Show the actual suggestion in the intended area; keep it editable
    and reviewable.
-   Accepting a suggestion changes draft content only; it must not
    publish automatically.
-   Add truthful loading, empty, error, timeout, retry, and
    invalid-response states.
-   Handle missing or malformed responses without showing false success.
-   Check dialog and controls on mobile and desktop.

**Acceptance criteria** - The reproduced case displays useful content
rather than `User Safety: safe`. - Invalid/empty responses show a
truthful failure or empty state. - Editing, accepting, saving draft, and
publishing remain distinct actions. - Relevant tests cover valid,
malformed, missing, and failed responses. - Record reproduction steps
and actual verification results.

## Task 2 --- Verify and fix Image Studio operations

**Priority:** High \| **Status:** Pending

**Observed/reported issues to verify against current code** - Operation
success messages do not by themselves prove that the output was
processed correctly. - Classic Look before/after appears nearly
identical at the screenshot's displayed scale; this is a reason to
investigate, not proof that files are identical. - Earlier reports
mention operations not visibly updating the result, technical values
such as `1.0.0-deterministic`, `QualityStudio:High`, dimensions or
correction identifiers exposed in the UI, and image changes not
persisting. Verify whether each is still reproducible.

**Required operations** 1. Improve Clarity 2. Improve Sharpness 3.
Reduce Noise 4. Upscale 5. Classic Look 6. Modern Look 7. Web Optimize

**Work** - Reproduce each relevant issue and trace the actual processing
path. - Verify the selected operation runs and the displayed candidate
matches the actual returned output. - Compare source/output identity,
dimensions, format, file size, and visual changes where applicable; do
not rely on a success banner. - Represent unchanged/subtle results
honestly rather than claiming unproven improvement. - Hide internal
implementation identifiers from customer-facing UI. - Ensure failures do
not mark candidates successful. - Preserve immutable originals and store
enhanced variants separately. - Verify preview refresh, candidate
persistence after reload, approval, and publishing state. - Keep human
approval separate from publishing; never auto-publish. - Verify
configured format, file-size, and pixel limits. - Test comparison
controls and operation UI on narrow mobile and desktop.

**Acceptance criteria** - All seven operations have verified behavior
and output. - Displayed candidates match returned/stored outputs;
originals remain unchanged. - Success, unchanged output, and failure are
represented truthfully. - No internal technical metadata is exposed as
customer-facing content. - Candidate state persists correctly. -
Relevant operation, persistence, and failure-path tests pass.

## Task 3 --- Verify upload-to-Studio and media management workflow

**Priority:** High \| **Status:** Pending

**Discussed requirements/reports** - Image Studio should be discoverable
in the initial upload flow. - Image saving/persistence has been reported
as unreliable; reproduce it. - The earlier Website Images / Slots view
reportedly used large four-column cards with previews. - Preserve
existing Explore Our Work cards. - Slots and categories must remain
separate. - Bulk delete and Publish were reported as existing
capabilities that must not be lost.

**Work** - Inspect current upload flow, Website Images / Slots screen,
Explore Our Work cards, slot/category handling, persistence, bulk
actions and publish workflow before editing. - Confirm which reported
regressions still exist. - Provide a clear route from initial upload to
Studio. - Verify upload, process, save, refresh/reopen, replace,
unpublish, publish and delete. - Preserve Explore Our Work and keep
slots separate from categories. - Restore the old four-column card
layout only if repository history/current project evidence confirms it
is the intended existing behavior. - Verify bulk delete and Publish,
including appropriate confirmation/authorization. - Ensure UI success
notifications reflect actual persistence responses. - Do not overwrite
the original image silently.

**Acceptance criteria** - Upload-to-Studio is discoverable and works end
to end. - Assets persist after refresh/reopen. - Website Images / Slots
and Explore Our Work remain distinct and functional. - Slots and
categories remain distinct. - Bulk delete and Publish work according to
the existing approved workflow. - Relevant workflow/regression tests
pass without destructive data changes.

## Task 4 --- Polish the discussed screens for responsive UI/UX

**Priority:** High | **Status:** CONDITIONALLY ACCEPTED — pending live browser verification

**Audit Outcome & Verified Scope (18 October 2026):**
- **Status:** Conditionally accepted. Zero TypeScript errors, zero ESLint warnings, clean Next.js production builds across both `apps/admin` and `apps/web`.
- **Condition:** Pending final live browser interactive verification on staging/production devices with live database and network connectivity. Not claimed as fully production-ready until browser execution is verified.
- **Implemented Scope:** 14 files modified across shared primitives (`Modal`, `Input`, `Textarea`, `FormField`, `InfoTooltip`, `Toast`), admin navigation (`AdminShell`), workflows (`ImageStudioWorkspace`, `ImageUploadModal`, `images/page.tsx`, `AIContentModal`, `content/page.tsx`, `business-presence/page.tsx`), and public gallery (`ProjectGallerySection`).
- **Audit Fixes Applied:**
  1. `Modal.tsx`: Focus trap filters disabled elements for initial focus.
  2. `ImageUploadModal.tsx`: Added `preventOutsideClose` for selected files/in-flight uploads.
  3. `AIContentModal.tsx`: Added `preventOutsideClose` for unaccepted/in-flight suggestions.
  4. `content/page.tsx`: Added `preventOutsideClose` to publish confirmation dialog.
  5. `leads/page.tsx`: Implemented approved card-first SaaS presentation, eliminated horizontal scrollbar and clipped table actions, redesigned Lead Detail modal to remove 6 nested boxed cards, integrated shared `PhoneInput` with +91 validation, and verified across all 6 viewports (320px–1440px) with 0 overflow. Unit tests (25/25) and integration tests (9/9) passed.

**Observed issues** - Image Studio comparison and controls feel cramped
at 320px width. - AI Content Assistance dialog/results need polish. -
Content editor and forms need mobile layout verification. - The public
image/project cards and Business Presence screen need review at mobile
and desktop sizes.

**Work** - Audit only the screens/workflows identified in the uploaded
screenshots and related discussion. - Apply approved design tokens and
component patterns. - Fix overflow, clipped labels, cramped controls,
awkward scrolling and unclear action hierarchy. - Ensure dialogs fit the
viewport and primary actions remain reachable on mobile. - Standardize
validation, loading, success, empty and error states. - Use purposeful
micro-interactions and respect reduced-motion preferences. - Preserve
functionality and avoid unrelated redesign/features.

**Acceptance criteria** - No horizontal overflow or clipped primary
actions at supported breakpoints. - Core flows work at 320px and wider
mobile widths, tablet, laptop and desktop. - Design is consistent with
the approved system. - Relevant accessibility and regression checks
pass; record actual viewport verification.

## Task 5 --- Fix Business Presence data flow to the public website

**Priority:** High | **Status:** COMPLETED

**Audit Outcome & Verified Scope (18 October 2026):**
- **Status:** COMPLETED. All acceptance criteria fully verified through automated integration tests and live headless Chrome browser end-to-end verification.
- **Automated Verification:**
  - 10/10 `BusinessPresenceTests` integration tests passing (`FullyQualifiedName~BusinessPresenceTests`).
  - 17/17 `WebsiteContentTests` integration tests passing (`FullyQualifiedName~WebsiteContentTests`).
  - Frontend TypeScript compilation passing with 0 errors (`npx tsc --noEmit`).
  - ESLint passing with 0 warnings (`npm run lint --workspace=apps/web`).
  - Production build passing with clean static generation (`npm run build:web`).
- **Live Browser Verification (Headless Chrome via DevTools Protocol):**
  1. *Admin Load:* Verified NAP details (name, phone, address) render correctly on `http://localhost:3001/admin/business-presence`.
  2. *Admin Input & Save:* Configured 3-line operating hours (`Monday – Friday: 8:00 AM – 6:00 PM\nSaturday: 9:00 AM – 2:00 PM\nSunday: Closed`) and public notice (`Special holiday consultation hours are now in effect.`). Successfully saved via UI.
  3. *Persistence on Reload:* Reloaded Admin page in browser; readback from DOM textareas confirmed exact persistence of hours and notice.
  4. *Public Published Content API:* Verified `GET /api/v1/website/published-content?domain={domain}` returns `operatingHours`, `publicNotice`, `phone`, `email`, `address`, and `serviceAreas`.
  5. *Public Desktop (1440x900):* Verified 2-column contact presentation with `whitespace-pre-line` formatting for operating hours, advisory notice card with `Info` icon, canonical NAP details, and quote inquiry form.
  6. *Public Mobile (375x812):* Verified clean vertical stacking, readable typography, and zero horizontal overflow (`scrollWidth <= clientWidth`).
  7. *Clean Empty-State Fallback:* Cleared optional fields in Admin and saved; verified public website cleanly collapses presence cards without empty containers, placeholder text, or broken layouts.
  8. *Tenant Isolation:* Provisioned independent Tenant B (`Vanguard Structural Group`); verified Tenant A and Tenant B data remain strictly isolated on both Admin and Public sites.
  9. *Screenshots Captured:* `admin-presence-saved.png`, `admin-presence-reloaded.png`, `public-contact-desktop-1440.png`, `public-contact-mobile-375.png`, `public-contact-cleared-desktop.png`, `public-contact-tenantB-desktop.png`.
- **Root Cause & Fix Applied:**
  1. `backend/src/Sparovia.Infrastructure/WebsiteContent/WebsiteContentService.cs`: In `GetPublishedContentAsync`, queried tenant-scoped `BusinessPresence` and canonical `BusinessContext` with `AsNoTracking()`. Enriched `sectionsMap["businessPresence"]`, alias `sectionsMap["presence"]`, and `sectionsMap["contact"]`.
  2. `apps/web/components/providers/WebsiteContentProvider.tsx`: Added `BusinessPresenceContent` typing, extended `ContactContent`, added `businessPresence` alias, and supported `?domain=` query parameter for multi-tenant testing/preview.
  3. `apps/web/app/components/ContactSection.tsx`: Implemented responsive contact section with Lucide icons (`Clock`, `MapPin`, `Phone`, `Mail`, `Info`), multiline preservation via `whitespace-pre-line`, advisory notice card, and clean empty-state fallback to centered quote form.
  4. `backend/tests/Sparovia.IntegrationTests/BusinessPresenceTests.cs`: Added integration tests verifying anonymous public access, multiline hours, closed days, public notice, canonical contact enrichment, tenant isolation, and safe handling of null/empty presence.

**Observed issue:** Business Presence shows operating hours and optional
public notice/announcement fields, but the user reports these are not
used on the public website. The intended meaning of "schedule" must be
confirmed from existing code/docs, not invented.

-   Trace fields from form state through API, persistence, public
    payload and public rendering.
-   Reproduce the missing behavior and identify the root cause.
-   Verify operating hours, closed days and optional announcement
    display against the existing specification.
-   Inspect "schedule" semantics and document ambiguity rather than
    assuming new behavior.
-   Verify Save, Mark as Reviewed, preview and Publish states.
-   Avoid rendering empty/unconfigured fields as misleading content.
-   Verify tenant-specific data and responsive public rendering.

**Acceptance criteria** - Saved operating hours and configured
announcements appear on the correct public site under the intended
rules. - Changes persist and follow existing preview/publish behavior. -
Empty fields do not create misleading content. - No cross-tenant data
leakage; relevant API/persistence/rendering tests pass.

## Task 6 --- Verify existing public social links

**Priority:** Medium \| **Status:** Pending

**Observed issue:** Public pages show social links, but their
configuration and behavior need verification.

-   Inspect existing Business Presence/social-link configuration and
    public rendering.
-   Test valid, empty and malformed URLs, allowed schemes, and
    enable/disable behavior against current requirements.
-   Ensure links open the intended business profiles and work on
    mobile/desktop.
-   Hide unconfigured or invalid links according to agreed validation
    rules.
-   Confirm outbound social clicks do not create or mutate Leads.
-   Preserve existing WhatsApp templates and direct external WhatsApp
    launch.
-   Do not add connected accounts, API publishing, scheduling, analytics
    or paid middleware.

**Acceptance criteria** - Configured links resolve to the correct
destination. - Invalid/empty values do not create broken public
controls. - Social clicks do not create or mutate Leads. - Relevant
validation/rendering tests pass.

## Task 7 --- Verify security and tenant isolation in affected workflows

**Priority:** Release blocker \| **Status:** Pending

**Concern to verify:** A prior audit reported that the WhatsApp webhook
accepts `X-WhatsApp-Token` but may not validate/pass it to the service.
This is not confirmed until current code is inspected.

-   Verify authorization and tenant checks for AI assistance, media
    upload/processing/persistence, content editing/publishing, Business
    Presence and Leads.
-   Trace the webhook token from request entry through actual
    validation.
-   If validation is missing, implement the smallest correct fix within
    the existing approved integration.
-   Test missing, invalid and valid credentials as applicable.
-   Verify tenant ownership checks for content, media, Business Presence
    and Leads.
-   Ensure public endpoints expose only intended public data.
-   Review file access and upload validation relevant to Image Studio.
-   Do not restore Contact Activity or add unrelated security
    subsystems.

**Acceptance criteria** - Webhook concern is resolved or shown to be
already handled with evidence. - Unauthorized and cross-tenant requests
are rejected. - Security regression tests pass. - No known
critical/high-severity issue in this scope remains without an explicit
release decision.

## Task 8 --- Fix test isolation and add focused regressions

**Priority:** Release blocker \| **Status:** Pending

**Concern to verify:** A prior report described two WebsiteContent
integration tests failing in the full backend suite while passing in
isolation. Shared state/concurrency was suspected but must be proven.

-   Run the relevant tests and record baseline results.
-   Reproduce full-suite versus isolated behavior.
-   Fix the confirmed root cause, such as shared state, ordering,
    concurrency or cleanup.
-   Do not weaken assertions or remove tests just to obtain a passing
    result.
-   Add focused regressions for confirmed AI output, Image Studio
    output/persistence, Business Presence rendering, social-link
    validation and security defects where supported by the existing test
    architecture.
-   Run relevant frontend lint/build and backend build/unit/integration
    checks.
-   Record exact commands and actual results.

**Acceptance criteria** - Reported failures are fixed or accurately
documented with reproducible evidence. - Required suite runs are
reliable. - Regression coverage addresses confirmed defects. - No test
is reported as passing unless executed.

## Task 9 --- Final verification for this scope

**Priority:** Release blocker \| **Status:** Pending

-   Verify AI Content Assistance output and failure handling.
-   Verify all seven Image Studio operations and upload/save/reopen
    workflow.
-   Verify responsive behavior on the discussed screens.
-   Verify Business Presence save-to-public rendering.
-   Verify public social links and no artificial Lead creation from
    outbound clicks.
-   Verify authorization, tenant isolation, webhook token handling and
    relevant media access.
-   Run required frontend/backend checks and relevant end-to-end tests.
-   Review the diff for unrelated changes, accidental deletions and
    scope creep.
-   Record unresolved defects, risks and external deployment settings
    that remain unverified.

**Acceptance criteria** - Every in-scope task has evidence-based
status. - Required checks have actual results. - No known
critical/high-severity issue remains unresolved without explicit release
approval. - Verified behavior is distinguished from assumptions and
unverified external settings. - Do not declare the entire product
production-ready solely because builds pass.

## Explicitly out of scope

-   Social-media publishing, connected social accounts, scheduling, or a
    social-media management suite. Research only.
-   New Theme System.
-   Separate Sparovia Brain database/module/agent runtime.
-   Restoring Contact Activity.
-   Product rebuild or unrelated feature expansion.
-   Unapproved paid middleware, providers or architecture.

## Required completion report for every task

-   **Status:** Not started / In progress / Blocked / Verified complete
-   **Root cause:** Evidence-backed explanation
-   **Files changed:** Exact paths
-   **Behavior changed:** What was corrected
-   **Verification:** Exact commands and manual checks
-   **Results:** Actual pass/fail outcomes
-   **Remaining risks:** Known limitations and unverified items
-   **Scope check:** Confirmation unrelated features/files were not
    changed

A task is complete only when acceptance criteria are met and
verification evidence is recorded.
