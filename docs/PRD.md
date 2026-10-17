# SPAROVIA --- PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Document:** `docs/PRD.md`\
**Version:** 1.0\
**Status:** Draft for product-owner review\
**Product:** Sparovia --- Business Experience Platform\
**Product authority:** Approved Sparovia Master Product Blueprint\
**Governance:** `docs/RULES.md`\
**Last updated:** 17 October 2026

> **Status note:** This PRD defines the approved product direction and
> requirements available from the Master Product Blueprint and existing
> V1 specification. It does not claim every requirement is implemented.
> Current implementation status must be established through a separate
> repository audit and executed verification.

------------------------------------------------------------------------

## 1. Purpose

This Product Requirements Document (PRD) describes what Sparovia is
intended to do, whom it serves, the product principles that guide it,
the approved V1 scope, user journeys, constraints, and staged roadmap.

It is the product requirements authority. It does not replace: -
`RULES.md` for engineering governance and change control. -
`ARCHITECTURE.md` for verified technical architecture. - `DESIGN.md` for
Sparovia's platform visual design. - Approved API, domain-model, UX, and
Image Studio specifications for detailed contracts, schemas, and
interaction behavior after reconciliation with this PRD.

If a requirement is unclear or conflicts with an explicitly approved
product decision, record the conflict and request a decision rather than
guessing.

## 2. Product Overview

### 2.1 Product identity

**Sparovia is a Business Experience Platform.**

### 2.2 Vision

Help businesses manage and improve their digital business experience
through a shared, trusted business context and a controlled platform
that connects business information, website experience, content, media,
and incoming leads---with a staged path toward intelligence and
automation.

### 2.3 Product thesis

Businesses should not have to repeatedly explain themselves to
disconnected tools or manually maintain inconsistent information across
their digital presence. Sparovia should maintain approved business
context and reuse it in supported workflows.

The product combines: - A reusable, approved understanding of each
business. - Controlled website and landing-page experiences. -
Structured content and media management. - Contextual AI assistance with
factual safeguards and user review. - Lead intake and operational
visibility. - A future path toward business intelligence and workflow
automation.

AI is a capability within the platform, not the entire product.

### 2.4 Problem statement

Business information, service descriptions, website content, images,
contact details, and enquiry workflows may be managed in disconnected
systems. This can create repeated work, inconsistent messaging,
low-quality content, and fragmented operations.

Sparovia aims to reduce that fragmentation by connecting supported
workflows through Business Context.

This problem statement is a product hypothesis. It does not claim market
demand, market size, competitive superiority, or willingness to pay has
been validated.

## 3. Target Users and Use Cases

### 3.1 Primary user

A business owner or authorized business representative who needs to
manage the business's supported digital presence and incoming enquiries
without directly editing website code.

### 3.2 Supporting user roles

The product may also involve authorized staff or administrators with
permissions appropriate to their responsibilities. Exact role
definitions, permission matrices, and account lifecycle behavior must
follow the approved domain model and implementation; this PRD does not
invent additional roles.

### 3.3 Core jobs to be done

Users need to: 1. Establish and maintain accurate business information.
2. Manage supported website or landing-page content. 3. improve content
using contextually relevant suggestions while retaining control. 4.
Upload, replace, and improve website images within the approved image
workflow. 5. Review draft changes and explicitly publish approved
changes. 6. Receive and manage genuine enquiries through supported lead
channels. 7. Understand relevant work and status from the Command
Center.

These are intended user needs. Their implementation status must be
verified separately.

## 4. Product Principles

### 4.1 Business Context First

Approved business information is the trusted factual basis for
contextual assistance and supported experiences.

### 4.2 Controlled experience

Sparovia controls supported structure, components, layout rules,
responsive behavior, and publishing boundaries. It is not an
unrestricted drag-and-drop website builder or a CMS code editor.

### 4.3 No source, no fact

Do not invent business facts, qualifications, awards, certifications,
testimonials, customer names, project metrics, or other unsupported
claims. Ask for missing information, omit it, or mark the gap.

### 4.4 User control

AI suggestions are reviewable. Accepting a suggestion changes a draft
only. Publishing requires a distinct explicit action.

### 4.5 Multi-tenant safety

Every tenant's data and operations must remain isolated and authorized
server-side.

### 4.6 Incremental improvement

Preserve the V1 foundation and improve it through scoped, verifiable
changes.

### 4.7 Honest evidence

Do not represent planned capabilities as implemented or claim production
readiness without evidence.

## 5. Approved V1 Product Lock

The approved V1 product areas are:

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

This list defines approved product areas. It is not proof that every
area is complete in the current repository.

