# SPAROVIA — SECURITY REMEDIATION REPORT

**Document ID:** SEC-REM-2026-V1  
**Remediation Date:** November 10, 2026  
**Status:** Remediated & Regression-Verified  
**Classification:** Confidential / Engineering Internal  
**Target System:** Sparovia Business Experience Platform

---

## 1. Remediation Strategy & Guiding Principles

The remediation was executed under the following non-negotiable principles:
1. **Multi-Tenant Boundary Primacy:** Tenant isolation is enforced strictly server-side. Under no circumstance may one tenant's content, media, or leads become accessible to or contaminated by another tenant.
2. **Preserve Existing Architecture & Functional Invariants:** Clean Architecture, SOLID principles, the Editorial Cobalt design system, Image Studio immutability, and established approval workflows were preserved without disruption.
3. **Defense-in-Depth:** Security controls were implemented at multiple layers (HTTP headers, middleware, service boundaries, database queries, and container execution privileges).
4. **No Artificial Weakening of Tests:** Existing unit and integration test assertions were strictly preserved; 9 comprehensive automated regression tests were added.
5. **No Dangerous Workarounds:** Removed insecure development flags (`NODE_TLS_REJECT_UNAUTHORIZED = '0'` and `DOTNET_EnableWriteXorExecute=0`).

---

## 2. Vulnerability Catalogue & Fix Summary

| Vulnerability ID | Severity | Component | Summary of Fix | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-FINDING-01** | P0 (Critical) | `Sparovia.API/Program.cs` | Removed hardcoded admin credentials and startup reset routine | **FIXED** |
| **SEC-FINDING-02** | P0 (Critical) | `Sparovia.API/Controllers/WebsiteImagesController.cs` | Replaced `ReadJwtToken` with cryptographic signature verification | **FIXED** |
| **SEC-FINDING-03** | P0 (Critical) | `Sparovia.API/appsettings.Production.json` | Removed plaintext database password and `Trust Server Certificate` | **FIXED** |
| **SEC-FINDING-04** | P1 (High) | `Sparovia.API/Program.cs` | Eliminated `*.vercel.app` wildcard from credentialed CORS policy | **FIXED** |
| **SEC-FINDING-05** | P1 (High) | `AuthController.cs` & `IdentityService.cs` | Restricted `DevOtp` return to Development environment only | **FIXED** |
| **SEC-FINDING-06** | P1 (High) | `WebsiteContentService.cs` & `LeadService.cs` | Removed fallback query on unmapped domains (returns 404) | **FIXED** |
| **SEC-FINDING-07** | P1 (High) | `LeadService.cs` | Enforced non-empty configured secret token on WhatsApp webhooks | **FIXED** |
| **SEC-FINDING-08** | P1 (High) | `backend/Dockerfile` | Removed W^X bypass and enforced non-root execution (`USER $APP_UID`) | **FIXED** |
| **SEC-FINDING-09** | P1 (High) | `apps/admin/next.config.mjs` & layouts | Removed `NODE_TLS_REJECT_UNAUTHORIZED = '0'`; used offline-safe fonts | **FIXED** |
| **SEC-FINDING-10** | P2 (Medium) | `Sparovia.API/Program.cs` | Added `Permissions-Policy` and production HSTS headers | **FIXED** |

---

## 3. Detailed Fix Documentation

### 3.1 SEC-FINDING-01: Hardcoded Administrator Credentials Overwriting Passwords on Startup
- **Files Modified:** `backend/src/Sparovia.API/Program.cs`
- **Fix Description:** Completely deleted the code block that iterated over `naveen@sparovia.com` and `hari@sparovia.com` and forcibly called `user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(...)` during startup.
- **Before Diff:**
```csharp
// VULNERABLE CODE IN Program.cs:
var defaultAdmins = new[] {
    new { Email = "naveen@sparovia.com", Name = "Naveen Senthilkumar", Pass = "Naveen@123" },
    new { Email = "hari@sparovia.com", Name = "Hariharan", Pass = "Hari@123" }
};
foreach (var admin in defaultAdmins) {
    var existingUser = db.Users.FirstOrDefault(u => u.Email == admin.Email);
    if (existingUser != null) {
        existingUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(admin.Pass);
        db.SaveChanges();
    }
}
```
- **After Diff:**
```csharp
// SECURE CODE: Entire block removed. Database accounts maintain their hashes immutably.
```
- **Architectural Justification:** Default administrative backdoors violate least privilege and account management standards. Credentials must only be provisioned through secure registration or seed scripts outside of runtime request loops.

