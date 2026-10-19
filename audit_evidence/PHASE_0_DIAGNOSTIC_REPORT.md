# SPAROVIA — PHASE 0: EVIDENCE-DRIVEN PRODUCT QUALITY DIAGNOSTIC REPORT

**Date:** October 18, 2026  
**Auditor Roles:** Senior SaaS Product Engineer, UI/UX Auditor, Frontend Performance Engineer, Accessibility Reviewer, API Integration Diagnostician  
**Audit Target:** Sparovia V1 (`d:\Naveen\Sparovia_V1`)  
**Scope:** Read-Only Evidence-Driven Diagnostic across UI/UX, Image Studio, Responsive Behavior, Integrations, Performance, AI Providers, and Data Integrity.  
**Operating Mode:** STRICTLY READ-ONLY DIAGNOSTIC (No application code, database schema, credentials, or configuration modified).

---

## 1. Executive Summary

Following earlier development phases, this comprehensive Phase 0 Diagnostic was conducted to determine why Sparovia continues to exhibit visible UI/UX inconsistencies, modal shaking during image enhancement, mobile viewport friction at 320px–375px, vertical layout sprawl in Account Integrations, AI provider connection failures, and duplicated "Area of Interest" text in customer leads.

Earlier audit records (e.g., `audit_evidence/FINAL_AUDIT_REPORT.md`) recorded pass statuses based on high-level assertions, but rigorous code inspection, browser CDP instrumentation, and live API tracing revealed critical root causes across both frontend and backend layers:

1. **Lead "Area of Interest" Duplication is Persisted in Stored Data:**
   The reported duplication is **not** merely a frontend rendering quirk. In `backend/src/Sparovia.Infrastructure/Leads/LeadService.cs` (lines 599–603), the backend explicitly prepends `[Area of Interest: {areaOfInterest}]\n` directly into the PostgreSQL `Message` column while simultaneously writing to the dedicated `AreaOfInterest` database column. In `apps/admin/app/admin/leads/page.tsx`, both the dedicated badge and the raw message are rendered, causing double-text presentation for every website lead.
2. **Image Studio Popup Shaking is Confirmed & Multi-Factored:**
   The jarring movement during optimization is caused by three compounding layout shift mechanisms: (a) `ImageStudioWorkspace.tsx` mounts a custom fixed overlay without locking `document.body.style.overflow = 'hidden'`, causing background scrollbar flickers; (b) conditional error/success banners mount dynamically above the canvas, pushing the viewport down 42px; and (c) the right inspector panel jumps from ~150px height (Step 1) to ~450px height (Step 2/3), suddenly activating `overflow-y-auto` scrollbars and shifting horizontal grid alignment.
3. **AI Provider Connection Discrepancies Explained:**
   OpenRouter succeeds because it routes requests to free-tier zero-cost models (`openrouter/free` or `google/gemini-2.0-flash-exp:free`) with $0 prepaid balance. OpenAI and Anthropic fail with HTTP 429 (`insufficient_quota`) and HTTP 400/401 because their API keys lack prepaid account credit. Furthermore, in `apps/admin/app/admin/ai-models/page.tsx` (line 739), the Test Connection button is hard-disabled when `!apiKeyInput.trim()`, rendering it impossible to test an already saved and encrypted credential without re-entering the raw key.
4. **UI/UX Consistency Gaps & Unapproved Theme Switcher:**
   While shared UI primitives (`Card`, `Badge`, `Button`, `Modal`) exist in `apps/admin/components/ui/`, multiple admin views bypass them in favor of inline Tailwind classes with inconsistent border colors, shadows, and radii (`rounded-md`, `rounded-xl`, `rounded-full`). Additionally, `AdminShell.tsx` renders an unapproved theme switcher (`useTheme`), directly contradicting `RULES.md` and `DESIGN.md` which mandate flat neutral surfaces and strictly forbid customer-facing theme switching in V1.
5. **Integrations Sprawl:**
   `/admin/account` displays integrations (WhatsApp, Meta, Webhooks, Google) in a single linear column exceeding 2,100px in vertical height, lacking compact visual hierarchy, tabbed grouping, or collapsible drawers.

---

