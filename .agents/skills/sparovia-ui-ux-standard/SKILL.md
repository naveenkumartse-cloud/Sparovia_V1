---
name: sparovia-ui-ux-standard
description: Authoritative Sparovia UI/UX design and verification standard. Enforces the locked Editorial Cobalt design system, component reuse, mobile-first responsiveness (320px–1440px), modal stability, restrained motion, accessibility, and CDP browser audit gates across the Sparovia Admin and Public interfaces, specifically governing Images library and Image Studio.
---

# SPAROVIA UI/UX DESIGN & VERIFICATION STANDARD (`sparovia-ui-ux-standard`)

## 1. Role & Scope

Act as a Senior SaaS Product Designer, Frontend Architect, Design Systems Engineer, Accessibility Specialist, and Browser-Based UI Quality Auditor.

This skill establishes a consistent, enforceable standard for implementing, reviewing, and verifying the Sparovia admin and public interfaces.


### 2. Understand the Existing Project First

Before creating files, inspect:

- `docs/RULES.md`
- `docs/DESIGN.md`
- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/TASKS.md`
- `skills-lock.json`
- `.agents/skills/`
- Existing shared components under `apps/admin/components/ui/`
- Existing UI components and design tokens in `apps/admin/tailwind.config.ts`
- Existing browser audit scripts under `scripts/`
- The existing Images, Image Studio, Leads, Account/Integrations, and responsive navigation implementations.

Read the actual relevant skill files rather than relying on their names.

Inspect the current Git status and preserve all existing user changes. Do not overwrite, revert, or discard unrelated work.

### 3. Create the Skill

Create:

`.agents/skills/sparovia-ui-ux-standard/SKILL.md`

Follow the repository's existing skill conventions. Inspect neighboring `SKILL.md` files to determine the correct frontmatter, naming, and instruction format.

The skill must contain the following sections.

### 4. Mandatory Design Principles

#### A. Locked Sparovia design system

Use the existing approved design system:

- Primary Editorial Cobalt: `#315FEA`
- Restrained Purple: `#7950B8`
- WhatsApp Green: `#25D366`, reserved for appropriate WhatsApp actions and indicators.
- Existing typography, spacing, border, radius, elevation, and surface tokens.
- Inter typography where already established by the project.
- Existing shared components before introducing new components.

Rules:

- No pill-shaped buttons.
- No decorative gradients or random accent colors.
- No inconsistent icons, typography, spacing, borders, or button treatments.
- No customer-facing Theme System.
- No parallel design system or duplicated component library.
- No unnecessary dependencies or animation libraries.

Use the actual existing project tokens and components. Do not invent replacement tokens or silently change locked values.

#### B. Modern SaaS product design

The skill must guide implementation toward a polished, coherent, professional SaaS experience rather than a traditional admin template.

Require:

- Clear page hierarchy and meaningful page headings.
- Consistent primary, secondary, and destructive actions.
- Balanced card density, readable content, and intentional whitespace.
- Clear grouping of related information.
- Consistent forms, field labels, validation, helper text, and errors.
- Consistent loading, success, empty, error, and confirmation states.
- Context-appropriate actions without unnecessary visual clutter.
- Clear mobile and desktop information hierarchy.
- Consistent interaction patterns across all in-scope modules.

Do not blindly replace every table with cards. Choose the appropriate presentation for the workflow. Where Sparovia has explicitly approved a card-first Leads experience, preserve that decision.

### 5. Shared Component Reuse

Before adding or changing a component, inspect the existing shared implementation.

Reuse and standardize existing components wherever appropriate:

- Button
- Card
- Modal
- Input
- Select
- Textarea
- Badge
- FormField
- PhoneInput
- Skeleton
- Toast
- EmptyState
- ErrorState

If a shared component is missing a necessary capability, explain the gap and implement the smallest compatible improvement.

Do not create duplicate components simply to make one page look different.

A shared component change must be checked against all affected consumers. Do not make a global change that unexpectedly breaks unrelated pages.

### 6. Card and Content Presentation Rules

For cards, require a clear hierarchy:

1. Main identity or image.
2. Primary information.
3. Secondary metadata.
4. Status and contextual indicators.
5. Primary action.
6. Secondary or destructive actions, appropriately separated.

Cards must not contain unnecessary empty space, repeated labels, excessive borders, or excessive nested containers.

For image cards:

- Present the image with a suitable aspect ratio and predictable cropping behavior.
- Keep project identity and image metadata readable.
- Distinguish the primary enhancement action from secondary actions.
- Keep publishing state visible.
- Provide accessible action names and confirmation for destructive operations.
- Preserve the original image and the existing enhancement approval and publishing boundaries.

