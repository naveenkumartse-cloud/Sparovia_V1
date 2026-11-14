# SPAROVIA V1.1 — COMPLETE TECHNICAL AUDIT REPORT

**Date:** 14 November 2026  
**Auditor Roles:** Senior Software Architect, Security Engineer, Backend & EF Core Specialist, Full-Stack Quality Engineer  
**Scope:** Technical Architecture, Backend, Frontend, Database, Security, Multi-Tenancy, Performance  
**Document Authority:** `ARCHITECTURE.md`, `RULES.md`, `SPAROVIA_MASTER_PRODUCT_BLUEPRINT.md`  
**Overall Status:** **VERIFIED**

---

## 1. System Architecture & Boundaries

Sparovia V1.1 preserves the approved Clean Architecture foundation:
- **`Sparovia.Domain` (.NET 9):**
  - Contains core entities (`Tenant`, `User`, `BusinessContext`, `Website`, `WebsiteContent`, `Image`, `ImageVariant`, `Lead`, `LeadFollowUp`, `TenantAiConfiguration`).
  - Strict zero-dependency rule: no references to ASP.NET Core, EF Core, or external SDKs.
- **`Sparovia.Application` (.NET 9):**
  - Use case orchestration, interfaces (`IWebsiteContentService`, `IWebsiteImageService`, `ILeadService`, `IIdentityService`, `ISigningSecretProvider`), DTOs, and validation logic.
- **`Sparovia.Infrastructure` (.NET 9):**
  - EF Core database persistence (`SparoviaDbContext`), PostgreSQL provider (`Npgsql.EntityFrameworkCore.PostgreSQL`), Supabase S3-compatible storage adapter, AES-GCM credential encryption, and deterministic image processing pipeline.
- **`Sparovia.API` (.NET 9):**
  - REST API controllers, cookie + JWT combined authentication, rate limiting middleware, global exception handler, Serilog structured logging, Swagger documentation.
- **Frontend Applications (`apps/admin`, `apps/web`):**
  - Next.js 14 with TypeScript, Tailwind CSS, Lucide icons, Framer Motion, and React Hook Form + Zod.

---

## 2. Security & Multi-Tenant Audit

### 2.1 Multi-Tenant Isolation
- **Server-Side Authorization:** Every tenant-owned endpoint extracts `TenantId` from the authenticated user's claims principal (`User.FindFirst("TenantId")` or cookie identity). Client-supplied tenant IDs in request bodies or query parameters are ignored.
- **Negative Authorization Verification:** Verified via `SecurityRegressionTests.cs` and `WebsiteImagesTests.cs`. Authenticated Tenant A cannot view, mutate, or delete Tenant B's:
  - Business Context
  - Website draft or published content
  - Uploaded images or derived image variants
  - Leads or lead follow-ups
  - Stored AI credentials
- **Cross-tenant requests consistently return `HTTP 404 Not Found` or `HTTP 403 Forbidden`**, preventing resource enumeration.

### 2.2 Cryptographic Signing & Key Management
- **Centralized Provider:** [`SigningSecretProvider.cs`](file:///d:/Naveen/Sparovia_V1/backend/src/Sparovia.Infrastructure/Security/SigningSecretProvider.cs) serves as the single source of truth for JWT signing and HMAC resource URL signatures.
- **Production Key Safeguard:** In `Production` (`builder.Environment.IsProduction()`), startup immediately halts if `Jwt:Secret` or `JWT_SECRET` is missing, whitespace, less than 32 characters, or matches the hardcoded development fallback.
- **Resource-Scoped HMAC Signatures:**
  - Original Image URL: HMAC-SHA256 over `imageId:tenantId:expiresUnix`
  - Variant URL: HMAC-SHA256 over `imageId:variantId:tenantId:expiresUnix`
  - Prevents variant cross-substitution and parent image mismatch.
- **Credential Protection:** Frontend image rendering (`resolveImageUrl`) omits the 7-day administrative bearer token query parameter when `sig=` is present, preventing bearer token leakage in browser history, logs, or external Referer headers.

### 2.3 Input Validation & Injection Defenses
- **SQL Injection:** All queries use parameterized LINQ via EF Core or compiled SQL queries; raw concatenated SQL strings are strictly prohibited.
- **XSS Protection:** Verified in `SaveDraft_ScriptTagInjection_ReturnsBadRequest`. HTML/script tags in website content submissions are sanitized or rejected with `400 Bad Request`.
- **File Upload Guard:**
  - Enforces magic-byte signature validation (JPEG, PNG, WebP).
  - Maximum upload size: 10 MB.
  - Maximum resolution: 25 megapixels.
  - Path traversal defense: file names sanitized via `Path.GetFileName` and stored under GUID-based object keys.

---

## 3. Database & EF Core Quality

### 3.1 Persistence Layer Review
- **Engine:** PostgreSQL (Supabase managed).
- **ORM:** Entity Framework Core 9.0.
- **Query Hygiene:**
  - Read-only queries consistently use `.AsNoTracking()` to avoid unnecessary object tracking overhead.
  - Relationships use explicit foreign keys (`TenantId`, `WebsiteId`, `ImageId`).
  - Additive migrations: existing database schemas are preserved; no destructive table drops or column truncations.
- **JSONB Handling:** Complex structured sections (`WebsiteContent.Sections`, `ImageVariant.AppliedCorrections`) utilize PostgreSQL JSONB columns with typed serialization in application DTOs.

### 3.2 Concurrency & State Management
- Integration test fixtures share the development database.
- Deterministic isolation is enforced via `[assembly: CollectionBehavior(DisableTestParallelization = true)]`, ensuring sequential test class execution and zero race conditions on global ordering queries.

---

## 4. Frontend Architecture & Performance

### 4.1 Client vs Server Component Boundaries
- Next.js App Router utilizes `'use client'` selectively on interactive views (form state, modals, canvas sliders).
- Static layout shells, typography tokens, and CSS primitives remain lightweight and optimized.

### 4.2 Bundle & Asset Delivery
- Next.js production builds produce compact initial JS bundles:
  - `apps/admin`: First Load JS shared by all pages is **87.3 kB** (well below the 150 kB budget).
  - `apps/web`: First Load JS shared by all pages is **87.3 kB**.
- Zero extraneous charting, 3D, or animation packages in `package.json`.
- Framer Motion animations respect `prefers-reduced-motion` via CSS overrides.

---

## 5. Production & Deployment Verification

### 5.1 Deployment Topology
- **Backend API:** Hosted on Render (`https://sparovia-api.onrender.com`), served via Kestrel behind Cloudflare CDN.
- **Frontend Applications:** Hosted on Vercel (`https://sparovia-v1.vercel.app`), served via Vercel Edge Network.
- **Database:** Supabase PostgreSQL with SSL enforced.
- **Object Storage:** Supabase S3-compatible bucket `sparovia-images`.

### 5.2 Live Non-Destructive Probe Evidence
- **Backend Health Check (`https://sparovia-api.onrender.com/api/v1/health`):**
  - Status: `HTTP 200 OK`
  - Payload: `{"status":"Healthy","duration":"00:00:01.6049300","checks":[{"name":"SparoviaDbContext","status":"Healthy","description":null,"error":null}]}`
  - Origin Server Header: `x-render-origin-server: Kestrel`
  - Security Headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
- **Frontend Health Check (`https://sparovia-v1.vercel.app`):**
  - Status: `HTTP 200 OK`
  - Edge Cache: `X-Vercel-Cache: MISS / HIT`
  - HSTS: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