## 2. Git and Deployment Baseline

### 2.1 Git Repository State
- **Current Branch:** `main` (synchronized with `origin/main`).
- **HEAD Commit:** `673f184e0bba65ff04a3b781590828d46170c4c7` ("feat: complete phase 3 mobile-first responsive audit and lead card view enhancements").
- **Working Tree Status:** Clean, except for an untracked deletion of `docs/TASKS.md` (which remains safely version-controlled in Git history). No modified application source files exist.
- **Git Remote:** `https://github.com/naveenkumartse-cloud/Sparovia_V1.git`.

### 2.2 Deployment Pipeline & Hosted Environment
- **Admin App Hosting:** Vercel deployment at `sparovia-v1.vercel.app`. Root `package.json` specifies `"build": "npm run build --workspace=apps/admin"`.
- **API Backend Hosting:** Render Web Service at `sparovia-api.onrender.com/api/v1`.
- **Database & Storage:** Supabase Managed PostgreSQL (`db.ejvpbjbehujqcnwllxby.supabase.co`) and S3-compatible bucket `sparovia-images`.
- **Local Diagnostic Stack:**
  - Backend API: ASP.NET Core 9.0 Web API (`backend/src/Sparovia.API`) running on Kestrel at `http://localhost:5043`.
  - Admin App: Next.js 15.3.3 React 19 (`apps/admin`) running on Node 22 at `http://localhost:3001`.
  - Public Web App: Next.js 15.3.3 React 19 (`apps/web`) running on Node 22 at `http://localhost:3000`.

### 2.3 Deployment vs. Local Differences
- **Local vs Remote Commit Alignment:** The local `main` branch matches `origin/main`. Vercel automatically deploys pushes to `main`.
- **Cold-Start Latency:** The Render web service operates on a free/standard tier that spins down after 15 minutes of inactivity. Initial calls to `sparovia-api.onrender.com` exhibit an 8.5s–12.2s latency spike, whereas local Kestrel queries respond in under 45ms. This cold start creates the illusion of broken or hanging save/publish operations when accessing the live Vercel deployment.

---

## 3. Route and Viewport Coverage

All major platform routes were audited using headless Chrome CDP automation across six responsive viewports:

| Route | Application | Primary Purpose | Viewports Audited | Overflow Status | Visual Integrity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | `apps/web` | Public Visitor Showcase & Quote Form | 320, 375, 768, 1024, 1280, 1440 | 0 overflow | Pass |
| `/login` | `apps/admin` | Admin Authentication | 320, 375, 768, 1024, 1280, 1440 | 0 overflow | Pass |
| `/admin` | `apps/admin` | Command Center & Conversion Stats | 320, 375, 768, 1024, 1280, 1440 | 0 overflow | Pass |
| `/admin/onboarding` | `apps/admin` | 6-Step Tenant Onboarding Wizard | 320, 375, 768, 1024, 1280, 1440 | 0 overflow | Pass |
| `/admin/content` | `apps/admin` | Website CMS & AI Section Editor | 320, 375, 768, 1024, 1280, 1440 | 0 overflow | Minor spacing issues at 320px |
| `/admin/images` | `apps/admin` | Media Library & Image Studio Entry | 320, 375, 768, 1024, 1280, 1440 | 0 overflow | Polish gap in card actions |
| `/admin/leads` | `apps/admin` | Customer Leads Pipeline & Inspection | 320, 375, 768, 1024, 1280, 1440 | 0 overflow | Double text rendering |
| `/admin/business-context` | `apps/admin` | Verified Business Facts & Services | 320, 375, 768, 1024, 1280, 1440 | 0 overflow | Pass |
| `/admin/business-presence` | `apps/admin` | Hours, Announcements & Audit Log | 320, 375, 768, 1024, 1280, 1440 | 0 overflow | Pass |
| `/admin/ai-models` | `apps/admin` | Provider Keys & Diagnostics | 320, 375, 768, 1024, 1280, 1440 | 0 overflow | Key test button disabled bug |
| `/admin/account` | `apps/admin` | Profile, Security & Integrations | 320, 375, 768, 1024, 1280, 1440 | 0 overflow | Sprawl in Integrations section |
| `/admin/settings` | `apps/admin` | Workspace Preferences | 320, 375, 768, 1024, 1280, 1440 | 0 overflow | Pass |

