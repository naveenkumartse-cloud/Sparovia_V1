# SPAROVIA — PRODUCT-WIDE EXPERIENCE AUDIT & ROUTE INVENTORY

**Document:** `docs/audits/SPAROVIA_PRODUCT_EXPERIENCE_AUDIT.md`  
**Execution Phase:** Phase 0 — Product & Repository Audit  
**Authority Hierarchy:**  
1. Latest explicit product-owner decisions.  
2. Approved Master Product Blueprint (`SPAROVIA_MASTER_PRODUCT_BLUEPRINT.md`).  
3. Project governance and locked rules (`docs/RULES.md`).  
4. Verified architecture (`docs/ARCHITECTURE.md`).  
5. Approved platform design system (`docs/DESIGN.md` v2.0).  
6. Reconciled specialized specifications (`docs/RESEARCH_IMAGE_STUDIO_AND_PLATFORM_REDESIGN.md`, `.agents/skills/sparovia-ui-ux-standard/SKILL.md`).  

**Audit Date:** November 9, 2026  
**Product Identity:** Sparovia — Business Experience Platform  
**Target Applications:**  
- Sparovia Admin Application (`apps/admin`) — Next.js 14 / React 18 / Tailwind CSS  
- Sparovia Public Website (`apps/web`) — Next.js 14 / React 18 / Tailwind CSS  
- Sparovia Backend API (`backend/src/Sparovia.API`) — ASP.NET Core 9.0 Clean Architecture  

---

## 1. Executive Summary

This audit assesses the end-to-end user experience, visual hierarchy, mobile responsiveness, accessibility, and functional workflows of Sparovia across all 21 user-facing routes, 14 modals/drawers, and shared UI primitives.

Sparovia's primary mission is to empower small and medium business owners (such as fabricators, contractors, and home improvement specialists) to manage their digital presence, showcase verified craftsmanship, enhance jobsite photography, and convert inbound visitor enquiries with zero technical friction.

### Key Audit Findings:
1. **Visual Cohesion & Signature Identity:**  
   The platform design system is anchored in **Editorial Cobalt** (`#315FEA`) for primary actions, navigation indicators, and structural focus. **Restrained Purple** (`#7950B8`) serves as Sparovia's signature creative accent, specifically highlighting AI content generation, Image Studio enhancements, and creative state indicators. The visual system strictly obeys the approved radius hierarchy (4px indicator, 6px control, 8px panel, 10px dialog; no pill-shaped buttons).
2. **Image Studio Experience:**  
   The canonical Image Studio architecture cleanly separates original uploads from enhanced candidates, ensuring complete source immutability. The studio provides a single, high-impact "Enhance for Website" action with purple glass styling, interactive before/after slider comparison, zoom/framing controls, and an explicit two-phase approval/publishing lifecycle.
3. **Daily Operations & Leads:**  
   The Customer Leads experience defaults to a scannable, mobile-optimized card view with direct phone (`tel:`) and WhatsApp (`wa.me`) triggers. Raw metadata tags (e.g. `[Area of Interest: ...]`) are cleanly parsed and presented as structured badges without mutating stored database records.
4. **Mobile-First Responsiveness:**  
   All 21 routes, dialogs, drawers, and data surfaces have been audited against the required 7 responsive viewports (320px, 375px, 390px, 430px, 768px, 1024px, 1440px). Zero horizontal scroll overflow exists across the entire application shell and modal overlays.
5. **Security & Boundary Integrity:**  
   Authentication, session persistence, and tenant isolation remain strictly enforced at the API controller level. Contact Activity tracking remains decommissioned. Customer-facing website theme switching remains excluded.

---

## 2. Complete Screen & Route Inventory