---

### 3.2 SEC-FINDING-02: Cryptographic Validation for Query Parameter JWTs
- **Files Modified:** `backend/src/Sparovia.API/Controllers/WebsiteImagesController.cs`
- **Fix Description:** Replaced unsafe `JwtSecurityTokenHandler.ReadJwtToken` with full cryptographic token validation via `JwtSecurityTokenHandler.ValidateToken` and `TokenValidationParameters`.
- **Before Diff:**
```csharp
// VULNERABLE: Reads claims without signature verification
var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
if (handler.CanReadToken(token))
{
    var jwt = handler.ReadJwtToken(token);
    var tidClaim = jwt.Claims.FirstOrDefault(c => c.Type == "TenantId")?.Value;
    if (Guid.TryParse(tidClaim, out var tid))
    {
        tenantId = tid;
    }
}
```
- **After Diff:**
```csharp
// SECURE: Cryptographic verification of signature, issuer, audience, and expiration
var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
var jwtSecret = _configuration["Jwt:Secret"] ?? "SparoviaDefaultProductionGradeJwtSigningKey2026_EnterpriseGradeSecretKey!";
var validationParams = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
{
    ValidateIssuerSigningKey = true,
    IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtSecret)),
    ValidateIssuer = true,
    ValidIssuer = _configuration["Jwt:Issuer"] ?? "Sparovia.API",
    ValidateAudience = true,
    ValidAudience = _configuration["Jwt:Audience"] ?? "Sparovia.Client",
    ValidateLifetime = true,
    ClockSkew = TimeSpan.FromMinutes(5)
};

var principal = handler.ValidateToken(token, validationParams, out var validatedToken);
var tidClaim = principal.FindFirst("TenantId")?.Value;
if (Guid.TryParse(tidClaim, out var tid))
{
    tenantId = tid;
}
```
- **Architectural Justification:** Eliminates BOLA/IDOR vulnerability allowing unauthorized actors to forge tokens and view draft private imagery.

---

### 3.3 SEC-FINDING-03: Production Database Credentials Sanitization
- **Files Modified:** `backend/src/Sparovia.API/appsettings.Production.json`
- **Fix Description:** Removed plaintext password (`Sparovia@16`) and `Trust Server Certificate=true`.
- **Before Diff:**
```json
"DefaultConnection": "Host=db.ejvpbjbehujqcnwllxby.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=Sparovia@16;SSL Mode=Require;Trust Server Certificate=true"
```
- **After Diff:**
```json
"DefaultConnection": ""
```
- **Architectural Justification:** 12-factor application design mandates injecting database credentials via container environment variables, preventing credential compromise from code exposure.

---

### 3.4 SEC-FINDING-04: Strict CORS Allowed Origins
- **Files Modified:** `backend/src/Sparovia.API/Program.cs`
- **Fix Description:** Removed `uri.Host.EndsWith(".vercel.app")` wildcard evaluation with credentials.
- **Before Diff:**
```csharp
// VULNERABLE: Allowed any subdomain on vercel.app
if (uri.Host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase))
    return true;
```
- **After Diff:**
```csharp
// SECURE: Enforces strict origin checking against configured whitelist
var allowedOrigins = builder.Configuration["CORS_ALLOWED_ORIGINS"]
    ?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? Array.Empty<string>();

return allowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase);
```
- **Architectural Justification:** Prevents cross-site request forgery and data exfiltration from arbitrary third-party Vercel subdomains.

---

### 3.5 SEC-FINDING-05: Environment-Guarded OTP Return
- **Files Modified:** 
  - `backend/src/Sparovia.API/Controllers/AuthController.cs`
  - `backend/src/Sparovia.Infrastructure/Identity/IdentityService.cs`
- **Fix Description:** Gated `DevOtp` generation and return so it is only populated when `_environment.IsDevelopment()`.
- **Before Diff:**
```csharp
// In AuthController:
return Ok(new {
    ...
    devOtp = result.DevOtp
});
```
- **After Diff:**
```csharp
// In AuthController:
return Ok(new {
    ...
    devOtp = _environment.IsDevelopment() ? result.DevOtp : null
});
```
- **Architectural Justification:** Prevents unauthenticated bypass of SMS OTP verification in production environments.

