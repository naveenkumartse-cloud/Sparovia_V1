# Sparovia Design System

**Document:** `docs/DESIGN.md`  
**Status:** Approved design authority  
**Version:** 2.0  
**Purpose:** Define the visual, interaction, responsive, motion, accessibility, and UI quality standards for Sparovia's platform interfaces.  
**Scope:** Sparovia Admin Panel and shared platform UI, including forms, dialogs, content management, AI assistance, Image Studio, lead management, and related operational workflows.

> **Approval note:** This is the authoritative visual design specification for Sparovia's platform UI. It records approved design decisions; it is not a claim that the existing codebase or components already fully conform. Existing code, shared components, tokens, breakpoints, and behavior must be inspected before implementation. Do not claim production readiness or accessibility conformance until the relevant checks have actually passed.

---

## 1. Design intent

Sparovia should feel **modern, calm, premium, capable, and straightforward**. The interface should help a business owner complete a task confidently without needing to understand the platform's internal complexity.

The design system prioritizes:

1. **Clarity before decoration.** Visual hierarchy should make the next useful action obvious.
2. **Simple workflows.** Minimize unnecessary decisions, repeated entry, modal layers, and configuration burden.
3. **Consistency.** The same control or pattern should behave and look the same throughout the platform.
4. **Mobile-first usability.** Design for constrained screens first, then enhance the layout for wider viewports.
5. **Trustworthy feedback.** Communicate what happened, what is happening, and what the user can do next.
6. **Purposeful motion.** Use restrained animation to clarify state changes and provide feedback, never to obstruct work.
7. **Accessible operation.** Support keyboard, assistive technology, zoom, contrast needs, and reduced-motion preferences.
8. **Incremental implementation.** Improve the existing product without unnecessary rewrites or unapproved feature expansion.

A current design trend is not, by itself, a reason to add a pattern. Every visual or motion choice must serve comprehension, usability, consistency, or meaningful feedback.

## 2. Scope and authority

This document governs the visual and interaction design of Sparovia's platform UI. It is not a specification for a customer-facing Theme System or a freeform website builder.

### 2.1 Authority

- This document is the visual-design authority for Sparovia's platform UI.
- `docs/RULES.md` governs project-wide implementation rules and change control.
- `docs/PRD.md` governs approved product scope and user outcomes.
- `docs/ARCHITECTURE.md` governs technical architecture.
- `docs/BUILD_IMAGE_STUDIO_REBUILD.md` supplies the detailed Image Studio workflow requirements; it must remain consistent with this design system.
- Existing API, domain, storage, authentication, tenant isolation, and publishing contracts must not be changed merely to achieve a visual redesign.
- If a design request conflicts with a locked product or security decision, preserve the locked decision and record the conflict for review.
- Do not silently modify other source-of-truth documents as part of a DESIGN.md task.

### 2.2 Scope exclusions

This document does not authorize:

- A customer-facing Theme System or a new website builder.
- New product modules, providers, databases, background services, or agent runtimes.
- Autonomous AI publishing or automatic publication after image enhancement.
- New social publishing integrations or paid Meta API/middleware.
- A full application rewrite or unrelated backend refactoring.
- A claim of production readiness without evidence from implementation and testing.

## 3. Brand identity and visual foundations

### 3.1 Locked brand decisions

The following decisions are preserved from the approved design baseline:

- **Primary brand color:** Editorial Cobalt `#315FEA`.
- **Secondary accent:** Restrained Purple `#7950B8`.
- **Primary typeface:** Inter, subject to verifying actual font loading, fallback behavior, licensing, and language coverage.
- **Logo:** Preserve the approved blue-to-purple SPAROVIA wordmark gradient and light-blue ADMIN badge.
- **Iconography:** Consistent, simple line icons. Do not use emoji as interface icons.
- **Shape language:** Use the defined radius hierarchy in Section 5. Pill-shaped buttons are prohibited.
- **Surface style:** Mostly white and neutral surfaces, flat by default, with restrained elevation.
- **Gradient policy:** The approved logo treatment is the exception. Do not add decorative purple gradients elsewhere without explicit approval.
- **Motion:** Restrained, purposeful, and respectful of reduced-motion settings.
- **WhatsApp integration indicator:** Reserved strictly for WhatsApp channel indicators (`#25D366`); never used as a general Sparovia brand color.

Do not reinterpret these decisions during implementation without explicit approval.

### 3.2 Color tokens

Use semantic tokens rather than scattering literal color values through components. These values preserve the approved design baseline; actual accessibility must be checked in the contexts where tokens are used.

