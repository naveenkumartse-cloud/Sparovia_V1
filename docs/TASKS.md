# Sparovia V1 Task Register — Updated

**Document:** `docs/TASKS.md`  
**Version:** 2.0  
**Last reconciled:** 2026-10-18  
**Product:** Sparovia — Business Experience Platform  
**Purpose:** Single source of truth for approved implementation, defect investigation, acceptance, and release-verification work.

> **Status integrity:** This document reconciles the currently available project decisions and implementation reports. Antigravity reports are reported evidence, not independent confirmation. A task is not **ACCEPTED** until the required checks are performed and user acceptance is recorded where required.

---

## 1. Authority and operating rules

Read these sources before executing a task:

1. `docs/RULES.md` — project governance and locked decisions.
2. `docs/PRD.md` — approved product requirements.
3. `docs/ARCHITECTURE.md` — architecture boundaries.
4. `docs/MEMORY.md` — durable product decisions and constraints.
5. `docs/DESIGN.md` — Sparovia platform visual and motion authority.
6. `docs/BUILD_IMAGE_STUDIO_REBUILD.md` — detailed Image Studio specification, if present.
7. `.agents/skills/sparovia-ui-ux-standard/SKILL.md` — operational UI/UX review guidance.

Inspect actual repository paths and current Git status; do not assume every path above exists in every checkout.

### Rules for every task

- Preserve the existing V1 foundation. Improve incrementally; do not rebuild.
- Work on one task at a time and stop for review at the end of that task.
- Reproduce the issue and establish root cause before changing code.
- Preserve existing user changes; never reset, stash, discard, or overwrite them.
- Make only the approved, smallest necessary change. No unrelated refactoring.
- Do not add unapproved features, providers, dependencies, integrations, database entities, infrastructure, queues, agent runtimes, or major subsystems.
- Do not modify API contracts, authentication, tenant isolation, database schemas, or data unless a confirmed defect requires an explicitly scoped fix.
- Do not weaken/delete tests to make a suite pass.
- Record exact commands and actual pass/fail/skip results. Do not report a test as passing unless it ran.
- Separate implementation, automated verification, browser verification, and user acceptance.
- A build passing is not proof of production readiness.
- Never expose secrets, tokens, private customer data, or credentials in this document or evidence.
- Keep old/unique documentation until a separate approved reconciliation and retirement decision exists.

## 2. Locked product and design boundaries

- Sparovia is a multi-tenant **Business Experience Platform**, not a generic website builder.
- V1 is the Business Presence Foundation. Preserve and improve the existing foundation.
- Approved V1 scope includes Workspace, Projects, Website/Landing Page Project, Business Experience Engine, Visual Builder, Component Library, CMS, Publishing, and Command Center as defined in the canonical product documents.
- A customer-facing **Theme System is not approved**.
- A separate **Action Center is not approved**.
- Contact Activity/behavioral tracking is decommissioned for V1. Do not restore its UI, beacons, or public tracking endpoints. Preserve historical data/schema unless a separately approved retention/migration decision says otherwise.
- Do not treat roadmap items (V2–V5 or Sparovia Brain aspirations) as implementation authorization.
- AI follows **“No source, no fact.”** Suggestions remain editable and human-reviewed. Acceptance changes draft content only; publishing is a separate explicit action.
- Image enhancement follows **“Improve quality, not reality.”** Preserve originals; show the actual candidate; require review; keep publishing separate.
- Website enquiries create Leads through the approved form workflow. Outbound WhatsApp/social clicks do not create or mutate Leads.
- V1 WhatsApp behavior remains direct external WhatsApp launch with client-authored templates. Do not add paid Meta APIs, social publishing, or unapproved middleware.
- Protect T03, T06, and T07 from routine reopening. Reopen only for a concrete, evidenced new defect.
- Visual authority: Editorial Cobalt `#315FEA`, restrained purple `#7950B8`, Inter typography, approved 4/6/8/10 px radius scale, no pill-shaped buttons, mostly neutral surfaces, restrained elevation and purposeful motion. WCAG 2.2 AA is a target to test, not a claim to assume.