For Leads:

- Preserve the approved card-first experience.
- Ensure customer details, status, source, and enquiry summary are easy to scan.
- Keep Call, WhatsApp, Edit, and Delete behavior consistent with the approved product rules.
- Do not create a new CRM or add unapproved lead-management features.
- Do not allow a table or card action to become inaccessible on smaller screens.

### 7. Forms, Dialogs, and Popups

Every form and dialog must follow a consistent standard:

- Clear title and concise description where useful.
- Predictable field spacing and alignment.
- Correct required-field indicators.
- Inline validation that explains how to fix errors.
- Clearly differentiated primary and secondary actions.
- Appropriate destructive-action confirmation.
- Keyboard access, visible focus, accessible labels, and sensible focus management.
- Responsive dimensions and internal scrolling when required.

#### Popup stability is mandatory

Investigate and prevent:

- Dialog shaking or repeated repositioning.
- Layout shifts when a request starts or finishes.
- Width or height jumps caused by loading states.
- Repeated mounting or unmounting during saving.
- Background scrolling when the dialog should be modal.
- Focus jumping unexpectedly.
- Duplicate submissions caused by repeated clicks.

Use stable dialog dimensions where appropriate, reserve space for dynamic feedback, and avoid unnecessary layout changes.

Do not hide real errors or introduce fake progress indicators to make the interface appear smoother.

### 8. Motion and Animation Standard

Use the existing Framer Motion installation only when it materially improves the interaction.

Appropriate examples include:

- Subtle card hover and press feedback.
- Small opacity or position transitions when content appears.
- Smooth mobile navigation drawer transitions.
- Dialog entrance and exit transitions.
- Clear feedback for a completed interaction.

Requirements:

- Motion must be restrained, consistent, and purposeful.
- Avoid excessive bounce, scale, parallax, animated decoration, and continuous movement.
- Respect `prefers-reduced-motion`.
- Do not animate large layouts in ways that delay interaction.
- Do not introduce motion that causes layout shifts or popup shaking.
- Loading indicators must reflect real application states.

The skill must explicitly distinguish animation polish from functional performance.

### 9. Mobile-First and Responsive Standard

Design and verify from small screens upward.

Required verification widths:

- 320px
- 375px
- 768px
- 1024px
- 1280px
- 1440px

Requirements:

- No unintended page-level horizontal overflow.
- No clipped primary actions, form fields, dialogs, or navigation.
- Appropriate mobile navigation and drawer behavior.
- Readable card layouts and responsive content density.
- Usable forms, selects, popups, and confirmation dialogs.
- Touch-friendly targets, aiming for at least 44 × 44 CSS pixels where practical.
- No hover-only functionality.
- Correct keyboard interaction and visible focus.
- Appropriate handling of long names, URLs, identifiers, and error messages.
- Responsive tabs and filters without hiding required functionality.

Internal scrolling is acceptable when appropriate, but it must not conceal critical actions or make a workflow difficult to use.

Do not declare mobile-first quality based solely on a responsive CSS breakpoint or a successful build.

### 10. Accessibility and Interaction Integrity

Target WCAG 2.2 AA practices where applicable, but do not claim conformance without sufficient testing.

Verify:

- Semantic headings and landmarks.
- Accessible names for icon-only buttons.
- Form labels and error associations.
- Keyboard navigation and focus visibility.
- Dialog focus handling and Escape behavior where appropriate.
- Sufficient contrast.
- Reduced-motion support.
- Appropriate status announcements and feedback.
- Disabled and pending states that reflect actual application behavior.

Preserve authentication, authorization, tenant isolation, API contracts, data integrity, and existing publishing rules.

### 11. Performance and Stability

The skill must require evidence-based performance investigation.

For slow pages or actions, distinguish among:

- Initial JavaScript and asset loading.
- API request duration.
- Client-side rendering and state updates.
- Image decoding and image delivery.
- Unnecessary component re-rendering.
- Repeated requests and duplicate submissions.
- Layout shifts and expensive animations.

Measure before optimizing. Do not introduce caching, background processing, API changes, or new infrastructure without establishing the problem and respecting the approved architecture.

For save, edit, delete, enhancement, and publishing workflows:

- Prevent duplicate submissions.
- Provide clear pending feedback.
- Reflect the actual server result.
- Update the UI efficiently after success.
- Preserve user input after recoverable errors.
- Avoid unnecessary full-page reloads.
- Do not claim an operation succeeded before it actually succeeds.

Do not sacrifice correctness or tenant security for perceived speed.

### 12. Mandatory Workflow for Every Future UI Task

The skill must instruct Antigravity to follow this workflow:

**Step 1 — Understand**