| Token | Value | Intended use |
|---|---|---|
| `color.brand.primary` | `#315FEA` | Primary brand accent and primary actions |
| `color.brand.secondary` | `#7950B8` | Restrained secondary emphasis |
| `color.text.primary` | `#172033` | Main text and headings |
| `color.text.secondary` | `#475569` | Supporting text |
| `color.surface.main` | `#FFFFFF` | Main canvas and primary surfaces |
| `color.surface.supporting` | `#F3F6FA` | Supporting surface and grouped content |
| `color.surface.brand-tint` | `#F5F0FB` | Occasional purple-tinted emphasis |
| `color.border.subtle` | `#E3E7ED` | Low-emphasis dividers |
| `color.border.default` | `#CBD5E1` | Standard control boundaries |
| `color.border.strong` | `#64748B` | Stronger boundaries when needed |
| `color.action.primary` | `#315FEA` | Primary action default |
| `color.action.hover` | `#254EDB` | Primary action hover |
| `color.action.pressed` | `#1E40AF` | Primary action pressed |
| `color.focus.selected` | `#1D4ED8` | Focus/selected accent candidate; validate in context |
| `color.status.success` | `#15803D` | Success state |
| `color.status.warning` | `#B45309` | Warning state |
| `color.status.error` | `#B91C1C` | Error and destructive state |
| `color.status.info` | `#1D4ED8` | Informational state |
| `color.integration.whatsapp` | `#25D366` | Reserved strictly for WhatsApp channel indicators |

#### Color usage rules

1. Use cobalt for primary actions, not as decoration on every surface.
2. Use purple sparingly for secondary emphasis.
3. Keep most surfaces white or neutral.
4. Use semantic status colors only for their intended meanings.
5. Do not rely on color alone to communicate a state; pair color with text, iconography, or another clear cue.
6. Do not add palette colors without review.
7. Test actual foreground/background and non-text combinations. A token is not automatically accessible in every context.
8. Avoid low-contrast placeholder text and subtle borders that disappear on real devices.
9. Do not add shadows, glows, gradients, or colored backgrounds to make an otherwise unclear layout appear more polished.
10. WhatsApp green (`#25D366`) is reserved strictly for WhatsApp channel indicators and badges; it must never be used as a general Sparovia brand color.

#### Historical palette migration

The legacy specification `PILOT_V1_SPAROVIA_THEME.md` (which contained a previous palette with an orange primary CTA `#FF7043`, dark navy `#0B1220`, and legacy blue/purple accents) has been retired and removed from active documentation. The Editorial Cobalt palette above is the canonical, locked visual design authority for Sparovia's brand and platform UI. The valid requirement from the legacy specification reserving WhatsApp Green (`#25D366`) strictly for WhatsApp channel integrations has been incorporated into this design system.

## 4. Typography

### 4.1 Typeface

Use **Inter** as the primary typeface for Sparovia's platform UI. Inspect the actual implementation to confirm font loading and fallback behavior. Confirm font licensing, language coverage (including Tamil if required), and loading performance before selecting the production delivery method. Do not assume the font is already bundled or correctly loaded.

### 4.2 Hierarchy and scale tokens

Use a small, consistent type scale based on centralized tokens. The following is the intended design target; confirm the current token implementation before mapping it to code.

| Token | Role | Target size | Weight | Line height | Guidance |
|---|---|---:|---:|---:|---|
| `type.display` | Display / hero | 48–64 px, responsive | 600–700 | 1.05–1.15 | Scale display text responsively |
| `type.heading-1` | Page title | 28–36 px | 600–700 | 1.15–1.25 | One clear title per screen |
| `type.heading-2` | Section heading | 20–24 px | 600 | 1.2–1.3 | Group related tasks |
| `type.heading-3` | Panel/card heading | 16–18 px | 600 | 1.25–1.35 | Concise and scannable |
| `type.heading-4` | Sub-panel heading | 18 px | 600 | 1.3 | Grouped subsections |
| `type.body-large` | Lead body | 18 px | 400 | 1.5–1.65 | Introductory or emphasized body |
| `type.body` | Standard body | 14–16 px | 400 | 1.45–1.6 | Comfortable reading size |
| `type.supporting` | Form label / helper | 13–14 px | 500–600 | 1.4–1.5 | Directly associated with input |
| `type.metadata` | Compact metadata | 12 px minimum target | 400–500 | 1.4–1.5 | Secondary details; verify legibility |

These sizes are guidance, not permission to make all screens dense. Prefer readable body text and sufficient line height. Avoid using small text to fit an overloaded screen.

### 4.3 Typography rules