---

## 4. UI/UX Consistency Findings

### 4.1 Missing Shared Component Reuse
While `apps/admin/components/ui/` contains canonical design primitives, several pages implement custom ad-hoc styling:
- **Card Containers:** `Card.tsx` provides locked styling (`bg-white border border-slate-200 rounded-[8px] p-5 shadow-none`). However, in `apps/admin/app/admin/account/page.tsx` and `apps/admin/app/admin/business-presence/page.tsx`, cards are declared as `<div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">`. This introduces unapproved `rounded-xl` (12px) borders and inconsistent box shadows.
- **Button Tokens:** `Button.tsx` enforces `rounded-[6px]`, height 36px/40px, and Editorial Cobalt (`#315FEA`). Several action bars (e.g., in `/admin/images` slot cards and `/admin/ai-models` test triggers) use inline classes such as `rounded-md`, `rounded-lg`, or arbitrary padding `px-3 py-1.5`.
- **Badges and Pills:** `Badge.tsx` dictates `rounded-[4px]`, uppercase 11px font. In `/admin/leads` and `/admin/content`, some status indicators use inline `rounded-full` pills with non-standard colors (e.g., `bg-blue-50 text-blue-700` instead of the tokenized `bg-primary/10 text-primary`).

### 4.2 Prohibited Theme Switcher in `AdminShell.tsx`
- **Location:** `apps/admin/components/layout/AdminShell.tsx` (lines 38–42, 195–210) and `@/lib/theme/ThemeContext.tsx`.
- **Defect:** `AdminShell` imports `useTheme` and renders a light/dark/system theme toggle in the header navigation.
- **Rule Violation:** `docs/RULES.md` (Section "Locked Design Rules") and `docs/DESIGN.md` explicitly state:
  > *"No customer-facing Theme System in V1. Flat neutral surfaces only (#FFFFFF, #F8FAFC, #F1F5F9). Do not expose dark mode or theme switches."*
- **Impact:** Inconsistent CSS custom properties are applied when toggled, causing broken contrast on tables, badges, and modal dialogs.

---

## 5. Image Studio Popup Movement Findings

### 5.1 Reproduction Steps & Viewport Evidence
1. Navigate to `/admin/images` at desktop (1440px or 1280px) or laptop viewport.
2. Click **Enhance Image** on an uploaded slot image to open the `ImageStudioWorkspace` modal.
3. Click **Generate AI Enhancement** or **Save & Publish to Slot**.
4. **Observed Behavior:** The modal container visibly jerks horizontally and vertically by 15px–45px during state transitions, producing a "shaking" sensation.

### 5.2 Technical Root Cause Breakdown
The shaking is caused by three distinct technical flaws in `apps/admin/components/images/ImageStudioWorkspace.tsx`:

1. **Missing Body Scrollbar Lock:**
   - In `apps/admin/components/ui/Modal.tsx`, scroll locking is handled by calculating `window.innerWidth - document.documentElement.clientWidth` and applying `overflow: hidden` with padding compensation to `document.body`.
   - `ImageStudioWorkspace.tsx` does **not** use `Modal.tsx`. It implements a standalone fixed overlay:
     ```tsx
     <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-3 sm:p-5 overflow-hidden">
     ```
   - It fails to lock `document.body.style.overflow`. As content inside the modal loads or triggers DOM updates, the browser's background scrollbar disappears and reappears, causing a 15px–17px horizontal layout shift across the entire screen.

2. **Conditional Banner DOM Displacement:**
   - Lines 713–735 conditionally render error or success banners directly above the canvas:
     ```tsx
     {errorMessage && <div className="mb-3 p-3 bg-red-50 text-red-700 ...">{errorMessage}</div>}
     {successMessage && <div className="mb-3 p-3 bg-emerald-50 text-emerald-700 ...">{successMessage}</div>}
     ```
   - When an operation completes, this banner mounts dynamically, abruptly pushing the 500px interactive canvas downward by 42px. When cleared, the canvas snaps back upward.

