# Sparovia Architecture

**Document:** `docs/ARCHITECTURE.md`  
**Version:** 1.0  
**Status:** Production-grade architecture baseline — implementation verification required  
**Product:** Sparovia — Business Experience Platform  
**Scope:** Existing V1 foundation and the approved incremental evolution of that foundation  
**Authority:** Architecture decisions and engineering boundaries; read with `docs/RULES.md`, `docs/PRD.md`, and `docs/DESIGN.md`

---

## 1. Purpose

This document defines Sparovia's architectural boundaries, responsibilities, security model, data ownership rules, frontend/backend integration, quality controls, and change process. It is intended to help engineers make safe, consistent changes to the existing V1 codebase without rebuilding working functionality or introducing unapproved product scope.

This is an architecture baseline, not proof that every described control is implemented. Repository-specific paths, package versions, endpoint behavior, provider configuration, deployment topology, and security controls must be confirmed against the current source code and runtime configuration before being treated as verified.

### 1.1 Evidence labels used in this document

- **LOCKED** — approved product or engineering decision; changes require explicit approval.
- **BASELINE** — intended architecture for the existing V1 foundation, consistent with the known project structure.
- **VERIFY** — must be checked against the current repository, tests, configuration, or deployed environment.
- **PROPOSED CONTROL** — a production engineering requirement that must not be described as implemented until verified.

No document, build, or test result alone proves that the deployed production system is secure or operationally ready.

---

## 2. Architectural principles

1. **Preserve before replacing.** Improve the existing implementation incrementally. Do not start a rewrite or replace working modules merely to match a preferred folder layout.
2. **Multi-tenant isolation is a security boundary.** Resolve ownership on the server for every tenant-owned operation.
3. **Clean Architecture with feature-oriented organization.** Keep domain rules independent of infrastructure and delivery mechanisms; organize application behavior around business capabilities where this fits the current codebase.
4. **Explicit scope.** Implement only approved requirements. Roadmap direction is not authorization to build future features.
5. **Secure defaults.** Deny access when identity, tenant ownership, resource authorization, or webhook authenticity cannot be established.
6. **No source, no fact.** AI may assist with wording and image quality, but cannot invent business facts or silently make generated output public.
7. **Human-controlled publication.** Drafting, review, approval, and publishing are separate actions.
8. **Contracts before coupling.** Keep API request/response contracts explicit and avoid direct database access from the frontend.
9. **Observable behavior.** Use structured logs, correlation identifiers, health checks, and actionable error handling without exposing secrets or personal data unnecessarily.
10. **Test isolation and reproducibility.** Automated tests must be deterministic and must not depend on execution order or shared mutable data.
11. **Data safety.** Prefer additive, reversible migrations; do not delete historical data or perform destructive schema changes without an approved migration plan.
12. **Accessibility and responsive UX.** Shared platform UI follows `docs/DESIGN.md`; accessibility conformance is claimed only after testing.

---

## 3. System context and logical boundaries

Sparovia is a multi-tenant Business Experience Platform. In V1, an authenticated business user manages approved business context, structured website content and images, and leads captured from supported channels. The public website presents published content and may submit customer enquiries through supported server endpoints.

### 3.1 Logical system view

```text
Business User
    |
    v
Admin Web Application
    |  HTTPS / JSON API
    v
ASP.NET Core API
    |
    +--> Authentication / Authorization
    +--> Tenant and Resource Access Checks
    +--> Application Use Cases
    |       |
    |       +--> Business Context and Services
    |       +--> Website Content and Publishing
    |       +--> Image Management / Image Studio
    |       +--> AI-assisted Content Workflow
    |       +--> Leads and Approved Inbound Channels
    |       +--> Audit / Operational Diagnostics
    |
    +--> Infrastructure Adapters
            |
            +--> PostgreSQL through EF Core
            +--> Approved image storage / processing provider
            +--> Approved AI provider, where configured
            +--> External website / webhook integrations
```

```text
Public Visitor
    |
    v
Published Client Website
    |  public content read / enquiry submit
    v
Public API Boundary
    |
    +--> Resolve trusted website or configured integration
    +--> Validate and rate-limit the request
    +--> Create a Lead only for a valid supported enquiry
    +--> Persist and log the result safely
```

The diagrams describe logical boundaries, not a verified deployment topology. Do not infer separate services, queues, databases, or infrastructure resources from them.

### 3.2 Known repository baseline — verify before changing

Prior repository audit notes reported the following structure and technologies:

- Backend: .NET 9 solution with Domain, Application, Infrastructure, and API projects.
- Persistence: Supabase-hosted PostgreSQL accessed through Entity Framework Core.
- Frontend: Next.js monorepo using npm workspaces, with `apps/admin` and `apps/web`.
- Admin UI foundations reported: TanStack Query, Zustand, Tailwind CSS, and shadcn/ui.
- Backend cross-cutting foundations reported: dependency injection, Serilog, global exception middleware, Swagger/OpenAPI with JWT configuration, and health checks.

These are **previously reported facts, not a fresh source inspection**. Verify the solution file, project references, package manifests, route handlers, dependency registrations, migrations, and runtime configuration before changing or relying on a specific path, version, or implementation detail.

Do not silently convert the conceptual diagrams in this document into a new target folder structure if the current repository differs.

---

## 4. Backend architecture

### 4.1 Layer responsibilities

#### Domain

Owns business concepts, invariants, and domain behavior that do not depend on external technology.

Expected responsibilities include:
- Tenant-owned business entities and value objects already approved for V1.
- Domain-level lifecycle and validation rules where appropriate.
- Business invariants that must remain true regardless of API or persistence implementation.

Must not depend on:
- ASP.NET Core controllers or HTTP types.
- EF Core or database-provider types.
- UI frameworks.
- External AI, image, messaging, or storage SDKs.

Do not introduce a new entity or domain module solely because it appears in an older specification. Reconcile it with the approved PRD and actual implementation first.

#### Application

Coordinates use cases and enforces application-level workflow rules.

Expected responsibilities include:
- Use-case orchestration.
- Input validation and authorization-relevant resource checks.
- Interfaces for infrastructure capabilities.
- DTOs or application contracts where established by the codebase.
- Explicit draft/review/approval/publish transitions.
- Consistent handling of expected application failures.

Application code must not depend on concrete infrastructure implementations. Keep abstractions proportionate to real use cases; do not create generic frameworks without a current need.

#### Infrastructure

Implements application-defined interfaces and technical concerns.

Expected responsibilities include:
- EF Core database access and entity configuration.
- Provider-specific storage, image-processing, and AI adapters that are approved and actually used.
- External integration clients.
- Persistence implementations and migration support.
- Infrastructure-specific resilience and diagnostics.

Secrets and provider credentials must come from the approved secret/configuration mechanism, never committed source code or frontend bundles.

#### API / delivery layer

Owns HTTP concerns.

Expected responsibilities include:
- Routing, HTTP status codes, request/response serialization, and API version boundaries.
- Authentication and authorization policies.
- Request validation and safe binding.
- Mapping application outcomes to stable HTTP responses.
- Request correlation, rate limiting, and endpoint-specific protections where required.
- Public and authenticated endpoint separation.

Controllers/endpoints should remain thin. Business rules must not be duplicated across controllers or placed solely in client-side validation.

### 4.2 Dependency direction

The intended dependency direction is inward:

```text
API ---------------> Application ---------------> Domain
 |                         ^
 |                         |
 +----> Infrastructure ----+
             |
             +-------------> Domain (as required)
```

Infrastructure may implement abstractions owned by Application. Domain must remain independent of the other layers. The API may reference Application and register Infrastructure through composition-root configuration, but business logic must not depend on API types.

**VERIFY:** inspect project references and dependency-injection registrations. Add an automated architecture/dependency test if practical within the existing test setup; do not reorganize the solution merely to make names match this diagram.

### 4.3 Feature-oriented organization

Within existing projects, keep related use-case code cohesive. Feature-oriented organization may group commands, queries, validators, handlers, DTOs, and tests by capability where the repository already supports that pattern.

Do not impose a second competing organization style. Follow established conventions unless a specific, approved refactor demonstrates a clear maintenance benefit.

---

## 5. Frontend architecture

### 5.1 Applications and responsibilities

The prior repository audit reported two Next.js applications:

- **Admin application (`apps/admin`, reported path):** authenticated business-user workflows, business context, website content, images, leads, and Command Center.
- **Public website application (`apps/web`, reported path):** public presentation of published tenant content and supported visitor enquiry workflows.

**VERIFY:** confirm these paths, Next.js version, routing mode, server/client component boundaries, workspace scripts, and shared-package setup in the current repository.

### 5.2 Admin UI principles