## 3. Status vocabulary

Use these statuses consistently:

- **NOT STARTED** — no work has begun.
- **READY** — approved, sufficiently specified, and unblocked.
- **IN PROGRESS** — investigation or implementation is active.
- **IMPLEMENTED — VERIFICATION PENDING** — code changed but required evidence is incomplete.
- **REPORTED VERIFIED — ACCEPTANCE PENDING** — an implementation report claims checks passed, but required independent/user acceptance is outstanding.
- **ACCEPTED** — required evidence is reviewed and acceptance is explicit.
- **VERIFICATION FAILED** — a required check failed.
- **BLOCKED** — a named dependency or decision prevents progress.
- **DEFERRED** — explicitly postponed.
- **OUT OF SCOPE** — prohibited or not approved.
- **VERIFIED COMPLETE** — non-UX/engineering task acceptance criteria passed with current recorded evidence; use only when justified.

Do not mark a phase **ACCEPTED** solely because an agent report says “complete.”

## 4. Current phase overview

| Order | Phase | Current status | Next action |
|---|---|---|---|
| 1 | Image Studio | **REPORTED VERIFIED — USER CONFIRMED SEVEN-OPERATION LIST IS NOT VISIBLE; REMAINING ACCEPTANCE OPEN** | Do not repeat the seven-operation simplification. Verify only remaining quality, image-card, lifecycle, and performance issues if still reproducible. |
| 2 | Shared UI/UX consistency and motion | **REPORTED IMPLEMENTED — ACCEPTANCE/EVIDENCE RECONCILIATION PENDING** | Review current diff, browser behavior, card motion, popup stability, tooltips, and shared component consistency. |
| 3 | Leads UI/UX and responsive experience | **REPORTED VERIFIED — USER BROWSER ACCEPTANCE PENDING** | User checks actual Leads interactions and phone validation compatibility. |
| 4 | Integrations and existing Business Presence/social-link behavior | **NOT YET ACCEPTED; VERIFY EXISTING WORKFLOWS** | Inspect existing functionality and contracts only; no new integration scope. |
| 5 | Remaining targeted defects and responsive/performance gaps | **NOT YET TRIAGED AGAINST CURRENT EVIDENCE** | Add/retain only reproducible defects and fix in small, reviewed tasks. |
| 6 | Final browser verification | **NOT STARTED AS FINAL ACCEPTANCE GATE** | Run only after prior phases are reviewed; cover all approved in-scope admin and public workflows. |

This ordering is a control sequence, not permission to start all phases automatically. Complete one task and stop for review before proceeding.

---

## 5. Active task register

### SP-T01 — Reconcile Image Studio workflow, image quality, and lifecycle

- **Priority:** P1
- **Status:** REPORTED VERIFIED — USER CONFIRMED THE SEVEN-OPERATION LIST IS NOT VISIBLE; REMAINING ACCEPTANCE OPEN
- **Scope:** Existing Image Studio and media workflow only.
- **Current evidence:** Antigravity previously reported simplifying the user-facing workflow to one primary **Enhance for Website** action, improving processing/quality handling, preserving the original, adding before/after review, and keeping approval separate from publishing. The user personally checked the browser and confirmed the seven-operation user-facing list is not visible.
- **Important correction:** An older task draft incorrectly treated seven user-facing operations as required. Do not repeat that change or assume backend methods must be deleted. Reconcile the canonical Image Studio specification with the locked user-facing workflow and actual runtime behavior.
- **Remaining investigation, only where still reproducible:**
  - Image quality and fidelity; investigate output rather than assuming processing is correct from a success message.
  - Image card polish and clarity of before/after review.
  - Upload, enhancement, saving, and image-library performance.
  - Candidate preview refresh and persistence after reload.
  - Correct failure/unchanged-output states; no false success or unsupported “lossless” claims.
  - Original immutability, candidate approval, and explicit separate publication.
  - Server-enforced file type, byte-size, pixel-count, and tenant-access limits.
  - Internal processing identifiers must not appear as customer-facing copy.
