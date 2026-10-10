# Sparovia Design System

**Document:** `DESIGN.md`  
**Version:** 1.0  
**Status:** Approved theme specification  
**Scope:** Sparovia brand and platform UI  
**Last consolidated:** 2026-10-10

---

## 1. Purpose and scope

This document defines the approved visual design system for Sparovia's own brand and platform interface, including the Admin Panel.

It does **not** prescribe the visual design of tenant/client websites. Client websites retain their own design choices within Sparovia's supported customization capabilities.

This document records approved design decisions. It does not claim that the theme has been implemented, that existing source files have been updated, or that accessibility verification has passed.

## 2. Product design principles

Sparovia's interface must be:

- **Professional and distinctive:** avoid generic SaaS templates and AI-generated-looking design.
- **Clear:** prioritize readability, hierarchy, accessibility, and practical administration.
- **Controlled:** cobalt is the primary accent; purple is secondary.
- **Consistent:** shared components use common tokens and predictable interaction behavior.
- **Purposeful:** avoid decoration, gradients, motion, shadows, and nested cards without a clear function.
- **Responsive and maintainable:** support mobile, tablet, and desktop layouts through reusable design tokens.

## 3. Approved color tokens

The following values are locked by the latest explicit theme approval.

| Token | Value | Intended use |
|---|---|---|
| `color.brand.primary` | `#315FEA` | Primary brand accent |
| `color.brand.secondary` | `#7950B8` | Restrained secondary brand accent |
| `color.text.primary` | `#172033` | Main text and headings |
| `color.text.secondary` | `#475569` | Supporting text |
| `color.surface.main` | `#FFFFFF` | Main canvas and primary surfaces |
| `color.surface.supporting` | `#F3F6FA` | Supporting surface |
| `color.surface.brand-tint` | `#F5F0FB` | Occasional purple-tinted emphasis |
| `color.border.subtle` | `#E3E7ED` | Low-emphasis dividers |
| `color.border.default` | `#CBD5E1` | Standard control boundaries |
| `color.border.strong` | `#64748B` | Stronger boundaries when needed |
| `color.action.primary` | `#315FEA` | Primary button default |
| `color.action.hover` | `#254EDB` | Primary action hover |
| `color.action.pressed` | `#1E40AF` | Primary action pressed |
| `color.focus.selected` | `#1D4ED8` | Focus/selected accent candidate; validate in context |
| `color.status.success` | `#15803D` | Success feedback |
| `color.status.warning` | `#B45309` | Warning feedback |
| `color.status.error` | `#B91C1C` | Error and danger feedback |
| `color.status.info` | `#1D4ED8` | Informational feedback |
| `color.integration.whatsapp` | `#25D366` | Reserved strictly for WhatsApp channel indicators |

### Color usage rules

1. Use solid cobalt for primary actions and selectively elsewhere.
2. Purple is secondary and should be used sparingly.
3. Keep most surfaces white or neutral.
4. Use semantic colors for their semantic meanings, not as decoration.
5. Choose border strength according to the importance of the boundary.
6. Do not introduce additional palette colors without approval.
7. Do not claim WCAG conformance until actual foreground/background and non-text combinations have been tested.
8. The approved logo gradient is a specific exception documented in Section 7. It does not authorize other gradients.
9. WhatsApp green (`#25D366`) is reserved strictly for WhatsApp channel indicators and badges; it must never be used as a general Sparovia brand color.

### Historical palette migration

The legacy specification `PILOT_V1_SPAROVIA_THEME.md` (which contained a previous palette with an orange primary CTA `#FF7043`, dark navy `#0B1220`, and legacy blue/purple accents) has been retired and removed from active documentation. The Editorial Cobalt palette above is the canonical, locked visual design authority for Sparovia's brand and platform UI. The valid requirement from the legacy specification reserving WhatsApp Green (`#25D366`) strictly for WhatsApp channel integrations has been incorporated into this design system.

## 4. Typography

### Primary typeface

- **Family:** Inter
- **Scope:** Sparovia brand and Admin Panel
- **Status:** Locked
- **Fallback, language coverage, licensing, and loading performance:** Open for verification before implementation

### Type scale

