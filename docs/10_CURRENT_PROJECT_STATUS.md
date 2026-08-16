# Sparovia — Current Project Status

> **Last Updated:** 2026-08-16
> **Current Phase:** Phase 3 Complete — Backend Foundation

---

## Completed Phases

### Phase 1 — Project Setup ✅
- Repository initialized on GitHub
- docs/ structure established

### Phase 2 — Premium Landing Page (Frontend) ✅
- KVN Interiors premium landing page built in Next.js 14
- 10+ sections: Hero, Brand Intro, Interior Storytelling, uPVC, Gallery, Testimonials, FAQ, CTA, Contact, Footer
- Smooth scroll (Lenis), animations (Framer Motion + GSAP)
- Design system: Inter font, brand purple palette, 8px grid
- Static export configured (Netlify)

### Phase 3 — Repository + Backend Foundation + PostgreSQL ✅

**Branch:** `feature/phase-3-backend-foundation`
**Completed:** 2026-08-16

#### What was implemented:

**Repository Structure**
```
Sparovia_V1/
├── docs/                         ← Project documentation (locked)
├── app/                          ← Next.js frontend (Landing + future Admin)
├── components/                   ← Frontend components
├── backend/                      ← NEW — .NET 9 ASP.NET Core API
│   ├── Sparovia.sln
│   ├── src/
│   │   ├── Sparovia.Domain/      ← Pure domain, no dependencies
│   │   ├── Sparovia.Application/ ← Use cases, interfaces, DTOs, validators
│   │   ├── Sparovia.Infrastructure/ ← EF Core, Npgsql, BCrypt, JWT
│   │   └── Sparovia.API/         ← Controllers, middleware, Program.cs
│   └── tests/
│       ├── Sparovia.UnitTests/   ← 10 unit tests (all passing)
│       └── Sparovia.IntegrationTests/ ← 12 integration tests (Testcontainers)
└── .gitignore                    ← Updated with .NET entries
```

**Domain Layer**
- `User` entity (Id, Email, PasswordHash, FirstName, LastName, IsActive, CreatedAt, UpdatedAt)
- `Business` entity — tenant root (Id, Name, Slug, Industry, Description, IsActive, CreatedAt, UpdatedAt)
- `Membership` entity (Id, UserId, BusinessId, Role, Status, CreatedAt, UpdatedAt)
- `MembershipRole` enum: Owner, Staff
- `MembershipStatus` enum: Active
- `DomainException` base exception

**Application Layer**
- `IUserRepository`, `IBusinessRepository`, `IMembershipRepository` interfaces
- `IUnitOfWork` interface (transaction management)
- `IPasswordHasher`, `ITokenService` interfaces
- `AuthService` — register, login, current user (timing-safe login path)
- `BusinessService` — create business + atomic Owner membership, tenant-isolated access
- `RegisterRequestValidator`, `LoginRequestValidator`, `CreateBusinessRequestValidator`
- Auth DTOs, Business DTOs (no PasswordHash ever exposed)
- Application exceptions: Conflict, Unauthorized, Forbidden, NotFound, Validation

**Infrastructure Layer**
- `SparoviaDbContext` with 3 entity configurations
- `UserConfiguration` — unique email index, snake_case columns
- `BusinessConfiguration` — unique slug index, RESTRICT deletes
- `MembershipConfiguration` — composite (user_id, business_id) index
- `UserRepository`, `BusinessRepository`, `MembershipRepository`
- `UnitOfWork` — wraps EF Core transaction
- `PasswordHasher` — BCrypt work factor 12
- `JwtTokenService` — HMAC-SHA256, config-driven
- EF Core migration: `InitialSchema` (creates all 3 tables + indexes + FKs)

**API Layer**
- `AuthController` — POST /api/auth/register, POST /api/auth/login, GET /api/auth/me
- `BusinessController` — POST /api/businesses, GET /api/businesses/me, GET /api/businesses/{id}
- `GET /api/health`
- `BaseApiController` — resolves userId from JWT claims only (never from request body)
- `GlobalExceptionHandlerMiddleware` — no stack traces, no SQL errors in responses
- Structured logging via Serilog (console + rolling file)
- Swagger/OpenAPI with JWT Bearer authentication config
- CORS configured per environment
- HTTPS redirection enabled

**Security**
- JWT Bearer tokens (HMAC-SHA256)
- BCrypt password hashing (work factor 12)
- Passwords never logged, never returned via API
- Tenant isolation: access always verified via Membership query from JWT userId
- Frontend-supplied BusinessId never trusted as authorization proof

**Testing**
- 10/10 unit tests passing
- 12 integration tests (Testcontainers PostgreSQL — no local PG required)

**Verification Results**
- `dotnet restore` ✅ — all 6 projects
- `dotnet build` ✅ — 0 warnings, 0 errors
- `dotnet test (unit)` ✅ — 10/10 passed
- Migration `InitialSchema` ✅ — created and verified

---

## In Progress / Next Phase

### Phase 4 — Basic Sparovia Admin Panel (NOT STARTED)

The next approved phase is:

```
PHASE 4 — BASIC SPAROVIA ADMIN PANEL
```

This phase should include:
- Admin Panel UI in Next.js (inside app/(admin)/ route group)
- Authentication flows (Register/Login pages)
- Business workspace
- Dashboard skeleton
- Integration with Phase 3 API

**Do not begin Phase 4 without explicit approval.**

---

## Known Issues / Notes

- Integration tests require Docker (for Testcontainers PostgreSQL) — Docker must be installed for `dotnet test` on integration project
- The `appsettings.Development.json` contains placeholder credentials — real credentials must be supplied via environment variables or user secrets before running the API against a real PostgreSQL instance
- `08_MASTER_PLATFORM_ARCHITECTURE.md` referenced in project rules but not yet created in docs/