- Use sentence case for labels, headings, buttons, and helper text unless a brand mark requires otherwise.
- Use clear, concrete action labels such as “Save draft,” “Preview website,” and “Publish changes.”
- Avoid vague labels such as “Proceed” when the result can be named.
- Use short paragraphs, meaningful headings, and lists where they improve scanning.
- Keep labels and error messages close to their associated controls.
- Do not use all caps for routine UI labels.
- Do not use text styling as the only way to communicate state.
- Test at 200% browser zoom to ensure text does not clip or overflow unexpectedly.
- Do not use em dashes in website copy.
- Do not fabricate marketing claims, metrics, or trust signals to fill visual space.

## 5. Layout, spacing, and shape

### 5.1 Layout principles

- Establish one primary task per screen or clearly prioritized workspace.
- Use consistent alignment and spacing across related pages.
- Prefer a clear page title, concise supporting description when useful, main content, and a small set of relevant actions.
- Keep secondary actions visually secondary.
- Use whitespace to separate meaningful groups, not to hide missing content.
- Avoid nesting cards inside cards without a clear information-architecture reason.
- Avoid multiple competing primary buttons in the same action group.
- Keep important content and primary actions discoverable without excessive scrolling.
- Do not compress a desktop layout into a narrow viewport by simply shrinking columns.

### 5.2 Spacing

Use a consistent spacing scale based on the project's existing tokens. If no usable scale exists, propose and review a compact base scale before implementation rather than introducing a second token system. Keep related controls close together and separate unrelated groups clearly.

### 5.3 Radius hierarchy (locked)

| Token | Context | Radius |
|---|---|---:|
| `radius.indicator` | Small indicators and compact accents | 4 px |
| `radius.control` | Buttons and form controls | 6 px |
| `radius.panel` | Cards, grouped panels, popovers, and dropdowns | 8 px |
| `radius.dialog` | Dialogs and modals | 10 px |
| `radius.table` | Tables and data-dense structures | Minimal / square |

Pill-shaped buttons are prohibited. Do not arbitrarily round every element. Tables should remain minimal and square-edged where appropriate.

### 5.4 Elevation and borders

| Token | Value | Usage |
|---|---|---|
| `shadow.none` | `none` | Default for surfaces |
| `shadow.subtle` | `0 1px 2px rgb(23 32 51 / 6%)` | Select elements needing slight separation |
| `shadow.overlay` | `0 12px 32px rgb(23 32 51 / 16%)` | Floating overlays and dialogs where appropriate |

- Flat surfaces are the default.
- Use overlay elevation for dialogs and floating surfaces only when it communicates layering.
- Do not use shadows as decoration or stack several shadowed surfaces.
- Use borders and backgrounds to distinguish groups before adding elevation.

## 6. Responsive and mobile-first behavior

Responsive quality is mandatory across the whole product. Every route and complete workflow must be usable on mobile, tablet, laptop, and desktop. A responsive screenshot alone is not proof that a workflow works.

### 6.1 Design from the smallest viewport upward

- Start with a narrow mobile layout, then enhance it for wider screens.
- Inspect the repository's actual breakpoints and responsive utilities before choosing or changing breakpoint values.
- Use fluid widths and sensible maximum widths where appropriate.
- Prevent page-level horizontal overflow.
- Keep important actions reachable and clearly labeled.
- Allow long labels, business names, and user content to wrap without breaking the layout.
- Ensure dialogs fit within the viewport, including available vertical space, and that their content can be reached without trapping controls off-screen.
- Respect browser zoom and larger text settings.
- Do not hide essential functionality on mobile merely because it is harder to fit.

### 6.2 Mobile interaction rules

- Controls must have comfortable touch targets. Aim for at least 44 × 44 CSS pixels where practical; validate applicable accessibility requirements in context.
- Do not rely on hover to reveal essential actions.
- Place primary and destructive actions deliberately so they are not easily confused or accidentally tapped.
- Avoid tiny icon-only buttons for important actions. Provide accessible names and visible labels where needed.
- Keep form controls full-width when that improves mobile usability.
- Use mobile-appropriate alternatives for data-dense desktop layouts, while preserving access to the same underlying information and actions.
- Keep sticky action areas from covering content, inputs, or validation messages.
- Ensure on-screen keyboards do not obscure the active field or the action required to complete the task.

### 6.3 Required responsive audit coverage

At minimum, test these categories at narrow mobile, larger mobile, tablet, and desktop sizes:

- Global navigation, sidebars, menus, and account controls.
- Dashboards and overview cards.
- Forms, field groups, validation, dropdowns, date/time controls, and confirmation dialogs.
- Website content editor, AI assistance, draft saving, preview, and publish review.
- Image upload, batch upload, operation selection, before/after comparison, approval, rejection, replacement, and publishing.
- Leads and other dense lists or tables.
- Empty, loading, error, success, and permission-denied states.

The exact viewport matrix should be documented in the test report. Do not claim all breakpoints passed if only a subset was tested.

