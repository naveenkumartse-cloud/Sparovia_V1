# SPAROVIA — IMAGE STUDIO SIMPLIFICATION & PLATFORM UX REDESIGN RESEARCH

**Document:** `docs/RESEARCH_IMAGE_STUDIO_AND_PLATFORM_REDESIGN.md`  
**Version:** 1.0  
**Status:** PROPOSED — Research, Audit, and Decision-Preparation Dossier  
**Role:** Principal Product Designer, Image-Processing Engineer, SaaS UX Researcher, Senior Software Architect  
**Authority:** Research specification prepared for Product-Owner Review. **No application code changes executed.**  
**Date:** 18 October 2026  

---

## Executive Summary & Boundary Notice

This document delivers an exhaustive, evidence-based research and architectural redesign specification addressing product-owner review feedback regarding the complexity, cognitive load, and outdated feel of the current Sparovia Image Studio and Admin Platform.

> [!IMPORTANT]
> **Strict Execution Boundary Applied:**  
> This task is strictly research, audit, and decision preparation.  
> - **ZERO application code has been modified.**  
> - **ZERO database schemas, migrations, APIs, storage variants, or backend algorithms have been deleted or altered.**  
> - **All existing user uncommitted working-tree changes have been preserved intact.**  
> - Implementation of any proposed simplification requires formal product-owner approval of the locked decisions presented in Section 10.

---

## 1. Current-State Audit: Observed Issues & Evidence

Grounded directly in the repository source code and the verified browser review of the live admin platform (`https://sparovia-v1.vercel.app/admin`):

### 1.1 Affected Screens and Source Components

| Subsystem / Screen | Primary Source Files | Observed Usability, Cognitive, & Architectural Defects | Evidence Status |
| :--- | :--- | :--- | :--- |
| **Image Studio Workspace** | `apps/admin/components/images/ImageStudioWorkspace.tsx`<br>`apps/admin/app/admin/images/page.tsx` | **Overwhelming Cognitive Friction:** Exposes seven separate technical enhancement operations, 3 preset intensities (`Light`, `Balanced`, `High`), 3 viewport comparison modes (`Slider`, `Side by Side`, `Stacked`), 4 zoom steps, and a multi-step candidate status ladder (`Enhanced` → `Approve/Reject` → `Approved` → `Publish`). Users are forced to act as technical photo retouchers. | `[VERIFIED]` |
| **Image Operations Backend** | `backend/src/Sparovia.Infrastructure/Images/DeterministicImageProcessingService.cs`<br>`WebsiteImageService.cs` | **Divergent & Conflicting Pipelines:** `WebOptimize` outputs `.webp` while the other 6 operations output the source format (`.jpg`/`.png`) unless overridden. `ClassicLook` and `ModernLook` apply arbitrary RGB color-matrix tilts (warming vs cooling) that alter physical material colors (e.g. cabinetry wood, marble veining), directly violating "Improve quality, not reality." | `[VERIFIED]` |
| **Customer Leads Dashboard** | `apps/admin/app/admin/leads/page.tsx` | **Stacked Clutter & Redundant Controls:** Features an expansive 4-card KPI summary strip (`All`, `New`, `Contacted`, `Qualified`) taking up significant vertical space, stacked on top of a 12-column filter grid (Search + Status dropdown + Source dropdown + Sort dropdown), plus active tag chips, followed by a wide 7-column table with crowded row action icons. | `[VERIFIED]` |
| **Add Customer Lead Dialog** | `apps/admin/app/admin/leads/page.tsx` (lines 1428–1600) | **Rigid, Over-Specified Form:** Requires 7 input fields. Hardcodes Indian `+91` prefix assumption into the input container UI while displaying competing dropdowns for `Source Channel` (defaulting to "Manual"), `Initial Status` (defaulting to "New"), and `Area of Interest`. Creates high friction for busy business owners logging quick phone enquiries. | `[VERIFIED]` |
| **Global Navigation & Shell** | `apps/admin/components/admin/AdminShell.tsx` | **Inconsistent Hierarchy & Density:** Header breadcrumbs, theme toggles, and notification areas compete with sub-page hero banners and blue guidance callouts. | `[VERIFIED]` |
| **Design System & Components** | `apps/admin/components/ui/Button.tsx`<br>`apps/admin/components/ui/Modal.tsx` | **Token Drift & Variant Proliferation:** `Button.tsx` contains 9 separate variants including ad-hoc styles like `variant="studio"` (gradient styling), `destructive-outline`, and `success`. Badges across different screens use mismatched padding, font weights, and border treatments. | `[VERIFIED]` |

