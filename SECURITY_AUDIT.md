# SPAROVIA — COMPREHENSIVE SECURITY AUDIT REPORT

**Document ID:** SEC-AUD-2026-V1  
**Assessment Date:** November 10, 2026  
**Status:** Audit Completed & Evidence-Verified  
**Classification:** Confidential / Engineering Internal  
**Target System:** Sparovia Business Experience Platform (Monorepo)

---

## 1. Audit Scope & Methodology

### 1.1 Scope of Assessment
The security audit encompassed all architectural tiers of the Sparovia platform:
1. **Backend Application Layer:** ASP.NET Core Web API (`Sparovia.API`), Clean Architecture layers (`Sparovia.Domain`, `Sparovia.Application`, `Sparovia.Infrastructure`).
2. **Identity & Access Management:** JWT authentication, cookie session handling, role-based authorization, OTP workflows, password hashing, and reset lifecycles.
3. **Multi-Tenant Isolation:** Server-side tenant boundary enforcement, workspace resolution, cross-tenant isolation in content rendering, media access, and lead capture.
4. **Data & Storage Layer:** Supabase PostgreSQL with EF Core 9, relational schema constraints, connection strings, and storage bucket integration.
5. **Image Studio & Upload Pipeline:** Image ingestion, MIME verification, dimension guards, SkiaSharp image processing, variant pipelines, and draft vs. published access controls.
6. **AI & External Integrations:** AI completion stubs, prompt handling, WhatsApp inbound webhook endpoints, token authentication, and lead ingestion.
7. **Frontend Applications:** `apps/admin` (Enterprise Admin Portal) and `apps/web` (Public-Facing Business Website), static export pipeline, dependency trees, and HTTP security policies.
8. **Infrastructure & DevSecOps:** Docker containerization, execution privileges, process environment settings, NuGet dependencies, and npm lockfiles.

### 1.2 Assessment Methodology
The audit adhered to industry standards including:
- **OWASP Top 10 (2021)** & **OWASP API Security Top 10 (2023)**
- **OWASP ASVS (Application Security Verification Standard) v4.0**
- **NIST National Vulnerability Database (NVD)** and **CISA KEV**
- **GitHub Security Advisories (GHSA)** & vendor CVE databases
- **Static Code Analysis (SAST)** and direct code auditing
- **Automated Dependency Auditing:** `dotnet list package --vulnerable` and `npm audit`
- **Dynamic Integration Testing & Automated Verification:** End-to-end multi-tenant exploit simulation with `WebApplicationFactory<Program>` in `xUnit`.

---

## 2. Verified Technology Inventory

| Layer | Component | Version / Technology | File Location / Evidence |
| :--- | :--- | :--- | :--- |
| **Runtime & SDK** | .NET SDK | 9.0.317 (Runtime: .NET 9.0) | `global.json`, `backend/Sparovia.sln` |
| **Language & Framework** | C# / ASP.NET Core | C# 13, ASP.NET Core 9.0.0 | `backend/src/Sparovia.API/Sparovia.API.csproj` |
| **ORM & Data Provider** | EF Core / Npgsql | EF Core 9.0.0, Npgsql.EntityFrameworkCore.PostgreSQL 9.0.0 | `backend/src/Sparovia.Infrastructure/Sparovia.Infrastructure.csproj` |
| **Authentication** | JWT / BCrypt | `System.IdentityModel.Tokens.Jwt` 8.2.1, `BCrypt.Net-Next` 4.0.3 | `backend/src/Sparovia.Infrastructure/` |
| **Image Processing** | SkiaSharp | SkiaSharp 2.88.9, SkiaSharp.NativeAssets.Linux.NoDependencies 2.88.9 | `backend/src/Sparovia.Infrastructure/` |
| **Logging & Docs** | Serilog / Swashbuckle | Serilog.AspNetCore 9.0.0, Swashbuckle.AspNetCore 7.0.0 | `backend/src/Sparovia.API/` |
| **Frontend Runtime** | Node.js / npm | Node v22.23.2, npm 10.9.8 | Global development environment |
| **Frontend Framework** | Next.js | Next.js 14.2.35 (Static Export `output: 'export'`) | `apps/admin/package.json`, `apps/web/package.json` |
| **UI Library** | React | React 18.3.1, React DOM 18.3.1 | `package.json` |
| **Styling** | Tailwind CSS | Tailwind CSS 3.4.7, PostCSS 8.4.40 | `package.json`, `tailwind.config.ts` |
| **Language** | TypeScript | TypeScript 5.5.4 | `package.json`, `tsconfig.json` |
| **Database** | PostgreSQL | Supabase Managed PostgreSQL | Cloud hosted via Supabase |
| **Containerization** | Docker | Linux Debian bookworm-slim (mcr.microsoft.com/dotnet/aspnet:9.0) | `backend/Dockerfile` |

