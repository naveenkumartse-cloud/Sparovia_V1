
==================================================
SPAROVIA - MANDATORY RULES FOR EVERY IMPLEMENTATION
==================================================

These rules are mandatory for every current and future Sparovia task.

They take precedence over generic AI design preferences, trend-based recommendations, and unrequested improvements.

1. EXPLICIT AUTHORIZATION AND CHANGE CONTROL

- Never modify code, files, architecture, or application behavior without explicit authorization from the user.
- Before implementation, inspect the existing repository and relevant documentation.
- Implement only the changes explicitly authorized in the current task.
- Never redesign unrelated pages or components.
- Never remove existing features, fields, buttons, routes, APIs, database records, or workflows without explicit authorization.
- Never replace working functionality merely because another implementation appears more modern.
- Preserve existing behavior, business logic, integrations, and tenant isolation.
- Do not introduce unrelated features, dependencies, refactoring, or architectural changes.
- Check dependencies before removing or replacing files.
- Preserve unrelated user changes.
- If a requirement is unclear, preserve the existing behavior and report the ambiguity instead of making a destructive assumption.
- Do not deploy to production, modify production infrastructure, or perform destructive data operations without explicit authorization.

2. DESIGN QUALITY AND BRAND IDENTITY

Sparovia must look like a professionally designed, carefully engineered software product, not a generic AI-generated SaaS template.

The design must be modern, polished, restrained, consistent, accessible, and production-ready.

Use the approved Sparovia design system.

- Blue is the primary color.
- Purple is the secondary color.
- Orange is a restrained tertiary accent.
- Preserve approved brand assets, typography, spacing, shapes, and design tokens.
- Prefer solid colors, clear hierarchy, whitespace, readable typography, and purposeful interactions.
- Maintain a consistent design language across every page, form, modal, popup, table, and component.
- Reuse approved shared components instead of creating inconsistent alternatives.
- Do not introduce a new design system without authorization.

3. PROHIBITED DESIGN PATTERNS

Never introduce the following:

- Decorative purple gradients.
- Pill-shaped buttons.
- Fake reviews or testimonials.
- Fake customer counters.
- Fake metrics, analytics, statistics, or conversion figures.
- Fabricated customer information or business claims.
- AI-slop photographs or generic AI-generated-looking imagery.
- AI-slop marketing copy.
- Vague headlines, vague hero text, or meaningless descriptions.
- Emoji icons.
- Em dashes in website copy.
- Cursor-following animations.
- Excessive scroll animations or parallax effects.
- Animated gradients, unnecessary glowing effects, or excessive decoration.
- Unnecessary nested cards, shadows, badges, or decorative icons.
- Fake loading progress or fake success states.
- Unsupported AI claims, quality scores, or confidence percentages.

Do not chase design trends at the expense of Sparovia's identity, usability, performance, or consistency.

Make interfaces polished through excellent layout, typography, spacing, hierarchy, and interaction design, not visual gimmicks.

4. CONTENT AND DATA INTEGRITY

- Use clear, specific, accurate, professional copy.
- Never invent testimonials, reviews, customers, metrics, portfolio projects, or business results.
- Use real application data wherever the feature depends on business information.
- Use placeholders only when necessary, and never present placeholders as real customer content.
- Never claim an operation succeeded before the underlying operation succeeds.
- Never fabricate image enhancements, processing results, or metadata.
- Preserve original images, business records, and tenant ownership rules.
- Do not silently change customer-facing content or business meaning.

5. CODE QUALITY AND IMPLEMENTATION

- Follow the existing architecture and approved technical specifications.
- Prefer reusable components and centralized design tokens.
- Avoid duplicated implementations and unnecessary dependencies.
- Preserve API contracts and database behavior unless explicitly authorized to change them.
- Preserve authentication, authorization, security, and tenant isolation.
- Do not weaken validation or remove tests to make builds pass.
- Inspect the impact of changes across the application.
- Verify related screens and workflows after modifying shared components.
- Run relevant builds, lint checks, and tests.
- Report actual results, failures, and unresolved issues.
- Never claim implementation or verification that did not happen.

6. PUBLIC WEBSITE LAUNCH BLOCKERS

Sparovia's public website must not be declared ready for launch until every applicable requirement below has been completed and verified:

- A custom domain is connected and verified.
- A proper favicon is configured and verified.
- Any unwanted "Made with AI" tag has been removed.
- A Privacy Policy page is published and accessible.
- A Terms and Conditions page is published and accessible.
- The public website has been checked for broken links and obvious defects.
- No fake reviews, fake metrics, fabricated customer counters, AI-slop photos, or unsupported claims remain.
- Required production configuration and essential user-facing workflows have been verified.

Do not claim launch readiness while any mandatory launch blocker remains unresolved.

Do not modify domain settings, production configuration, or deployment infrastructure without explicit authorization.

7. ANIMATION POLICY

Polish the design system, forms, popups, and page layouts before introducing a broader animation system.

Animations must be implemented only when explicitly authorized.

When authorized, animations must be purposeful, restrained, performant, accessible, and compatible with reduced-motion preferences.

Never add cursor-following animations, excessive scroll effects, decorative motion, or animation that interferes with usability.

8. REQUIRED WORKFLOW FOR EVERY TASK

Before making changes:

1. Read `docs/PROJECT_RULES.md`.
2. Read the relevant approved specifications and `docs/DESIGN.md`.
3. Inspect the existing implementation and dependencies.
4. Identify the exact scope authorized by the user.
5. Preserve all unrelated functionality.

During implementation:

1. Change only the authorized scope.
2. Reuse the existing architecture and shared components.
3. Preserve data, security, integrations, and working workflows.
4. Avoid unrequested redesigns and destructive changes.
5. Verify affected screens and related functionality.

Before completion:

1. Run the relevant builds, tests, and checks.
2. Review the complete diff for unauthorized changes.
3. Confirm which requirements passed and failed.
4. Report remaining issues and unverified behavior.
5. Never claim completion without evidence.

If a task cannot be completed safely within the authorized scope, stop the affected change and explain the blocker. Do not silently expand the scope.

==================================================
END OF MANDATORY SPAROVIA RULES
==================================================