- Use the existing API as the source of persisted business data; do not connect browser components directly to PostgreSQL.
- Use the existing query/cache and local-state libraries according to their established responsibilities. Do not add a second state-management or data-fetching framework without approval.
- Keep server-owned data, transient UI state, form state, and derived display state distinguishable.
- Validate forms both in the client for usability and on the server for correctness/security.
- Model loading, empty, success, validation-error, permission-error, and recoverable-failure states deliberately.
- Prevent duplicate submissions and communicate the outcome of mutations.
- Use reusable form, dialog, table/list, upload, notification, and confirmation patterns where appropriate.
- Do not default to traditional dense tables when a task-oriented list, summary, or detail view better fits the information. Use the approved UX specification and `docs/DESIGN.md`.
- Do not introduce a Theme System as a product module. `docs/DESIGN.md` governs Sparovia's own platform UI; tenant website customization is limited to approved V1 capabilities.

### 5.3 Public website principles

- Render only published/approved tenant content.
- Keep draft or pending image variants private and unavailable to public routes.
- Resolve the website-to-tenant relationship through a trusted server-side mapping or approved identity mechanism.
- Validate public form submissions on the server, including input size, field constraints, origin/integration policy where applicable, and abuse controls.
- Do not expose tenant IDs, internal database identifiers, private storage paths, provider errors, or draft content unnecessarily.
- Outbound WhatsApp or social-link clicks are navigation actions, not lead submissions.

### 5.4 Shared components and styling

- Reuse the repository's current component and design-token foundation.
- `docs/DESIGN.md` is the visual authority for Sparovia's own platform interface.
- Avoid arbitrary one-off colors, radii, shadows, typography, and interaction patterns.
- Do not claim accessibility compliance based only on design intent. Verify keyboard behavior, focus visibility, labels, error association, contrast, zoom/reflow, and relevant screen-reader behavior.

---

## 6. Data and persistence architecture

### 6.1 Database baseline

The approved foundation uses PostgreSQL through EF Core, with Supabase reported as the hosted database platform. Confirm the current provider, connection configuration, schema, and migrations in source before making changes.

The database is the persistence boundary for business records. Frontend applications must not access it directly.

### 6.2 Tenant ownership model

Every tenant-owned resource must have an explicit, enforceable ownership relationship. The current approved product model includes tenant-scoped business context, services, website/content, images/variants, leads, AI-operation records where implemented, and audit records where implemented.

The exact current entity names and cardinalities must be verified against the live domain model and migrations. This document does not authorize adding missing tables or entities merely to match an illustrative list.

### 6.3 Tenant resolution and resource authorization

For authenticated admin operations:

```text
Validated identity
    -> server-resolved user
    -> server-resolved tenant membership
    -> resource ownership check
    -> use case
    -> persistence
```

For public website operations:

```text
Trusted website/integration identity
    -> server-resolved website
    -> server-resolved tenant
    -> endpoint-specific validation
    -> permitted use case
```

Rules:
- Never treat a client-supplied `TenantId` as authorization.
- A resource ID is not proof that the caller owns the resource.
- Check tenant ownership for reads, writes, deletes, uploads, image-variant access, exports, and background work.
- Ensure query filters or repository conventions do not hide a missing authorization check; test negative cross-tenant cases explicitly.
- Public endpoints must use a deliberately narrow allowlist of operations and data.
- Avoid leaking whether another tenant's resource exists; return an appropriate non-disclosing response.
- Background jobs must carry a trusted server-created tenant/resource reference and revalidate ownership/state before executing.

### 6.4 EF Core and migration safety

- Keep schema changes in reviewed EF Core migrations consistent with repository conventions.
- Review generated SQL and data effects for non-trivial migrations.
- Prefer additive changes and explicit backfills over destructive in-place transformations.
- Never drop or rewrite historical tables/data without explicit approval and a documented retention/migration plan.
- Avoid running production migrations automatically at application startup unless an explicit, reviewed deployment design requires it.
- Test migrations against a representative non-production database before production rollout.
- Ensure database constraints and indexes support important ownership, uniqueness, and query requirements where appropriate.

**Special case — Contact Activity:** this module is decommissioned for V1. Do not restore its UI, public tracking endpoint, tracking beacon, or behavioral tracking. Preserve historical schema/data where present unless a separately approved retention and migration decision authorizes otherwise.

### 6.5 Transactions and consistency

Use database transactions when a single business operation must commit multiple related changes atomically. Keep transaction scope short and avoid holding a database transaction open during slow external AI/image/network calls.

For workflows spanning persistence and external providers:
1. Validate the request and current resource state.
2. Perform external work using bounded timeouts and safe retry behavior.
3. Persist the result and state transition consistently.
4. Handle partial failure explicitly; do not mark an operation successful when its result was not durably stored.
5. Make retries idempotent where duplicate execution could create duplicate records or overwrite newer user work.

