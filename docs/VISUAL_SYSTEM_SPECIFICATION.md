# Sparovia Visual System Specification
**Version:** 1.0 (Production Locked)  
**Standard:** Editorial Cobalt Design System  
**Governing Skill:** `.agents/skills/sparovia-ui-ux-standard/SKILL.md`  
**Governing Rules:** `docs/RULES.md` and `docs/DESIGN.md` (Version 2.0)

---

## 1. Visual Identity & Brand Foundations

Sparovia's visual identity is **Editorial Cobalt**. It is an authoritative, clean, business-grade SaaS design language built for trust, legibility, and operational clarity.

- **Primary Identity Token:** `#315FEA` (Editorial Cobalt) — Used for primary buttons, active navigation indicators, key accents, focus rings (`#1D4ED8`/20), and primary links.
- **Secondary Accent Token:** `#7950B8` (Restrained Purple) — Used sparingly for AI/studio highlights, business context metadata, and exploratory features.
- **WhatsApp Dedicated Channel Token:** `#25D366` / `#128C7E` — Strictly reserved for WhatsApp contact triggers, badges, and communication links. Never used as a generic brand color or success indicator.
- **Neutral Surface Palette:**
  - Background Light: `#FFFFFF` (Primary Canvas / Card), `#F8FAFC` (Page Background), `#F3F6FA` (Inset Sub-surfaces / Table Row alternate)
  - Neutral Borders: `#E3E7ED` (Dividers), `#CBD5E1` (Interactive Control & Card Boundaries)
  - Neutral Text: `#172033` (Slate-900 / Headings), `#334155` (Slate-700 / Body), `#475569` (Slate-600 / Subtext), `#64748B` / `#94A3B8` (Muted / Placeholders)
- **Theme Stability:** Light mode / Editorial Cobalt is locked for V1. In accordance with `docs/RULES.md` Section 2.4 and `docs/DESIGN.md` Section 3, all customer-facing and admin header theme switchers / dark mode toggles have been decommissioned.

---

## 2. Color Tokens & Semantic Status Colors

All semantic statuses must meet WCAG 2.2 AA contrast requirements (minimum 4.5:1 for normal body text, 3:1 for large text / UI controls).

| Role | Token Value | Background Tint (Badge/Alert) | Border Color | Semantic Meaning & Usage |
|---|---|---|---|---|
| **Primary / Brand** | `#315FEA` | `bg-[#315FEA]/10` | `border-[#315FEA]/20` | Core action, active tab, brand indicator |
| **Secondary Accent** | `#7950B8` | `bg-[#7950B8]/10` | `border-[#7950B8]/20` | AI enhancement, business context, trust metadata |
| **Success** | `#15803D` | `bg-[#15803D]/10` | `border-[#15803D]/20` | Completed action, active status, new lead |
| **Warning** | `#B45309` | `bg-[#B45309]/10` | `border-[#B45309]/20` | Unsaved changes, area of interest, action needed |
| **Destructive / Error** | `#B91C1C` | `bg-[#B91C1C]/10` | `border-[#B91C1C]/20` | Failed API, validation error, destructive delete |
| **Neutral** | `#475569` | `bg-[#F3F6FA]` | `border-[#E3E7ED]` | Closed status, informational metadata, timestamp |
| **WhatsApp Channel** | `#128C7E` / `#25D366` | `bg-[#25D366]/10` | `border-[#25D366]/20` | Inbound WhatsApp channel, direct WhatsApp chat |

---

## 3. Typography Hierarchy

Sparovia exclusively uses **Inter** via Next.js `next/font/google` with optical font metric smoothing (`font-sans antialiased text-[#172033]`).