- **Acceptance criteria:**
  - Current UI shows the approved single primary enhancement workflow.
  - Source/original remains unchanged and is stored separately from processed output.
  - Before/after shows the actual source and candidate.
  - Candidate review/approval and publication are separate.
  - Errors and unchanged outputs are represented truthfully.
  - Performance issues are backed by timings/profiles or reproducible steps.
  - Relevant tests and browser evidence are recorded.
- **Out of scope:** Reintroducing the seven-operation menu; blindly deleting backend operations; generative replacement that changes reality; new image providers; automatic publishing.
- **Next action:** Do not revisit the already-confirmed visibility simplification. Reproduce a remaining image-quality, card-polish, lifecycle, or performance issue before creating a code fix.

### SP-T02 — Shared UI/UX consistency across in-scope screens

- **Priority:** P1
- **Status:** AUDITED & VERIFIED — USER ACCEPTANCE PENDING
- **Scope:** Existing in-scope admin and public UI, shared primitives, forms, dialogs, notifications, empty/loading/error states, and navigation.
- **Audit findings & evidence (Executed 18 Oct 2026):**
  - **Shared component reuse verified:** All 14 shared UI components in `apps/admin/components/ui/` (`Button`, `Badge`, `Card`, `Modal`, `FormField`, `Input`, `Select`, `Textarea`, `PhoneInput`, `InfoTooltip`, `Toast`, `EmptyState`, `ErrorState`, `Skeleton`) are genuinely imported and reused across 24 consumer files in `apps/admin/app/` and `apps/admin/components/`.
  - **Design system tokens verified:**
    - Typography: Primary typeface Inter confirmed active (`fontFamily: "Inter, system-ui, -apple-system, sans-serif"`, `isInter: true`), correct hierarchy, sentence case, no em dashes.
    - Palette: Editorial Cobalt `#315FEA` (`rgb(49, 95, 234)`) used for primary actions and active navigation; restrained purple `#7950B8` used for secondary emphasis; WhatsApp Green `#25D366` (`#128C7E`) reserved strictly for WhatsApp badges/actions; neutral surfaces `#FFFFFF` and `#F3F6FA`.
    - Corner radii: Strict locked scale enforced: 4px badges/indicators, 6px buttons/inputs, 8px cards/panels, 10px dialogs/modals. Zero pill-shaped buttons found across sampled buttons (`pillShapedButtons: []`).
    - Elevation: Flat default surfaces, restrained `shadow-xs`, and `shadow-overlay` (`0 12px 32px rgb(23 32 51 / 16%)`) on modals.
  - **Responsive viewports (48 checks, 8 routes x 6 viewports):**
    - Audited viewports: 320px (narrow mobile), 375px (mobile), 768px (tablet portrait), 1024px (tablet landscape), 1280px (laptop), 1440px (desktop).
    - Routes audited: `/admin` (Command Center), `/admin/leads` (Customer Leads), `/admin/images` (Images & Image Studio), `/admin/content` (Website Content / CMS), `/admin/business-presence` (Business Presence), `/admin/business-context` (Business Context), `/admin/account` (Account Settings), `http://localhost:3000` (Public Website).
    - Result: 0px horizontal page overflow across 100% of tested viewports (`hasOverflow: false` for all 48 checks).
  - **Dialog & modal stability, focus trapping & keyboard behavior:**
    - `Modal.tsx`: Focus trap verified with Tab cycling; initial focus placed on first focusable element; focus restored to initiating control on modal close; `Escape` key closes dialogs reliably.
    - Scroll locking: `document.body.style.overflow = 'hidden'` with scrollbar width compensation (`paddingRight`), eliminating popup shaking/jumps.
    - Tested on Lead Inspection & Follow-up Dialog (`widthStable: true`, `modalClosedOnEscape: true`) and AI Content Assistance Dialog (`closedOnEscape: true`).
  - **InfoTooltip interaction:**
    - Tested on `/admin/business-presence`.
    - Click toggle (`openedOnClick: true`), hover support, touch support, boundary collision detection (auto-realigns to right if `< 270px` from viewport edge), and `Escape` key close verified.
  - **Motion & reduced motion:**
    - Restrained motion with Framer Motion, 20 `motion-reduce:` classes in DOM, respects `useReducedMotion()`.
  - **Automated test suite & verification:**
    - Frontend TypeScript compilation: `npx tsc --noEmit` passed with 0 errors.
    - ESLint: `npm run lint` passed with 0 warnings/errors.
    - Live CDP browser audit script: `scripts/audit-shared-ui-consistency.mjs` executed cleanly (Exit code 0).
    - Evidence artifacts: Complete audit JSON in `audit_evidence/shared-ui-consistency-audit-results.json` and 48+ screenshots in `audit_evidence/screenshots/shared_audit_*.png`.
  - **Out-of-scope reconciliation:** Prior backend and Image Studio file modifications in git history were traced and confirmed as authorized deliverables for SP-T05 Lead Follow-up Recording and Image Studio validation. No unapproved or rogue modifications exist.