Use an outbox, queue, or distributed workflow only if the actual reliability requirement and current system justify it and the design is approved; this document does not authorize adding one by default.

---

## 7. API and integration architecture

### 7.1 API contracts

The legacy API specification describes `/api/v1` as the intended API prefix. **VERIFY** actual routes before documenting them as current production contracts.

- Keep request and response schemas explicit and stable.
- Validate requests at the server boundary.
- Use consistent error shapes and status codes according to the existing approved API contract.
- Keep internal exception details, SQL, stack traces, secrets, and provider payloads out of public responses.
- Document authentication requirements and tenant ownership expectations for each endpoint.
- Make breaking changes through an explicitly approved versioning strategy.
- Do not create duplicate endpoints or silently rename existing routes to match documentation.

### 7.2 Authentication and authorization

Authentication establishes identity; authorization decides what that identity may do. Both are required.

- Use the currently approved authentication mechanism and existing implementation; verify its configuration and token/session lifecycle.
- Enforce authorization on the server for every protected operation.
- Apply least privilege to administrative and integration credentials.
- Validate token issuer, audience, signature, expiry, and other required claims according to the chosen authentication system.
- Keep secrets out of URLs, logs, client-side source, and error messages.
- Test unauthenticated access, invalid/expired credentials, insufficient permission, and cross-tenant resource access.

Do not infer that JWT support in Swagger or an authorization header example proves authentication is correctly configured in production.

### 7.3 Public endpoints and abuse protection

Public content reads and enquiry submission are different trust boundaries.

For public enquiry endpoints, verify and implement as appropriate:
- Strict input validation and request-size limits.
- Rate limiting and abuse/spam controls.
- Origin/CORS policy that is not mistaken for authentication.
- Safe logging and data minimization.
- Duplicate-submission handling where required.
- Explicit allowed website/integration identity resolution.
- Generic external errors with useful internal correlation IDs.

CORS alone does not prevent direct HTTP requests and must never be treated as authorization.

### 7.4 WhatsApp inbound integration

Inbound WhatsApp lead creation is permitted only when the integration is configured and the request is authenticated according to the approved integration contract.

- Verify the provider's signature/token using the correct server-side secret and documented provider algorithm.
- Reject invalid, missing, expired, or malformed authentication evidence before accepting a lead.
- Validate provider event structure and prevent duplicate processing using a trusted event/message identifier when available.
- Resolve the destination integration/website to a tenant on the server.
- Enforce payload limits and avoid logging message bodies or personal information unnecessarily.
- Record only a legitimate inbound enquiry as a Lead, according to the approved mapping.
- Outbound WhatsApp links and template launches must not create or mutate Lead records.

**High-priority verification item:** a prior audit reported that `LeadsController.cs` accepted an `X-WhatsApp-Token` header but may not have validated or passed it to the service. This is not freshly verified here. Inspect the current implementation and tests. If confirmed, treat it as a security defect and block inbound lead acceptance until server-side validation is enforced and negative tests pass. Do not assume a header is secure merely because it exists.

### 7.5 External provider boundaries

AI, image-processing, storage, and messaging providers must be accessed through the current approved server-side integrations or application-owned interfaces.

- Do not call privileged provider APIs directly from the browser.
- Use timeouts, bounded retries, and cancellation where supported.
- Retry only operations that are safe to retry; avoid duplicate lead creation or repeated billable work.
- Validate provider responses before persisting or serving them.
- Do not log credentials or full sensitive provider payloads.
- Do not introduce a new provider, paid service, middleware, or background-processing platform without approval.

Provider abstractions are justified when they isolate a real external dependency; avoid speculative abstraction layers.

---

## 8. Content and publishing lifecycle

### 8.1 Source-of-truth hierarchy

Use the following trust order for business facts:

1. Approved Business Context.
2. Approved website content and verified client-provided assets.
3. Current editable draft.
4. AI-generated suggestion awaiting review.
5. General model knowledge.

Lower-trust sources must not silently overwrite higher-trust sources.

### 8.2 Draft, review, approval, and publication

The intended lifecycle is:

```text
Create/edit draft
    -> validate
    -> review
    -> explicit approval
    -> explicit publish action
    -> verify public result
```