## 7. Interaction and component standards

Every interactive component must communicate its purpose and state consistently.

### 7.1 Required states

Where applicable, components must have intentional states for:

- Default
- Hover
- Focus-visible
- Pressed/active
- Selected
- Disabled
- Loading/busy
- Success
- Warning
- Error
- Empty/no result

Not every component requires every state. Implement only states meaningful to that component.

### 7.2 Buttons

#### Primary action
Use a solid cobalt background for the primary action in a workflow. Use the approved hover and pressed colors. Primary actions should describe the result, such as “Save draft” or “Publish website.”

#### Secondary action
Use a neutral surface, border, or text treatment according to importance. Do not style every action as primary.

#### Destructive action
Use a clear destructive treatment and confirmation when the action is consequential or difficult to reverse. Explain what will be removed or changed.

#### Button behavior
- Provide immediate pressed feedback.
- Prevent duplicate submissions while an operation is pending.
- Show a concise busy state without unexpectedly changing the button's width or causing layout shifts.
- Keep the label or accessible name meaningful.
- Disabled states must look unavailable and must not imply that clicking will work.
- Do not use animation as a substitute for a clear state.
- Never show a success state before the operation has succeeded.

### 7.3 Forms and validation

- Use persistent labels; placeholders are examples or hints, not replacements for labels.
- Mark required fields clearly and consistently.
- State constraints before submission when they are important.
- Validate on the appropriate schedule without producing noisy errors on every keystroke.
- Put error messages beside the relevant field and summarize form-level errors when useful.
- Preserve safe user input after validation or recoverable network errors.
- Clearly distinguish unsaved changes from saved changes.
- Prevent accidental loss of edits where feasible.
- Make keyboard order logical and associate errors with fields for assistive technology.
- Group fields by the user's mental model, not backend entity structure.
- Ask only for information needed for the current task.

### 7.4 Cards and grouped content

- A card should represent a meaningful item, action, or related group of information.
- Use a clear title, relevant content, and a limited number of actions.
- Do not make a whole card appear clickable if only one small region is interactive.
- If a whole card is clickable, expose a clear focus state and ensure nested buttons behave independently.
- Use hover elevation only on interactive cards and only where the device supports hover.
- Do not animate static information cards simply because an animation is possible.
- Avoid nested cards, decorative statistics, and excessive badges.

### 7.5 Navigation, tabs, menus, and tooltips

- Keep navigation labels recognizable and consistent.
- Indicate the current location clearly.
- Menus must support keyboard interaction and touch use.
- Tabs should represent related views within one context, not hide unrelated workflows.
- Tooltips must not contain essential information unavailable elsewhere.
- Avoid hover-only controls and interactions that cannot be completed on touch devices.
- Ensure popovers and menus remain within the viewport and do not obscure their own triggers or critical content.

### 7.6 Dialogs and confirmation flows

- Use a dialog only when the user needs to focus on a contained decision or task.
- Prefer an inline form or dedicated page when a dialog would be too tall or complex, especially on mobile.
- Avoid dialogs opened from dialogs.
- Keep titles, explanations, controls, and actions clearly ordered.
- Provide an obvious close/cancel action when safe.
- Manage focus when opening and closing; support Escape where appropriate.
- Prevent background interaction when modal semantics require it.
- Keep critical actions visible and reachable on small screens.
- Confirm destructive actions and irreversible publishing decisions when appropriate, not routine low-risk actions.
- Preserve unsaved data when a dialog is dismissed unexpectedly where feasible.

### 7.7 Notifications and status feedback

- Use inline feedback for field-specific errors.
- Use toast/snackbar-style notifications only for brief, non-blocking updates.
- Use persistent or inline messages for failures requiring action.
- Avoid duplicate notifications for one operation.
- Provide recovery steps when possible.
- Do not communicate success through color or animation alone.
- Do not show internal provider responses, raw exception messages, safety-classifier labels, or unfiltered model output to clients.

### 7.8 Tables and dense data

- Optimize for scanning, consistent alignment, clear headers, and concise actions.
- Use the simplest presentation that preserves the information and tasks.
- At narrow widths, choose a tested responsive treatment such as a focused column set or item cards; do not merely force the desktop table off-screen.
- Do not remove meaningful data without an approved product decision.
- Keep row actions discoverable and keyboard accessible.
- Empty states should explain the situation and the next useful step.

## 8. Motion system: restrained and premium

Motion should make Sparovia feel responsive and polished while keeping the product calm and efficient. **Use motion only when it communicates feedback, continuity, hierarchy, or a meaningful state change.**

### 8.1 Motion principles