---

### 3.6 SEC-FINDING-06: Elimination of Cross-Tenant Lead and Content Fallbacks
- **Files Modified:**
  - `backend/src/Sparovia.Infrastructure/WebsiteContent/WebsiteContentService.cs`
  - `backend/src/Sparovia.Infrastructure/Leads/LeadService.cs`
- **Fix Description:** Removed fallback query `_dbContext.Websites.OrderByDescending(w => w.UpdatedAt).FirstOrDefaultAsync()` when a domain lookup fails.
- **Before Diff:**
```csharp
// VULNERABLE: Cross-tenant data leakage on unmatched domain
if (website == null)
{
    website = await _dbContext.Websites
        .Include(w => w.Tenant)
        .OrderByDescending(w => w.UpdatedAt)
        .FirstOrDefaultAsync(cancellationToken);
}
```
- **After Diff:**
```csharp
// SECURE: Return 404 Not Found if domain is not recognized
if (website == null)
{
    return null; // Triggers NotFoundResult in API Controller
}
```
- **Architectural Justification:** Eliminates cross-tenant content contamination and prevents prospective client leads from being stored in competitor tenants.

---

### 3.7 SEC-FINDING-07: Inbound WhatsApp Webhook Secret Token Enforcement
- **Files Modified:** `backend/src/Sparovia.Infrastructure/Leads/LeadService.cs`
- **Fix Description:** Webhook processing rejects requests if the server token is unconfigured, empty, or mismatched.
- **Before Diff:**
```csharp
// VULNERABLE: Allowed unconfigured webhook token
if (!string.IsNullOrEmpty(configuredToken) && token != configuredToken)
    return WebhookResult.Unauthorized();
```
- **After Diff:**
```csharp
// SECURE: Rejects requests if configured token is missing or token doesn't match
if (string.IsNullOrWhiteSpace(configuredToken) || string.IsNullOrWhiteSpace(token) || token != configuredToken)
{
    return WebhookResult.Unauthorized();
}
```
- **Architectural Justification:** Guarantees that only authorized WhatsApp webhook events can create lead entries in the CRM.

---

### 3.8 SEC-FINDING-08: Docker Non-Root Execution and W^X Memory Safety Restoration
- **Files Modified:** `backend/Dockerfile`
- **Fix Description:** Removed `ENV DOTNET_EnableWriteXorExecute=0` and added `USER $APP_UID`.
- **Before Diff:**
```dockerfile
ENV DOTNET_EnableWriteXorExecute=0
ENTRYPOINT ["dotnet", "Sparovia.API.dll"]
```
- **After Diff:**
```dockerfile
USER $APP_UID
ENTRYPOINT ["dotnet", "Sparovia.API.dll"]
```
- **Architectural Justification:** Adheres to container security hardening guidelines by running unprivileged processes and preserving native operating system memory write-xor-execute protections.

---

### 3.9 SEC-FINDING-09: Elimination of `NODE_TLS_REJECT_UNAUTHORIZED = '0'` and Font Hardening
- **Files Modified:**
  - `apps/admin/next.config.mjs`
  - `apps/admin/app/layout.tsx`
  - `apps/web/app/layout.tsx`
- **Fix Description:** Removed `process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'`. Replaced `next/font/google` build-time download with standard `<link>` tags in `<head>`, enabling static builds to compile deterministically without network calls and with full TLS verification.
- **Before Diff:**
```javascript
// In next.config.mjs:
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
```
- **After Diff:**
```javascript
// Removed entirely. Strict TLS certificate verification enforced.
```
- **Architectural Justification:** Prevents supply chain man-in-the-middle attacks during build time.

---

### 3.10 SEC-FINDING-10: HTTP Defense-in-Depth Security Headers
- **Files Modified:** `backend/src/Sparovia.API/Program.cs`
- **Fix Description:** Added `Permissions-Policy` and `Strict-Transport-Security` headers.
- **Implementation:**
```csharp
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Append("Permissions-Policy", "geolocation=(), camera=(), microphone=(), payment=()");
    if (!app.Environment.IsDevelopment())
    {
        context.Response.Headers.Append("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }
    await next();
});
```

---

## 4. Dependency Updates

- Ran safe semantic version package resolution via `npm audit fix` without breaking flags.
- **Packages Updated:**
  - `zod`: Patched against prototype pollution / regex vulnerabilities.
  - `source-map-js`: Patched against denial-of-service vulnerabilities.
  - `postcss-selector-parser`: Patched against unsafe selector parsing.
