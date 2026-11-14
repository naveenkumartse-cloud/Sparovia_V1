---
name: sparovia-engineering-standards
description: Enforces Sparovia's approved product scope, architecture, design system, multi-tenant security, development rules, testing standards, performance requirements, and evidence-based engineering. Use before planning, implementing, reviewing, testing, refactoring, or optimizing any Sparovia feature.
---

# SPAROVIA ENGINEERING STANDARDS (`sparovia-engineering-standards`)

## 1. Primary Authority and Role

This skill governs all engineering and architecture tasks across the Sparovia platform. It enforces mandatory rules derived from `docs/RULES.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `docs/MEMORY.md`, and `docs/SPAROVIA_MASTER_PRODUCT_BLUEPRINT.md`.

Before planning, writing, reviewing, testing, or refactoring code for Sparovia, verify every planned action against the standards below.

---

## 2. Product and Architecture

- **Platform identity:** Sparovia is a **Business Experience Platform**. Maintain this identity consistently.
- **Scope preservation:** Preserve the approved V1 product scope:
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
- **Controlled experience:** Do not turn Sparovia into an unrestricted drag-and-drop website builder or a CMS code editor.
- **Backend architecture:** Preserve the existing .NET backend (ASP.NET Core on .NET 9.0).
- **Design principles:** Preserve Clean Architecture and SOLID principles. Maintain explicit layer separation:
  - `Domain` remains free of external dependencies, frameworks, and HTTP types.
  - `Application` coordinates use cases, orchestrates validation, and defines domain-adjacent interfaces.
  - `Infrastructure` implements database persistence (PostgreSQL via EF Core), external adapters, and services.
  - `API` handles HTTP routing, authentication/authorization enforcement, request validation, and status code mapping.
- **Organization:** Preserve established feature-first organization where established in the codebase.
- **Persistence:** Preserve Supabase PostgreSQL and Entity Framework Core. Keep schema migrations additive and reversible.
- **Multi-tenancy:** Preserve the shared multi-tenant architecture. Every tenant-owned resource must have a verifiable tenant boundary.
- **Component and service reuse:** Reuse existing services, components, APIs, and contracts before creating new abstractions.
- **No over-engineering:** Do not introduce unnecessary abstractions, duplicate services, or speculative infrastructure.
- **Roadmap control:** Do not implement future roadmap features (e.g., V2 Business Intelligence, V3 Workflow Automation, V4 AI Copilot, V5 Agentic Business OS, or standalone Sparovia Brain runtimes) without explicit approval.

---

## 3. Multi-Tenancy and Security

- **Server-side tenant enforcement:** Enforce tenant ownership and authorization on the server for every tenant-owned resource and operation.
- **Zero client trust:** Never trust client-supplied tenant identifiers (e.g., `TenantId` in request bodies or query params) or assume resource ID possession implies authorization.
- **No direct database access:** Never access the database directly from the frontend; all persistence happens via the ASP.NET Core API.
- **Authentication & authorization:** Preserve authentication and authorization policies across all protected endpoints.
- **Secret protection:** Protect secrets, API keys, and credentials. Never commit them to Git or expose them in client bundles, public logs, or error responses.
- **Public endpoint validation:** Strictly validate public endpoint inputs (e.g., website enquiry submissions) and apply rate limiting and abuse controls.
- **Webhook verification:** Verify webhook authenticity (e.g., inbound WhatsApp tokens and signatures) server-side before processing payloads. Reject unverified requests immediately.
- **Cross-tenant denial:** Prevent cross-tenant access across all CRUD operations, uploads, image variant processing, exports, and background tasks. Negative cross-tenant authorization must be tested explicitly.
- **Draft/published separation:** Strictly preserve draft/published separation. Public runtime endpoints must only expose published content; draft content and unpublished image variants must never leak.

---

## 4. AI and Media Engineering

- **No source, no fact:** AI must not fabricate years in business, qualifications, certifications, awards, accreditations, warranties, testimonials, client names, project metrics, or unsupported business claims. Missing information must be requested, omitted, or flagged.
- **Human review:** AI output must remain reviewable. Present suggestions as drafts awaiting explicit user review and acceptance.
- **Draft updates only:** Accepting AI suggestions updates editable drafts only. AI must never autonomously publish content.
- **Explicit publication:** Publishing requires a separate, deliberate user action.
- **Image immutability:** Preserve original uploaded images immutably. Never overwrite original assets during enhancement or optimization.
- **"Improve quality, not reality":** Follow the core Image Studio doctrine. Processing must not materially alter or misrepresent the photographed subject, architecture, materials, products, or project completion.
- **Approved operations only:** Maintain the approved Image Studio operation suite:
  1. Improve Clarity
  2. Improve Sharpness
  3. Reduce Noise
  4. Upscale
  5. Classic Look
  6. Modern Look
  7. Web Optimize

---

## 5. UI/UX and Platform Design Standards

- **Design authority:** Follow `docs/DESIGN.md` for all Sparovia platform UI.
- **Design tokens:** Reuse locked design tokens:
  - Primary Brand Accent: Editorial Cobalt (`#315FEA`)
  - Secondary Brand Accent: Restrained Purple (`#7950B8`)
  - Status Success: `#15803D`, Warning: `#B45309`, Error: `#B91C1C`, Info: `#1D4ED8`
  - WhatsApp Indicator: `#25D366` (strictly reserved for WhatsApp channel indicators)