1. Keep interactions fast and predictable.
2. Prefer opacity and small transforms over large movement or layout animation.
3. Avoid animation that delays access to an action or content.
4. Do not animate every component on initial page load.
5. Do not add motion solely to make a page look trendy.
6. Respect `prefers-reduced-motion`.
7. Provide the same information and capabilities when motion is reduced or disabled.
8. Avoid motion that causes layout shifts, disorientation, nausea, or unnecessary battery/CPU use.
9. Do not use cursor-following effects, decorative parallax, constant pulsing, or excessive bounce.
10. Test motion on real mobile-class performance where practical.

### 8.2 Timing guidance

These are design targets, not claims about current code:

| Interaction | Target duration | Guidance |
|---|---:|---|
| Press/hover feedback | 100–160 ms | Immediate, subtle |
| Focus/selection change | 100–180 ms | Clear, not theatrical |
| Small tooltip/menu transition | 120–180 ms | Avoid delaying availability |
| Dialog entrance/exit | 160–220 ms | Short fade with minimal movement |
| Card/list state transition | 160–220 ms | Only when it clarifies a change |
| Larger workflow transition | 180–260 ms | Use sparingly; do not block interaction |

Use a small shared set of easing curves. Prefer a standard ease-out for entrances and a standard ease-in for exits. Inspect existing motion utilities before creating new tokens. These duration targets must not be treated as a requirement to animate every interaction.

### 8.3 Approved motion patterns

#### Buttons
- A subtle color transition on hover.
- Immediate pressed feedback.
- A clear loading indicator for pending actions.
- No scaling that makes the control jump or changes surrounding layout.

#### Interactive cards
- Optional slight border/elevation change on hover for mouse/trackpad users.
- Short entrance motion only when it helps reveal a new result or meaningful grouping.
- No staggered entrance for large lists if it delays scanning or causes excessive motion.

#### Dialogs and popovers
- Short opacity transition and minimal vertical movement.
- Maintain correct focus management independently of the animation.
- Do not prevent keyboard access until an animation finishes.

#### Lists and state changes
- Brief visual transition when an item is added, removed, selected, or changes state.
- Preserve stable layout where possible.
- Avoid animated reordering that makes it difficult to track an item.

#### Scroll-based animation
- Use sparingly for optional content reveals, if they improve orientation.
- Do not hide essential controls or information until a scroll animation completes.
- Do not make scroll position control critical business logic.
- Avoid long-distance travel, parallax, pinned sequences, and large staggered cascades.
- Disable or simplify nonessential scroll motion under reduced-motion preferences.
- Admin workflows should generally prioritize immediate access over scroll theatrics.

#### Image Studio
- Use smooth but restrained transitions when switching operation or preview states.
- Make processing progress and completion explicit.
- Before/after comparison must remain controllable and usable without motion.
- Never animate an image in a way that implies an enhancement happened before a real output exists.
- Do not use an animation or success banner as proof of image-quality improvement.

#### Publishing and saving
- Use clear pending, success, and failure feedback.
- A status change may transition subtly, but the underlying server-confirmed state is authoritative.
- Motion must not imply that publication completed before the server confirms it.

### 8.4 Reduced motion

When the user agent indicates `prefers-reduced-motion: reduce`:

- Remove or greatly reduce nonessential movement, parallax, and scroll reveals.
- Avoid large transforms and animated scrolling.
- Keep status indicators understandable without motion.
- Preserve visible focus, state changes, and workflow continuity.
- Do not disable essential information or functionality.

### 8.5 Performance guardrails

- Avoid continuous animation loops unless they communicate an active process.
- Avoid expensive blur/filter effects and large animated shadows.
- Prefer CSS transitions for simple state feedback where appropriate.
- Avoid introducing a new animation library unless existing capabilities cannot reasonably meet the need and the change is approved.
- Check for layout shift, dropped frames, and excessive CPU usage on representative devices.
- Respect the existing framework and shared component architecture.

## 9. AI-assisted workflows

AI assistance must remain understandable, reviewable, and grounded in approved business information. Design must not hide uncertain or failed outcomes behind polished presentation.

### 9.1 Content assistance

- Keep AI assistance close to the field or content being edited.
- Make the action and selected task clear.
- Show the returned suggestion as editable content with an obvious accept, edit, or discard path.
- Preserve the current content until the user explicitly applies a suggestion.
- Explain meaningful failures in client-friendly language and provide retry or manual-edit paths.
- Do not display raw provider output, internal safety labels, JSON, stack traces, or implementation details.
- Never invent business facts. Apply the “No source, no fact” rule.
- Acceptance must update a draft, not publish the website automatically.
- Clearly distinguish a real result from loading, fallback, validation, and error states.

### 9.2 AI state language