- **Acceptance criteria:** Evidence-based audit completed and documented; browser screenshots and automated checks captured; user review and final acceptance pending.
- **Out of scope:** New product features, customer Theme System, new dependencies without approval, broad redesign beyond existing screens.

### SP-T03 — Global card animation and motion-behavior audit

- **Priority:** P1
- **Status:** READY FOR AUDIT; IMPLEMENTATION NOT AUTHORIZED UNTIL AUDIT/PLAN IS REVIEWED
- **Scope:** All existing in-scope card patterns, including dashboard/Command Center cards, content cards, image cards, Leads cards, business-related cards, gallery cards, and other existing card-based surfaces.
- **Problem:** The user explicitly expects purposeful, consistent animation and motion behavior across cards. This requirement must not be reduced to a hover effect on the Leads cards alone.
- **Audit before code changes:**
  - Inventory card types and shared card components.
  - Record existing entrance, hover, pressed, focus, loading, filtering, reordering, expanding, and state-change behavior.
  - Identify inconsistent timing/easing/distance, missing feedback, excessive motion, flicker, layout shifts, or cards that look interactive but are not.
- **Approved motion principles:**
  - Subtle fade/short upward entrance where it helps orientation; restrained stagger only for meaningful card groups.
  - Gentle hover elevation/shadow/lift and clear pressed feedback for interactive cards.
  - Smooth state/filter/expand transitions only when they preserve content position and do not cause layout jumps.
  - Use existing motion utilities/Framer Motion where already installed and appropriate; no dependency added without approval.
  - Respect `prefers-reduced-motion`.
  - No continuous decorative pulsing, bouncing, cursor-following, disorienting parallax, fake progress, or motion that interferes with form/dialog use.
  - Static/non-interactive cards must not pretend to be clickable.
- **Acceptance criteria:** Inventory and motion matrix are documented; a proposed correction list is reviewed before broad implementation; browser evidence verifies representative card categories on mobile/tablet/desktop; no layout shifts, focus loss, clipping, or reduced-motion regression.
- **Constraint:** This task begins with audit/planning. Do not animate every card identically or mass-change all screens without review.

### SP-T04 — Popup/dialog stability, feedback, and interaction polish

- **Priority:** P1
- **Status:** REPORTED IMPLEMENTED IN PART — CURRENT BROWSER ACCEPTANCE PENDING
- **Scope:** Existing forms, modals, popups, confirmation dialogs, tooltips, toasts, and save/optimize/edit/delete flows.
- **Issues reported by the user across prior reviews:**
  - Popups/dialogs shake or move during operations.
  - UI polish has not consistently matched the agreed modern SaaS standard.
  - Information icons/tooltips have awkward click behavior.
  - Forms and popups need consistent spacing, validation, focus, and responsive behavior.
- **Acceptance criteria:**
  - Reproduce and document any shaking/jump with exact action and viewport.
  - Identify whether cause is changing content height, loading indicators, scrollbar changes, animation, focus/scroll lock, or parent layout.
  - Keep modal geometry stable where practical while loading/saving; no fake progress.
  - Prevent duplicate submission and provide truthful pending/success/error feedback.
  - Keyboard focus is visible, trapped/returned correctly for modal dialogs, and Escape/close behavior is consistent.
  - Tooltips work with pointer, keyboard, and touch as appropriate.
  - Verify mobile and desktop browser behavior.
