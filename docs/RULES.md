# SPAROVIA --- PROJECT RULES

**Document:** `docs/RULES.md`\
**Version:** 1.0\
**Status:** Draft for review\
**Authority:** Project governance and engineering rules\
**Product baseline:** Approved `SPAROVIA_MASTER_PRODUCT_BLUEPRINT.md`\
**Last updated:** 17 October 2026

> **Purpose:** These rules govern how Sparovia is specified, changed,
> verified, and documented. They do not replace the product vision in
> the Master Product Blueprint, the visual standards in `DESIGN.md`, or
> approved domain-specific specifications. This document must be
> reviewed and approved before it is treated as the active repository
> authority.

------------------------------------------------------------------------

## 1. Rule Precedence and Authority

When instructions or documents conflict, do not silently choose
whichever is easiest to implement.

Apply this order:

1.  Latest explicit product-owner decisions and locked constraints.
2.  The approved Sparovia Master Product Blueprint for product identity,
    scope, exclusions, and roadmap.
3.  This `RULES.md` for governance, engineering behavior, security,
    verification, and change control.
4.  `ARCHITECTURE.md` for verified current architecture and approved
    technical decisions.
5.  `DESIGN.md` for Sparovia's own platform visual design.
6.  Approved specialized specifications for their respective domains,
    once reconciled with higher-level decisions.
7.  Historical documents, old audit reports, and superseded
    specifications as evidence/history---not automatically current
    authority.
8.  Current source code, configuration, migrations, and executed tests
    as evidence of implementation---not automatic permission to change
    the product vision.

If two approved sources conflict, record the conflict, identify the
affected requirements, and request a product-owner decision when the
conflict cannot be resolved from an explicit later decision. Do not hide
or silently rewrite the conflict.

## 2. Non-Negotiable Product Rules

### 2.1 Product identity

Sparovia is a **Business Experience Platform**. Use this product
identity consistently.

### 2.2 Preserve and improve V1

The existing V1 foundation must be preserved and improved incrementally.
Do not rebuild working functionality from scratch without explicit
approval and a documented reason.

### 2.3 Approved V1 Product Lock

The approved product areas are:

1.  Workspace
2.  Projects
3.  Website Project
4.  Landing Page Project
5.  Business Experience Engine
6.  Visual Builder
7.  Component Library
8.  CMS
9.  Publishing
10. Command Center

This list defines approved product areas; it does not prove each one is
implemented or complete. Verify implementation status before making
completion claims.

### 2.4 Theme System is not approved

Do not introduce a customer-facing **Theme System** feature into product
scope, user journeys, roadmap, or implementation plans. It has not been
approved.

`DESIGN.md` remains the authority for the visual design of Sparovia's
own platform UI. A platform design system is not the same as a
customer-facing Theme System feature.

### 2.5 Contact Activity is decommissioned for V1

Do not restore Contact Activity UI, public tracking endpoints, tracking
beacons, or associated behavior. Historical schema/data may be retained
when necessary to avoid destructive migrations. Reconcile old documents
that describe this module so they cannot be mistaken for current
requirements.

### 2.6 Command Center

The Command Center is the operational home after login. Relevant actions
can be available within it. Do not introduce a separate Action Center
without explicit approval.

### 2.7 Sparovia Brain

Sparovia Brain is a long-term direction that starts with existing
Business Context. Do not create a separate database, independent module,
agent runtime, or duplicate source of business facts without an approved
requirement and architecture decision.

### 2.8 No unapproved scope

Do not add features, providers, integrations, database entities,
services, architectural subsystems, or roadmap capabilities merely
because they seem useful or are mentioned as a future direction. Obtain
explicit approval first.

## 3. Evidence, Truthfulness, and Status Labels

Every material product or implementation claim must be traceable to an
approved decision, source document, current code, or executed
verification.

Use these labels consistently:

-   **LOCKED:** explicitly approved decision or constraint.
-   **VERIFIED:** confirmed in the current repository or by an executed
    check.
-   **IMPLEMENTED --- UNVERIFIED:** code appears present, but behavior
    has not been adequately verified.
-   **APPROVED --- NOT IMPLEMENTED:** approved requirement not yet
    delivered.
-   **PLANNED:** future direction not approved for active
    implementation.
-   **PROPOSED:** idea awaiting a decision.
-   **CONFLICT:** authoritative sources disagree.
-   **DEPRECATED:** no longer an active requirement.
-   **UNKNOWN:** available evidence is insufficient.

Rules:

1.  Never describe a planned or proposed capability as implemented.
2.  Never treat an old test report as proof of the current repository's
    state.
3.  Never report a test, build, security check, or deployment validation
    as passed unless it was actually run and its result observed.
4.  Distinguish repository evidence from assumptions and product
    aspirations.
5.  If evidence is missing, record `UNKNOWN` and identify how to verify
    it.