Use client-friendly, specific status language such as “Preparing suggestion,” “Suggestion ready to review,” or “We couldn’t create a suggestion. Your original content is unchanged.” Use only language that accurately reflects the actual operation and verified state.

Do not expose internal labels such as “User Safety: safe” as the AI suggestion itself. A result must be validated and mapped to the expected response field before being displayed. If a response is invalid, handle it as an error rather than presenting internal metadata as usable content.

### 9.3 Human approval

- A suggestion is not an approved business statement until the user accepts it.
- A content draft is not public until the user explicitly publishes it.
- Avoid language or animation that makes approval appear to have happened automatically.
- Make the difference between “Apply suggestion,” “Save draft,” “Preview,” and “Publish” clear.

## 10. Image Studio design standards

Image Studio is an image-first workflow, but the interface must not become a complex image-editing application. Preserve the approved seven operations:

1. Improve Clarity
2. Improve Sharpness
3. Reduce Noise
4. Upscale
5. Classic Look
6. Modern Look
7. Web Optimize

This document defines presentation and interaction standards. `docs/BUILD_IMAGE_STUDIO_REBUILD.md` remains the detailed workflow specification and must be followed where consistent with locked product decisions.

### 10.1 Core experience

- Make the selected image the visual focus.
- Keep image identity, dimensions, file type, file size, current status, and relevant destination/slot easy to understand.
- Organize the seven operations in a compact, readable control group with clear labels.
- Explain options in plain language, not processing jargon.
- Show the actual result produced by the selected operation.
- Keep original and enhanced variant distinct and preserve the original.
- Make the before/after comparison easy to control using mouse, touch, and keyboard where applicable.
- Keep the primary next action clear: review, approve/reject, or publish as allowed by the actual workflow.
- Approval and publishing are separate decisions.
- Keep batch operations understandable and make per-image status visible.
- Preserve the ability to recover from processing failure without losing the original or leaving the rest of the product unusable.

### 10.2 Mobile behavior

- Give the image enough space to inspect details.
- Avoid placing a large image and a long operation list side by side at narrow widths.
- On mobile, stack preview and controls in a predictable order.
- Keep the primary action reachable without hiding comparison controls or status messages.
- Avoid horizontal scrolling for essential operations.
- Use a full-height or near-full-height panel only if it preserves safe-area space, scrolling, close controls, and access to all content.
- Ensure dialogs do not exceed the usable viewport height.
- Test touch comparison and ensure the control does not conflict with page scrolling.
- Do not make hover the only way to see an operation description or action.

### 10.3 Quality and status integrity

- A “completed” or “enhanced” status means the processing operation returned a valid output, not that a human has confirmed quality.
- Do not claim a measurable improvement unless a supported measurement exists.
- Keep operation status, review status, approval status, and publishing status distinct.
- Do not imply that visually similar before/after images are necessarily different or improved.
- If output validation or processing fails, show a clear error and preserve the original.
- Never use decorative progress to imply actual work is occurring when it is not.

## 11. Business Presence, content and public-site consistency

- Admin fields that are intended to appear on the public website must have an explicit and testable mapping to the public payload and rendered component.
- Labels should tell clients where information will appear when that is known.
- Do not promise that operating hours, schedule, announcements, social links, or other business details are public unless the data flow and rendering are verified.
- Distinguish saved admin data from published public content.
- Preview should represent the content that would be published, subject to clearly identified draft behavior.
- Show useful empty states when optional content is not configured.
- Do not render dead, malformed, placeholder, or unverified social links as if they were valid.
- Avoid making the client repeat information already available in approved Business Context unless confirmation is necessary.
- This design document does not authorize new social network publishing integrations.

## 12. Content, copy and empty states

- Use plain, direct language appropriate for business owners.
- Prefer one clear instruction over several competing helper paragraphs.
- Tell users what is needed, why it matters, and what happens next when that context is useful.
- Use specific action labels and describe consequences for important actions.
- Keep error messages calm and actionable.
- Avoid technical jargon unless the audience needs it.
- Avoid generic placeholder marketing copy, unsupported claims, fake testimonials, fabricated statistics, and meaningless filler.
- Empty states should explain why there is no content and offer the next useful action, where applicable.
- Loading states should communicate the operation underway without making unsupported time promises.
- Do not use a skeleton if the content is likely to appear immediately and the skeleton would add visual noise.
- Do not show fabricated sample data in a live client workspace.

## 13. Accessibility requirements

**Target: WCAG 2.2 AA for applicable criteria. This is a target, not a claim of achieved conformance.**

### 13.1 Required checks