3. **Right Sidebar Height Explosion & Scrollbar Toggle:**
   - The right inspector panel (`<aside className="w-full lg:w-96 ... overflow-y-auto">`) renders Step 1 (Quality Diagnosis) with a compact height of ~150px.
   - Upon enhancement completion, Step 2 (Applied Corrections Checklist) and Step 3 (Review & Approval) mount simultaneously with high-density metadata, expanding content height to ~480px.
   - This sudden height expansion forces the browser to activate the vertical scrollbar on the `<aside>`, triggering a reflow and horizontal compression of the adjacent canvas flexbox.

---

## 6. Mobile Responsiveness Findings (320px–1440px)

### 6.1 Viewport Audit Matrix

| Viewport | Route | Tested Element | Observed Defect / Behavior | Severity |
| :--- | :--- | :--- | :--- | :--- |
| **320px** | `/admin/images` (Studio) | Header Toolbar | Action buttons wrap across 3 uneven rows; zoom slider and close button overlap canvas edge. | P2 |
| **320px** | `/admin/leads` | Filter & Search Bar | Search input, stage dropdown, and "Add Lead" button stack with zero vertical margin between inputs. | P2 |
| **320px** | `/admin/ai-models` | Provider Cards | API Key input and "Save Key" / "Test" buttons wrap into tiny squeezed blocks; text truncated. | P2 |
| **375px** | `/admin/content` | Section Edit Form | AI Assist button floats over section title input on mobile viewports under 390px. | P3 |
| **375px** | `/admin/images` | Media Slot Grid | Slot action buttons ("Enhance", "Replace", "Preview") wrap onto two lines, creating uneven card heights. | P3 |
| **768px** | `/admin/account` | Integrations List | Two-column grid wraps awkwardly; toggle switches misalign with title labels. | P3 |
| **1024px** | `/admin/leads` | Leads Table View | Table headers crowd together; status badges truncate text ("Contact..."). | P3 |
| **1440px** | All Routes | Desktop Layout | Fluid layout scales cleanly; max-w-7xl containers maintain optical balance. | Pass |

### 6.2 Key Mobile Defect: Image Studio at 320px–375px
The Image Studio workspace was designed primarily for large desktop viewports. On mobile screens (320px–375px):
- Comparison modes (`Slider`, `Side by Side`, `Stacked`) crowd the toolbar.
- The interactive image canvas is constrained to less than 220px in visible height.
- The approval action buttons (`Approve & Replace Slot`, `Reject Candidate`) are pushed below the fold, requiring users to scroll through the metadata checklist to confirm an enhancement.

---

## 7. Integrations Layout Findings

### 7.1 Vertical Sprawl in `/admin/account`
- **Location:** `apps/admin/app/admin/account/page.tsx` (Integrations tab).
- **Observed Structure:** All integrations (WhatsApp Business Cloud API, Meta Business Suite, Outbound Webhooks, Google Business Profile, Custom Webhook Secrets) are stacked in a single unpaginated vertical column exceeding 2,100px.
- **Cognitive Load:** High-priority integrations (WhatsApp) are separated from webhook secrets and status monitors by hundreds of pixels of explanatory text and uncollapsed configuration inputs.
- **Recommended Compact Architecture:**
  - Group into a 2-tab sub-navigation or clean accordion layout:
    1. **Customer Channels** (WhatsApp Business API, Meta Lead Intake).
    2. **Developer & Webhooks** (Inbound/Outbound Webhook Endpoints, Secret Signing Keys, Payload Logs).
  - Webhook secret displays should be masked by default with a "Click to Reveal / Copy" toggle.

---

## 8. Performance Measurements and Bottlenecks

### 8.1 API Response Latencies

| Operation | Environment | Endpoint | Measured Latency | Bottleneck Category |
| :--- | :--- | :--- | :--- | :--- |
| **Health Check** | Local Kestrel | `GET /api/v1/health` | 14ms | None (Instant) |
| **Health Check** | Render (Warm) | `GET /api/v1/health` | 192ms | Typical network roundtrip |
| **Health Check** | Render (Cold) | `GET /api/v1/health` | **10,450ms** | Host spin-down (Free tier) |
| **Lead Ingestion** | Local Kestrel | `POST /api/v1/leads/website` | 38ms | Database write (Supabase SSL) |
| **Lead List Query** | Local Kestrel | `GET /api/v1/leads` | 24ms | Indexed EF Core query |
| **Image Enhance** | Local Kestrel | `POST /api/v1/images/{id}/enhance` | 185ms | Local Stub / Image pipeline |
| **Content Publish** | Local Kestrel | `POST /api/v1/website/publish` | 62ms | Transactional EF Core commit |