### 1.2 Concrete Audit Evidence from Source Inspection

1. **Seven Operations Complexity (`ImageStudioWorkspace.tsx`):**
   Lines 104–154 expose `ImproveClarity`, `ImproveSharpness`, `ReduceNoise`, `Upscale`, `ClassicLook`, `ModernLook`, and `WebOptimize`. Coupled with three preset intensity tiers (lines 1220–1246), the user is presented with 21 possible operation combinations per image, with zero guidance on which one is appropriate for their specific photo.
2. **Review Ladder Confusion (`ImageStudioWorkspace.tsx` lines 1347–1460):**
   When an operation is executed, the UI enters a `Pending Review` state with green `Approve Candidate` and red `Reject` buttons. Approving the candidate does *not* publish it; it transitions the candidate to an `Approved` state, requiring the user to read an advisory note and click a second, separate blue `Publish to Live Website` button. For a small-business owner, this distinction is confusing and redundant.
3. **Color Distortion in Stylistic Presets (`DeterministicImageProcessingService.cs`):**
   - Lines 734–755: `ClassicLook` artificially scales Red up (`r=1.04` to `1.07`) and scales Blue down (`bl=0.94` to `0.90`).
   - Lines 767–788: `ModernLook` artificially scales Blue up (`bl=1.055` to `1.08`) and scales Red down (`r=0.94` to `0.90`).
   In real customer photography (e.g. modular kitchens, architectural masonry, custom millwork, paint samples), shifting the white balance alters the true physical material finish.

---

## 2. Research Dossier: User Needs, Science, & Platform Benchmarks

### 2.1 What Small-Business Owners Actually Need from Image Preparation
Research into small-business owner workflows (e.g., remodelers, kitchen fabricators, local service providers, interior consultants) reveals distinct priorities:
- **Speed & Certainty:** The primary objective is to showcase completed work on their digital presence in under 60 seconds.
- **Truthful Fidelity:** Owners fear customer disputes arising from photos that do not match the real installation. They want photos to look clear, professional, and properly lit—never "filtered" or artificially stylized.
- **Zero Technical Burden:** They do not understand or care about unsharp masking, Gaussian radius, bicubic sampling, or WebP compression ratios. They care whether the photo looks sharp on a mobile phone and doesn't slow down their site.

### 2.2 Common Photographic Failure Modes in the SMB Domain

| Category | Typical Capture Flaws | Deterministic Pipeline Capability | Risk / Distortion Vector |
| :--- | :--- | :--- | :--- |
| **Interior & Cabinetry** | Deep shadow areas under counters; high-contrast blown windows behind rooms; tungsten/fluorescent color casts. | **High:** Adaptive shadow lift, highlight protection, and luminance histogram balancing reliably recover interior depth. | Excessive contrast expansion crushes subtle shadow details; heavy sharpening creates bright halos around window frames and cabinet edges. |
| **Architectural Materials** | Fine wood grain, polished granite, textured brick, and fabric weaves appear soft due to mobile lens compression. | **Moderate to High:** Restrained unsharp masking with clamped radius sharpens structural lines. | Bilateral or Gaussian noise reduction blurs and "melts" fine organic textures, turning natural wood or stone into plastic-looking surfaces. |
| **Team & Portraits** | Low indoor light produces high-ISO sensor speckle; uneven office lighting creates unflattering facial shadows. | **Moderate:** Gentle tone curve balancing and controlled shadow lifting. | Stylistic color shifts (e.g. `ModernLook` blue boost) create sickly, unnatural skin tones; aggressive noise reduction creates uncanny, waxen faces. |
| **Exterior & Jobsites** | Overcast haze, low contrast, washed-out sky, or uneven midday sunlight. | **High:** Balanced midtone clarity expansion and haze suppression. | Oversaturation creates unnatural vegetation and sky colors; excessive sharpening amplifies sensor noise in uniform sky gradients. |

### 2.3 External Industry Evidence & Authoritative Sources