- Text contrast against actual backgrounds.
- Non-text contrast for meaningful controls, boundaries, and focus indicators.
- Keyboard navigation and visible focus.
- Logical focus order and focus restoration after dialogs.
- Form labels, descriptions, and associated error messages.
- State communication that does not rely on color alone.
- Accessible names for icon-only controls.
- Appropriate semantics and announcements for loading, success, and errors.
- Touch target size and spacing where applicable.
- Responsive behavior at browser zoom and increased text size.
- Reduced-motion behavior.
- Usability with keyboard and representative assistive technology where available.

### 13.2 Focus and keyboard behavior

- Never remove the visible focus indicator without providing a clear replacement.
- Ensure every interactive action is keyboard reachable.
- Use semantic controls rather than clickable noninteractive elements where possible.
- Avoid keyboard traps except where a correctly implemented modal interaction requires focus containment.
- Ensure opening a dialog places focus appropriately and closing it returns focus to the initiating control when appropriate.
- Keyboard operation must not depend on hover.

### 13.3 Accessibility reporting

Report what was tested, the tools and viewport conditions used, failures found, and remaining limitations. Do not claim “WCAG compliant” or “fully accessible” based solely on automated linting or a visual review.

## 14. Performance and perceived speed

- Prioritize fast access to the main task.
- Avoid motion that delays interaction.
- Prevent layout shifts when loading fonts, images, content, or buttons.
- Reserve space for media when dimensions are known.
- Optimize image previews and thumbnails using existing application capabilities.
- Do not load a heavy animation or visual-effects dependency solely for polish.
- Provide useful feedback for slow network or processing operations.
- Keep retry behavior safe and avoid duplicate submissions.
- Verify actual performance with the tools available in the repository and report measurements honestly.
- Do not invent load-time targets or report performance improvements without measurement.

## 15. Content density and cognitive load

Sparovia serves business owners who need to manage their business presence, not learn a complex design tool.

- Show the most important information first.
- Prefer sensible defaults over asking clients to configure every detail.
- Reveal advanced options only when they are needed and the product scope supports them.
- Use progressive disclosure to reduce initial complexity without hiding essential controls.
- Avoid presenting every possible setting at once.
- Do not add explanatory panels that repeat visible labels.
- Keep repeated workflows consistent so users can transfer what they learned from one page to another.
- Use confirmations selectively; too many confirmations create fatigue.
- Avoid forcing users through unnecessary wizard steps.
- Do not add features or settings solely to make the interface appear sophisticated.

## 16. Prohibited patterns

Do not use:

- Pill-shaped buttons
- Decorative purple gradients outside the approved logo treatment
- Fake reviews, fabricated metrics, invented customer counts, or unsupported credibility claims
- Vague marketing headlines
- Em dashes in website copy
- Emoji icons
- Excessive scroll or cursor animations
- Generic AI-generated-looking photography or AI-slop copy
- Decorative effects without a clear purpose
- Excessive shadows or unnecessarily nested cards
- Unapproved changes to locked colors, typography, shapes, or elevation

## 17. Implementation rules

These rules govern design implementation now that this document is approved.

1. Inspect existing routes, shared components, tokens, responsive patterns, and tests before editing.
2. Reuse existing components and utilities when they satisfy the specification.
3. Identify the actual token source before implementing tokens. Do not assume that recommended token names already exist in code.
4. Avoid arbitrary inline color, spacing, radius, and animation values when a shared token is available.
5. Do not add a new UI, animation, or icon library without demonstrating a concrete need and obtaining approval when it changes dependencies.
6. Keep changes scoped to the approved workflow.
7. Preserve API contracts, authorization, tenant isolation, storage lifecycle, draft state, and publishing boundaries.
8. Do not use visual polish to mask a broken API, invalid AI result, failed image operation, or incorrect data flow.
9. Do not remove working functionality to simplify a screenshot or design.
10. Add or update tests for behavior affected by implementation.
11. Run relevant lint, type checks, production builds, unit tests, integration tests, and responsive/accessibility checks that the repository supports.
12. Review the final diff for regressions, duplicated components, unapproved scope, inaccessible states, and accidental token drift.
13. Report exact commands run and actual outcomes. Identify checks not run.
14. Do not call a screen production-ready based on appearance alone.

## 18. Design review and release checklist

Use this checklist for every significant screen or workflow update.

### Visual consistency
- [ ] Uses approved colors, typography, radii, surfaces, and iconography.
- [ ] Uses existing centralized tokens and shared components where available.
- [ ] Has a clear primary action and restrained secondary actions.
- [ ] Avoids unnecessary nested cards, badges, shadows, and decorative effects.
- [ ] Text is readable and labels are consistent.