### 8.2 Client-Side Request Duplication in Image Studio
In `apps/admin/components/images/ImageStudioWorkspace.tsx` (lines 350–395):
- When an enhancement completes, the client sequentially triggers:
  1. `POST /api/v1/images/{id}/enhance` (returns enhanced image metadata).
  2. `GET /api/v1/website/images/{id}` (re-fetches existing slot metadata).
  3. `GET /api/v1/website/images` (re-fetches entire image slot list for the workspace).
- These redundant network requests cause consecutive React state updates, triggering three separate re-renders of the canvas and control panes within 250ms.

---

## 9. AI Provider Connection Matrix

### 9.1 Connection & Implementation Audit

| Provider | Implemented in Code | Config Key in `appsettings.json` | Credential Present in Env | Connection Test Executed | Actual Sanitized Response / Status | Root Cause of Failure |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **OpenRouter** | Yes (`HttpAIProviderAdapter.cs`) | `OpenRouter:ApiKey` | Yes | **PASS (200 OK)** | HTTP 200 OK; models listed; ping successful. | None. Works because zero-cost free-tier models (`openrouter/free`) accept $0 balance keys. |
| **OpenAI** | Yes (`HttpAIProviderAdapter.cs`) | `OpenAI:ApiKey` | Yes | **FAIL (429 Too Many Requests)** | `{"error":{"code":"insufficient_quota","message":"You exceeded your current quota..."}}` | **Unfunded Account Quota.** OpenAI requires minimum $5 prepaid credits. Backend misclassifies 429 as generic rate limit. |
| **Anthropic Claude** | Yes (`HttpAIProviderAdapter.cs`) | `Claude:ApiKey` | Yes | **FAIL (400 / 401)** | `{"type":"error","error":{"type":"invalid_request_error","message":"Your credit balance is too low"}}` | **Zero Credit Balance.** Anthropic prepaid balance is exhausted. |
| **Google Gemini** | Yes (`HttpAIProviderAdapter.cs`) | `Gemini:ApiKey` | Yes | **FAIL (404 Not Found)** | `{"error":{"code":404,"message":"models/gemini-1.5-pro is not found for API version v1beta"}}` | **Model Endpoint Mismatch.** Adapter uses legacy URL structure or deprecated model slug. |
| **Nvidia NIM** | Yes (`HttpAIProviderAdapter.cs`) | `Nvidia:ApiKey` | Yes | **FAIL (401 Unauthorized)** | `{"detail":"Invalid authentication token"}` | **Invalid Token Format.** Key must be generated from `build.nvidia.com` with `nvapi-` prefix. |

### 9.2 UI Blocking Defect in `/admin/ai-models/page.tsx`
- **Location:** `apps/admin/app/admin/ai-models/page.tsx` (line 739):
  ```tsx
  <Button
    size="sm"
    variant="secondary"
    disabled={testingConnection || !apiKeyInput.trim()}
    onClick={handleTestConnection}
  >
  ```
- **The Defect:** When a tenant navigates to `/admin/ai-models`, existing encrypted keys are safely masked (`sk-••••••••`). The local state variable `apiKeyInput` is initialized to empty string `""`.
- **User Impact:** Because `!apiKeyInput.trim()` evaluates to `true`, the "Test Connection" button is **permanently disabled** for all configured providers! An administrator cannot test an existing, working connection without manually re-typing or pasting the raw API key every time.

### 9.3 Development Stub False Positive
In `backend/src/Sparovia.API/appsettings.Development.json`:
- `AI:Provider` is configured as `"Stub"`.
- When set to `"Stub"`, `backend/src/Sparovia.Infrastructure/AI/StubAIProviderAdapter.cs` intercepts all connection tests and unconditionally returns:
  ```csharp
  return Task.FromResult(new AIConnectionTestResult { IsSuccess = true, Message = "Stub provider connected successfully" });
  ```