- AI content suggestions remain suggestions until the user reviews and accepts them.
- Accepting a suggestion updates draft content only.
- AI must not invent years in business, qualifications, awards, certifications, testimonials, customer identities, project metrics, or other factual claims.
- Do not automatically publish content or images after AI processing.
- Publishing should validate required content, asset readiness, and authorization before changing public state.
- Failed publication must be visible and recoverable; do not report success before the public state is confirmed.
- Preserve a clear distinction between draft and published versions so public visitors cannot receive incomplete work.

Verify the exact lifecycle implementation and state names in the current repository before changing it.

---

## 9. Image management and Image Studio

Image processing must improve presentation quality without changing the reality represented by a client image.

### 9.1 Approved operation scope

The seven approved Image Studio operations are:
1. Improve Clarity
2. Improve Sharpness
3. Reduce Noise
4. Upscale
5. Classic Look
6. Modern Look
7. Web Optimize

The canonical detailed specification is `docs/BUILD_IMAGE_STUDIO_REBUILD.md`. Read it alongside this architecture document before changing Image Studio. Do not replace its operation definitions, parameters, limits, or UX with a new interpretation.

### 9.2 Image safety and lifecycle

- Preserve the original upload as an immutable source.
- Store processed output as a separate variant.
- Do not overwrite the original with processed output.
- Show a genuine before/after comparison using the actual original and processed assets.
- Keep variant creation, user approval, and publishing as separate states/actions.
- Serve only approved/published variants through public website routes.
- Validate file type using content inspection where feasible, not just filename extension or client-supplied MIME type.
- Enforce the currently approved size, pixel-count, and batch limits from the canonical Image Studio specification.
- Handle corrupt, unsupported, oversized, or failed processing inputs without exposing provider internals.
- Verify that storage objects and URLs cannot be used to access another tenant's private assets.

The specification currently records JPG/JPEG/PNG/WebP, a 10 MB per-image limit, 25 MP, batch size up to 10, and Balanced as the default preset with Light/Balanced/High choices. Treat these as **specification values to verify in code and tests**, not proof of current enforcement.

### 9.3 Processing reliability

- Apply bounded execution timeouts and resource limits.
- Avoid blocking request threads on long-running work when the existing architecture provides an appropriate asynchronous pattern.
- Ensure retries do not create uncontrolled duplicate variants.
- Track processing state and failures only using the existing approved model unless a new persistence design is approved.
- Do not introduce generative image creation or operations outside the seven approved operations without explicit product approval.

---

## 10. AI-assisted content architecture

AI is contextual workflow assistance, not an autonomous product operator.

### 10.1 Allowed behavior

The approved contextual content actions are:
- Improve Wording
- Make More Professional
- Make Shorter
- Make Clearer
- Improve Service Description
- Custom Instruction

Use these only in their approved contexts. Confirm the exact current UI labels and operation contracts against `docs/PRD.md` and the repository.

### 10.2 Required safeguards

- Provide only the minimum relevant business context and content needed for the operation.
- Treat user content and uploaded material as untrusted input; instructions embedded in them must not override system safeguards or authorization.
- Instruct the model not to invent unsupported business facts.
- Validate response structure and length before presenting or saving it.
- Keep output editable and reviewable.
- Never let AI output directly trigger publication, external messaging, destructive data changes, or permission changes.
- Do not treat model-generated statements as verified business context.
- Handle provider unavailability and malformed output with a recoverable error and preserve the user's current draft.
- Avoid sending secrets or unnecessary personal data to a provider.
- Record only the minimum operational metadata required by the existing approved design.

AI request logging, retention, provider choice, and privacy obligations must be verified against current code/configuration and applicable agreements. This document does not authorize adding a new AI subsystem or agent runtime.

---

## 11. Lead management and business events

### 11.1 Lead creation sources

A Lead may be created by:
- A valid website enquiry form submission.
- A verified inbound WhatsApp event, only when that integration is configured and approved.

Other sources require explicit approval.

### 11.2 Event integrity

- Outbound WhatsApp launches, social links, page views, and ordinary navigation must not create or mutate Lead records.
- Do not inflate enquiry counts from clicks or tracking beacons.
- Validate and normalize incoming lead data server-side.
- Prevent duplicate processing when a trusted idempotency key or provider event identifier is available.
- Keep tenant ownership immutable unless an explicit, authorized workflow permits a change.
- Restrict access to lead personal information by tenant and role.
- Avoid including sensitive lead details in application logs or telemetry.

### 11.3 Contact Activity exclusion

Contact Activity is permanently decommissioned for V1. Do not restore behavior tracking, tracking pixels/beacons, a public tracking endpoint, or an Activity UI. Existing historical schema/data may remain for compatibility or retention. Any cleanup must be separately reviewed and approved.