---

## 3. Security Architecture & Threat Model

### 3.1 Trust Boundaries
```
[ Untrusted Public Internet ]
           │
           ▼
[ Cloudflare / Reverse Proxy ] (HSTS, TLS 1.3 Termination)
           │
  ┌────────┴──────────────────────────┐
  │                                   │
  ▼                                   ▼
[ Static Web & Admin Frontends ]    [ ASP.NET Core Web API ] (Port 5000/5001)
  (Static Export HTML/JS/CSS)         - CORS Origin Enforcement
                                      - Permissions-Policy / Frame-Options
                                      - Rate Limiters (Sliding/Fixed Windows)
                                      - JWT / Secure Cookie Validation
                                      - Tenant Isolation Middleware & Services
                                      │
                                      ▼
                        [ PostgreSQL DB & Supabase Storage ]
                          (Server-Side Parameterized EF Core Queries)
```

### 3.2 Threat Scenarios Evaluated
1. **Tenant Escalation / BOLA:** Can a user authenticated under Tenant A request, modify, or delete entities belonging to Tenant B?
2. **Unauthenticated Media Access:** Can an attacker forge a token to view unapproved or draft images belonging to arbitrary tenants?
3. **Cross-Tenant Content / Lead Smuggling:** Can an unmapped domain trigger fallback content leakage or deposit customer leads into the wrong tenant database?
4. **Supply Chain & Memory Corruption:** Are vulnerable binary packages or disabled memory safety flags (`EnableWriteXorExecute=0`) exposing backend containers to exploitation?
5. **TLS Inspection / MITM in Build:** Does build configuration bypass TLS certificate validation during frontend bundling?

---

## 4. Detailed Security Findings

### Finding 1: Hardcoded Administrative Credentials with Forced Startup Password Reset
- **Vulnerability ID:** SEC-FINDING-01
- **Severity:** **P0 — Critical** (CVSS: 9.8 | CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)
- **Component:** `backend/src/Sparovia.API/Program.cs` (lines 387-432)
- **Description:** On every application bootstrap, the backend iterated over predefined administrator accounts (`naveen@sparovia.com`, `hari@sparovia.com`) and forcibly reset their passwords to hardcoded values (`Naveen@123`, `Hari@123`), overwriting any password updates made by legitimate users.
- **Attack Vector:** An attacker with knowledge of the repository source code could authenticate against any production instance using these default credentials, gaining full administrative privileges.
- **Root Cause:** Development convenience seed routine was deployed unconditionally in all environments.
- **Remediation:** Removed the hardcoded credentials and password overwriting routine entirely. Seeded accounts now only occur during explicit non-production bootstrapping or migrations without overwriting existing credentials.

### Finding 2: Unverified JWT Parsing Granting Unauthorized Private Image Access
- **Vulnerability ID:** SEC-FINDING-02
- **Severity:** **P0 — Critical** (CVSS: 9.1 | CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N)
- **Component:** `backend/src/Sparovia.API/Controllers/WebsiteImagesController.cs` (lines 201-209, 237-245)
- **Description:** For endpoints serving image binaries (`/api/v1/website/images/{id}/file` and `/api/v1/website/images/{id}/variants/{variantId}/file`), authentication via query parameter `?token=` was parsed using `new JwtSecurityTokenHandler().ReadJwtToken(token)`. `ReadJwtToken()` reads token claims without cryptographically validating the HMAC signature, issuer, audience, or expiration.
- **Attack Vector:** Any attacker could craft an unsigned or self-signed JWT token containing an arbitrary `TenantId` or `nameid` claim, pass `?token=<forged>` in the query string, and bypass tenant authorization to access private, unapproved draft images and internal assets.
- **Root Cause:** Use of `ReadJwtToken()` instead of `ValidateToken()` with authoritative `TokenValidationParameters`.
- **Remediation:** Implemented cryptographic signature, issuer, audience, and expiration verification using `TokenValidationParameters` bound to the server's configured JWT secret.