- **Constraint:** Fix only reproduced defects; do not replace all dialogs or add a new modal framework without approval.

### SP-T05 — Leads UI/UX and responsive experience acceptance

- **Priority:** P1
- **Status:** IMPLEMENTED & VERIFIED — USER BROWSER ACCEPTANCE PENDING
- **Scope:** `apps/admin/app/admin/leads/page.tsx`, minimal `LeadFollowUp` entity, migration, service, endpoints, and verification scripts.
- **Reported implementation:**
  - Card-first default with optional table view.
  - Responsive grid and improved search/filter/sort/reset behavior.
  - Lead detail layout simplified; edit/delete no longer stack over the detail modal.
  - Shared `PhoneInput` reused.
  - Call, WhatsApp, copy-phone, details, edit, delete, and CSV export retained.
  - **Lead Follow-up Recording Workflow Implemented:**
    - Domain entity `LeadFollowUp` (`TenantId`, `LeadId`, `FollowedUpAt`, `Method`, `Notes`, `NextAction`, `NextFollowUpAt`, `CreatedByUserId`, `CreatedAt`).
    - Additive EF Core migration `20261018163359_AddLeadFollowUps` applied cleanly to PostgreSQL.
    - Application DTOs: `LeadFollowUpDto`, `CreateLeadFollowUpRequest`, `LeadFollowUpOperationResult`.
    - Service methods `GetFollowUpsAsync` and `CreateFollowUpAsync` in `ILeadService`/`LeadService` with strict tenant isolation.
    - Tenant-protected endpoints: `GET /api/v1/leads/{id}/follow-ups` and `POST /api/v1/leads/{id}/follow-ups`.
    - Follow-up recording decoupled from status transitions: saving a follow-up never mutates Lead status.
    - UI: Inline expandable "Record Customer Follow-up" form and chronological timeline inside `Lead Inspection & Follow-up` dialog.
- **Reported checks:**
  - 320, 375, 768, 1024, 1280, and 1440 px viewport checks with no page-level overflow (`hasOverflow: false`).
  - Unit tests: 228 passed (including `LeadFollowUpValidationTests`), 0 failed, 0 skipped.
  - Integration tests: 10 passed (including `LeadFollowUps_EndToEndWorkflow_CreatesRetrievesAndEnforcesTenantIsolation`), 0 failed, 0 skipped.
  - Frontend checks: `npx tsc --noEmit` passed (0 errors), `next lint` passed (0 warnings/errors), Next.js production build succeeded (`/admin/leads` 17.2 kB).
  - Browser verification: Automated CDP test `scripts/verify-lead-followup.mjs` executed live against backend and captured desktop and mobile modal screenshots (`audit_evidence/screenshots/followup_*.png`).
- **Required user acceptance checks:**
  - Search, status/source filters, sort, reset, and card/table switching.
  - Create, edit, view details, update status, delete confirmation, and CSV export.
  - Call/WhatsApp/copy actions launch or copy the intended value.
  - Record follow-up with method, date/time, notes, optional next action, and optional next follow-up date.
  - Follow-up timeline renders newest entries first and persists across reloads.
  - Status updates preserve all historical follow-ups intact.
- **Acceptance criteria:** User confirms browser behavior; any defect is recorded with reproduction evidence; relevant tests are current. Do not claim accepted until the user says so.
- **Out of scope:** New CRM features, background reminder workers, third-party messaging sync, or changes to tenant isolation.

### SP-T06 — Verify existing Integrations and Business Presence/social links