6.  Do not invent customer validation, market demand, competitive
    superiority, business outcomes, performance metrics, or
    production-readiness evidence.

## 4. Architecture and Engineering Rules

### 4.1 Existing architecture first

Inspect the current repository and approved architecture before changing
code. Reuse existing modules, services, components, API contracts,
persistence patterns, and processing pipelines where appropriate.

### 4.2 Clean Architecture and maintainability

Preserve the approved direction: - .NET backend. - Clean Architecture
and SOLID principles. - Feature-first organization where established. -
Reusable, cohesive components. - Supabase PostgreSQL and EF Core
foundation. - Shared multi-tenant codebase.

Verify actual repository structure before documenting implementation
details or changing architecture.

### 4.3 Avoid duplication and over-engineering

Do not create a duplicate service, abstraction, component, API endpoint,
DTO, state model, database entity, processor, storage abstraction, or
provider when an adequate existing equivalent exists.

Do not introduce infrastructure for hypothetical future requirements.
Prefer the smallest maintainable change that satisfies an approved
requirement.

### 4.4 Preserve contracts

Before modifying APIs, DTOs, database schemas, migrations, storage,
publishing, or external integrations: 1. Inspect existing callers and
consumers. 2. Identify compatibility and data migration risks. 3.
Preserve working contracts unless a change is approved. 4. Add or update
tests for the changed behavior. 5. Document necessary migration and
rollout steps.

### 4.5 No unrelated changes

Keep each task scoped to its approved objective. Do not include drive-by
refactoring, broad redesign, dependency upgrades, formatting churn, or
unrelated fixes unless separately approved or necessary to resolve a
directly related defect.

## 5. Multi-Tenancy, Security, and Data Integrity

Security and tenant isolation are foundational requirements.

1.  Enforce tenant ownership and authorization on the server for every
    tenant-owned resource and operation.
2.  Never rely on frontend hiding, route guards, or client-supplied
    tenant identifiers as the sole security boundary.
3.  Verify that reads, writes, updates, deletes, uploads, downloads,
    previews, publishing operations, and background/external processing
    cannot cross tenant boundaries.
4.  Validate inputs and state transitions server-side.
5.  Keep secrets out of source code, committed configuration, logs,
    client bundles, and error messages.
6.  Use approved secret/configuration mechanisms and avoid exposing
    sensitive information in diagnostics.
7.  Protect public endpoints against abuse using controls appropriate to
    their purpose.
8.  Validate webhook authentication before processing payloads.
9.  Prevent draft content from leaking through public runtime endpoints.
10. Preserve data integrity and avoid destructive migrations.
11. Do not weaken authorization or tenant checks to make tests pass.
12. Record security-sensitive decisions and verification evidence.

### 5.1 Webhook security

A prior audit reported a potential issue in which the inbound WhatsApp
token header was received but not validated or passed to the service.
Re-inspect the current code and verify the complete request path. Treat
the finding as unresolved until validation is demonstrated through code
review and tests.

Do not process untrusted webhook payloads before the configured
authentication mechanism has been verified.

### 5.2 Historical data and decommissioned features

A feature being decommissioned does not automatically authorize deleting
its database tables, migrations, or historical data. Preserve
compatibility and data unless an explicit, reviewed migration plan
authorizes removal.

## 6. AI Factuality and User Control

### 6.1 No source, no fact

AI must not fabricate: - Years in business. - Qualifications,
certifications, accreditations, awards, or warranties. - Customer names,
testimonials, or reviews. - Project counts, results, metrics, or
completion claims. - Authorized/dealer status or other credentials. -
Any other factual business claim not supported by approved information.

Use approved Business Context and relevant approved content as the
factual source. When a fact is missing, ask the user, omit it, or
clearly identify the gap.

### 6.2 Context minimization

Send AI only the context needed for the current task, such as approved
Business Context, relevant approved content, the current field/section,
the user's instruction, and applicable Sparovia AI rules.

### 6.3 Human review

Treat generated output as an untrusted suggestion until reviewed. Users
must be able to review and, where supported, edit or reject suggestions.
Accepting a suggestion changes a draft only unless an explicitly
approved workflow states otherwise.

### 6.4 No autonomous publishing

Do not allow AI to silently publish content, redesign a website, or
bypass explicit approval and authorization.

### 6.5 Honest user feedback

Do not present fabricated scores, quality percentages, processing
claims, or success notifications. The UI must reflect actual operation
results and failure states.

## 7. Image Quality and Media Rules

The approved Image Studio direction follows the principle **"Improve
quality, not reality."** `BUILD_IMAGE_STUDIO_REBUILD.md` is the
canonical detailed specification unless formally superseded through an
approved review.