### Finding 3: Plaintext Production Database Credentials and Disabled TLS Verification
- **Vulnerability ID:** SEC-FINDING-03
- **Severity:** **P0 — Critical** (CVSS: 9.8 | CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H)
- **Component:** `backend/src/Sparovia.API/appsettings.Production.json` (line 3)
- **Description:** The production configuration file committed to Git contained a live Supabase PostgreSQL connection string with a plaintext password (`Password=Sparovia@16`) and configured `Trust Server Certificate=true`.
- **Attack Vector:** Anyone with read access to the repository could connect directly to the database cluster, bypassing all application-level controls, multi-tenant boundaries, and RLS policies. Additionally, `Trust Server Certificate=true` exposed database traffic to man-in-the-middle (MITM) attacks.
- **Root Cause:** Accidental check-in of production secrets into source control.
- **Remediation:** Sanitized connection string in `appsettings.Production.json` to empty, eliminated `Trust Server Certificate=true`, and mandated that production connection strings be injected exclusively via runtime environment variables (`ConnectionStrings__DefaultConnection`).

### Finding 4: Overly Permissive CORS Policy with Credentials Allowed
- **Vulnerability ID:** SEC-FINDING-04
- **Severity:** **P1 — High** (CVSS: 8.1 | CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:N)
- **Component:** `backend/src/Sparovia.API/Program.cs` (lines 142-168)
- **Description:** CORS policy evaluated `uri.Host.EndsWith(".vercel.app")` and dynamically allowed any subdomain on `vercel.app` with `AllowCredentials()`.
- **Attack Vector:** Any malicious third-party site hosted on Vercel (`attacker.vercel.app`) could execute cross-origin authenticated fetch requests against the Sparovia API, reading sensitive customer data and performing authenticated actions using the user's cookies.
- **Root Cause:** Overly broad wildcard matching on a public shared cloud hosting domain (`*.vercel.app`).
- **Remediation:** Replaced wildcard matching with strict comparison against configured, authorized domains (`CORS_ALLOWED_ORIGINS`).

### Finding 5: Development OTP Disclosure in Public API Responses
- **Vulnerability ID:** SEC-FINDING-05
- **Severity:** **P1 — High** (CVSS: 7.5 | CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N)
- **Component:** `backend/src/Sparovia.API/Controllers/AuthController.cs` (lines 33, 442) & `Sparovia.Infrastructure/Identity/IdentityService.cs` (lines 115, 608)
- **Description:** The `DevOtp` property containing the generated phone verification OTP was returned in registration and `send-otp` HTTP responses without checking whether the application was running in Development mode.
- **Attack Vector:** In production or staging environments, an attacker could register an account with any phone number and immediately inspect the JSON response to obtain the verification OTP, bypassing SMS delivery and phone verification controls.
- **Root Cause:** Debug convenience field exposed unconditionally in API view models.
- **Remediation:** Enforced environment checks (`_environment.IsDevelopment()`) in both the service and controller layers, ensuring `DevOtp` is null/empty and omitted from API responses in production environments.

### Finding 6: Cross-Tenant Lead Deposit and Website Content Fallback
- **Vulnerability ID:** SEC-FINDING-06
- **Severity:** **P1 — High** (CVSS: 7.5 | CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:L/A:N)
- **Component:** `backend/src/Sparovia.Infrastructure/WebsiteContent/WebsiteContentService.cs` (line 123) & `backend/src/Sparovia.Infrastructure/Leads/LeadService.cs` (line 69)
- **Description:** In both public website content fetching and public lead submission, if an incoming request domain did not match any tenant website, the service fell back to `_dbContext.Websites.OrderByDescending(w => w.UpdatedAt).FirstOrDefaultAsync()`.
- **Attack Vector:** An attacker querying an unknown or unmapped domain would receive the private website content of the most recently updated tenant. Furthermore, submitting a lead on an unmapped host would deposit the prospective customer's confidential contact details and message into the wrong tenant's database.
- **Root Cause:** Overly permissive fallback logic intended for local single-tenant testing.
- **Remediation:** Removed the fallback queries completely. Unmapped domains now return a strict 404 Not Found, preserving tenant confidentiality.