Read the relevant Sparovia rules and inspect the actual implementation. Identify the affected routes, components, API contracts, and user workflow.

**Step 2 — Establish the baseline**

Capture the current behavior and screenshots at relevant viewport sizes. Record existing defects before making changes.

**Step 3 — Define the intended outcome**

Describe the visual hierarchy, interaction behavior, responsive behavior, and acceptance criteria before editing code.

**Step 4 — Implement narrowly**

Modify only the necessary components and routes. Reuse shared components. Preserve unrelated changes and locked product decisions.

**Step 5 — Verify actual behavior**

Run the relevant automated checks and browser tests. Capture before/after screenshots and verify the actual interaction, not just the static appearance.

**Step 6 — Compare and correct**

Compare the implemented result with the stated acceptance criteria. If the visual outcome is not acceptable, continue fixing the specific defect rather than reporting success.

**Step 7 — Report honestly**

Report:

- Files changed.
- Actual behavior improved.
- Relevant tests and their actual results.
- Routes and viewport sizes tested.
- Screenshot or browser evidence.
- Remaining defects and risks.
- Any checks that could not be performed.

A successful build is necessary where relevant, but never sufficient evidence of UI quality.

### 13. Mandatory Visual Acceptance Gate

A UI task cannot be reported as visually complete merely because the code compiles.

Require evidence for:

- Visual hierarchy and component consistency.
- Desktop and mobile behavior.
- Form and dialog interaction.
- Loading, error, and success behavior where applicable.
- No unintended overflow or clipping.
- No regression in existing functionality.
- No unapproved feature or architecture changes.

If browser automation fails, report the limitation and use an available supported verification method. Never fabricate screenshots, test results, or browser evidence.

### 14. Existing Browser Audit Integration

Inspect and reuse the existing scripts where appropriate:

- `scripts/test-cdp-harness.mjs`
- `scripts/comprehensive-browser-audit.mjs`
- Other relevant existing audit scripts.

Do not duplicate the browser harness or add Playwright solely because it is popular.

Determine which checks the current harness actually supports. Extend it only if a concrete verification gap requires a small, compatible change.

Do not claim that DOM checks or overflow checks measure subjective design quality. Combine automated verification with actual visual review.

### 15. Locked Product Restrictions

The skill must explicitly preserve:

- Sparovia's existing V1 architecture and approved scope.
- No rebuild or speculative refactoring.
- No customer-facing Theme System.
- No new CRM or unapproved product modules.
- No unauthorized dependencies, providers, APIs, or database changes.
- Existing authentication, tenant isolation, and data contracts.
- Image Studio original-image preservation and explicit publishing approval.
- Existing approved WhatsApp and social integration boundaries.
- T03, T06, and T07 unless a concrete new defect is demonstrated.
- Existing user changes and unrelated work.

This skill provides implementation guidance; it does not authorize additional product features.

### 16. Skill Discovery and Activation Verification

After creating the skill:

1. Inspect the existing Antigravity skill discovery and loading conventions.
2. Verify the new directory and `SKILL.md` follow those conventions.
3. Inspect `skills-lock.json` and determine whether the new local skill requires registration. Follow the existing schema; do not invent a new format.
4. Use Antigravity's supported discovery or reload mechanism, if available.
5. Verify that the skill is actually recognized and can be loaded.
6. Confirm that a future UI task can explicitly invoke it.
7. If automatic activation is supported, explain its actual mechanism and scope. Do not assume that creating a skill makes it automatically active for every task.

Do not modify global Antigravity configuration, install external skills, or alter unrelated settings without explicit approval.

### 17. Verification Task — No Application Redesign

After creating the skill, validate it against one small, read-only example from the existing Images library.

The verification must demonstrate that the skill can:

- Identify the applicable locked design rules.
- Identify the relevant shared components.
- State the visual defects and responsive acceptance criteria.
- Specify the required browser evidence.
- Identify prohibited changes.

Do not edit application source files during this verification example.

### 18. Final Report

Return a concise report with these sections:

1. **Skill created:** exact path and files changed.
2. **Discovery status:** recognized, loaded, and how verified.
3. **Project rules covered:** design tokens, component reuse, motion, responsiveness, accessibility, performance, and scope restrictions.
4. **Verification results:** actual checks performed and results.
5. **Limitations:** anything not verified.
6. **Next recommended task:** a focused Images library and Image Studio visual correction task, with measurable acceptance criteria.

Do not begin that next implementation task.

### Final Instruction

Create the smallest complete, maintainable skill that makes the approved Sparovia design standards actionable and verifiable.

Do not add external skills in this task. Do not redesign the application. Do not claim activation or verification without evidence.

Finish the skill, report the result, and stop for review.