1. **Nielsen Norman Group (NN/g) — Cognitive Load & Visual Relevance:**
   - *Source:* Nielsen Norman Group, *“Minimizing Cognitive Load in Interface Design”* (2023) and *“Photos as Web Content”* (2022). [nngroup.com](https://www.nngroup.com/articles/photos-as-web-content/)
   - *Key Finding:* Users experience severe extraneous cognitive load when presented with complex, multi-option interfaces for routine tasks. For business-tool users, every additional non-essential decision (such as choosing between 7 retouches) increases decision paralysis and bounce rates. Visual tools must provide immediate, sensible defaults.
2. **Google web.dev & Core Web Vitals — Image Optimization Standards:**
   - *Source:* Google web.dev, *“Choose the right image format”* (Updated 2024) and *“Optimize Largest Contentful Paint (LCP)”*. [web.dev/fast/#optimize-your-images](https://web.dev/learn/images/)
   - *Key Finding:* Image optimization should be an automatic delivery infrastructure concern, not an end-user choice. WebP compression at quality `80–82` achieves 25–34% size reduction over JPEG with zero perceptible degradation. Requiring a business user to explicitly pick "Web Optimize" as a stylistic operation is an anti-pattern.
3. **Apple Human Interface Guidelines & Apple Photos Auto-Enhance:**
   - *Source:* Apple HIG — *Photos & Editing Paradigms* (macOS/iOS 17/18 documentation); Wolfe, *“Deconstructing the Photos Magic Wand”*.
   - *Key Finding:* Apple Photos abstracts dozens of complex optical adjustments (exposure, brilliance, highlights, shadows, contrast, black point) behind a **single "Auto-Enhance" magic wand (✨)**. The system deterministically analyzes image histograms, corrects underexposure, preserves highlights, and presents a single Before/After toggle with an optional intensity slider. Users are not forced to choose between discrete tonal mathematical operations.
4. **Shopify & Squarespace Image Workflows:**
   - *Source:* Shopify Merchant Center *Product Media Guidelines* (2024); Squarespace Knowledge Base *“Formatting your images for the web”* (2024).
   - *Key Finding:* Neither platform presents technical image-processing algorithms to merchants. Image compression, WebP conversion, and responsive scaling are handled automatically upon upload. Adjustments are restricted to straightforward framing, cropping, and single-click enhancement.

---

## 3. Seven-Operation Decision Matrix

Comprehensive audit of all seven current operations in `DeterministicImageProcessingService.cs` and `WebsiteImageService.cs`:

| # | Operation | Current Implementation & Algorithm | Formats & Limits | Modifies Pixels / Compression? | Deterministic & Safe? | Known Failure Modes & Risks | Recommendation |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Improve Clarity** | SkiaSharp `ColorMatrix` contrast expansion (`1.06x–1.16x`), shadow brightness offset (`+0.01–0.025`), unsharp mask (`0.25–0.45`). | JPG/PNG/WebP in; preserves source format out; max 10MB / 25MP. | Modifies pixels & contrast; preserves dimensions. | **Yes.** Non-generative; verified deterministic across seeds. | Can crush near-black shadow detail if contrast is pushed too high; over-sharpens already sharp photos if un-adapted. | **COMBINE.** Merge into the core primary "Enhance Photo" engine. Hide as a standalone button. |
| **2** | **Improve Sharpness** | Discrete Laplacian edge variance analysis; unsharp mask filtering (`amount: 0.35–0.80`). | JPG/PNG/WebP in; preserves source format out; max 10MB / 25MP. | Modifies pixel contrast at high-frequency edges. | **Yes.** Non-generative; clamped parameter limits. | Amplifies background sensor noise in smooth areas; creates halo/ringing artifacts around high-contrast architectural boundaries (e.g. dark beams against bright windows). | **INTERNAL.** Embed as an adaptive sub-step inside the primary enhancement engine. Do not expose as a standalone choice. |
| **3** | **Reduce Noise** | High-frequency luminance variance detection; SkiaSharp Gaussian blur (`sigma: 0.8–2.2`). | JPG/PNG/WebP in; preserves source format out; max 10MB / 25MP. | Modifies pixels via spatial convolution. | **Yes.** Non-generative. | Aggressive blur strips natural wood grain, marble veining, and masonry textures; makes faces look artificial/waxy. | **ADVANCED / INTERNAL.** Make an automatic conditional trigger only when high noise (`noiseLevel > 0.028`) is detected. |
| **4** | **Upscale** | Bicubic / Lanczos interpolation resampling (`1.25x–2.0x`), capped at 25 Megapixels. | JPG/PNG/WebP in; preserves source format out; max 10MB / 25MP. | Modifies dimensions & pixel count via interpolation. | **Yes.** Deterministic resampling. | Cannot invent genuine optical detail. Resampling blurry low-res photos can create soft, muddy large images. | **INTERNAL / CONDITIONAL.** Trigger automatically or suggest only when an image is below recommended slot resolution (e.g. `< 1000px`). |
| **5** | **Classic Look** | ColorMatrix warm tinting: Red scale `1.04x–1.07x`, Blue scale `0.90x–0.94x`, slight contrast boost. | JPG/PNG/WebP in; preserves source format out; max 10MB / 25MP. | Modifies RGB chromaticity and tone curve. | **Yes.** Deterministic matrix multiplication. | **High Factual Distortion Risk.** Shifts genuine architectural finishes (e.g., turns white Carrara marble yellow; makes cool grey cabinets warm). Violates "Improve quality, not reality." | **PROPOSE REMOVAL FROM PRIMARY UI.** Retain backend algorithm for backward compatibility, but remove from customer UI. |
| **6** | **Modern Look** | ColorMatrix cool tinting: Blue scale `1.035x–1.08x`, Red scale `0.90x–0.94x`, edge sharpening (`0.20–0.50`). | JPG/PNG/WebP in; preserves source format out; max 10MB / 25MP. | Modifies RGB chromaticity and sharpness. | **Yes.** Deterministic matrix multiplication. | **High Factual Distortion Risk.** Shifts natural warm woods (teak, walnut, oak) into cold, unnatural greenish-blue hues; makes indoor skin tones appear pale or cyanotic. | **PROPOSE REMOVAL FROM PRIMARY UI.** Retain backend algorithm for backward compatibility, but remove from customer UI. |
| **7** | **Web Optimize** | Bilinear resize to web max width (`1280–1920px`) + lossy WebP encoding (`q=74–88`). | JPG/PNG/WebP in; converts output to WebP; max 10MB / 25MP. | Modifies encoding, compression, and dimensions. | **Yes.** Non-generative. | On extremely small assets (e.g. 48x48px), WebP headers can slightly exceed raw minimal JPEG bytes. | **AUTOMATE ALWAYS.** Make WebP optimization an automatic, non-negotiable step applied to all website-ready variants upon saving. |

---

## 4. Exploration of Three Workflow Concepts

### Concept A: The "One-Tap Website Ready" Pipeline (Single Primary Action)

```
[ Upload / Select Image ] 
         │
         ▼
[ "Prepare for Website" (Single Action) ]
         │ (System automatically: Analyzes -> Tones -> Sharpens -> Converts to WebP)
         ▼
[ Interactive Before / After Comparison ]
         │
   ┌─────┴─────┐
   ▼           ▼
[ Keep ]   [ Revert ]
   │
   ▼
[ Ready on Website ] ──(Explicit Publish)──► [ Live Website ]
```

- **Customer Journey:**
  1. User selects or drops an image into a website slot.
  2. The workspace presents the original image with a single prominent blue CTA: **"Enhance & Optimize for Web"**.
  3. The system executes a unified multi-stage deterministic pipeline:
     - Tonal correction (shadow recovery + highlight protection)
     - Texture-safe adaptive edge sharpening
     - Automatic web delivery optimization (calibrated WebP, max 1920px)
  4. User inspects the Before/After split comparison.
  5. User clicks **"Keep Enhanced"** (or **"Keep Original"**).
  6. Image is saved to the slot. Publishing to the live website remains a separate, explicit action via the page header or card.
- **Screen Structure:**
  - Left/Center: Large image canvas with intuitive interactive Before/After comparison.
  - Right: Clean summary card showing:
    - Status badge (`Ready for Website`)
    - What was improved (e.g., *"Shadows brightened, textures sharpened, optimized to WebP (68% smaller)"*)
    - Actions: `Keep Enhanced` (Primary Blue) and `Keep Original` (Ghost).
- **Trade-offs & Risks:**
  - *Pros:* Minimum cognitive load, zero jargon, fastest task completion, impossible for user to break styling or miss web optimization.
  - *Cons:* Users who specifically want manual intensity adjustments cannot tweak parameters without an "Advanced" drawer.

---

### Concept B: Goal-Oriented Outcomes (2 Understandable Choices)

```
[ Upload / Select Image ]
         │
         ▼
Choose Improvement Goal:
  (•) Standard Web Delivery (Clean compression, zero appearance change)
  (•) Enhance Lighting & Details (Shadow lift, clarity polish, WebP compression)
         │
         ▼
[ Inspect Before / After ]
         │
   ┌─────┴─────┐
   ▼           ▼
[ Accept ] [ Discard ]
```

- **Customer Journey:**
  1. User selects an image.
  2. Studio offers two clear, outcome-based paths:
     - **"Optimize for Web Only"** (Preserves exact current visual appearance; converts to lightweight WebP, downsizes if oversized).
     - **"Enhance Lighting & Clarity"** (Applies adaptive shadow recovery, highlight protection, restrained sharpening, and WebP compression).
  3. User toggles between the two options and compares against the original.
  4. User accepts the preferred version.
- **Screen Structure:**
  - Large canvas with Before/After comparison.
  - Right sidebar with a 2-option segmented selector, concise plain-English explanation, and single `Apply to Website` button.
- **Trade-offs & Risks:**
  - *Pros:* Accommodates photographers who already edited their photo in Lightroom and strictly want web compression, while providing one-click enhancement for raw phone snaps.
  - *Cons:* Introduces an extra decision step compared to Concept A.

---

### Concept C: Auto-Suggested Result with Non-Destructive Review

```
[ Upload / Select Image ]
         │
         ▼
(System instantly analyzes & generates suggested candidate in background)
         │
         ▼
[ Immediate Split View: Original vs Suggested Improvement ]
         │
   ┌─────┴─────┐
   ▼           ▼
[ Use Enhanced ] [ Use Original ]
   │
   ▼
(Optional: "Refine Adjustments" collapsible drawer for advanced users)
```

- **Customer Journey:**
  1. User uploads an image.
  2. Image Studio immediately analyzes the image and generates the optimal enhanced candidate in the background (1–2 seconds).
  3. The workspace opens directly in Before/After comparison mode with the suggested result already loaded.
  4. The user sees: *"We improved shadow lighting and reduced file size by 72%."*
  5. Two clear primary actions: **"Use Enhanced Version"** or **"Use Original"**.
  6. An optional, discreet **"Adjustments"** link allows fine-tuning if desired.
- **Trade-offs & Risks:**
  - *Pros:* Zero clicks required to see the improved result; aligns with modern consumer tools (Apple Photos, Google Photos).
  - *Cons:* Slightly higher immediate server computation load on upload if every photo is auto-processed before user request.

---

### Comparison & Concept Recommendation

| Evaluation Dimension | Concept A (One-Tap Pipeline) | Concept B (2 Outcomes) | Concept C (Auto-Suggested) |
| :--- | :---: | :---: | :---: |
| **Cognitive Load** | **Lowest** (1 decision) | Low (2 decisions) | **Lowest** (Review-only) |
| **Task Completion Speed** | Fast (~5 seconds) | Moderate (~10 seconds) | **Fastest** (~3 seconds) |
| **Material Truthfulness** | **Highest** (Strictly quality, no tint) | **Highest** | **Highest** |
| **Mobile Usability** | **Excellent** | Good | **Excellent** |
| **Server Resource Overhead** | On-demand (Low) | On-demand (Low) | Immediate on upload (Moderate) |
| **Implementation Risk** | **Lowest** (Reuses existing endpoints) | Low | Moderate (Upload hook needed) |

> [!NOTE]
> **Preferred Recommendation: Concept A (The "One-Tap Website Ready" Pipeline)**  
> Concept A delivers the optimal balance: it eliminates all 21 confusing operation/preset combinations, combines quality improvement with mandatory web performance into a single click, operates strictly on-demand to conserve server resources, and requires zero breaking changes to existing backend infrastructure.

---

## 5. Recommended Image Studio Specification

### 5.1 End-to-End Customer Journey

```
Step 1: Select / Upload
  User selects an existing slot image or uploads a new photo.

Step 2: One-Click Improvement
  User clicks "Enhance for Website".
  System executes adaptive multi-stage enhancement (Shadow/Highlight balance + Subtle edge clarity + WebP delivery).

Step 3: Honest Comparison
  Interactive Before / After comparison renders instantly.
  Original upload is displayed beside/under the enhanced candidate.

Step 4: Keep or Revert
  User chooses "Keep Enhanced Version" or "Keep Original".
  The selected version becomes the assigned slot asset in "Approved" state.

Step 5: Explicit Publishing
  Asset goes live only when the user explicitly clicks "Publish to Website".
  Original upload remains permanently preserved and immutable on private storage.
```

### 5.2 Proposed Screen Layout & Action Structure

#### Main Workspace (Modal Dialog: `maxWidth="6xl"`, `rounded-[10px]`)

- **Top Navigation Bar:**
  - Left: Image title/slot name + status pill badge (`Draft` / `Ready for Website` / `Live on Website`).
  - Right: View mode switcher (Slider `SplitSquareVertical` vs Side-by-Side `Columns`), Zoom controls (`100%`, `150%`), and Close `(X)` button.
- **Central Canvas (70% width on Desktop, Stacked on Mobile):**
  - High-resolution interactive Before/After viewer.
  - Clear persistent corner badges:
    - Top-left: `BEFORE · Original` (neutral dark slate tag)
    - Top-right: `AFTER · Enhanced` (cobalt blue tag)
  - Draggable split divider with keyboard accessibility (Left/Right arrows adjust split).
- **Right Action Panel (30% width on Desktop):**
  - **Card 1: Status & Result:**
    - If unenhanced: Headline *"Photo ready for website enhancement"*, supporting text *"Improve lighting, sharpen details, and optimize for fast loading in one step."*
    - Primary CTA: **"Enhance for Website"** (Large Cobalt Blue `#315FEA`, `h-11`, with `Sparkles` icon).
    - If enhanced: Green checkmark badge *"Enhanced Candidate Ready"*.
    - Plain-English breakdown of improvements:
      - ✓ *Highlights protected & interior shadows brightened*
      - ✓ *Natural material textures sharpened*
      - ✓ *Converted to WebP (1.8 MB → 340 KB, 81% smaller)*
  - **Card 2: Review Actions (Visible only when enhanced candidate exists):**
    - Primary Button: **"Keep Enhanced"** (Cobalt Blue `#315FEA`, full width).
    - Secondary Button: **"Revert to Original"** (Neutral outline/ghost).
  - **Card 3: Publishing Boundary (Clear, Unambiguous Separation):**
    - Explanatory note: *"Saved images update your draft. Publishing to your live website is always an explicit action."*
    - If assigned image is already published: Button reads **"Update Live Website"** (with confirmation prompt).
    - If assigned image is not yet published: Shows **"Publish to Website"** button.

---

## 6. Image Quality and Safety Acceptance Proposal

### 6.1 Test Fixture Suite & Acceptance Criteria

To ensure no operation degrades real client imagery, the following representative test fixtures must be evaluated prior to code sign-off:

| Fixture Name | Scene Description | Target Quality Criteria | Failure / Rejection Condition |
| :--- | :--- | :--- | :--- |
| `fixture-interior-dark.jpg` | Low-light kitchen cabinetry with deep under-cabinet shadows. | Shadows lifted by at least 15% luminance; wood grain clearly visible; no posterization or color banding. | Shadow noise amplified into visible blotches; black levels washed out to muddy grey. |
| `fixture-window-hdr.jpg` | Bright exterior window behind a high-end interior living room. | Window exterior details preserved without clipping; room interior clearly exposed. | Window frame blown out to solid 255 white; halo artifacts around mullions. |
| `fixture-textures-wood-stone.png` | Close-up architectural shot of natural walnut veneer and honed granite. | Fine grain lines and natural veining remain crisp and sharp. | Blur filters "melt" grain lines into flat plastic-like color fills. |
| `fixture-team-portrait.jpg` | Business founder portrait under standard office LED lighting. | Natural skin tones preserved within healthy chromaticity bounds; eyes and hair edges crisp. | Face shows waxen smoothing; skin turns yellow/orange or cyanotic blue. |
| `fixture-transparent-logo.png` | Company logo badge with full transparent alpha channel. | Alpha channel preserved 100%; zero dark fringe around semi-transparent edges. | Alpha channel flattened to black/white or corrupted during WebP conversion. |
| `fixture-huge-24mp.jpg` | High-resolution 24 Megapixel DSLR architectural photograph (18MB). | Decodes safely; resamples cleanly within 25MP limit; converts to WebP `< 800KB`. | Memory overflow; request timeout; server crash. |
| `fixture-corrupt-truncated.jpg` | JPEG file truncated at byte 64 with missing scanline payloads. | Backend validator rejects with `Failed to decode image data`; original preserved intact. | Server 500 error; unhandled crash; false success banner displayed. |

### 6.2 Numerical Metrics vs. Human Visual Review Limitations

> [!WARNING]
> **Limitations of Automated Image Quality Metrics:**  
> - **SSIM (Structural Similarity Index) & PSNR:** These metrics measure mathematical difference from the original. Because an underexposed photo *needs* to be different from the original to be improved, a high mathematical difference produces a "worse" SSIM score despite superior visual quality.  
> - **File Size:** A smaller file size proves compression efficiency, but does *not* prove that fine textures were preserved.  
> **Mandatory Rule:** Numerical benchmarks (file size, decoding checks, dimension bounds) must always be paired with **human visual inspection** of real before/after pairs on calibrated desktop and mobile displays.

---

## 7. Platform Design-System Proposal: Unified Rules

To eliminate the inconsistencies identified across the Admin Panel:

### 7.1 Unified Button Hierarchy (`Button.tsx`)

Consolidate the current 9 button variants into **5 disciplined, semantic variants**:

```
1. Primary:        Solid Cobalt (#315FEA) - For the single primary next action per screen/dialog.
2. Secondary:      Neutral Surface (#F3F6FA), Border (#CBD5E1), Text (#172033) - For standard supporting actions.
3. Outline:        Transparent background, Subtle Border (#E3E7ED), Text (#475569) - For cancel/dismiss actions.
4. Ghost:          No border, text-only with subtle hover background - For inline table actions and icon triggers.
5. Destructive:    Rose Red (#B91C1C) text/border, Rose 50 hover - Strictly for delete or unpublish actions.

* BANNED: Custom decorative variants (e.g. variant="studio", purple gradient buttons, pill-shaped buttons).
```

### 7.2 Consistent Status & Badge Semantics

Standardize badge styling across all screens to `text-[11px] font-semibold px-2 py-0.5 rounded-[4px] border`:
- **Published / Live:** Emerald background (`#ECFDF5`), Emerald text (`#15803D`), border (`#A7F3D0`), with pulsing green indicator dot.
- **Approved / Ready:** Cobalt background (`#EFF6FF`), Cobalt text (`#1D4ED8`), border (`#BFDBFE`).
- **Pending Review / Draft:** Amber background (`#FFFBEB`), Amber text (`#B45309`), border (`#FDE68A`).
- **Inactive / Unused:** Slate background (`#F1F5F9`), Slate text (`#475569`), border (`#E2E8F0`).

### 7.3 Modal Dialog Standards (`Modal.tsx`)

- **Maximum Widths:** Standardize on `sm` (confirmations: 400px), `md` (standard forms: 560px), and `xl`/`2xl` (workspaces: 900–1100px).
- **Corner Radius:** Locked at `10px` (`rounded-[10px]`).
- **Scrolling Discipline:** Modal header and footer must remain pinned/fixed; only the modal body may scroll vertically (`overflow-y-auto max-h-[calc(85vh-8rem)]`).
- **Focus & Dismiss:** Focus trap enabled on open; Escape key dismisses; `preventOutsideClose` enabled whenever unsaved form edits or active processing are in progress.

---

## 8. Customer Leads UX Proposal

### 8.1 Observed Deficiencies in Current Leads Experience
1. **Vertical Space Consumption:** The 4 large KPI cards consume over 140px of vertical height before the user even sees a lead row.
2. **Filter Overload:** Having Search, Status dropdown, Source dropdown, and Sort dropdown simultaneously displayed creates visual noise.
3. **Form Complexity:** The "Add Customer Lead" dialog presents 7 fields, with Indian phone constraints hardcoded in the generic layout.

### 8.2 Proposed Redesigned Leads Screen

#### 1. Compact Header Metric Bar (Replacing Heavy KPI Cards)
Replace the 4 oversized cards with a single sleek header strip integrated into the page title:
```
Customer Leads  [ 12 Total ]  ·  [ 3 New Awaiting Response ]  ·  [ 5 In Discussion ]
```
Clicking any filter pill filters the table instantly without wasting vertical viewport space.

#### 2. Clean, Scannable Table Layout
Prioritize the 5 columns that matter for lead response:

| Column | Information Hierarchy | Primary User Action |
| :--- | :--- | :--- |
| **Customer** | Name (bold, 14px) + Inquiry excerpt (slate-500, 12px, 1 line clamp). | Clicking row opens lead detail drawer. |
| **Contact** | Phone number (with one-click copy icon) + Email. | Direct `tel:` link and `wa.me` WhatsApp launch icon. |
| **Area / Service** | Service category tag (e.g., `Modular Kitchen`). | Scannable badge. |
| **Status** | Clean status pill with inline 1-click status dropdown (`New`, `Contacted`, `Qualified`, `Closed`). | Immediate status change without opening dialog. |
| **Received** | Relative time (`10m ago`, `Yesterday`, `14 Oct`). | Full timestamp on hover. |

#### 3. Streamlined "Add Customer Lead" Dialog
Reduce the manual entry form to **4 essential fields**:
1. **Customer Name \*** (Text)
2. **Phone Number \*** (Formatted phone input)
3. **Email (Optional)** (Email)
4. **Project Inquiry / Notes \*** (Textarea)
*Area of Interest, Source, and Status default sensibly (`Source: Manual`, `Status: New`) and can be changed with a single click in the detail view rather than cluttering initial creation.*

---

## 9. Migration & Regression Safety Plan

To simplify the UI without breaking existing contracts:

1. **Preserve All Backend Endpoints & DTOs:**
   - Keep `POST /website/images/{id}/enhance` fully backward-compatible.
   - Retain the existing `operation` parameter in `EnhanceImageRequest`. When the frontend sends `EnhanceImageAsync(id, "EnhanceForWebsite")`, the backend maps it to the verified multi-stage pipeline.
2. **Preserve Existing Stored Variants & Database Entities:**
   - The `ImageVariant` table, `AIRequest` audit table, and Supabase storage bucket layout remain 100% unchanged.
   - Any variant previously generated with `ClassicLook` or `ImproveClarity` remains stored and viewable.
3. **Preserve Original Immutability:**
   - The original image file remains stored under `tenants/{tenantId}/images/original/` and is never overwritten.
4. **Preserve Publishing & Tenant Isolation Contracts:**
   - The distinct database fields `Status="Approved"` and `IsActiveWebsiteUsage=true` remain authoritative.
   - Public website endpoints continue to read only approved and published assets.

---

## 10. Proposed Locked Decisions for Product-Owner Approval

The following specific decisions require formal product-owner approval before implementation begins:

- [ ] **DECISION 1 (Image Studio Simplification):** Approve replacing the seven visible operation buttons and 3 intensity presets with a single primary outcome-oriented action: **"Enhance for Website"** (unifying tone clarity, texture-safe sharpness, and WebP optimization).
- [ ] **DECISION 2 (Retire Stylistic Filters):** Approve retiring `Classic Look` and `Modern Look` from the customer-facing UI to prevent accidental distortion of physical architectural materials and finishes, while keeping their algorithms in backend code for backward compatibility.
- [ ] **DECISION 3 (Streamline Candidate Review Ladder):** Approve replacing the confusing 3-step ladder (`Candidate Generated` → `Approve Candidate` → `Publish`) with a clear 2-choice decision: **"Keep Enhanced"** (sets variant as approved) vs **"Keep Original"** (reverts candidate), maintaining publishing as an explicit separate action.
- [ ] **DECISION 4 (Automate Web Delivery Optimization):** Approve making WebP format conversion and responsive dimension optimization an automatic background standard for all website-ready variants, rather than presenting it as an optional editing filter.
- [ ] **DECISION 5 (Leads Dashboard & Dialog Streamlining):** Approve replacing the heavy 4-card KPI strip with a compact header metric bar, and reducing the "Add Customer Lead" dialog to 4 essential fields.
- [ ] **DECISION 6 (Platform Button & Badge Standardization):** Approve deprecating custom button variants (such as `variant="studio"`) and enforcing the 5 standard semantic variants across all admin screens.

---

## 11. Staged Implementation Plan (Post-Approval Roadmap)

Upon product-owner sign-off, implementation should proceed in four strictly isolated, verifiable tasks:

```
┌────────────────────────────────────────────────────────┐
│ Task T01: Image Studio Unified Pipeline & UI Redesign  │
│ - Implement "Enhance for Website" in ImageStudio       │
│ - Wire single Before/After review with Keep/Revert     │
│ - Retain backend operation mappings & immutability     │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Task T02: Image Quality Fixture Suite Verification    │
│ - Add representative fixtures (interior, hdr, texture) │
│ - Execute automated SkiaSharp decodability & delta tests│
│ - Inspect actual before/after pairs at scale           │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Task T03: Customer Leads UX & Form Streamlining        │
│ - Implement compact metric bar & scannable table       │
│ - Simplify Add Customer Lead dialog to 4 fields        │
│ - Retain full lead persistence & WhatsApp integrations │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Task T04: Platform Design Token & Button Consolidation │
│ - Remove variant="studio" and consolidate to 5 styles  │
│ - Standardize modal scrolling, focus, and status badges│
│ - Execute complete lint, build, and regression checks  │
└────────────────────────────────────────────────────────┘
```

---

*This document completes the research, audit, and decision-preparation requirements. Awaiting product-owner review and explicit approval of locked decisions.*