### Mobile-first behavior
- [ ] Narrow mobile layout was tested.
- [ ] Larger mobile and tablet layouts were tested.
- [ ] Desktop layout was tested.
- [ ] No page-level horizontal overflow or clipped controls.
- [ ] Dialogs and menus fit the usable viewport.
- [ ] Touch users can complete every essential action.
- [ ] Keyboard appearance and text scaling do not hide critical actions.
- [ ] No essential action depends on hover.

### Interaction and workflow
- [ ] Default, focus, pressed, disabled, loading, success, and error states were reviewed where applicable.
- [ ] Duplicate submissions are prevented where needed.
- [ ] Errors explain recovery steps where possible.
- [ ] Saved, draft, approved, and published states are not confused.
- [ ] Destructive actions are appropriately guarded.
- [ ] User input is preserved after recoverable failures where feasible.
- [ ] Public-facing outcomes match the verified underlying data flow.

### Motion
- [ ] Motion is purposeful, restrained, and consistent.
- [ ] Motion does not delay important actions or shift layout unexpectedly.
- [ ] Reduced-motion behavior is implemented and checked.
- [ ] No excessive scroll reveal, parallax, bounce, or continuous decoration.
- [ ] Processing and publishing animations reflect real operation states.

### Accessibility and performance
- [ ] Contrast was checked in actual states.
- [ ] Keyboard navigation and focus were tested.
- [ ] Labels and error associations were reviewed.
- [ ] Status messages are not communicated by color alone.
- [ ] Representative zoom/text scaling was checked.
- [ ] Relevant performance checks were run and results recorded.
- [ ] Automated and manual test limitations are documented.

### Regression and evidence
- [ ] Existing functionality and contracts were preserved.
- [ ] Relevant automated tests passed, or failures are clearly documented.
- [ ] Production builds and lint/type checks were run where available.
- [ ] Screenshots or a concise evidence report cover key breakpoints and states.
- [ ] Remaining defects are listed; no unsupported readiness claim is made.

## 19. Decision register

| Decision ID | Topic | Status |
|---|---|---|
| `LOGO-001` | Approved SPAROVIA logo treatment | LOCKED |
| `THEME-COLOR-001` | Editorial Cobalt palette | LOCKED |
| `THEME-TYPE-001` | Inter typeface | LOCKED |
| `THEME-TYPE-002` | Typography scale | LOCKED, implementation/loading verification remains open |
| `THEME-SURFACE-001` | Surface and border hierarchy | LOCKED |
| `THEME-SHAPE-001` | Corner-radius hierarchy and no pill buttons | LOCKED |
| `THEME-ELEVATION-001` | Flat default and restrained shadow tokens | LOCKED |
| `THEME-GRADIENT-001` | Gradient restrictions | LOCKED |
| `THEME-ICON-001` | Consistent line icons; no emoji icons | LOCKED |
| `THEME-INTERACTION-001` | Consistent interaction-state requirements | LOCKED |
| `THEME-MOTION-001` | Restrained motion and reduced-motion support | LOCKED |
| `RESPONSIVE-001` | Mobile-first, all-workflow responsive requirement | DESIGN REQUIREMENT |
| `ACCESSIBILITY-001` | WCAG 2.2 AA target, verification required | TARGET; NOT VERIFIED |
| `TOKEN-IMPLEMENTATION-001` | Actual token source and code mapping | OPEN: inspect repository |
| `FONT-IMPLEMENTATION-001` | Font loading, fallback, language coverage, performance | OPEN: inspect repository |
| `MOTION-IMPLEMENTATION-001` | Existing motion utilities and reduced-motion support | OPEN: inspect repository |
| `RESPONSIVE-VERIFICATION-001` | Route/workflow breakpoint test evidence | OPEN: execute tests |

## 20. Approval history

- **Phase 2–3:** Editorial Cobalt palette selected, refined, and locked.
- **Phase 4:** Inter and the typography scale locked.
- **Phase 5:** Surface hierarchy, radii, and shadows locked.
- **Phase 6:** Gradient, icon, interaction, and motion policies approved and locked.
- **Phase 7:** Consolidated theme specification prepared (Version 1.0).
- **Task T00:** Comprehensive platform design system specification approved as authoritative design baseline (Version 2.0).

## 21. Authority and change control

This document is the **approved visual design authority** for Sparovia's platform UI.

### Operating rules
- Use this document as the platform UI visual-design authority.
- Preserve locked decisions unless explicitly reopened by the product owner.
- Implement incrementally with evidence, automated tests, and regression protection.
- Propose changes to locked decisions separately for explicit approval.
- Update the decision register when a decision changes.
- Do not claim that the design system is fully implemented or verified in code until the relevant implementation and verification tasks have passed.

---

**Current status:** Approved design authority. Implementation, repository integration, and accessibility verification are to be executed through subsequent implementation tasks.