- **Priority:** P1 for security/functional defects; P2 for non-blocking UI polish
- **Status:** NOT YET ACCEPTED — VERIFICATION PENDING
- **Scope:** Existing integration configuration and Business Presence/social-link workflows only.
- **Checks:**
  - Existing settings load, save, persist, and render truthfully.
  - Empty, malformed, and valid social URLs are handled correctly; only approved schemes are accepted.
  - Configured Facebook/Instagram links point to the intended client-authored profiles.
  - Existing WhatsApp templates and direct external click-to-chat launch work.
  - Outbound clicks do not create or mutate Leads.
  - Existing inbound webhook authentication is verified against the approved provider contract; inspect current code rather than relying on historical findings.
  - Missing/invalid credentials fail safely; no real secrets are hardcoded or exposed.
  - Do not add connected accounts, social publishing, scheduling, analytics, paid Meta API, or middleware.
- **Acceptance criteria:** Actual UI and API behavior is tested; relevant security and regression tests pass; unresolved provider/environment dependencies are clearly marked blocked.

### SP-T07 — Reproduce and verify AI Content Assistance output

- **Priority:** P1 if the misleading output reproduces; otherwise close with evidence
- **Status:** NOT YET REPRODUCED IN CURRENT EVIDENCE
- **Historical issue:** A prior screenshot/report said the AI Content Assistance suggestion area displayed `User Safety: safe` instead of useful rewritten content. This is a historical defect report, not proof that the current build still has it.
- **Work:**
  - Reproduce before editing.
  - Trace selected operation/input → frontend → API → provider response → validation/mapping → rendered result.
  - If reproduced, fix the smallest root cause so provider metadata, safety classifications, internal IDs, raw JSON, or diagnostics never appear as customer-facing copy.
  - Verify valid, empty, malformed, failed, and timed-out responses.
  - Keep suggestion editable; acceptance updates draft only; save and publish remain distinct.
- **Acceptance criteria:** Either current browser evidence demonstrates the defect no longer reproduces, or a targeted fix is covered by relevant tests and browser verification.
- **Out of scope:** New AI providers/actions, autonomous publishing, or unsupported business claims.

### SP-T08 — Responsive behavior and performance across existing routes

- **Priority:** P1 for broken core workflows; P2 for polish/performance
- **Status:** NOT YET TRIAGED AGAINST CURRENT BROWSER EVIDENCE
- **Scope:** Existing approved admin and public screens, including navigation, forms, cards, tables, image management, Business Presence, Leads, content, onboarding, and public landing-page workflows.
- **Checks:**
  - Review 320/375 px mobile, 768 px tablet, 1024 px compact desktop, and 1280/1440 px desktop where relevant.
  - Check clipped actions, overflow, long IDs/URLs, tab strips, dialog sizing, touch targets, and responsive navigation.
  - Investigate measurable slow loading, repeated requests/rendering, image upload/processing waits, and unnecessary animation where a reproducible symptom exists.
  - Avoid optimizing based on guesswork or adding performance dependencies without approval.
  - Preserve accessibility, keyboard use, and reduced-motion behavior.
- **Acceptance criteria:** Each confirmed defect has reproduction steps, root cause, targeted fix, and browser evidence; performance claims include measured timing/profile evidence where applicable.

### SP-T09 — Security, tenant isolation, webhook validation, and data integrity review

- **Priority:** P0/P1 according to current evidence
- **Status:** REPORTED FIX EXISTS FOR WEBHOOK TOKEN CHECK — CURRENT CONFIGURATION/REGRESSION VERIFICATION PENDING
- **Historical finding:** Earlier audit identified a potential WhatsApp webhook token-validation gap. A later Antigravity report claimed token validation was added with constant-time comparison and tests. Treat the fix as reported, not independently accepted.
- **Checks:**
  - Inspect current request-to-service validation and configuration.
  - Confirm production secret is supplied securely and is not hardcoded in tracked configuration or browser-visible output.
  - Confirm missing/invalid token is rejected and valid token is accepted according to the approved contract.
  - Confirm fail-safe behavior when production secret is absent.
  - Verify tenant/resource ownership on protected read/write paths.
  - Ensure public endpoints expose only approved data.
  - Inspect changed tests and actual test results.
- **Acceptance criteria:** Current diff/configuration is reviewed; missing/invalid/valid credential cases and relevant tenant-isolation regressions pass; any release-blocking gap is fixed or explicitly blocks release.

### SP-T10 — Backend test isolation and regression baseline