| Token | Size | Weight | Line height |
|---|---:|---:|---:|
| `type.display` | 48–64 px, responsive | 600–700 | 1.05–1.15 |
| `type.heading-1` | 36 px | 600–700 | 1.15–1.25 |
| `type.heading-2` | 28 px | 600 | 1.2–1.3 |
| `type.heading-3` | 22 px | 600 | 1.25–1.35 |
| `type.heading-4` | 18 px | 600 | 1.3 |
| `type.body-large` | 18 px | 400 | 1.5–1.65 |
| `type.body` | 16 px | 400–500 | 1.45–1.6 |
| `type.supporting` | 14 px | 400–500 | 1.4–1.5 |
| `type.metadata` | 12 px | 500 | 1.4–1.5 |

### Typography rules

- Use one primary family across headings, body text, forms, and tables.
- Preserve clear hierarchy among headings, body copy, labels, and metadata.
- Scale display text responsively.
- Test at 200% browser zoom.
- Verify required language/script coverage, including Tamil if required.
- Confirm font licensing and loading performance before selecting the production delivery method.

## 5. Surfaces and borders

### Surface hierarchy

| Token | Value | Usage |
|---|---|---|
| `color.surface.main` | `#FFFFFF` | Main canvas and primary surfaces |
| `color.surface.supporting` | `#F3F6FA` | Supporting regions |
| `color.surface.brand-tint` | `#F5F0FB` | Occasional brand emphasis |

### Border hierarchy

| Token | Value | Usage |
|---|---|---|
| `color.border.subtle` | `#E3E7ED` | Low-emphasis dividers |
| `color.border.default` | `#CBD5E1` | Standard control boundaries |
| `color.border.strong` | `#64748B` | Important boundaries where needed |

Use whitespace and clear grouping rather than excessive borders or nested cards. Validate border contrast where boundaries are necessary to identify controls or state.

## 6. Corner radii and elevation

### Radius tokens

| Token | Value | Usage |
|---|---:|---|
| `radius.indicator` | 4 px | Small badges and indicators |
| `radius.control` | 6 px | Buttons, inputs, and selects |
| `radius.panel` | 8 px | Cards, grouped panels, popovers, and dropdowns |
| `radius.dialog` | 10 px | Dialogs and modals |
| `radius.table` | Minimal/square | Tables and data-dense structures |

**Pill-shaped buttons are prohibited.**

### Shadow tokens

| Token | Value | Usage |
|---|---|---|
| `shadow.none` | `none` | Default for surfaces |
| `shadow.subtle` | `0 1px 2px rgb(23 32 51 / 6%)` | Select elements needing slight separation |
| `shadow.overlay` | `0 12px 32px rgb(23 32 51 / 16%)` | Floating overlays and dialogs where appropriate |

Use flat surfaces by default. Shadows communicate layering and must not be used as decoration.

## 7. Logo, gradients, and iconography

### Approved logo treatment

Preserve the approved reference treatment:

- Blue-to-purple gradient on the SPAROVIA wordmark.
- Light-blue ADMIN badge.

This approval applies only to the specific logo treatment.

### Gradient policy

- No decorative purple gradients.
- No additional gradients without explicit approval.
- Prefer solid colors and purposeful surface contrast.
- Do not generalize the logo exception into permission to add gradients elsewhere.

### Icon policy

- Use a consistent, simple line-icon style.
- Keep icon sizing and stroke treatment consistent.
- Icons must communicate meaning or support navigation.
- Do not use emoji icons or decorative icon clutter.

## 8. Components and interaction states

Shared components must consume centralized design tokens instead of duplicating arbitrary values in component styles.

| State | Requirement |
|---|---|
| Default | Clear and consistent with the component's role |
| Hover | Subtle feedback without unnecessary animation |
| Pressed | Distinguishable activation feedback |
| Selected | Clearly identify the active option or item |
| Disabled | Communicate unavailability and avoid implying interactivity |
| Error | Identify the affected control and explain the issue where appropriate |
| Keyboard focus | Provide a clearly visible focus indicator |

### Component rules