---

## 12. Security architecture

Security is an end-to-end property; no single middleware, framework, or deployment setting is sufficient.

### 12.1 Minimum control areas

| Area | Required control | Verification evidence |
|---|---|---|
| Identity | Correct authentication configuration and lifecycle | Automated tests and environment review |
| Authorization | Server-side policies and resource checks | Positive and negative authorization tests |
| Tenant isolation | Ownership resolved server-side at every access path | Cross-tenant API, storage, and background-work tests |
| Input handling | Validation, bounds, safe serialization | Validation and malformed-input tests |
| Public endpoints | Rate limits, payload limits, abuse controls | Endpoint tests and runtime configuration review |
| Webhooks | Provider-authentic request verification | Invalid/missing/forged signature or token tests |
| Secrets | Managed environment/secret storage | Repository scan and deployment configuration review |
| Data | Least privilege, safe migrations, retention | Schema review and migration tests |
| Files | Type/size validation and private asset protection | Upload and cross-tenant storage tests |
| Logging | Redaction and restricted access | Log review with sensitive test data |
| Dependencies | Vulnerability and version review | Dependency scanning and update process |
| Transport | HTTPS and secure production configuration | Deployment/endpoint verification |
| Operations | Health, alerting, backup and recovery process | Runbook and restore evidence |

These are required controls, not claims of current implementation.

### 12.2 Threat scenarios to test

At minimum, test:
- Tenant A attempts to read, update, delete, upload, publish, or process Tenant B's resource.
- An unauthenticated user invokes an admin endpoint.
- A valid user invokes an operation beyond their permission.
- A forged or missing webhook credential attempts to create a lead.
- A public request supplies a fake tenant ID or website ID.
- A malicious or oversized file is uploaded.
- An AI response includes unsupported factual claims or malformed output.
- A replayed webhook or repeated request attempts duplicate lead creation.
- A provider failure occurs after partial work.
- Error responses or logs reveal secrets, internal paths, or another tenant's data.

### 12.3 Security change discipline

For security-sensitive changes:
1. Identify the trust boundary and affected use cases.
2. Write a failing negative test where practical.
3. Implement the narrowest fix.
4. Run targeted tests, then the relevant full suite.
5. Inspect logs and error responses for information leakage.
6. Record unresolved risk explicitly; do not mark the issue complete based only on code edits.

---

## 13. Observability and operations

### 13.1 Logging

Use the existing structured logging foundation if confirmed. Logs should help operators answer what failed, where, and for which request without exposing secrets or unnecessary personal data.

- Include a server-generated correlation/request ID.
- Include operation and component identifiers where useful.
- Avoid access tokens, webhook secrets, connection strings, full uploaded files, and unnecessary lead message content.
- Ensure client-supplied correlation values are validated and cannot inject arbitrary log structure.
- Use consistent error categories and preserve the original exception internally.

### 13.2 Health checks

Separate:
- **Liveness:** whether the process is running and able to continue.
- **Readiness:** whether required dependencies are available for serving the relevant workload.

Health endpoints must not reveal credentials, internal topology, database connection strings, or detailed provider errors. Verify existing endpoint semantics before changing monitoring configuration.

### 13.3 Failures and recovery

- Return safe, actionable errors to users.
- Keep internal diagnostics available to authorized operators.
- Use bounded timeouts for external calls.
- Retry only transient errors and only when retries are safe.
- Avoid retry storms and unbounded queues.
- Ensure failures preserve user drafts and do not falsely mark work as published or processed.
- Document operational recovery for failed migrations, provider outages, and interrupted image processing where those workflows exist.

### 13.4 Deployment readiness

Production readiness requires evidence beyond a successful local build:
- Environment-specific secrets and configuration are set correctly.
- HTTPS and domain routing are verified.
- Database backup and restore are tested.
- Migrations are reviewed and safely applied.
- Logs, health checks, and actionable alerts are available.
- Security tests and relevant automated suites pass.
- Critical workflows are exercised in the deployed environment.
- Rollback or recovery steps are documented and usable.

Do not claim deployment, SSL, backup, monitoring, or production configuration is verified unless it has actually been checked.

---

## 14. Testing architecture

Tests must verify behavior and security boundaries, not simply that methods execute.

### 14.1 Test layers

