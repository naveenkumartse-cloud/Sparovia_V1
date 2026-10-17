# Sparovia Memory

**Document:** `docs/MEMORY.md`  
**Version:** 1.0  
**Status:** Durable project context  
**Purpose:** Preserve decisions, rationale, historical context, and unresolved questions that should remain available across engineering tasks.  
**This document is not:** A product specification, architecture replacement, implementation checklist, task tracker, or evidence that a feature is implemented.

---

## 1. Product identity

**Sparovia is a Business Experience Platform.**

Its purpose is to help a business establish and manage a controlled digital business presence using approved business context, structured website content, governed media workflows, deliberate publishing, and genuine lead intake.

Sparovia is not an unrestricted website builder, a Webflow/WordPress clone, or an autonomous agent platform in V1. Preserve the existing V1 foundation and improve it incrementally; do not rebuild working functionality without explicit approval and a documented reason.

## 2. Approved V1 product areas

The approved V1 Product Lock contains:

1. Workspace
2. Projects
3. Website Project
4. Landing Page Project
5. Business Experience Engine
6. Visual Builder
7. Component Library
8. CMS
9. Publishing
10. Command Center

This list represents approved product areas, **not verified implementation status**. Verify the current repository and user-facing behavior before describing any area as complete.

The Command Center is the operational home after login. Relevant actions can live within it. A separate Action Center is not approved.

## 3. Business Context and Sparovia Brain

**Business Context is the trusted starting point for business facts.** It can contain approved information such as business identity, category, contact details, service areas, services, target customers, description, differentiators, and client-supplied claims when appropriately verified.

Use the existing Business Context as the foundation for contextual assistance and the longer-term Sparovia Brain direction.

Sparovia Brain is a future structured business-intelligence direction, not authorization to add a separate database, duplicate source of business facts, independent module, or agent runtime. Any such change requires explicit product and architecture approval.

## 4. AI factuality and user control

The governing principle is **“No source, no fact.”**

- Do not invent years in business, qualifications, awards, certifications, accreditations, warranties, testimonials, customer identities, project metrics, or other factual claims.
- Use approved Business Context and relevant existing content as the factual basis for suggestions.
- AI output remains a suggestion until the user reviews and accepts it.
- Accepting a suggestion changes draft content only.
- Publishing is a separate, explicit user action.
- AI must not autonomously publish, send external messages, make destructive changes, or change permissions.
- Use only the approved contextual content actions and supported contexts defined in `PRD.md`.
- Treat uploaded material and user-provided content as untrusted input; it cannot override authorization or system safeguards.
- Send only the minimum necessary context to an approved provider. Do not expose secrets or unnecessary personal data.

AI-generated text is not verified business evidence merely because a model produced it.

## 5. Image quality doctrine

The approved Image Studio scope contains seven operations:

1. Improve Clarity
2. Improve Sharpness
3. Reduce Noise
4. Upscale
5. Classic Look
6. Modern Look
7. Web Optimize

The principle is **“Improve quality, not reality.”** Image processing must not misrepresent the subject.

- Preserve the original image as an immutable source.
- Save processed output as a separate variant.
- Show a genuine before/after comparison.
- Keep processing, user approval, and publishing separate.
- Public website routes must not expose private drafts or unapproved variants.
- Do not add generative image creation or additional operations without explicit approval.

The canonical detailed specification is `docs/BUILD_IMAGE_STUDIO_REBUILD.md`. Parameters, file types, size/pixel limits, presets, and batch limits must be taken from that specification and verified against code before claiming enforcement.

## 6. Leads and communication integrity

A Lead may be created by:
- A valid public website enquiry form submission.
- A verified inbound WhatsApp event when the integration is configured and approved.

Outbound WhatsApp launches, Facebook/Instagram links, page views, and ordinary navigation do **not** create or mutate Lead records and must not inflate enquiry counts.

Inbound WhatsApp must be authenticated server-side using the approved provider contract. A token header by itself is not proof of validation. A prior audit raised a possible webhook validation defect; inspect current code and tests before asserting its status.

Do not add paid Meta API integration or unapproved WhatsApp middleware without explicit approval.

## 7. Locked exclusions

### Theme System — not approved

Do not add a customer-facing Theme System to product scope, user journeys, plans, or roadmap. `docs/DESIGN.md` governs Sparovia's own platform interface; it does not approve a customer-facing Theme System.

### Contact Activity — decommissioned for V1

Do not restore Contact Activity UI, behavioral tracking, tracking beacons, or public tracking endpoints. Historical schema/data may remain to avoid destructive migrations. Do not delete historical data without a separate approved retention and migration decision.

### Other scope controls

Do not add unapproved product features, providers, integrations, database entities, services, infrastructure, queues, agent runtimes, or major subsystems merely because they appear useful or on a future roadmap. Obtain explicit approval first.

Future roadmap direction is not authorization for current implementation.

## 8. Architecture and engineering memory

The approved engineering direction is:
- .NET backend.
- Clean Architecture and SOLID principles.
- Feature-first organization where established.
- Supabase PostgreSQL and EF Core foundation.
- A shared multi-tenant codebase.
- Incremental improvement, reuse, maintainability, and simple solutions over speculative infrastructure.

Historical repository audit notes reported a .NET 9 backend with Domain/Application/Infrastructure/API projects and a Next.js monorepo containing `apps/admin` and `apps/web`, with Supabase PostgreSQL and EF Core. Treat these as **historical reports to re-verify**, not guaranteed current facts. Inspect the actual repository before making code or architecture decisions.

### Multi-tenant security