- **Shape hierarchy (locked):**
  - `radius.indicator`: 4 px (compact indicators)
  - `radius.control`: 6 px (buttons and form inputs)
  - `radius.panel`: 8 px (cards, popovers, grouped panels)
  - `radius.dialog`: 10 px (modals and dialogs)
  - Tables: square-edged / minimal radius
  - **Pill-shaped buttons are prohibited.**
- **Consistency:** Keep interaction patterns, forms, dialogs, validation feedback, and empty/loading/error states consistent across all screens.
- **Responsive & accessible:** Implement mobile-first interfaces responsive across 320px, 375px, 768px, 1024px, 1280px, and 1440px. Ensure keyboard navigation, visible focus indicators, and accessible labels.
- **Restrained motion:** Use purposeful animations (e.g., subtle drawer, dialog entrance/exit) via existing Framer Motion. Respect `prefers-reduced-motion`. Prevent modal shaking and layout shifts.
- **No customer-facing Theme System:** Do not introduce a customer-facing Theme System feature. `DESIGN.md` governs Sparovia's own platform UI.
- **Decommissioned Contact Activity:** Do not restore Contact Activity UI, tracking beacons, or public tracking endpoints.

---

## 6. 3D Engineering Standards

- **Purposeful 3D:** Use 3D graphics (Three.js / React Three Fiber) only where it enhances a genuine product experience (e.g., interactive product visualizer or spatial showcase).
- **Lazy loading:** Always lazy-load 3D components and dynamic canvas containers (`next/dynamic` with `ssr: false`).
- **Non-blocking rendering:** Never block initial page rendering, core business workflows, or administrative forms with 3D scene initialization.
- **Optimization:**
  - Optimize 3D models (use Draco / Meshopt compression on GLTF/GLB).
  - Power-of-two textures with compressed formats (KTX2 / WebP).
  - Minimize draw calls (instanced meshes, merged static geometries).
  - Limit pixel ratio (`Math.min(window.devicePixelRatio, 2)`).
- **Resource cleanup & disposal:** Explicitly dispose of geometries, materials, textures, and render targets on component unmount to prevent WebGL memory leaks.
- **Graceful fallbacks:** Provide a clean, accessible 2D fallback or static image when WebGL is unavailable or fails context creation.
- **Accessibility & motion:** Respect reduced-motion preferences (`prefers-reduced-motion`) by halting continuous rotation, orbit controls, or complex camera transitions.
- **Admin restraint:** Avoid placing heavy 3D scenes on ordinary administrative screens, settings, tables, or forms without explicit architectural approval.

---

## 7. Testing and Verification Discipline

- **Inspect first:** Always inspect existing tests before modifying code.
- **New behavior coverage:** Add unit, integration, or E2E tests for every new behavior or bug fix.
- **Preserve existing tests:** Never delete, skip, weaken, or suppress existing tests or assertions to obtain a green result.
- **Browser automation:** Use Playwright CLI and Playwright E2E tests for critical user journeys:
  - Authentication and login
  - Onboarding and Business Context setup
  - Content editing, draft saving, and deliberate publishing
  - Image upload, enhancement review, and publishing
  - Lead intake and verified inbound webhooks
- **Backend testing:** Use the existing .NET test framework (xUnit, `Microsoft.AspNetCore.Mvc.Testing`, `Microsoft.EntityFrameworkCore.InMemory` / TestContainers).
- **Security test verification:** Explicitly test tenant authorization and cross-tenant access denial (negative authorization tests).
- **Edge cases:** Test validation failures, empty states, network errors, and retry behaviors.
- **Honest reporting:** Run the actual builds, linting, and test suites. Record exact commands and observed outputs. Never report unexecuted checks as passed.

---

## 8. Performance and Resource Management

- **Evidence-based optimization:** Measure with concrete metrics before optimizing; do not guess bottlenecks.
- **Dependency discipline:** Do not add redundant or unvetted npm packages or NuGet libraries.
- **API efficiency:** Avoid duplicate API calls, N+1 database queries, and unindexed filter lookups.
- **React rendering:** Prevent unnecessary re-renders; isolate high-frequency state updates; use memoization judiciously.
- **Media delivery:** Optimize images (Next.js Image component, responsive sizing, modern formats).
- **Code splitting:** Lazy-load non-critical routes and heavy client components.
- **Memory safety:** Prevent memory leaks in long-lived browser sessions and backend background services.
- **No fake metrics:** Do not invent latency, throughput, or performance scores without real profiling evidence.

---

## 9. Engineering Workflow Protocol

### Before making changes:
1. **Inspect Git status:** Verify clean branch or identify existing uncommitted work.
2. **Read relevant documentation:** Review PRD, ARCHITECTURE, RULES, DESIGN, and domain specifications.
3. **Inspect actual implementation:** Read existing files, types, and database models.
4. **Identify existing contracts:** Map API endpoints, DTOs, interfaces, and component props.
5. **Define scope and acceptance criteria:** Limit work strictly to the approved task.
6. **Identify security & data implications:** Assess multi-tenant boundaries and migration safety.

### After making changes:
1. **Review complete diff:** Check `git diff` for unintended modifications, extraneous formatting, or secret leakage.
2. **Run relevant verification:** Execute build, lint, unit tests, integration tests, and browser tests.
3. **Record actual outcomes:** Document exact commands run and output observed.
4. **Document residual risks:** State any unverified edge cases or deployment requirements.
5. **Update documentation:** Update documentation only when evidence supports the change.