### Finding 7: Unrestricted Inbound WhatsApp Webhook Processing
- **Vulnerability ID:** SEC-FINDING-07
- **Severity:** **P1 — High** (CVSS: 7.3 | CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N)
- **Component:** `backend/src/Sparovia.Infrastructure/Leads/LeadService.cs` (lines 280-310)
- **Description:** Inbound webhook processing accepted requests even if `WhatsApp:WebhookToken` was unconfigured or blank, allowing forged WhatsApp webhook events.
- **Attack Vector:** Attackers could spam the webhook endpoint with forged lead messages, poisoning the CRM database with fake contacts without authorization.
- **Root Cause:** Missing validation of webhook token configuration before accepting incoming requests.
- **Remediation:** Enforced strict non-empty webhook token configuration checks. Webhook calls with invalid or missing tokens are immediately rejected with HTTP 401 Unauthorized.

### Finding 8: Memory Safety Protection Disabled in Dockerfile (W^X Bypass)
- **Vulnerability ID:** SEC-FINDING-08
- **Severity:** **P1 — High** (CVSS: 7.0 | CVSS:3.1/AV:L/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H)
- **Component:** `backend/Dockerfile` (line 17)
- **Description:** Dockerfile contained `ENV DOTNET_EnableWriteXorExecute=0`, which disables the .NET runtime's Write-XOR-Execute (W^X) memory safety mitigation. Additionally, the container ran as the root user.
- **Attack Vector:** Disabling W^X permits memory pages to be simultaneously writable and executable, drastically simplifying exploitation of memory corruption bugs (e.g. in native SkiaSharp libraries) into arbitrary code execution.
- **Root Cause:** Outdated workaround for older native SkiaSharp JIT compilation on Linux.
- **Remediation:** Removed `DOTNET_EnableWriteXorExecute=0`. Added `USER $APP_UID` to enforce unprivileged non-root execution inside the container.

### Finding 9: Global TLS Verification Disabled in Frontend Build Configuration
- **Vulnerability ID:** SEC-FINDING-09
- **Severity:** **P1 — High** (CVSS: 7.4 | CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N)
- **Component:** `apps/admin/next.config.mjs` (line 2)
- **Description:** Next.js configuration contained `process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'`, turning off TLS certificate verification for all Node.js HTTPS requests during build time.
- **Attack Vector:** Build agents and developer machines were susceptible to MITM attacks, permitting malicious actors on local networks or compromised proxies to inject malicious code during build-time downloads.
- **Root Cause:** Insecure workaround for `next/font/google` fetch failures behind corporate TLS-intercepting proxies.
- **Remediation:** Removed `NODE_TLS_REJECT_UNAUTHORIZED = '0'`. Replaced build-time font fetching with browser-level Google Fonts `<link>` tags, making builds fully offline-deterministic and secure.

### Finding 10: Missing Modern HTTP Defense-in-Depth Headers
- **Vulnerability ID:** SEC-FINDING-10
- **Severity:** **P2 — Medium** (CVSS: 5.3 | CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N)
- **Component:** `backend/src/Sparovia.API/Program.cs` (lines 280-305)
- **Description:** Missing `Strict-Transport-Security` (HSTS) in production and missing `Permissions-Policy` across API responses.
- **Attack Vector:** Clients connecting over HTTP were vulnerable to SSL-stripping attacks. Browsers lacked explicit policy restrictions on geolocation, camera, and microphone APIs.
- **Root Cause:** Incomplete security header middleware configuration.
- **Remediation:** Added `Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=()` and `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` for production requests.

---

## 5. Exploitability Assessment