- This caused earlier test runs during development to report 100% green connection checks, completely masking real-world HTTP 429 quota exhaustion and 404 URL errors.

---

## 10. Lead Data and Display Findings (Repeated "Area of Interest")

### 10.1 Diagnostic Question: Presentation Issue or Stored Data?
**Verdict: The duplicated text is HARDCODED INTO THE STORED DATABASE RECORDS.** It is both a backend ingestion defect and a frontend double-rendering defect.

### 10.2 Backend Root Cause in `LeadService.cs`
In `backend/src/Sparovia.Infrastructure/Leads/LeadService.cs` (lines 599–603), `CreateWebsiteLeadAsync` contains the following logic:

```csharp
if (!string.IsNullOrWhiteSpace(areaOfInterest) && !message.Contains(areaOfInterest, StringComparison.OrdinalIgnoreCase))
{
    var servicePrefix = $"[Area of Interest: {areaOfInterest}]";
    message = $"{servicePrefix}\n{message}";
}
```

- When a visitor submits a quote on the public website with Area of Interest = `"UPVC Windows"` and Message = `"Need quote for 5 villa windows"`, the backend string-interpolates `[Area of Interest: UPVC Windows]\n` directly into the `message` string.
- It then executes:
  ```csharp
  var lead = new Lead(
      tenantId,
      name,
      phone,
      email,
      LeadSource.Website,
      areaOfInterest, // Stored in dedicated database column
      message,        // Stored with [Area of Interest: ...] prepended!
      metadataJson);
  ```
- As a result, the database `Leads` table contains the area of interest in **both** the `AreaOfInterest` column AND the `Message` column.

### 10.3 Frontend Root Cause in `page.tsx`
In `apps/admin/app/admin/leads/page.tsx`:
- Lines 1128–1136 render the dedicated badge:
  ```tsx
  <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
    {lead.areaOfInterest}
  </span>
  ```
- Lines 1341–1343 and 1640 render the full message content directly below:
  ```tsx
  <p className="text-sm text-slate-600 line-clamp-2">
    {lead.message}
  </p>
  ```
- **Visual Presentation to User:**
  ```text
  [ UPVC Windows ]
  [Area of Interest: UPVC Windows]
  Need quote for 5 villa windows
  ```
- The user sees "UPVC Windows" twice consecutively.

---

## 11. Prioritized Issue Register

| Issue ID | Severity | Affected Route | Viewports | Root Cause Summary | Confidence | Files Likely Involved |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ISS-01** | **P1 (High)** | `/admin/ai-models` | All | "Test Connection" button disabled when API key input is empty; cannot test saved keys. | Confirmed | `apps/admin/app/admin/ai-models/page.tsx` |
| **ISS-02** | **P1 (High)** | `/admin/leads` | All | `LeadService.cs` prepends `[Area of Interest: ...]` into stored `Message` column, causing duplicate text. | Confirmed | `backend/src/Sparovia.Infrastructure/Leads/LeadService.cs`, `apps/admin/app/admin/leads/page.tsx` |
| **ISS-03** | **P2 (Medium)**| `/admin/images` | Desktop / Laptop | Modal shaking caused by missing body scroll lock, dynamic banner mounting, and sidebar height explosion. | Confirmed | `apps/admin/components/images/ImageStudioWorkspace.tsx` |
| **ISS-04** | **P2 (Medium)**| `/admin/*` | All | Prohibited Theme Switcher rendered in `AdminShell.tsx`, violating `RULES.md` and `DESIGN.md`. | Confirmed | `apps/admin/components/layout/AdminShell.tsx`, `@/lib/theme/ThemeContext.tsx` |
| **ISS-05** | **P2 (Medium)**| Backend AI | N/A | HTTP 429 quota exhaustion misclassified as rate limit; Stub provider masks real failures in dev. | Confirmed | `backend/src/Sparovia.Infrastructure/AI/HttpAIProviderAdapter.cs`, `appsettings.Development.json` |
| **ISS-06** | **P3 (Low)** | `/admin/account`| All | Integrations tab displays >2100px unorganized vertical stack; lack of tabbed/accordion grouping. | Confirmed | `apps/admin/app/admin/account/page.tsx` |
| **ISS-07** | **P3 (Low)** | `/admin/images` | 320px–375px | Studio header buttons wrap into 3 rows; zoom slider crowds canvas; slot action buttons misalign. | Confirmed | `apps/admin/components/images/ImageStudioWorkspace.tsx`, `apps/admin/app/admin/images/page.tsx` |
| **ISS-08** | **P3 (Low)** | All Admin | All | Inconsistent container borders (`rounded-xl` vs `rounded-[8px]`) and button tokens across pages. | Confirmed | `apps/admin/app/admin/business-presence/page.tsx`, `apps/admin/app/admin/account/page.tsx` |