**Theme System is not an approved product capability** and must not
appear as a planned V1 feature, user journey, or roadmap item.
`DESIGN.md` defines Sparovia's own platform visual design; it does not
approve a customer-facing Theme System.

**Contact Activity is permanently decommissioned for V1.** Do not
restore its UI, public tracking endpoints, tracking beacons, or
behavior. Historical schema/data may remain where necessary to avoid
destructive migrations.

## 6. V1 Product Goals

V1 establishes the foundational business presence and management
workflows that support Sparovia's core product model.

### Goal 1 --- Establish approved Business Context

The user can provide structured business information needed for
supported workflows. The platform distinguishes approved facts from
absent or unverified claims.

### Goal 2 --- Manage supported website content

The user can manage content fields and sections that are actually
supported by the connected website. The platform does not promise
arbitrary code or layout editing.

### Goal 3 --- Provide context-aware content assistance

The user can request relevant wording improvements based on approved
Business Context and current content. Suggestions remain reviewable and
do not publish automatically.

### Goal 4 --- Manage website media

The user can upload and replace supported website images and use
approved image-quality workflows where implemented. Original assets must
be preserved.

### Goal 5 --- Publish deliberately

The user can distinguish draft changes from public content and
explicitly publish approved changes. Draft content must not leak through
public runtime endpoints.

### Goal 6 --- Manage genuine leads

The platform can receive and manage supported website enquiries and,
where configured and securely verified, inbound WhatsApp leads. Outbound
link clicks do not create leads.

### Goal 7 --- Provide operational orientation

The Command Center serves as the operational home after login, showing
real status and relevant actions available to the user. It is not merely
an analytics dashboard.

## 7. V1 Functional Requirements

The requirements below describe intended product behavior. Their current
implementation status is not asserted here.

### 7.1 Business onboarding and Business Context

The platform should support onboarding that collects the approved
business information needed for supported workflows.

The existing specification identifies information such as: - Business
name. - Business type and primary category. - Business phone and
email. - Website and business address where applicable. - Service areas
where applicable. - Services and target customers. - Business
description and differentiators. - Approved facts and claims, such as
years in business, certifications, awards, accreditations, warranties,
or authorized/dealer status when provided and verified.

Acceptance expectations: - Required and optional fields are clearly
distinguished according to the approved schema. - Input is validated. -
The user can review and correct information. - Missing claims are not
fabricated by AI. - Tenant ownership and access are enforced
server-side.

The exact field schema and validation rules belong in the approved
domain-model specification.

### 7.2 Website and landing-page projects

The product supports approved Website Project and Landing Page Project
concepts.

Requirements: - The user can access projects permitted to their
account. - Project data remains tenant-isolated. - Only supported
project types and capabilities are presented. - Project lifecycle and
permissions follow the approved domain model. - The product does not
imply arbitrary code editing or unrestricted drag-and-drop composition.

Exact project creation, status, routing, and lifecycle requirements must
be reconciled with the existing UX and domain specifications.

### 7.3 Structured website content management

The platform should allow users to edit supported content mapped to the
connected website.

The existing product specification mentions sections such as: - Hero /
Business - About - Services - Why Choose Us - Explore Our Work -
Contact - Footer

Only sections actually supported by the connected website should be
exposed.

Requirements: - Content fields reflect their intended meaning and
validation. - The user can save draft changes. - Draft and published
states are distinct. - Public runtime endpoints expose only published
content. - Content operations are authorized and tenant-safe. -
Unsupported structural/code editing is not exposed as a V1 promise.

### 7.4 Contextual AI content assistance

The existing specification lists these content actions: - Improve
Wording - Make More Professional - Make Shorter - Make Clearer - Improve
Service Description - Custom Instruction

Requirements: - Use approved Business Context and only the relevant
approved content for the task. - Do not invent factual business
claims. - Present output as a suggestion until the user reviews it. -
Where supported, allow the user to accept, edit, or reject the
suggestion. - Acceptance updates a draft only. - AI errors and missing
context are communicated honestly. - AI does not bypass authorization or
publish content automatically.

### 7.5 Website image management and Image Studio

The platform should support the approved upload/replacement workflow and
Image Studio capabilities where implemented.

The seven approved client-facing operations are: 1. Improve Clarity 2.
Improve Sharpness 3. Reduce Noise 4. Upscale 5. Classic Look 6. Modern
Look 7. Web Optimize

Requirements: - Follow the principle **"Improve quality, not
reality."** - Preserve the original image immutably. - Store enhanced
results as separate derived variants. - Provide a genuine before/after
comparison. - Keep review/approval distinct from explicit publishing. -
Do not materially alter the photographed subject or fabricate project
completion. - Reuse the canonical Image Studio specification and
existing processing pipeline. - Verify file constraints and operation
mappings against current code before claiming them as implemented.