| Vulnerability | Ease of Exploitation | Prerequisites | Reachability in Production | Exploited in Wild? |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-FINDING-01** (Hardcoded Admin) | Trivial | Public API access | Directly reachable at `/api/v1/auth/login` | No evidence found |
| **SEC-FINDING-02** (Unverified JWT) | Trivial | Image ID known or enumerated | Directly reachable at `/api/v1/website/images/{id}/file` | No evidence found |
| **SEC-FINDING-03** (DB Password) | Trivial | Source code read access | Direct network access to Supabase DB | No evidence found |
| **SEC-FINDING-04** (CORS Wildcard) | Moderate | Victim visits attacker Vercel site | Directly reachable via browser fetch | No evidence found |
| **SEC-FINDING-05** (OTP Leak) | Trivial | Public API access | Directly reachable at `/api/v1/auth/register` | No evidence found |
| **SEC-FINDING-06** (Cross-Tenant Leak)| Easy | Any unmapped domain / host header | Directly reachable at `/api/v1/website/published-content` | No evidence found |
| **SEC-FINDING-07** (WhatsApp Spoof) | Easy | Inbound webhook reachability | Reachable at `/api/v1/leads/webhook/whatsapp` | No evidence found |
| **SEC-FINDING-08** (W^X Bypass) | Hard | Native code execution bug | Requires memory corruption primitive | No evidence found |
| **SEC-FINDING-09** (TLS Bypass) | Moderate | Local proxy / network MITM | Build-time only | No evidence found |
| **SEC-FINDING-10** (Missing Headers) | Moderate | Insecure network connection | Network eavesdropping | No evidence found |

---

## 6. Security Posture by Area

### 6.1 Authentication & Identity
- **Status:** **Secured**
- **Findings:** Hardcoded admin credentials and OTP disclosure remediated. Passwords hashed using BCrypt. Standardized JWT issuance with cryptographic validation. Rate limiters active on sensitive auth routes (`PhoneOtpSend`, `PhoneOtpVerify`, `ForgotPassword`, `ResendVerification`).

### 6.2 Authorization & Multi-Tenant Isolation
- **Status:** **Secured**
- **Findings:** Cross-tenant fallback queries eliminated from `WebsiteContentService` and `LeadService`. Unsigned JWT query-string token reading eliminated from `WebsiteImagesController`. Tenant membership verified server-side on all tenant-scoped operations.

### 6.3 API Security
- **Status:** **Secured**
- **Findings:** CORS restricted to approved origins. Comprehensive security headers added (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and HSTS). Fixed-window rate limiting active on public intake and AI routes.

### 6.4 Database & Storage
- **Status:** **Secured**
- **Findings:** Hardcoded Supabase database password removed from `appsettings.Production.json`. `Trust Server Certificate=true` removed. EF Core parameterized queries prevent SQL injection across all entities.

### 6.5 File Upload & Media Processing
- **Status:** **Secured**
- **Findings:** Image upload enforces strict file size, dimension, aspect ratio, and magic-byte header validation. Original images preserved immutably. Access to private/draft images cryptographically protected.

### 6.6 AI & External Integrations
- **Status:** **Secured**
- **Findings:** WhatsApp webhook requires non-empty secret token validation. AI service integrations remain strictly proposal/draft oriented; no unapproved automated publishing or destructive operations.

### 6.7 Frontend & Browser Security
- **Status:** **Secured**
- **Findings:** `NODE_TLS_REJECT_UNAUTHORIZED = '0'` removed. Build runs cleanly in offline/proxy mode without certificate validation bypasses. Frontend static exports (`output: 'export'`) run without server-side Node runtime vulnerabilities.

### 6.8 Infrastructure & Supply Chain
- **Status:** **Secured**
- **Findings:** Docker container enforces non-root execution (`USER $APP_UID`) and standard W^X memory protections. Zero vulnerable NuGet packages across all 6 backend projects. Npm audit fix applied for non-breaking dependencies.

---

## 7. Evidence Log

```
Scan: dotnet list backend/Sparovia.sln package --vulnerable
Result: 0 vulnerable NuGet packages across Sparovia.Domain, Sparovia.Application, Sparovia.Infrastructure, Sparovia.API, Sparovia.UnitTests, Sparovia.IntegrationTests.

Scan: npm audit
Result: 14 vulnerabilities reduced to 11 via safe semver updates. Remaining 11 affect devDependency tools and unused Node SSR runtime paths (compensated by static export architecture).

Frontend Builds:
- npm run build:admin -> Exit code 0 (27 static pages prerendered)
- npm run build:web   -> Exit code 0 (4 static pages prerendered)

Backend Test Execution:
- dotnet test backend/Sparovia.sln
Result: 465 Passed, 0 Failed, 0 Skipped (270 Unit Tests + 195 Integration Tests)
```