| Scale Role | Font Size / Line Height | Weight | Tailwind Classes | Approved Usage |
|---|---|---|---|---|
| **H1 Screen Title** | 24px / 32px (1.5rem / 2rem) | Bold (700) | `text-xl sm:text-2xl font-bold text-[#172033]` | Top of admin screens |
| **H2 Section Title** | 18px / 24px (1.125rem / 1.5rem) | Bold (700) | `text-base sm:text-lg font-bold text-[#172033]` | Primary card & section headers |
| **H3 Subsection Title**| 14px / 20px (0.875rem / 1.25rem) | Semibold (600) | `text-sm sm:text-base font-semibold text-[#172033]` | Nested sub-panels, modal headings |
| **Body (Default)** | 14px / 20px (0.875rem / 1.25rem) | Regular (400) | `text-sm text-[#334155] leading-relaxed` | Primary reading text, form controls |
| **Body (Small)** | 12px / 16px (0.75rem / 1rem) | Regular / Medium | `text-xs text-[#475569] leading-normal` | Helper text, metadata descriptions |
| **Caption / Badge** | 11px / 14px (0.6875rem / 0.875rem) | Medium / Bold | `text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider` | Badges, status labels, timestamps |

---

## 4. Border Radius Scale (Restrained Geometry)

Pill-shaped buttons (`rounded-full`) and arbitrary rounded geometries are strictly forbidden across Sparovia admin and shared components.

- `rounded-[4px]` (`indicator`): Status dots, small category badges, inline code/tags.
- `rounded-[6px]` (`control`): Buttons, Inputs, Selects, Textareas, Avatars, Checkboxes.
- `rounded-[8px]` (`panel`): Cards, Dropzones, Guidance banners, Notification panels.
- `rounded-[10px]` (`dialog`): Modals, Drawers, Flyout sheets.
- `rounded-none` (`0px`): Tables, Full-width strip banners, Inset dividers.

---

## 5. Spacing Conventions & Layout Grid

- **Layout Container:** Fluid responsive container with `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6`.
- **Card Internal Padding:**
  - Compact: `p-4 sm:p-5` (Lead cards, metric summaries)
  - Standard: `p-6 sm:p-8` (Settings cards, Presence panels, Studio sidebar)
- **Component Gap Spacing:**
  - Micro: `gap-1.5` to `gap-2` (Icons + text, badge groups)
  - Control Groups: `gap-3` (Button pairs, Input + Helper)
  - Grid Layouts: `gap-4` to `gap-6` (Card grids, Form columns)

---

## 6. Shared Component Anatomy & State Conventions

### 6.1 Card (`apps/admin/components/ui/Card.tsx`)
- **Structure:**
  - `Card`: Outer container with `bg-white rounded-[8px] border border-[#CBD5E1] shadow-soft-sm`
  - `CardHeader`: `p-5 sm:p-6 border-b border-[#E3E7ED] flex items-center justify-between`
  - `CardTitle`: `text-base sm:text-lg font-bold text-[#172033]`
  - `CardDescription`: `text-xs sm:text-sm text-[#475569] mt-0.5 leading-relaxed`
  - `CardContent`: `p-5 sm:p-6 space-y-4`
  - `CardFooter`: `p-4 sm:p-6 border-t border-[#E3E7ED] bg-[#F3F6FA]/50 flex items-center justify-between`
- **Variants:**
  - `default`: Flat white surface with subtle soft border.
  - `interactive`: Focusable and hoverable with `hover:border-[#315FEA]/40 hover:shadow-soft-md cursor-pointer`.
  - `muted`: Inset `#F3F6FA` background with `#E3E7ED` border.

### 6.2 Button (`apps/admin/components/ui/Button.tsx`)
- **Variants:**
  - `primary`: `bg-[#315FEA] hover:bg-[#254EDB] text-white shadow-soft-sm focus:ring-[#1D4ED8]/25`
  - `secondary`: `bg-white hover:bg-[#F3F6FA] text-[#172033] border border-[#CBD5E1] shadow-soft-xs`
  - `outline`: `bg-transparent hover:bg-[#F3F6FA] text-[#334155] border border-[#CBD5E1]`
  - `ghost`: `bg-transparent hover:bg-[#F3F6FA] text-[#475569] hover:text-[#172033]`
  - `destructive`: `bg-[#B91C1C] hover:bg-[#991B1B] text-white shadow-soft-sm`