The detailed limits and processing behavior belong in
`BUILD_IMAGE_STUDIO_REBUILD.md` and related verified implementation
documentation.

### 7.6 Lead intake and management

Requirements: - Website form submissions create website Lead records
through the supported intake flow. - Inbound WhatsApp leads are
supported only where configured and securely verified. - Outbound
WhatsApp/social clicks do not create or mutate Lead records. - Lead
status changes follow approved rules. - Tenant ownership and
authorization are enforced. - Public intake has appropriate server-side
validation and abuse protection. - Errors must not create duplicate or
misleading lead records.

Exact Lead fields, statuses, transitions, and endpoint contracts belong
in the domain-model and API specifications.

### 7.7 WhatsApp and social links

Locked V1 direction: - Three to four client-authored WhatsApp
templates. - Direct external WhatsApp launch. - Facebook and Instagram
links. - No paid Meta API or third-party middleware without explicit
approval.

These capabilities must not be expanded into unapproved messaging
automation.

### 7.8 Command Center

The Command Center is the operational home after login.

Requirements: - Display only real, supportable product state. - Provide
access to relevant actions and workflows available to the user. - Avoid
fabricated metrics, fake activity, and empty dashboard widgets presented
as useful data. - Respect authorization and tenant boundaries. - Keep
relevant actions within the Command Center where appropriate; a separate
Action Center is not approved. - Follow `DESIGN.md` and consistent
platform UX standards.

Exact widgets, actions, status summaries, and navigation must be
grounded in approved user journeys and real data.

### 7.9 Authentication, authorization, and tenant isolation

Requirements: - Protected operations require appropriate authentication
and authorization. - Every tenant-owned resource is accessed within the
correct tenant boundary. - Server-side checks enforce tenant ownership;
frontend controls alone are insufficient. - Public endpoints expose only
intended data and operations. - Webhook authentication is validated
before processing payloads. - Secrets are not exposed in source code,
client bundles, logs, or error responses.

Exact authentication flows and permission behavior must be documented in
the architecture, API, and UX specifications based on the current
implementation.

### 7.10 Publishing and public runtime

Requirements: - Draft content remains private to authorized workflows. -
Publishing is explicit and authorized. - Public runtime reads only the
published version. - Publishing failures are reported accurately. -
Repeated requests and partial failures are handled safely according to
the existing architecture. - Tenant boundaries remain enforced.

### 7.11 Cross-cutting UX requirements

All supported workflows should provide appropriate: - Loading and
processing states. - Empty states. - Validation feedback. - Success and
failure feedback. - Safe retry behavior where appropriate. - Responsive
layouts. - Keyboard access and visible focus. - Accessible labels and
understandable error messages. - Reduced-motion behavior where animation
is used.

Follow `DESIGN.md`. Do not claim WCAG 2.2 AA compliance without actual
verification.

## 8. Non-Functional Requirements

### 8.1 Security and privacy

Enforce authentication, authorization, tenant isolation, input
validation, secret protection, and safe public endpoint behavior. Handle
business information only for approved product purposes.

### 8.2 Reliability

Failures must not be presented as successes. Preserve originals and
existing data. Avoid partial state changes where existing transactions
or consistency mechanisms apply. Make retries safe where appropriate.

### 8.3 Maintainability

Reuse established architecture and shared components. Avoid duplicate
infrastructure and unnecessary dependencies. Keep changes scoped and
testable.

### 8.4 Performance

Measure actual behavior before setting numeric performance claims. Do
not invent latency, throughput, availability, or processing targets that
have not been approved.

### 8.5 Accessibility and responsiveness

Use `DESIGN.md` as the visual authority. Treat WCAG 2.2 AA as a
verification target, not an assumed achievement.

### 8.6 Observability

Errors and operational events should be diagnosable without exposing
secrets or sensitive business data. Specific logging, monitoring, and
alerting requirements must be established in architecture and
operational documentation.

## 9. Explicit Exclusions and Scope Boundaries

The following are not approved V1 requirements:

-   Customer-facing Theme System.
-   Contact Activity screens, tracking beacons, public tracking API, or
    tracking behavior.
-   Unrestricted drag-and-drop website building.
-   Arbitrary HTML/CSS or custom-code editing.
-   AI-driven autonomous redesign or publishing.
-   Fabricated business facts, reviews, testimonials, or project claims.
-   Separate Action Center.
-   Separate Sparovia Brain database/module/agent runtime without
    approval.
-   Paid Meta API or unapproved third-party middleware.
-   New providers, major services, or database entities without explicit
    approval.