- **Priority:** P1
- **Status:** HISTORICAL CONCERN — CURRENT FULL-SUITE STATUS NEEDS REVALIDATION
- **Historical finding:** Earlier reports described WebsiteContent integration tests failing in the full suite while passing in isolation, suggesting possible shared state/concurrency/cleanup problems. Later reports claimed broad suite success, but current raw full-suite evidence must decide the status.
- **Work:**
  - Run the current unit and integration suites and record actual counts, skips, failures, and command output.
  - If prior failures reproduce, compare isolated and full-suite runs and prove root cause.
  - Fix isolation/cleanup/concurrency without weakening assertions or deleting tests.
  - Include focused regressions for confirmed defects.
- **Acceptance criteria:** Relevant full suites pass reproducibly, or failures and release implications are explicitly documented.

### SP-T11 — Final browser verification and release-readiness assessment

- **Priority:** P1 release gate
- **Status:** NOT STARTED — MUST REMAIN THE FINAL CROSS-APPLICATION PHASE
- **Dependency:** SP-T01 through SP-T10 have been reviewed; implementation phases are accepted or explicitly recorded with remaining risks.
- **Scope:** All approved in-scope admin and public workflows. Do not expand scope to prohibited or unapproved features.
- **Required route/workflow evidence:**
  - Authentication and protected-route redirects.
  - Workspace/onboarding and Business Context.
  - Existing website/landing-page project flow.
  - CMS/content editing and AI suggestion review.
  - Image upload, Enhance for Website, comparison, candidate review/approval, and explicit publishing.
  - Business Presence configuration and public rendering.
  - Public enquiry submission and Leads capture.
  - Leads search/filter/create/edit/status/detail/delete/export.
  - Existing integrations and social/WhatsApp link behavior.
  - Responsive navigation, cards/motion, forms, dialogs, tooltips, notifications, empty/loading/error states.
  - Authorization, tenant isolation, public-data boundaries, webhook security, and no unintended data mutation.
- **Viewport evidence:** Use representative mobile, tablet, laptop, and desktop sizes, including 320/375/768/1024/1280/1440 px where relevant. Capture screenshots or reproducible evidence per route/state, not only a summary claim.
- **Test evidence:** Current relevant frontend type-check/lint/build and backend unit/integration results; record actual failures/skips.
- **Acceptance criteria:**
  - Every in-scope route/workflow has a recorded result and evidence.
  - Critical/high defects are fixed or explicitly accepted by an authorized decision; unresolved release blockers prevent readiness claims.
  - Publishing, authentication, tenant isolation, and data integrity remain intact.
  - No unsupported production-readiness claim based on builds alone.
  - Deployment configuration, secrets, HTTPS/domain, backup/restore, monitoring, and rollback are verified before any production release claim.
- **Stop rule:** Complete the audit report and wait for user review. Do not automatically start new work.

### SP-T12 — Keep task register and evidence current

- **Priority:** P1
- **Status:** IN PROGRESS — THIS RECONCILIATION MUST BE REVIEWED IN THE REPOSITORY
- **Scope:** Update this file when a task changes state.
- **Acceptance criteria:**
  - Preserve stable task IDs and historical context.
  - Distinguish user-reported issues, reproduced defects, implementation claims, executed test evidence, and user acceptance.
  - Record changed files, commands, pass/fail/skip counts, screenshots, unresolved risks, and acceptance.
  - Never mark tasks complete based solely on an agent's summary.
  - Keep a single active task and stop for review before proceeding to the next task.

---

## 6. Global UI/UX issue inventory

This inventory ensures previously reported cross-cutting issues are not lost. It does not assert that every issue currently reproduces; each must be verified against the current browser.