1.  Preserve original uploaded images immutably.
2.  Store enhanced outputs as separate derived variants.
3.  Provide a genuine before/after comparison where required by the
    approved workflow.
4.  Keep approval and publishing as separate explicit actions.
5.  Do not generatively replace or materially misrepresent the
    photographed subject.
6.  Do not alter the geometry, architecture, materials, products,
    people, or project completion represented by an image.
7.  Reuse existing image APIs, deterministic processing, storage,
    variant lifecycle, and publishing mechanisms.
8.  Do not create duplicate image-processing infrastructure.
9.  Enforce server-side file-type, file-size, pixel-limit,
    authorization, and tenant checks.
10. Verify documented file constraints and operation behavior against
    the current implementation before describing them as implemented.

The approved operation names are Improve Clarity, Improve Sharpness,
Reduce Noise, Upscale, Classic Look, Modern Look, and Web Optimize. Do
not invent extra operations without approval.

## 8. Leads and Communication Integrity

1.  Website form submissions are the source of website Lead records.
2.  Supported inbound WhatsApp leads may be accepted when configured and
    securely verified.
3.  Outbound WhatsApp or social-media clicks must not create or mutate
    Lead records or inflate enquiry counts.
4.  Distinguish an outbound contact launch, an external link click, and
    an actual inbound enquiry.
5.  Do not add paid Meta APIs, third-party middleware, or unapproved
    messaging automation.
6.  Preserve the locked direction of three to four client-authored
    WhatsApp templates, direct external WhatsApp launch, and
    Facebook/Instagram links unless a later approved decision changes
    it.

## 9. UI, UX, and Accessibility Rules

1.  Follow `DESIGN.md` for Sparovia's own platform UI.
2.  Reuse approved design tokens and shared components rather than
    scattering arbitrary style values.
3.  Maintain consistent interaction patterns across screens, forms,
    dialogs, menus, tables, empty states, loading states, validation,
    success, and error feedback.
4.  Avoid generic, cluttered, traditional admin UI where an approved
    modern interaction is required.
5.  Do not add pill-shaped buttons or decorative effects prohibited by
    `DESIGN.md`.
6.  Use purposeful motion and respect reduced-motion preferences.
7.  Make keyboard navigation, visible focus, semantic structure, labels,
    validation, responsive behavior, and contrast part of implementation
    and review.
8.  WCAG 2.2 AA is a target, not a claim of compliance. Do not claim
    conformance without actual verification.
9.  Do not introduce a customer-facing Theme System under the guise of
    applying the platform design system.
10. Do not invent dashboard metrics or show placeholder data as real
    business information.

## 10. Testing and Verification

### 10.1 Required discipline

For each meaningful code change: 1. Identify the relevant existing tests
before editing. 2. Add or update tests for the intended behavior and
important edge cases. 3. Run the relevant build, lint, unit tests, and
integration tests available for the affected area. 4. Record the exact
commands and observed outcomes. 5. Fix regressions caused by the change.
6. Review the final diff for unintended changes.

### 10.2 Never game test results

Do not delete tests, skip failing tests, weaken assertions, suppress
meaningful errors, or change expected values merely to obtain a green
run. If an existing test is invalid, document the reason and obtain
appropriate review before changing it.

### 10.3 Integration-test isolation

A prior audit reported two WebsiteContent integration-test failures in a
full test run that did not reproduce when the class was run in
isolation. Investigate shared database state, test parallelism, and test
isolation. Do not assume a root cause without reproducing it.

### 10.4 Reporting

Report: - Commands actually run. - Pass/fail counts and relevant
failures. - Tests not run and why. - Known limitations. - Whether the
result is local-only or verified in a deployment environment.

A successful compile alone does not establish correctness or production
readiness.

## 11. Production-Readiness and Release Rules

Never declare Sparovia "production ready" without defining the scope and
evidence for that claim.

Verify relevant requirements, including: - Authentication,
authorization, and tenant isolation. - Public routes and draft/published
content boundaries. - Webhook authentication and public endpoint abuse
protection. - Build, lint, unit, and integration test results. -
Configuration and secret handling. - Database migrations and data
integrity. - External integrations and failure behavior. - Deployment
settings, custom domains, SSL, and environment configuration where
applicable. - Monitoring, logging, backup/recovery, and operational
procedures where applicable. - Required privacy, terms, and other
public-facing legal pages where applicable.

Do not imply an external deployment, domain, SSL, secrets, or
operational control was verified if it was not.

## 12. Change-Control Protocol

Every task or implementation prompt must state:

1.  Objective and user/business problem.
2.  Current behavior and evidence.
3.  Approved scope.
4.  Explicit exclusions.
5.  Existing behavior and contracts to preserve.
6.  Acceptance criteria.
7.  Security, data, API, and migration implications.
8.  Verification plan.
9.  Required final report.