- **Unit tests:** domain invariants, validation, use-case decisions, and pure transformations.
- **Integration tests:** API behavior, EF Core persistence, migrations, and provider-adapter behavior using controlled dependencies.
- **Authorization/security tests:** authentication failures, permission failures, cross-tenant access, public endpoint restrictions, webhook verification, and upload validation.
- **Frontend tests:** critical form behavior, loading/error states, accessible interactions, and important route workflows using the repository's existing test framework.
- **End-to-end/UAT tests:** onboarding, content editing, image processing and approval, publishing, website enquiry, lead management, and configured inbound WhatsApp.

Do not add a new testing framework unless there is a clear gap and approval for the dependency.

### 14.2 Determinism and isolation

- Tests must not rely on ordering or shared persistent state.
- Use unique test data and deterministic cleanup/fixture ownership.
- Avoid running concurrent tests against the same mutable records unless concurrency is the behavior under test.
- External services should be mocked or replaced with controlled test doubles in ordinary automated tests.
- Keep separate tests for provider contract behavior where needed.
- Do not weaken or delete a failing test just to obtain a green build.

A prior audit reported two WebsiteContent integration failures in the full backend suite that passed when run in isolation, suggesting possible shared database state or concurrency. This report must be rechecked against the current code and test results. If reproducible, fix the isolation/root cause and preserve the assertions.

### 14.3 Required release evidence

For a production-bound change, record:
- Exact commands run and their exit codes.
- Relevant test counts and failures.
- Any skipped tests and the reason.
- Build/lint/type-check results applicable to the changed areas.
- Migration or configuration impact.
- Security scenarios exercised.
- Remaining blockers and unverified deployment requirements.

Never report a test, build, audit, or deployment step as passed unless it was actually run and its result observed.

---

## 15. Performance, reliability, and accessibility

### 15.1 Performance

- Measure before optimizing.
- Paginate or bound large collections.
- Select only required data and avoid unnecessary database round trips.
- Review query plans/indexes for demonstrably expensive paths.
- Limit upload sizes, image pixel counts, batch size, and processing duration according to the approved Image Studio specification.
- Avoid unbounded concurrency for image/AI provider calls.
- Optimize public website delivery without exposing private drafts or bypassing publication state.
- Use caching only with a correct tenant/content invalidation strategy; never risk serving one tenant's content to another.

### 15.2 Reliability

- Make externally retried operations idempotent when duplicates would cause harm.
- Preserve state when a provider fails.
- Avoid claiming success until the authoritative state transition is complete.
- Make partial failures diagnosable and recoverable.
- Do not introduce queues, distributed locks, caches, or extra services without an approved need.

### 15.3 Accessibility and responsive behavior

The design target is WCAG 2.2 AA, but conformance is not assumed. Validate relevant screens and workflows for keyboard access, visible focus, semantic structure, accessible names, form error association, color contrast, zoom/reflow, reduced motion, and assistive-technology behavior. Follow `docs/DESIGN.md` for approved visual tokens and interaction conventions.

---

## 16. Configuration, secrets, and environments

- Keep configuration external to source code and separate by environment.
- Never commit production credentials, API keys, private tokens, or connection strings.
- Validate required configuration at startup and fail safely when critical security settings are missing.
- Use least-privilege credentials for databases and providers.
- Rotate credentials through the approved operational process.
- Keep local development values distinct from production secrets.
- Avoid exposing server-only environment variables to browser bundles.
- Document configuration names and purpose without documenting secret values.
- Verify the actual secret manager, deployment environment, and rotation procedure; this document does not prescribe an unapproved vendor.

---

## 17. Architecture decision records and change control

For a material architecture change, record:
- Context and problem.
- Options considered.
- Decision and rationale.
- Security, tenant isolation, data, operational, and cost impacts.
- Migration/rollback plan.
- Tests and evidence required.
- Approval status.

Changes requiring explicit approval include:
- New product capability outside the approved PRD.
- New provider, paid service, middleware, or infrastructure platform.
- New database, separate service, queue, agent runtime, or major subsystem.
- Breaking API or domain contract changes.
- Destructive migrations or deletion of historical data.
- Changes to locked product scope or visual design authority.
- Generative image creation, autonomous publishing, unrestricted website building, or Contact Activity restoration.

Routine internal implementation changes may proceed when they preserve approved behavior, architecture boundaries, security, and contracts.

---

## 18. Explicit exclusions and locked boundaries

The architecture must not introduce these as V1 functionality without separate approval:

- A freeform website builder or unrestricted page-layout editor.
- Autonomous AI website generation or autonomous AI publishing.
- A separate AI-agent runtime or a new database for Sparovia Brain.
- A separate Action Center; Command Center remains the operational home after login.
- A Theme System product module. `docs/DESIGN.md` is the platform visual design authority, not a customer-facing Theme System feature.
- Contact Activity, behavioral tracking, tracking beacons, or a public tracking endpoint.
- Paid Meta API integration or unapproved WhatsApp middleware.
- Advanced CRM, billing, Super Admin, native mobile apps, advanced analytics, email automation, or unapproved integrations.
- Generative project-image creation or any Image Studio operation beyond the seven approved operations.

Future roadmap direction (V2–V5) is not permission to implement those capabilities now.

---

## 19. Current verification register

The following items must be verified against the current repository and deployment before this document is treated as a fully verified architecture map.

| Priority | Verification item | Required evidence |
|---|---|---|
| P0 | Confirm current repository structure and package/project versions | Current tree, solution/project files, package manifests |
| P0 | Verify server-side tenant resolution and cross-tenant enforcement | Code-path review plus negative integration/security tests |
| P0 | Verify WhatsApp webhook credential/signature validation | Current endpoint/service code and forged/missing-token tests |
| P0 | Verify authentication and authorization configuration | Configuration review and authentication/authorization tests |
| P0 | Re-run full backend suite and investigate reported integration-test isolation failures | Exact commands/results; root cause fixed without weakening tests |
| P1 | Verify public enquiry validation, abuse controls, and duplicate handling | Endpoint configuration and integration tests |
| P1 | Verify image originals/variants, approval, publication, and storage isolation | End-to-end tests and storage access review |
| P1 | Verify AI safeguards and draft-only behavior | Tests for unsupported facts, malformed output, provider failure, and no auto-publish |
| P1 | Verify migrations, constraints, indexes, backup/restore and deployment process | Migration review and operational evidence |
| P1 | Verify public content cannot expose drafts or private assets | Public-route and storage authorization tests |
| P2 | Verify accessibility, performance, logging redaction, alerting and recovery runbooks | Test reports, measurements, configuration and runbook review |

A prior audit reported frontend lint/build success, 150 backend unit tests passing, and 161 of 163 backend integration tests passing, with two WebsiteContent integration tests failing in the full suite but passing in isolation. These are historical reported results, not current release evidence. Re-run the exact repository commands and record the actual outcome.

---

## 20. Definition of Done for architecture-affecting changes

A change affecting architecture is complete only when all applicable criteria are met:

- [ ] The change is within approved product scope and has an identified user/business requirement.
- [ ] Existing behavior and relevant API contracts are preserved or explicitly approved for change.
- [ ] Layer boundaries and dependency direction remain valid.
- [ ] Tenant ownership is resolved and enforced server-side.
- [ ] Input validation, authorization, and failure behavior are covered.
- [ ] Database migrations are reviewed and non-destructive unless explicitly approved.
- [ ] Relevant unit, integration, security, and frontend tests pass.
- [ ] Test isolation is preserved; no tests are weakened to hide defects.
- [ ] Logs and responses do not expose secrets or unnecessary personal data.
- [ ] Documentation is updated in the same change when behavior or contracts change.
- [ ] Build, test, and lint commands and observed results are recorded accurately.
- [ ] Remaining risks and unverified deployment requirements are stated explicitly.

---

## 21. Related documents and authority

Read these documents together:

1. `docs/RULES.md` — project-wide operating rules and locked decisions.
2. `docs/PRD.md` — approved product scope and functional requirements.
3. `docs/DESIGN.md` — visual authority for Sparovia's own platform UI.
4. `docs/BUILD_IMAGE_STUDIO_REBUILD.md` — canonical detailed Image Studio specification.
5. Existing domain, API, UX, implementation, and locked-decision documents — use for detailed requirements after reconciling conflicts with the approved baseline.

If documents conflict:
- Follow the latest explicitly approved locked decision.
- Do not silently merge contradictory requirements.
- Record unresolved conflicts and ask for a decision when it changes product behavior, security, data, or public contracts.
- Do not delete or archive source documents until their unique content has been reconciled, replacement coverage has been checked, and retirement has been explicitly approved.

---

## 22. Final architecture statement

Sparovia should evolve as a secure, maintainable, multi-tenant application built on its existing .NET Clean Architecture and current frontend foundation. The priority is to verify and strengthen the actual implementation—especially tenant isolation, webhook authentication, test determinism, image/content lifecycle integrity, and production operations—before adding new subsystems or roadmap features.

This document establishes architectural intent and verification requirements. It does not claim that the repository has been modified, all controls are implemented, or the product is production-ready. Those claims require current source inspection, reproducible test evidence, and deployment verification.