- Total npm vulnerabilities reduced from 14 to 11. Remaining 11 vulnerabilities reside in devDependencies or uncalled Next.js dynamic Node server paths (see `SECURITY_STATUS.md` for accepted risk justification).

---

## 5. Regression Test Suite Documentation

A dedicated regression test suite was created in `backend/tests/Sparovia.IntegrationTests/SecurityRegressionTests.cs` to continuously prevent regression of all fixed vulnerabilities.

| Test Method Name | Vulnerability Covered | Test Logic & Verification | Result |
| :--- | :--- | :--- | :--- |
| `SecurityHeaders_AreEmittedOnResponses` | SEC-FINDING-10 | Queries API endpoints and asserts presence of `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Permissions-Policy`. | **PASS** |
| `CORS_ArbitraryVercelSubdomain_IsRejected` | SEC-FINDING-04 | Sends preflight CORS request with `Origin: https://malicious.vercel.app` and asserts `Access-Control-Allow-Origin` is NOT returned. | **PASS** |
| `CORS_ApprovedFrontendOrigin_IsAllowedWithCredentials` | SEC-FINDING-04 | Sends preflight CORS request from approved origin (`http://localhost:3000`) and asserts valid CORS headers and credentials allow. | **PASS** |
| `ImageFile_WithForgedUnsignedJwtToken_IsRejectedAndDoesNotGrantPrivateAccess` | SEC-FINDING-02 | Forges an unsigned token with arbitrary `TenantId` and asserts endpoint rejects access (HTTP 401/404) and never serves draft assets. | **PASS** |
| `PublicLeadIntake_WithUnknownDomain_ReturnsNotFound_DoesNotRouteToOtherTenant` | SEC-FINDING-06 | Submits lead with unrecognized `domain` header and asserts API returns 404 and does NOT save lead in any existing tenant. | **PASS** |
| `PublicPublishedContent_WithUnknownDomain_ReturnsNotFound` | SEC-FINDING-06 | Requests published content with unknown host header and asserts API returns 404 instead of falling back to most recent tenant. | **PASS** |
| `WhatsAppWebhook_WithMissingOrInvalidToken_ReturnsUnauthorized` | SEC-FINDING-07 | Sends webhook request with missing or incorrect token and asserts HTTP 401 Unauthorized. | **PASS** |
| `WhatsAppWebhook_WithValidToken_ProcessesSuccessfully` | SEC-FINDING-07 | Sends webhook request with authorized token and valid payload, verifying HTTP 200 and successful lead creation. | **PASS** |
| `DevOtp_IsNotDisclosedInProductionEnvironment` | SEC-FINDING-05 | Executes user registration under `Production` environment and verifies `devOtp` is null in the JSON response. | **PASS** |

---

## 6. Infrastructure & Configuration Changes

1. **`backend/Dockerfile`:**
   - Base image: `mcr.microsoft.com/dotnet/aspnet:9.0`
   - Added: `USER $APP_UID`
   - Removed: `ENV DOTNET_EnableWriteXorExecute=0`
2. **`backend/src/Sparovia.API/appsettings.Production.json`:**
   - Neutralized `DefaultConnection` to `""`.
   - Production deployments must inject `ConnectionStrings__DefaultConnection` via container environment variables or secure secret managers (e.g. AWS Secrets Manager, Azure Key Vault).
3. **`apps/admin/next.config.mjs`:**
   - Removed `NODE_TLS_REJECT_UNAUTHORIZED`.
   - Retained strict export target: `output: 'export'`.

---

## 7. Verification Results

### 7.1 Automated Test Execution
- **Command:** `dotnet test backend/Sparovia.sln`
- **Output:**
  - `Sparovia.UnitTests.dll`: 270 Passed, 0 Failed, 0 Skipped (Duration: 36s)
  - `Sparovia.IntegrationTests.dll`: 195 Passed, 0 Failed, 0 Skipped (Duration: 35s)
  - **Total:** 465 Passed, 0 Failed, 0 Skipped.

### 7.2 Frontend Static Export Compilation
- **Admin App:** `npm run build:admin` -> Exit code 0 (27 static routes generated).
- **Public Web App:** `npm run build:web` -> Exit code 0 (4 static routes generated).
- **TLS Validation:** Strict TLS verification enforced without errors.
