# Sparovia Component Reuse Matrix
**Version:** 1.0 (Production Locked)  
**Standard:** Editorial Cobalt Component System  
**Governing Skill:** `.agents/skills/sparovia-ui-ux-standard/SKILL.md`

---

## 1. Master Component Reuse Matrix

| Pattern | Existing Implementation | Approved Shared Component | Required Action & Architectural Decision |
|---|---|---|---|
| **Card** | Ad-hoc `div` containers with varying borders (`border-slate-200`, `border-[#CBD5E1]`, `rounded-[8px]`, `rounded-lg`) in Dashboard, Business Presence, and Leads | `apps/admin/components/ui/Card.tsx` (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`) | **Standardized & Reused:** Canonical anatomy (`CardTitle`, `CardDescription`) added to `Card.tsx`. Replaced ad-hoc containers in `admin/page.tsx` and `admin/business-presence/page.tsx`. Ensured interactive variant (`variant="interactive"`) is preserved for Leads list. |
| **Badge** | Inline `span` elements with arbitrary `bg-amber-50`, `bg-blue-50`, `bg-emerald-50`, and arbitrary padding/radii in Leads and Business Presence | `apps/admin/components/ui/Badge.tsx` (`Badge` with `cobalt`, `purple`, `success`, `warning`, `destructive`, `neutral`, `whatsapp` variants) | **Standardized & Reused:** Replaced custom Area of Interest and status spans in `admin/leads/page.tsx` with `<Badge variant="warning" size="xs">`. Dashboard platform badge updated to `<Badge variant="cobalt">`. Preserved channel-specific `whatsapp` variant. |
| **Button** | Ad-hoc `<button>` elements with mixed heights, custom colors, and inconsistent disabled states across forms and modals | `apps/admin/components/ui/Button.tsx` (`Button` with `primary`, `secondary`, `outline`, `ghost`, `destructive` variants, sizes `xs`–`lg`) | **Reused & Enforced:** Ensured all actions use shared `Button`. Banned all pill-shaped geometries. Standardized `isLoading`, `leftIcon`, `rightIcon`, and accessible `min-h-[36px]`–`[40px]` touch targets. |
| **Input** | Raw `<input type="text">` elements with ad-hoc padding, borders, and rings in `ImageUploadModal.tsx` and settings drawers | `apps/admin/components/ui/Input.tsx` (`Input` with forwardRef, `hasError`, automatic accessible spellcheck/autocapitalize handling) | **Standardized & Reused:** Replaced raw inputs in `apps/admin/components/images/ImageUploadModal.tsx` for Project Name, Slot, and New Category. Consistent 40px height, `#CBD5E1` border, `#315FEA` focus ring. |
| **Select** | Raw `<select>` dropdowns with browser-native arrow indicators and custom borders in `ImageUploadModal.tsx` | `apps/admin/components/ui/Select.tsx` (`Select` with forwardRef, `sizeVariant="sm" | "md"`, custom chevron indicator, disabled states) | **Standardized & Reused:** Replaced raw select in `apps/admin/components/images/ImageUploadModal.tsx` with shared `Select`, providing consistent height, chevron, and dark/light token compatibility. |
| **Textarea** | Raw `<textarea>` elements with ad-hoc classes in `apps/admin/app/admin/business-presence/page.tsx` (Operating Hours, Public Notice) and `ImageUploadModal.tsx` (Caption) | `apps/admin/components/ui/Textarea.tsx` (`Textarea` with forwardRef, `hasError`, standard token styling, accessible spellcheck) | **Standardized & Reused:** Replaced raw textareas in `business-presence/page.tsx` (lines 640 & 658) and `ImageUploadModal.tsx` (line 391) with shared `Textarea`. Consistent padding, border, focus ring, and disabled behavior. |
| **Modal & Dialog** | Inconsistent dialog implementations; some modals embedded action buttons inside arbitrary child divs without standardized footers | `apps/admin/components/ui/Modal.tsx` (`Modal` with `isOpen`, `onClose`, `title`, `description`, `footer`, `maxWidth`, focus trap, escape handling) | **Standardized & Reused:** Updated `ImageUploadModal.tsx` to pass action buttons via canonical `footer={...}` prop, leveraging standard background (`#F3F6FA`), top border (`#E3E7ED`), and responsive button alignments. |
| **Toast & Feedback** | Dynamic 42px error banners inserted above canvas in `ImageStudioWorkspace.tsx`, causing layout shaking and displacement | `apps/admin/components/ui/Toast.tsx` (`toast.success`, `toast.error`, `toast.info`) and `apps/admin/components/ui/InlineBanner.tsx` | **Standardized & Reused:** Decommissioned disruptive DOM-insert banners above Image Studio canvas. Routed studio notifications directly through canonical `toast` triggers and stable sidebar status panels. |

---

## 2. Page-by-Page Audit & Consolidation Summary

### 2.1 Admin Dashboard (`apps/admin/app/admin/page.tsx`)
- **Before:** Ad-hoc container `div`s with custom `border-slate-200` and mixed shadows. Raw header badge with manual text color.
- **After:** Standardized to `<Card variant="default">` and `<Badge variant="cobalt" size="sm">`.
- **Behavioral Impact:** Zero disruption to statistics rendering, navigation links, or data fetching.

### 2.2 Leads Management (`apps/admin/app/admin/leads/page.tsx`)
- **Before:**
  - Area of Interest displayed twice: once as an ad-hoc amber `<span>` badge and again inside the customer enquiry message preview (`[Area of Interest: ...]`).
  - Table view had duplicate raw `<span>` for Area of Interest.
- **After:**
  - Standardized Area of Interest badges in card view and table view to `<Badge variant="warning" size="xs">`.
  - Introduced `getCleanEnquiryMessage(message)` helper across card view, table view, and detail drawer to cleanly strip redundant prefix while preserving original stored database text.
  - Interactive cards leverage shared `<Card variant="interactive">`.
- **Behavioral Impact:** Preserved full leads query, status mutations, follow-up interactions, and CSV exports.

### 2.3 Business Presence (`apps/admin/app/admin/business-presence/page.tsx`)
- **Before:**
  - Raw `<textarea>` elements for Operating Hours (line 640) and Public Notice (line 658).
  - Guidance section (Section 2) and Verified Information section (Section 3) wrapped in ad-hoc `div`s with manual borders and shadows.
- **After:**
  - Replaced raw textareas with shared `<Textarea>` component.
  - Replaced ad-hoc container divs with `<Card variant="default">`.
  - Standardized form container to canonical `#CBD5E1` border and soft shadow.
- **Behavioral Impact:** Preserved unsaved change tracking (`useUnsavedChanges`), API payload format, and NAP copy triggers.

### 2.4 Image Upload Modal (`apps/admin/components/images/ImageUploadModal.tsx`)
- **Before:**
  - Embedded modal action buttons inside inner form `div` instead of utilizing Modal's footer structure.
  - Used raw `<input>`, `<select>`, and `<textarea>`.
- **After:**
  - Standardized to `<Modal footer={...}>` with form-associated submit button (`form="image-upload-form"`).
  - Replaced controls with shared `<Input>`, `<Select>`, and `<Textarea>`.
- **Behavioral Impact:** Preserved file upload validation (10MB, 25MP), category creation flow, and handoff to Image Studio.

### 2.5 Image Studio Workspace (`apps/admin/components/images/ImageStudioWorkspace.tsx`)
- **Before:**
  - Window scrollbar toggle caused 15–17px horizontal layout shift on modal mount/unmount.
  - Dynamic 42px alert banner inserted directly above the canvas displaced the image down during AI enhancement.
  - Unstable sidebar height caused scrollbar jitter.
- **After:**
  - Implemented body scroll lock with clientWidth compensation.
  - Removed dynamic banner above canvas; routed feedback to canonical `toast.success` / `toast.error`.
  - Added stable status panels inside `<aside>` with `[scrollbar-gutter:stable]`.
- **Behavioral Impact:** Preserved single-action enhancement, before/after slider comparison, approval, rejection, and publishing boundaries.

---

## 3. Exceptions & Justifications

| File / Component | Exception Pattern | Justification |
|---|---|---|
| `ImageStudioWorkspace.tsx` | Dedicated `<canvas>` viewport and floating toolbar | Requires exact pixel boundaries and zoom/pan matrix transformations that cannot be constrained within a standard `<Card>` body. |
| `leads/page.tsx` | `Badge variant="whatsapp"` | WhatsApp brand green (`#25D366`) is an approved channel-specific color required for instant operator recognition of inbound WhatsApp enquiries. |
| `leads/page.tsx` | Full-width responsive table scroll container | Data-dense table requires horizontal scrolling (`overflow-x-auto`) on mobile viewports to prevent column compression. |