- Primary buttons use solid cobalt with the approved hover and pressed tokens.
- Buttons and form controls use the 6 px control radius.
- Cards and grouped panels use the 8 px panel radius.
- Dialogs use the 10 px dialog radius and appropriate overlay elevation.
- Tables prioritize alignment, readability, and efficient scanning.
- Focus, selected, and error states must remain distinguishable.
- Do not rely on color alone to communicate status.
- Exact component-level state treatments require implementation and accessibility verification; the requirements above do not imply that such verification has already occurred.

## 9. Motion and responsive behavior

### Motion

- Use transitions only when they improve feedback or understanding.
- Avoid excessive scroll animations and cursor-following effects.
- Avoid motion used purely for decoration.
- Respect the user's reduced-motion preference.
- Keep interactions understandable when motion is disabled.

### Responsive behavior

Validate mobile, tablet, and desktop layouts. In particular, check:

- Navigation and sidebars
- Forms and control groups
- Tables and data-dense views
- Cards and grouped panels
- Dropdowns, tooltips, and popovers
- Dialog and modal widths
- Image previews and upload areas
- Content editing and publishing review screens

Prevent horizontal overflow, clipped dialogs, inaccessible controls, tiny tap targets, and desktop-only layouts. Preserve hierarchy and usability at smaller widths.

## 10. Accessibility requirements

Target WCAG 2.2 AA for applicable requirements. This is a target, not a claim of achieved conformance.

Before release, verify:

- Text contrast against actual backgrounds
- Non-text contrast for meaningful controls, boundaries, and focus indicators
- Keyboard navigation and visible focus
- Form labels and understandable validation errors
- State communication that does not rely on color alone
- Responsive layouts and text scaling
- Reduced-motion behavior

Check actual color combinations and component states. Do not assume that a palette token is accessible in every context.

## 11. Prohibited patterns

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

## 12. Token naming and implementation guidance

Use semantic, centralized tokens rather than scattered literal values.

Recommended naming groups:

- `color.brand.*`
- `color.text.*`
- `color.surface.*`
- `color.border.*`
- `color.action.*`
- `color.focus.*`
- `color.status.*`
- `type.*`
- `radius.*`
- `shadow.*`

These are naming conventions for the future implementation, not a statement that these tokens already exist in code.

When implementing, inspect the repository and identify the actual token source before choosing a file or framework-specific representation. Do not introduce duplicate token systems or change application architecture as part of theme work.

## 13. Decision register

| Decision ID | Topic | Status |
|---|---|---|
| `LOGO-001` | Approved SPAROVIA logo treatment | LOCKED |
| `THEME-COLOR-001` | Editorial Cobalt palette | LOCKED |
| `THEME-TYPE-001` | Inter typeface | LOCKED |
| `THEME-TYPE-002` | Typography scale | LOCKED |
| `THEME-TYPE-003` | Language fallback, licensing, and font performance | OPEN |
| `THEME-SURFACE-001` | Surface and border hierarchy | LOCKED |
| `THEME-SHAPE-001` | Corner radii | LOCKED |
| `THEME-ELEVATION-001` | Shadow tokens | LOCKED |
| `THEME-GRADIENT-001` | Gradient restrictions | LOCKED |
| `THEME-ICON-001` | Icon style | LOCKED |
| `THEME-INTERACTION-001` | Interaction-state requirements | LOCKED |
| `THEME-MOTION-001` | Motion and reduced-motion policy | LOCKED |

## 14. Approval history

- **Phase 2–3:** Editorial Cobalt palette selected, refined, and locked.
- **Phase 4:** Inter and the typography scale locked.
- **Phase 5:** Surface hierarchy, radii, and shadows locked.
- **Phase 6:** Gradient, icon, interaction, and motion policies approved and locked.
- **Phase 7:** Consolidated theme specification prepared as this document.

## 15. Release and change control

- Do not silently alter a locked decision.
- A change to a locked token or rule requires explicit product-owner approval and an update to the decision register.
- Keep the theme specification separate from the implementation plan.
- Do not claim that the theme is implemented or verified until the relevant code changes and checks have actually been completed.
- The legacy theme specification has been reconciled and retired; `DESIGN.md` serves as the authoritative visual baseline.
- The next workflow phase is implementation planning. Implementation itself requires separate explicit authorization.

---

**Current status:** Specification prepared. Implementation, repository integration, and accessibility verification are not claimed as complete.