Before implementation: - Read the mandatory source-of-truth documents
for the affected area. - Inspect the actual code and current Git
status. - Identify ambiguities and conflicts. - Ask for a product
decision if a material ambiguity cannot be resolved from approved
decisions.

During implementation: - Do only the approved work. - Keep changes
reviewable. - Do not silently broaden scope. - Do not claim success
before verification.

After implementation: - Run relevant checks. - Review the diff. - Update
documentation and task status when evidence changes. - Report files
changed, verification performed, remaining risks, and any deviations.

A future roadmap item is not authorization to implement it.

## 13. Documentation Governance

### 13.1 One source of truth per responsibility

Use the approved documentation structure: -
`MASTER_PRODUCT_BLUEPRINT.md` (or its approved canonical location):
product identity, vision, product lock, exclusions, roadmap. -
`RULES.md`: engineering governance and non-negotiable rules. - `PRD.md`:
product requirements, users, journeys, V1 scope, and roadmap detail. -
`ARCHITECTURE.md`: verified current architecture and approved technical
boundaries. - `MEMORY.md`: durable decisions, rationale, historical
context, and unresolved conflicts. - `TASKS.md`: current priorities,
defects, evidence, and acceptance criteria. - `DESIGN.md`: platform
visual design authority. - `BUILD_IMAGE_STUDIO_REBUILD.md`: canonical
Image Studio specification.

The exact canonical location and filenames must be reconciled with the
approved repository layout. Do not create competing authorities with
near-identical content.

### 13.2 Preserve before retiring

Do not delete or archive existing specifications until: 1. Their unique
requirements and decisions have been inventoried. 2. Each valid
requirement has a destination in the new documentation. 3. Conflicts
have been explicitly recorded or resolved. 4. References have been
updated. 5. A traceability check has been completed. 6. The proposed
retirement list has been reviewed and approved.

Do not delete Git history, source code, database tables, migrations, or
user data as part of a documentation cleanup.

### 13.3 Keep documentation evidence-based

Update implementation status only when supported by current code review
or executed checks. Preserve historical audit reports as historical
evidence where useful, clearly labeling their date and limitations.

### 13.4 One document at a time

Create and review the documentation in the approved sequence: 1.
`RULES.md` 2. `PRD.md` 3. `ARCHITECTURE.md` 4. `MEMORY.md` 5. `TASKS.md`

Do not create the next document until the current document has been
reviewed and approved by the product owner.

## 14. Repository and File-Safety Rules

1.  Inspect Git status before making changes.
2.  Preserve unrelated user changes.
3.  Do not overwrite files blindly.
4.  Do not delete, rename, or move files without an approved migration
    plan.
5.  Do not assume a document is obsolete solely because its filename is
    old.
6.  Do not modify application code during a documentation-only task.
7.  Report exact files created, modified, moved, and proposed for
    retirement.
8.  If repository state differs from the documentation or a previous
    report, record the discrepancy and use current evidence.

## 15. Required Final Report for Engineering Tasks

Every completed engineering task must report:

-   **Objective:** what was requested.
-   **Scope:** what was and was not changed.
-   **Files changed:** exact paths and purpose.
-   **Behavior:** what changed from the user's perspective.
-   **Verification:** commands run and actual results.
-   **Security/data impact:** relevant findings or confirmation of no
    intended impact, supported by inspection.
-   **Known issues:** unresolved defects, limitations, or failed checks.
-   **Documentation:** documents updated or requiring follow-up.
-   **Deviation:** any difference from the approved plan and why.

Never report a task as fully complete if required acceptance criteria or
verification remain unmet.

## 16. Rule Changes

These rules may be changed only through an explicit, reviewed update: 1.
Identify the rule being changed. 2. State the reason and affected
product/technical areas. 3. Check for conflicts with the approved Master
Product Blueprint and locked decisions. 4. Describe migration and
compatibility implications. 5. Obtain product-owner approval. 6. Update
related documentation and references. 7. Record the decision and
effective version.

No prompt, generated plan, code change, or historical document can
silently override a locked product decision.

## 17. Approval Checklist

Before this document becomes the active `docs/RULES.md`, review that
it: - Preserves the approved Master Product Blueprint. - Keeps the ten
approved V1 product areas intact. - Excludes Theme System from product
scope. - Keeps Contact Activity decommissioned for V1 while preserving
historical data where needed. - Requires verification of webhook
security and integration-test failures. - Preserves AI factuality, image
fidelity, human review, and explicit publishing. - Requires tenant
isolation and server-side authorization. - Prohibits test suppression
and unsupported production-readiness claims. - Requires
one-document-at-a-time review and migration before deletion. - Does not
authorize unapproved features or application-code changes during
documentation migration.

------------------------------------------------------------------------

**Review status:** Draft awaiting product-owner approval.\
**Do not treat this document as approved until the user explicitly
approves it.**