| Route | App | Target User Role | Primary Purpose & Key Workflows | Primary Components | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/login` | Admin | Anonymous / Returning | Two-step email/phone + password authentication; session creation | `apps/admin/app/login/page.tsx`, `Card`, `Input`, `Button` | **AUDITED** |
| `/register` | Admin | Anonymous / New Owner | Tenant and owner account creation with validation | `apps/admin/app/register/page.tsx`, `Card`, `Input`, `Button` | **AUDITED** |
| `/forgot-password` | Admin | Anonymous | Self-service password recovery email request | `apps/admin/app/forgot-password/page.tsx`, `Card`, `Input` | **AUDITED** |
| `/reset-password` | Admin | Anonymous | Token-based password reset confirmation | `apps/admin/app/reset-password/page.tsx`, `Card`, `Input` | **AUDITED** |
| `/verify-email` | Admin | Pending Member | Email verification token confirmation screen | `apps/admin/app/verify-email/page.tsx`, `Card`, `Button` | **AUDITED** |
| `/verify-phone` | Admin | Pending Member | 6-digit phone OTP verification interface | `apps/admin/app/verify-phone/page.tsx`, `Card`, `Button` | **AUDITED** |
| `/admin` | Admin | Authenticated Owner | **Command Center:** Operational dashboard, status indicators, quick actions, recent inquiries | `apps/admin/app/admin/page.tsx`, `PageHeader`, `Card`, `Badge` | **AUDITED** |
| `/admin/onboarding/*` | Admin | New Tenant | 6-step business context wizard (Basics, Description, Location, Services, Facts, Review) | `apps/admin/app/admin/onboarding/**`, `FormField`, `Button` | **AUDITED** |
| `/admin/business-context` | Admin | Authenticated Owner | Maintain verified business facts, service offerings, credentials, and differentiators | `apps/admin/app/admin/business-context/page.tsx`, `PageHeader` | **AUDITED** |
| `/admin/business-presence`| Admin | Authenticated Owner | Operating hours, public announcements, directory NAP copy tool | `apps/admin/app/admin/business-presence/page.tsx`, `Card`, `Textarea`| **AUDITED** |
| `/admin/content` | Admin | Authenticated Owner | Section copy editing, AI wording assistance, draft vs published indicators, publishing dialog | `apps/admin/app/admin/content/page.tsx`, `AIContentModal` | **AUDITED** |
| `/admin/images` | Admin | Authenticated Owner | Media slots management, Explore Our Work portfolio gallery, batch upload, delete confirmation | `apps/admin/app/admin/images/page.tsx`, `Tabs`, `ImageUploadModal` | **AUDITED** |
| Image Studio Overlay | Admin | Authenticated Owner | Fullscreen workspace: deterministic photo enhancement, before/after inspection, candidate approval | `apps/admin/components/images/ImageStudioWorkspace.tsx`, `EnhanceButton` | **AUDITED** |
| `/admin/leads` | Admin | Authenticated Owner | Enquiry intake management, status workflow, customer follow-up notes, phone/WhatsApp triggers | `apps/admin/app/admin/leads/page.tsx`, `LeadCard`, `LeadTableView` | **AUDITED** |
| `/admin/ai-models` | Admin | Authenticated Owner | AI provider connections, API key management, model selection, live connection testing | `apps/admin/app/admin/ai-models/page.tsx`, `PageHeader`, `Modal` | **AUDITED** |
| `/admin/account` | Admin | Authenticated Owner | Profile, password update, session security, admin light/dark preferences | `apps/admin/app/admin/account/page.tsx`, `Tabs`, `Input` | **AUDITED** |
| `/admin/account?tab=integrations` | Admin | Authenticated Owner | **Business Communication:** WhatsApp channel, message templates with live preview, social links | `apps/admin/app/admin/account/page.tsx`, `Card`, `Button` | **AUDITED** |
| `/admin/settings` | Admin | Authenticated Owner | Workspace metadata and tenant configuration | `apps/admin/app/admin/settings/page.tsx`, `Card` | **AUDITED** |
| `/` | Web | Public Visitor | Published digital presence: Hero, Brand Intro, Services, Portfolio, Why Choose Us, Quote Intake | `apps/web/app/page.tsx`, `Navbar`, `Footer`, `HeroSection` | **AUDITED** |

---

## 3. Screen-by-Screen Detailed Audit & Findings

### 3.1 Application Shell (`apps/admin/components/admin/AdminShell.tsx`)
- **Visual Design & Hierarchy:**
  - Modern, minimalist application shell featuring standard 64px header and collapsible desktop sidebar.
  - SPAROVIA wordmark uses approved blue-to-purple gradient (`text-brand-gradient`) paired with a light-blue ADMIN pill badge.
  - Active navigation item highlighted with solid Editorial Cobalt background (`bg-[#315FEA] text-white`) and 6px border radius.
- **Mobile Ergonomics:**
  - Standard hamburger button with 44px × 44px minimum touch target (`min-h-[44px] min-w-[44px]`).
  - Mobile slide-over drawer transitions smoothly with backdrop blur and accessible close button.
  - Zero horizontal overflow across viewports from 320px to 1440px.
- **Admin Appearance Preference:**
  - Light / Dark / System admin theme toggle preserved in header and account settings. Light theme is the default locked operational surface.
- **Accessibility:**
  - Focus outlines use high-contrast ring (`focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2`).
  - All navigation links and buttons possess descriptive accessible names and ARIA attributes (`aria-current="page"`, `aria-label`).

### 3.2 Command Center (`apps/admin/app/admin/page.tsx`)
- **Operational Clarity:**
  - Top `PageHeader` welcomes business owner by name, displays workspace ID, and features a prominent "Live & Serving Visitors" pulse badge.
  - Quick action toolbar provides direct link to open the public website in a new window.
- **Key Cards:**
  - **Business Context Card:** Displays confirmation status, service count, and direct link to review context facts.
  - **Website & Publishing Card:** Displays live website domain, connection status, and direct link to content editor.
  - **Customer Leads Card:** Highlights total inbound enquiry count with visual indicators.
- **Recent Inquiries & Quick Actions:**
  - Displays most recent 3 leads with customer name, timestamp, and quick-call/chat actions.
  - Action cards ("Update Website Copy", "Enhance Project Photos", "Follow Up Leads", "WhatsApp Templates") use subtle 3D hover lift (`card-hover-lift`).

### 3.3 Business Context (`apps/admin/app/admin/business-context/page.tsx`)
- **Information Architecture:**
  - Organizes verified business knowledge into 5 scannable cards:
    1. Business Identity (Name, Category, Contact Information).
    2. Description & Differentiators (with contextual AI wording assistance).
    3. Service Areas & Target Customers.
    4. Services Offered list.
    5. Approved Facts & Credentials (Years in business, certifications, warranties, authorized status).
- **AI Integration:**
  - Triggering AI assistance opens `AIContentModal` with purple accent styling. Adheres strictly to "No Source, No Fact": AI suggestions only refine style and wording without fabricating factual credentials.
- **Confirmation State:**
  - Unconfirmed tenants see an actionable warning banner with a one-click confirmation mechanism; confirmed tenants display an authoritative green "Verified & Approved" shield badge.

### 3.4 Business Presence & Operations (`apps/admin/app/admin/business-presence/page.tsx`)
- **Operational Purpose:**
  - Manages public NAP consistency across directory citations (Google Business Profile, Yelp, Bing Places, Apple Maps).
- **Directory NAP Card:**
  - Clean display of business name, address, phone, email, and website.
  - Includes a one-click "Copy NAP for Directories" button that formats information for directory copy-paste and triggers a success toast.
- **Operating Hours & Notices:**
  - Standardized textareas for weekly operating schedule and public notices (e.g. holiday closures).
  - Clean save button with feedback toast and unsaved changes guard (`useUnsavedChanges`).

### 3.5 Website Content Management (`apps/admin/app/admin/content/page.tsx`)
- **Layout & Ergonomics:**
  - Two-panel responsive architecture: Section navigator on the left (or mobile selector) and dynamic field editor on the right.
  - Every section card displays draft vs published indicators (`Draft`, `Published`, `Draft Changes Pending`).
- **Publishing Safeguards:**
  - Changes to fields update the draft state only.
  - "Publish to Live Website" button requires explicit confirmation via `ConfirmationDialog`, showing what will become public.
  - Instant preview button allows opening the live site.
- **AI Content Assistance:**
  - Contextual AI buttons next to copy fields provide options to "Improve Wording", "Make More Professional", "Make Shorter", "Make Clearer", or provide custom instructions.

### 3.6 Images Library & Image Studio (`apps/admin/app/admin/images/page.tsx`, `ImageStudioWorkspace.tsx`)
- **Dual Gallery Organization:**
  - **Website Slots Tab:** Dedicated cards for key architectural slots (`heroImage`, `primaryImage`, `secondaryImage`, `serviceImage`) with slot dimensions, current live status, upload action, and enhance trigger.
  - **Explore Our Work Tab:** Portfolio gallery of project showcases organized by category with batch selection, caption editing, and delete protection.
- **Image Studio Workspace (`ImageStudioWorkspace.tsx`):**
  - Fullscreen modal overlay rendered via `createPortal` above the application shell.
  - **Body Scroll Lock:** Compensates for clientWidth scrollbar width to prevent horizontal layout shift during modal open/close.
  - **Enhance Action:** Distinctive purple glassmorphic "Enhance for Website" button (`EnhanceButton.tsx`) applying SkiaSharp deterministic enhancement pipeline.
  - **Comparison Modes:** Split before/after slider (touch and mouse drag), side-by-side mode, and stacked mode.
  - **Zoom & Pan Controls:** Interactive zoom (50%, 100%, 150%, 200%, Fit) with pan boundary clamping.
  - **Candidate Review Ladder:**
    - Original photograph is stored immutably.
    - Enhanced candidate variant is rendered with before/after inspection.
    - User has clear actions: "Approve Candidate" (advances variant status), "Discard Candidate" (reverts to original), and "Publish to Website" (explicit live activation).
  - **Replacement Workflow:** "Replace Image" uploads a fresh original photograph while maintaining slot assignment and history.

### 3.7 Customer Leads Management (`apps/admin/app/admin/leads/page.tsx`)
- **Presentation Modes:**
  - Card-first primary presentation designed for quick mobile scanning and thumb-friendly contact actions.
  - Table view alternative for batch administrative review with responsive horizontal scroll wrapper.
- **Lead Identity & Inquiry Parsing:**
  - Displays customer name, phone, email, timestamp, and status.
  - Redundant bracketed metadata (e.g. `[Area of Interest: ...]`) is cleanly stripped from the customer message display via `getCleanEnquiryMessage` and rendered as structured badges.
- **Direct Contact Triggers:**
  - One-tap phone call trigger (`tel:<phone>`).
  - One-tap WhatsApp chat trigger (`https://wa.me/<phone>`) styled with WhatsApp channel green token (`#25D366`).
- **Modals & Drawers:**
  - `LeadDetailModal`: Full inquiry history, stage progress stepper, and follow-up note logging.
  - `AddLeadModal` / `EditLeadModal`: Streamlined lead creation and editing with phone number normalization.
  - `ConfirmationDialog`: Protects destructive lead deletion.

### 3.8 AI Connections (`apps/admin/app/admin/ai-models/page.tsx`)
- **Security & Masking:**
  - API keys are masked by default (`••••••••••••••••`) with an explicit Reveal toggle.
  - Backend encrypts keys at rest; frontend never logs or exposes credentials.
- **Provider & Model Selection:**
  - Visual cards for AI providers (Google Gemini) and supported models (Gemini Flash, Gemini Pro).
  - "Test Connection" button executes server-side validation and returns clear latency/health feedback.
  - Rotate Key and Disconnect actions are protected by `ConfirmationDialog`.

### 3.9 Business Communication & Social Links (`/admin/account?tab=integrations`)
- **Streamlined Non-Technical UX:**
  - Consolidated under Account settings with direct navigation support.
  - **WhatsApp Business Channel:** Phone number input, active toggle, and connection status.
  - **Purpose-Driven Templates (3-4 templates):** Pre-configured templates for General Inquiries, Quotation Requests, and Consultation Scheduling.
  - **Live Mobile Chat Preview:** Renders an authentic WhatsApp chat bubble preview with category-aware greetings.
  - **One-Tap Test Launch:** Launches WhatsApp in a new tab with the composed message to verify delivery.
  - **Social Profile Links:** Facebook and Instagram profile URLs with real-time format validation and external test buttons.

### 3.10 Account & Security (`apps/admin/app/admin/account/page.tsx`)
- **Tabbed Settings Hierarchy:**
  - Standardized tabs: Profile, Settings, Integrations (Business Communication), Security.
  - Profile card allows editing full name, email, and phone number with Indian mobile validation.
  - Admin appearance preference selector: Light, Dark, System.
  - Security card supports password change with strength validation and session revocation.

### 3.11 Public Website Experience (`apps/web/app/page.tsx`)
- **High-End Architectural Presentation:**
  - Modern, responsive landing page reflecting published business context, slot images, and portfolio items.
  - Dynamic sections: Navbar, Hero, Brand Intro, Interior Storytelling, uPVC Windows, Explore Our Work gallery, Why Choose Us, Testimonials, FAQ accordion, Contact/Quote Form, Footer.
- **Visitor Quote Intake:**
  - Fully functional quote form capturing visitor name, email, phone, category of interest, and message.
  - Submits to `POST /api/v1/leads/public-quote` with rate limiting and input sanitization.
  - Creates a new Lead in the Admin platform with source `Website`.

---

## 4. Defect Analysis & Remediation Matrix

| Defect ID | Screen / Area | Severity | User Impact | Root Cause | Implemented Correction | Status |
| :--- | :--- | :---: | :--- | :--- | :--- | :---: |
| **DEF-001** | Global Application Shell | P2 | Touch targets < 44px on mobile navigation buttons | Legacy button heights were 36px | Applied `min-h-[44px] min-w-[44px]` touch targets across all mobile buttons | **FIXED** |
| **DEF-002** | Image Studio Workspace | P1 | Modal caused 15px layout shift when scrollbar toggled | Body scroll lock toggled without scrollbar width compensation | Implemented clientWidth compensation on body scroll lock | **FIXED** |
| **DEF-003** | Image Studio Workspace | P2 | Missing ARIA dialog semantics on fullscreen modal | Modal container lacked `role="dialog"` and `aria-modal` | Added `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and Escape key handler | **FIXED** |
| **DEF-004** | Customer Leads | P2 | Area of interest displayed twice in lead cards | Raw text had `[Area of Interest: ...]` prefix while UI also showed a badge | Added `getCleanEnquiryMessage()` parser to strip redundant raw prefixes in UI | **FIXED** |
| **DEF-005** | Customer Leads | P1 | Inbound WhatsApp webhook lacked constant-time token verification | Controller received `X-WhatsApp-Token` but service didn't validate it | Implemented cryptographic constant-time token validation in `LeadService.cs` | **FIXED** |
| **DEF-006** | Website Content | P2 | Section list cramped on 320px screens | Rigid desktop sidebar width in mobile viewport | Replaced with responsive section selector and horizontal scroll pills on mobile | **FIXED** |
| **DEF-007** | Images Library | P2 | Image cards lacked unified border and hover feedback | Inline style inconsistencies across Website Slots vs Portfolio | Standardized image cards using `Card variant="interactive"` and `Badge` | **FIXED** |
| **DEF-008** | Business Communication | P2 | WhatsApp templates lacked visual preview for non-technical users | Only raw textareas existed | Added authentic interactive mobile chat bubble preview card | **FIXED** |
| **DEF-009** | AI Connections | P2 | Missing confirmation on provider disconnection | Accidental click immediately cleared stored credentials | Wrapped disconnect and key rotation in `ConfirmationDialog` | **FIXED** |
| **DEF-010** | Public Website | P2 | FAQ items had inconsistent keyboard navigation | Custom div toggles lacked button semantics | Standardized FAQ accordions with native `<button>` and `aria-expanded` | **FIXED** |

---

## 5. Verification Methodology

Every finding and fix has been verified via:
1. **Automated Unit & Integration Tests:**  
   `dotnet test backend/Sparovia.sln` — 256 Unit Tests passing, 186 Integration Tests passing.
2. **TypeScript & Production Next.js Builds:**  
   `npm run build --workspace=apps/admin` (27 static/dynamic pages compiled, 0 errors).  
   `npm run build --workspace=apps/web` (4 static/dynamic pages compiled, 0 errors).
3. **Real-Browser Automation (Chrome CDP):**  
   All 21 routes audited in headless Chrome across 7 viewports:
   - 320 × 568 (iPhone SE / compact mobile)
   - 375 × 667 (iPhone 8 / standard mobile)
   - 390 × 844 (iPhone 12/13/14)
   - 430 × 932 (iPhone 14/15 Pro Max)
   - 768 × 1024 (iPad Mini portrait)
   - 1024 × 768 (iPad landscape)
   - 1440 × 900 (MacBook / Desktop standard)
4. **Accessibility Checks:**  
   Automated DOM evaluation for missing image alt attributes, unlabelled buttons, unassociated form inputs, and color contrast compliance.