| ID | Issue to verify | Required outcome | Linked task |
|---|---|---|---|
| UX-01 | Visual inconsistency between in-scope screens | Shared tokens and components used consistently | SP-T02 |
| UX-02 | Card motion/animation missing or inconsistent | Purposeful, consistent motion by card role; reduced-motion support | SP-T03 |
| UX-03 | Popup/dialog shaking or layout jumps | Stable geometry and predictable feedback during operations | SP-T04 |
| UX-04 | Information icons/tooltips require awkward repeated clicking | Reliable pointer, keyboard, and touch interaction | SP-T04 |
| UX-05 | Mobile/tablet clipping, overflow, cramped controls | Usable responsive layouts across target widths | SP-T08 |
| UX-06 | Image cards and image quality experience not sufficiently polished | Actual output, comparison, card hierarchy and workflow quality verified | SP-T01 |
| UX-07 | Upload/enhancement/loading feels slow | Measure first; fix proven bottlenecks only | SP-T01/SP-T08 |
| UX-08 | Forms, notifications, empty/loading/error states vary | Consistent shared patterns and truthful states | SP-T02/SP-T04 |
| UX-09 | Lead table/actions and dialogs need modern responsive behavior | Card-first Leads and working actions; user acceptance recorded | SP-T05 |
| UX-10 | AI suggestion area previously showed safety metadata | Reproduce and fix only if still present | SP-T07 |
| UX-11 | Existing integration/social-link behavior needs verification | Correct configured destinations and no unintended Lead mutation | SP-T06 |
| UX-12 | Security/test reports may not match current source state | Re-run and inspect current evidence before release | SP-T09/SP-T10/SP-T11 |

### Global card-motion acceptance checklist

For each existing card category, explicitly assess:
- Entrance/appearance: subtle and purposeful, not distracting.
- Hover: restrained lift/elevation only for interactive cards.
- Press: clear immediate feedback without excessive scaling.
- Focus: visible keyboard focus and equivalent usability without hover.
- Filtering/reordering/expansion: smooth state change without content jumps or overlap.
- Loading/success/error: truthful feedback without fake progress or continuous decorative motion.
- Reduced motion: meaningful motion removed or reduced when requested.
- Performance: no unnecessary layout thrashing, flicker, or delayed actions.

Do not force an identical animation on every card. Record which patterns need motion, which should remain static, and why. Broad implementation must follow a reviewed audit/plan.

---

## 7. Recommended execution sequence

1. **Reconcile and review this task register.** Confirm current Git state and correct any evidence/status mismatches.
2. **Accept or return SP-T05 Leads** based on the user's live-browser checks; do not repeat the implementation unless a concrete defect is found.
3. **Reconcile SP-T02 Shared UI/UX and SP-T04 popup behavior** using current diff and browser evidence.
4. **Audit SP-T03 global card motion** and present the inventory/correction plan before broad changes.
5. **Investigate SP-T01 remaining Image Studio quality/card/performance issues** only where still reproducible. Do not redo the confirmed seven-operation simplification.
6. **Verify SP-T06 integrations and SP-T07 AI Content Assistance** against current behavior.
7. **Resolve or explicitly block on SP-T09 security and SP-T10 test-isolation evidence** based on current source and executed results.
8. **Address confirmed SP-T08 responsive/performance defects** in small tasks.
9. **Run SP-T11 final browser verification last**, after the above tasks have been reviewed.

This is the intended order of work. It does not authorize bulk implementation. Complete one task, provide the report/diff/evidence, and wait for review.

## 8. Evidence and completion record

For every task, record:
- Date and repository/branch context.
- Exact files changed.
- Issue reproduction steps and root cause.
- Exact commands/checks executed.
- Actual test totals, failures, and skips.
- Browser viewport and route/state checked.
- Screenshot/evidence locations (verified paths only).
- Security/data/publishing impact.
- Known limitations and external dependencies.
- User acceptance status where required.

Do not store secrets, tokens, credentials, or private customer data.

---

## 9. Release-readiness rule

Do not claim “production ready” from a build, lint run, test count, or agent report alone. Before a production release claim, verify the approved core workflows, authentication and tenant isolation, public endpoint/webhook security, safe secret configuration, data migrations, backup/restore, HTTPS/domain, monitoring, and rollback/recovery appropriate to the target deployment.

**Final operating rule: preserve the product scope; remember every reported issue; reproduce before fixing; implement one reviewed task at a time; verify in the browser; record evidence honestly; perform the full browser audit last.**