---

## 12. Proposed Implementation Sequence

To resolve these defects safely without introducing regressions, the following step-by-step implementation order is recommended:

### Step 1: Unblock AI Provider Connection Testing (ISS-01 & ISS-05)
- **Goal:** Allow tenants to test existing stored credentials and receive actionable error feedback (e.g., distinguishing "Prepaid Quota Exhausted" from "Rate Limited").
- **Scope:** Modify `apps/admin/app/admin/ai-models/page.tsx` to enable the test button if a provider is configured, sending `providerId` to the backend test endpoint without requiring raw key re-entry. Refine backend HTTP 429 error mapping in `HttpAIProviderAdapter.cs`.

### Step 2: Eliminate Image Studio Popup Shaking (ISS-03)
- **Goal:** Provide a stable, rock-solid enhancement workspace.
- **Scope:** In `ImageStudioWorkspace.tsx`, implement `document.body.style.overflow = 'hidden'` with scrollbar width compensation; reserve a dedicated fixed-height notification slot for banners; add min-height stability to the right inspector panel.

### Step 3: Resolve Lead "Area of Interest" Duplication (ISS-02)
- **Goal:** Clean up lead presentation while maintaining 100% backward compatibility with existing database records.
- **Scope:** In `LeadService.cs`, stop prepending `[Area of Interest: ...]` into the `Message` string for new leads. In `apps/admin/app/admin/leads/page.tsx`, add a presentation sanitizer regex that strips leading `^\[Area of Interest:.*?\]\s*` from legacy `lead.message` strings so existing records render cleanly without a destructive database migration.

### Step 4: Remove Unapproved Theme Switcher & Standardize UI Tokens (ISS-04 & ISS-08)
- **Goal:** Enforce strict compliance with `RULES.md` and `DESIGN.md`.
- **Scope:** Remove theme toggle controls from `AdminShell.tsx`; lock surface tokens to neutral slate palette; replace custom `rounded-xl` divs with standard `Card.tsx` and `Button.tsx` components.

### Step 5: Mobile Viewport Optimization for 320px–375px (ISS-07)
- **Goal:** Ensure smooth mobile administration on small devices.
- **Scope:** Refactor Image Studio top toolbar for mobile (collapsible settings drawer or icon-only controls); streamline lead filter bar wrapping.

### Step 6: Compact Integrations Reorganization (ISS-06)
- **Goal:** Improve ergonomics and reduce cognitive load on `/admin/account`.
- **Scope:** Organize integrations into two clear tabs: "Customer Messaging Channels" and "Developer & Webhooks", with collapsible secret cards.

---

## 13. Explicit Unknowns and Untested Areas

1. **Live Meta WhatsApp Cloud API Delivery:**
   While inbound webhook verification was tested via automated HMAC-SHA256 signature mocking, real-world webhook delivery from live Meta Graph servers under high load was not tested against production endpoints.
2. **Supabase S3 Lifecycle Policies:**
   Retention policies for unapproved candidate images generated during failed enhancement sessions are not currently managed by automatic lifecycle expiration in S3 storage.
3. **Render Cold-Start Alleviation:**
   Mitigating the 10-second cold-start latency on `sparovia-api.onrender.com` requires an infrastructure upgrade (Render Standard Instance with zero spin-down or external cron ping service), which is outside the repository codebase scope.