- **Sizes:**
  - `xs`: `h-7 px-2.5 text-xs rounded-[6px]`
  - `sm`: `h-8 px-3 text-xs rounded-[6px]`
  - `md`: `h-9 min-h-[36px] px-3.5 text-sm rounded-[6px]`
  - `lg`: `h-10 min-h-[40px] px-4 text-sm rounded-[6px]`
- **State Handling:**
  - Loading: Disables interaction, suppresses duplicate submissions, displays `Loader2 animate-spin`.
  - Disabled: `disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none`.

### 6.3 Form Controls (`Input.tsx`, `Select.tsx`, `Textarea.tsx`)
- **Geometry:** Height 40px (`min-h-[40px]`), radius 6px (`rounded-[6px]`), padding `px-3.5 py-2`.
- **Default State:** `border border-[#CBD5E1] bg-white text-[#172033] placeholder-[#64748B] text-sm`.
- **Focus State:** `focus:outline-none focus:border-[#315FEA] focus:ring-2 focus:ring-[#1D4ED8]/20`.
- **Invalid State:** `border-[#B91C1C] focus:border-[#B91C1C] focus:ring-2 focus:ring-[#B91C1C]/20` with `aria-invalid="true"`.
- **Disabled State:** `disabled:bg-[#F3F6FA] disabled:opacity-50 disabled:cursor-not-allowed`.

### 6.4 Badge (`apps/admin/components/ui/Badge.tsx`)
- **Variants:** `cobalt` (brand), `purple` (accent), `success`, `warning`, `destructive`, `neutral`, `whatsapp`.
- **Geometry:** Height 20px-24px, radius 4px (`rounded-[4px]`), uppercase font weight 600, optional dot indicator (`w-1.5 h-1.5 rounded-full`).

### 6.5 Modal & Dialog (`apps/admin/components/ui/Modal.tsx`)
- **Anatomy:**
  - Fixed backdrop with `bg-[#0B1220]/60 backdrop-blur-sm z-50`.
  - Panel container with `rounded-[10px] bg-white border border-[#CBD5E1] shadow-soft-xl max-h-[90vh] flex flex-col`.
  - Header: Title, description, accessible close button with focus ring.
  - Body: Scrollable internal viewport (`overflow-y-auto overscroll-contain`).
  - Footer: Standardized bottom bar (`bg-[#F3F6FA]/95 border-t border-[#E3E7ED] px-6 py-4 flex justify-end gap-3`).
- **Focus & Interaction Rules:**
  - Body scroll lock with scrollbar compensation prevents layout shift.
  - Escape key dismisses modal (unless `preventOutsideClose` is active).
  - Traps keyboard focus within dialog bounds and restores focus to previous active element upon unmount.

### 6.6 Feedback & Toast (`apps/admin/components/ui/Toast.tsx`)
- Dispatched exclusively via `toast.success`, `toast.error`, `toast.info`.
- Fixed positioning bottom-right (`z-50`).
- Persistent/extended duration (6000ms+) for errors to ensure comprehension without auto-dismissing before action is understood.
- Secret sanitization: Backend stack traces and credentials are never exposed in user toasts.

---

## 7. Motion & Reduced-Motion Behavior

All interactive transitions are restrained and purposeful:
- Standard Transition: `transition-all duration-150 ease-in-out`
- Hover Elevation: Subtle lift `hover:-translate-y-0.5`
- Accessibility Override: Every motion transition must pair with `motion-reduce:hover:translate-y-0 motion-reduce:transition-none` to honor user OS preferences.

---

## 8. Rules for Page-Level Overrides

Page-level styling overrides are **prohibited** unless one of the following criteria is met:
1. **Third-party Canvas Embedding:** Dedicated canvas tools (such as Image Studio preview or fabric manipulation) where canvas dimensions require pixel-exact viewport containment.
2. **Specialized High-Density Tables:** Horizontal scroll containers where fixed column widths are necessary to prevent header collapse on mobile viewports.
3. **Channel-Specific Color Compliance:** Official WhatsApp brand green (`#25D366`) used strictly for genuine WhatsApp communication endpoints.
In all other scenarios, shared components (`Card`, `Badge`, `Button`, `Input`, `Select`, `Textarea`, `Modal`) must be reused as canonical primitives.