-   Future-stage intelligence, automation, or agent capabilities
    implemented merely because they appear on the roadmap.

Historical database schema/data may be retained when needed to avoid
destructive migrations, even when the associated product feature is
decommissioned.

## 10. Roadmap

Roadmap stages describe direction and are not automatic authorization
for implementation.

### V1 --- Business Presence Foundation

Foundational Business Context, controlled website and landing-page
workflows, structured content and media, publishing, and lead intake.

Project discussions treat the foundation as completed, but defects and
production-readiness gaps remain. Verify each capability against current
code and tests.

### V1.1 --- Business-aware content and image quality

Incrementally improve reliability, usability, consistency, and quality
of existing approved workflows. Do not rebuild V1 or add unapproved
providers.

### V2 --- Business Intelligence

Explore approved intelligence use cases based on structured Business
Context and permitted platform information. Define users, outcomes, data
governance, privacy boundaries, and implementation before development.

### V3 --- Workflow Automation

Explore controlled automation of approved workflows. The roadmap does
not authorize autonomous external actions or new integrations by itself.

### V4 --- AI Copilot

Explore broader contextual assistance while preserving factual
grounding, reviewability, authorization, and user control.

### V5 --- Agentic Business OS

Long-term aspiration for a more capable business operating layer. It
does not authorize an autonomous agent runtime in V1.

### Sparovia Brain

A long-term structured business-intelligence direction that begins with
existing Business Context. Its precise boundaries and implementation
require separate approval. Do not duplicate the existing source of
business facts.

## 11. Success Measures and Validation

The product should be validated with real users and evidence rather than
assumed to be valuable.

Potential areas for future measurement include: - Whether users can
complete onboarding and establish accurate Business Context. - Whether
users can safely edit and publish supported content. - Whether AI
suggestions are useful, accurate, and accepted after review. - Whether
image workflows preserve originals and produce acceptable results. -
Whether genuine enquiries are captured accurately without inflated
counts. - Whether users can find important workflows from the Command
Center. - Whether users continue using the product and demonstrate
willingness to pay.

These are candidate measurement areas, not established metrics or
validated targets. Numeric targets, event definitions, privacy
constraints, and analytics implementation require explicit approval. Do
not add Contact Activity tracking to measure them.

## 12. Known Risks and Open Questions

The following require evidence or decisions rather than assumptions:

1.  Exact implementation completeness of each V1 product area.
2.  Precise relationship between Business Experience Engine, Business
    Context, and Sparovia Brain.
3.  Current status of the reported inbound WhatsApp webhook
    token-validation issue.
4.  Current reproducibility and root cause of the reported
    integration-test isolation failures.
5.  Actual deployment, secret management, custom-domain, SSL,
    monitoring, backup, and operational readiness.
6.  Current Image Studio behavior, operation mapping, and file
    constraints.
7.  Conflicts between legacy Contact Activity specifications and the
    locked decommissioning decision.
8.  Market validation, competitive positioning, pricing, retention, and
    willingness to pay.

Track engineering defects in `TASKS.md`; resolve product decisions
through explicit review.

## 13. Dependencies and Source Documents

This PRD must be reconciled with: - `RULES.md` --- engineering
governance. - `ARCHITECTURE.md` --- verified current implementation
architecture. - `DESIGN.md` --- platform visual design. -
`BUILD_IMAGE_STUDIO_REBUILD.md` --- canonical Image Studio
specification. - Existing domain data model --- schemas and persistence
invariants. - Existing API specification --- endpoint and DTO
contracts. - Existing UX screen specification --- detailed screens and
journeys. - Existing implementation plan and audit evidence.

Do not delete or retire these specialized documents until their unique
approved content has been mapped, conflicts reconciled, and a
migration/retirement plan approved.

## 14. Acceptance Criteria for This PRD

This PRD is ready for approval when: - Product identity and vision match
the approved Master Product Blueprint. - The ten approved V1 product
areas are preserved. - Theme System is excluded from approved product
scope. - Contact Activity is decommissioned for V1. - V1 is described as
an existing foundation to preserve and improve. - Business Context and
AI factuality rules are explicit. - Draft, review, and publishing
boundaries are clear. - Lead integrity and webhook security requirements
are included. - Image quality and original-preservation requirements are
included. - Planned direction is separated from implemented
functionality. - No unsupported market, customer, performance, or
production-readiness claims are made. - Conflicts and unknowns remain
visible. - The product owner has reviewed and approved the document.

------------------------------------------------------------------------

**Review status:** Draft awaiting product-owner approval.\
**Do not treat this document as approved until the user explicitly
approves it.**