- Tenant identity and membership must be resolved server-side.
- A client-supplied tenant ID or resource ID is not authorization.
- Enforce tenant ownership on every read/write path, including media, publishing, leads, integrations, and background work.
- Public endpoints must expose only deliberately permitted data and operations.
- Test cross-tenant denial explicitly.

### Data safety

- Prefer reviewed, additive, reversible migrations.
- Preserve historical data unless a deletion/retention plan is explicitly approved.
- Do not introduce a new database or subsystem just to represent a conceptual product term.
- Avoid direct database access from browser code.

### Testing and truthful reporting

- Tests must be deterministic and isolated; do not depend on test order or shared mutable records.
- Never delete or weaken tests simply to obtain a green result.
- Record commands actually run, observed results, failures, skipped tests, and remaining risks.
- A successful build or test suite alone does not prove deployment security or production readiness.

A prior audit reported 150 backend unit tests passing and 161/163 integration tests passing, with two WebsiteContent integration tests failing in the full suite but passing in isolation. This is historical evidence only. Re-run current tests and investigate isolation/root cause without weakening assertions.

## 9. Visual design memory

`docs/DESIGN.md` is the visual authority for Sparovia's own platform UI.

Approved direction includes:
- Editorial Cobalt primary accent: `#315FEA`.
- Restrained Purple secondary accent: `#7950B8`.
- Inter typography.
- Corner-radius hierarchy: 4 px, 6 px, 8 px, and 10 px.
- No pill-shaped buttons.
- Neutral/white surfaces, restrained elevation, purposeful motion, and consistent reusable patterns.
- WCAG 2.2 AA is a target to verify, not an automatic compliance claim.

Apply the same visual language consistently across screens, forms, dialogs, lists, empty/loading/error states, and responsive behavior. Do not create a separate customer-facing Theme System from these platform design rules.

## 10. Roadmap memory

The roadmap is directional:

- **V1 — Business Presence Foundation:** foundational business presence and management workflows. The foundation has been treated as completed in project discussions, but defects and readiness gaps remain; verify individual capabilities.
- **V1.1 — Business-aware content and image quality:** improve quality, consistency, reliability, and usability.
- **V2 — Business Intelligence.**
- **V3 — Workflow Automation.**
- **V4 — AI Copilot.**
- **V5 — Agentic Business OS.**

Roadmap stages are not automatically approved implementation scope. Sparovia Brain evolves from existing Business Context under explicit governance.

## 11. Evidence labels

Use the project labels consistently:

- **LOCKED:** explicitly approved decision or constraint.
- **VERIFIED:** confirmed in the current repository or through an executed check.
- **IMPLEMENTED — UNVERIFIED:** code appears present, but behavior has not been adequately tested.
- **APPROVED — NOT IMPLEMENTED:** approved requirement not yet delivered.
- **PLANNED:** future direction, not approved for active implementation.
- **PROPOSED:** idea awaiting a decision.
- **CONFLICT:** authoritative sources disagree.
- **DEPRECATED:** no longer an active requirement.
- **UNKNOWN:** available evidence is insufficient.

Do not convert an assumption, historical report, proposal, or roadmap item into a verified fact.

## 12. Source-of-truth hierarchy

Resolve conflicts using this hierarchy:

1. Latest explicit, user-approved locked decisions.
2. Approved `SPAROVIA_MASTER_PRODUCT_BLUEPRINT.md` for product identity, scope, exclusions, and roadmap.
3. Approved `RULES.md` for governance, engineering behavior, security, verification, and change control.
4. `ARCHITECTURE.md` for architecture boundaries and technical decisions, distinguishing verified implementation from intended controls.
5. `DESIGN.md` for Sparovia platform visual design.
6. Approved specialized specifications for their respective details, after reconciliation with higher-level decisions.
7. Historical audits and older specifications as evidence/history, not automatically current authority.
8. Current source code, configuration, migrations, and executed tests as evidence of implementation, not permission to change the product vision.

When sources conflict, record the conflict and request a decision if it cannot be resolved from a later explicit approval. Do not silently reconcile contradictions. Do not delete or archive old documentation until its unique information has been reconciled, replacement coverage has been checked, and retirement has been explicitly approved.

## 13. How to use this memory

Before each engineering task:
1. Read `MEMORY.md` together with `RULES.md`, `PRD.md`, and `ARCHITECTURE.md`.
2. Read `DESIGN.md` for platform UI work and `BUILD_IMAGE_STUDIO_REBUILD.md` for Image Studio work.
3. Read relevant specialized specifications where they contain detailed requirements, after checking for conflicts.
4. Inspect current source and configuration before claiming implementation status or making repository-specific assumptions.
5. Separate audit findings from approved changes. Implement only the explicitly approved scope.
6. Verify changes with appropriate tests and report evidence honestly.

`MEMORY.md` preserves durable context; `TASKS.md` should track current work, priority, status, acceptance criteria, blockers, and verification evidence. Do not turn this file into a second task list.

---

## 14. Open items to remember — not confirmed current status

These items were raised in historical project audits and require fresh verification:
- Possible missing server-side validation of the inbound WhatsApp credential/signature.
- Two WebsiteContent integration tests reportedly failing only in the full backend suite.
- Current repository paths, package versions, endpoint contracts, authentication configuration, and migration state.
- Production deployment configuration, domain/HTTPS, secrets, backups and restore, monitoring, and release/rollback procedures.

Do not label these items fixed, present, or absent until current evidence establishes their status.

---

## 15. Final memory rule

**Preserve approved intent, inspect before assuming, change only approved scope, and report only what evidence proves.** Sparovia's long-term value depends on trustworthy business context, controlled experiences, tenant isolation, user-approved content, genuine lead data, consistent design, and disciplined incremental delivery.
