# PILOT_V1_IMPLEMENTATION_PLAN.md

# Sparovia Client Pilot V1 — Implementation Plan

**Status:** Production Ready  
**Version:** 1.0  
**Purpose:** Define the implementation order, module boundaries, dependencies, testing strategy, deployment process, and Definition of Done for Sparovia Client Pilot V1.

---

## 1. Purpose

This document is the implementation authority for Sparovia Client Pilot V1.

It converts the approved Pilot V1 product ([`PILOT_V1_PRODUCT_SPECIFICATION.md`](PILOT_V1_PRODUCT_SPECIFICATION.md)), UX ([`PILOT_V1_UX_SCREEN_SPECIFICATION.md`](PILOT_V1_UX_SCREEN_SPECIFICATION.md)), domain ([`PILOT_V1_DOMAIN_DATA_MODEL.md`](PILOT_V1_DOMAIN_DATA_MODEL.md)), API ([`PILOT_V1_API_SPECIFICATION.md`](PILOT_V1_API_SPECIFICATION.md)), visual design ([`DESIGN.md`](DESIGN.md)), and Image Studio rebuild prompt ([`BUILD_IMAGE_STUDIO_REBUILD.md`](BUILD_IMAGE_STUDIO_REBUILD.md)) into an executable engineering plan.

The implementation must prioritize:

1. Correctness
2. Tenant isolation
3. Production security
4. Reliable client workflows
5. Maintainability
6. Testability
7. Controlled AI/image processing
8. Simple deployment and operation

Pilot V1 must be production-usable by at least one real client before additional platform complexity is introduced.

---

# 2. Pilot V1 Scope

Implementation includes:

- Authentication
- Client onboarding
- Business Context
- Business type/service configuration
- Website content management
- Embedded AI content assistance
- Website image management
- Explore Our Work images
- AI image enhancement
- Image approval and publishing
- Website lead intake
- WhatsApp lead intake when configured
- Lead management
- Tenant isolation
- Audit/change tracking
- API
- Background processing where required
- Production deployment
- Monitoring and error handling

Implementation does **not** include:

- Freeform website builder
- AI website generation
- Autonomous AI publishing
- Advanced CRM
- Advanced analytics
- Google Business Profile integration
- Email automation
- WhatsApp automation
- AI agents
- Multi-workspace management
- Billing
- Super Admin
- Native mobile application
- Advanced DAM
- Generative project-image creation

---

# 3. Implementation Principles

## 3.1 Build the smallest production system

Do not implement future platform functionality unless it is required by Pilot V1.

Every new abstraction must have a current V1 use case.

---

## 3.2 Follow the approved architecture

Backend:

- .NET
- Clean Architecture
- Feature-oriented organization
- PostgreSQL / Supabase
- Entity Framework Core
- REST API
- Provider abstractions for AI/image processing

Frontend/Admin:

- Production web application
- Responsive Admin UI
- API-driven data access
- Client-facing workflow simplicity

Client Website:

- Existing Sparovia-connected website/template
- Controlled content and image integration
- No freeform design editing

---

## 3.3 Tenant isolation is mandatory

Every tenant-owned operation must resolve and validate the tenant before accessing data.

No endpoint, service, repository, background job, or storage operation may depend on a client-provided tenant ID as proof of authorization.

---

## 3.4 AI is workflow assistance

AI must remain embedded inside relevant workflows.

Examples:

- Content → `Improve with AI`
- Images → `AI Enhance`

There must not be a separate autonomous AI module that controls the website.

---

## 3.5 Human approval is mandatory

AI output must never become public automatically.

Required flow:

```text
Generate / Enhance
        ↓
Validate
        ↓
Review
        ↓
Approve
        ↓
Publish
````

---

# 4. High-Level Build Order

Implementation should follow this order:

```text
Phase 0  → Repository & Environment Foundation
Phase 1  → Authentication & Tenant Foundation
Phase 2  → Business Context & Onboarding
Phase 3  → Website Content
Phase 4  → Website Integration / Content Publishing
Phase 5  → Image Management
Phase 6  → AI Content Assistance
Phase 7  → AI Image Enhancement
Phase 8  → Lead Management
Phase 9  → WhatsApp Lead Intake
Phase 10 → Audit, Observability & Hardening
Phase 11 → Full Testing & UAT
Phase 12 → Production Deployment
Phase 13 → Pilot Monitoring & Stabilization
```

Do not build later phases before their required dependencies are stable.

---

# 5. Phase 0 — Repository & Environment Foundation

## Objective

Establish the engineering foundation before feature implementation.

## Tasks

* Confirm repository structure
* Configure solution/projects
* Configure Clean Architecture boundaries
* Configure dependency injection
* Configure configuration management
* Configure environment variables
* Configure local development environment
* Configure database connection
* Configure EF Core
* Configure migrations
* Configure API project
* Configure logging
* Configure API error handling
* Configure validation framework
* Configure automated testing projects
* Configure CI pipeline
* Configure development/staging environments

## Expected Structure

Conceptually:

```text
Sparovia
├── Domain
├── Application
├── Infrastructure
├── API
├── Tests
│   ├── Unit
│   ├── Integration
│   └── Security
└── Client/Admin Application
```

The exact project naming may follow the existing repository conventions.

## Exit Criteria

* Solution builds successfully
* Tests execute
* Database connection works
* API starts successfully
* CI can build and test the project
* Environment configuration is separated from source code

---

# 6. Phase 1 — Authentication & Tenant Foundation

## Objective

Create the security foundation required by every subsequent feature.

## Modules

### Authentication

Responsibilities:

* Login
* Logout/session handling
* Password/security flow
* Token/session validation
* Authentication errors

### Tenant

Responsibilities:

* Tenant identity
* Tenant resolution
* Tenant ownership
* Tenant lifecycle

### Authorization

Responsibilities:

* Authenticated access
* Resource ownership
* Permission enforcement

### Request Context

Responsibilities:

* Current user
* Current tenant
* Request correlation ID

## Dependency

```text
Authentication
      ↓
Tenant Resolution
      ↓
Authorization
      ↓
All Protected Features
```

## Security Requirements

* Never trust tenant ID from request body
* Never expose cross-tenant resources
* Validate resource ownership
* Secure tokens/sessions
* Protect sensitive configuration
* Rate-limit authentication endpoints
* Avoid leaking account existence
* Log security-relevant events

## Exit Criteria

* User can authenticate
* Tenant context is resolved
* Protected endpoint access works
* Unauthorized requests fail
* Cross-tenant access tests fail safely
* Authentication security tests pass

---

# 7. Phase 2 — Business Context & Onboarding

## Objective

Establish the client's trusted business information.

## Modules

* Onboarding
* Business Profile
* Business Context
* Business Type
* Services
* Service Areas where applicable

## Core Flow

```text
Client Registration
        ↓
Business Information
        ↓
Business Type
        ↓
Services
        ↓
Additional Context
        ↓
Review
        ↓
Save Approved Business Context
```

## Requirements

* Required-field validation
* Field limits
* Helpful guidance
* Structured business type
* Structured services
* Explicit approval/save
* Tenant ownership
* Audit fields

## AI Dependency

AI must not be implemented as an independent source of business facts.

The approved Business Context becomes the trusted foundation supplied to AI workflows.

## Exit Criteria

* Client can complete onboarding
* Business Context is persisted correctly
* Data belongs to the correct tenant
* Validation works
* Context can be retrieved safely
* AI-ready context structure exists

---

# 8. Phase 3 — Website Content

## Objective

Allow the client to manage supported website content without providing a freeform website builder.

## Modules

* Website
* Content Sections
* Content Fields
* Services Content
* Business Information Content
* Validation
* Draft/update handling

## Flow

```text
Open Content
      ↓
Edit Supported Field
      ↓
Validate
      ↓
Save
      ↓
Preview / Update
```

## Requirements

* Only supported fields are editable
* Required fields enforced
* Length limits enforced
* Invalid content rejected
* Tenant ownership enforced
* Audit changes
* Existing approved content protected until update succeeds

## Exit Criteria

* Client can edit supported content
* Changes persist
* Invalid content is rejected
* Tenant isolation works
* Content can be consumed by the connected website

---

# 9. Phase 4 — Website Integration & Publishing

## Objective

Connect Sparovia-managed content to the existing client website.

## Modules

* Website configuration
* Content API
* Website integration
* Cache/update propagation
* Publish/update mechanism

## Flow

```text
Sparovia Admin
      ↓
Content API
      ↓
Approved Content
      ↓
Connected Website
```

## Requirements

* Stable API contract
* Secure access
* Tenant-safe content retrieval
* Predictable response structure
* Cache invalidation/update strategy
* Failure protection

## Critical Rule

A failed update must not destroy the currently working website content.

## Exit Criteria

* Website retrieves correct tenant content
* Content changes appear correctly
* Cache/update behavior is verified
* Failure does not corrupt live content

---

# 10. Phase 5 — Image Management

## Objective

Provide reliable website image upload and replacement.

## Modules

* Image Asset
* Image Upload
* Image Validation
* Image Replacement
* Explore Our Work
* Image Storage
* Image Delivery

## Supported Operations

* Upload
* Replace
* Preview
* Approve
* Publish
* Optimize

## Validation

Validate:

* File type
* File size
* Image dimensions where applicable
* Content/storage safety
* Upload ownership

## Lifecycle

```text
Upload
  ↓
Validate
  ↓
Store Original
  ↓
Create/Prepare Derived Version
  ↓
Review
  ↓
Publish
```

## Exit Criteria

* Valid images upload successfully
* Invalid images are rejected
* Original is preserved
* Replacement works
* Explore Our Work images work
* Website receives approved image
* Tenant isolation is verified

---

# 11. Phase 6 — AI Provider Connection & Model Selection Foundation

## Objective

Establish the provider-neutral AI foundation, approved provider/model registries, and secure tenant-owned provider connection management.
Sparovia does not create fictional AI models. The client connects a supported external provider (OpenAI, Google Gemini, Anthropic Claude) using their own API credentials and selects an approved model.

## User Flow

```text
AI Provider Abstraction
      ↓
Provider Registry / Allowlist (OpenAI, Gemini, Claude)
      ↓
Secure Tenant AI Connection (Encrypted API Key at Rest)
      ↓
Model Selection (from approved allowlist)
      ↓
Connection Validation (Test Connection)
      ↓
AI Service Foundation
      ↓
Active for Content AI & Image Enhancement
```

## Modules

* AI Provider Abstraction (`IAIProvider`)
* Provider Adapters (`OpenAIAdapter`, `GeminiAdapter`, `ClaudeAdapter`, `StubAdapter`)
* Provider & Model Registry (`AIModelRegistry`)
* Tenant AI Configuration Service
* Secure Credential Storage & Encryption at Rest
* Connection Validator (`TestConnection`)
* AI Service Orchestrator (`IAIService`)
* AI Configuration Audit

## Exit Criteria

* Provider-neutral abstraction decouples domain from external SDKs
* Tenant can connect supported provider with own API key
* API key is encrypted at rest and never exposed in plaintext
* Connection can be tested before persistence
* Tenant can select from approved models only (unapproved/unavailable rejected)
* Multi-tenant isolation verified (Tenant A cannot see/modify Tenant B connection)

---

# 12. Phase 7 — AI Content Assistance

## Objective

Add contextual AI assistance directly inside supported content workflows.

## User Flow

```text
Existing Content
      ↓
Improve with AI
      ↓
Build Trusted Context
      ↓
AI Provider Abstraction
      ↓
Generate Suggestion
      ↓
Validate
      ↓
Accept / Edit / Reject
      ↓
Save
      ↓
Publish/Update
```

## Modules

* AI Service
* AI Context Builder
* Content AI Workflow
* Provider Abstraction
* Provider Adapter
* AI Output Validator
* AI Audit

## Trusted Context

Use:

1. Approved Business Context
2. Existing approved website content
3. User-provided current content

Do not treat unsupported AI output as business truth.

## Exit Criteria

* AI can improve supported content
* Business Context is supplied
* AI cannot invent unsupported claims
* User can edit result
* User can reject result
* AI result is never automatically published
* Provider failures do not break content editing

---

# 12. Phase 7 — AI Image Enhancement

## Objective

Allow clients to improve their existing images without changing what the image represents.

*(Canonical Implementation Authority: Refer to [`BUILD_IMAGE_STUDIO_REBUILD.md`](BUILD_IMAGE_STUDIO_REBUILD.md) for the approved Image Quality Studio rebuild prompt, adaptive deterministic enhancement pipeline, and before/after review workspace. Visual presentation adheres strictly to the Editorial Cobalt design system in [`DESIGN.md`](DESIGN.md).)*

## Supported Operations

* Improve Clarity
* Improve Sharpness
* Reduce Noise
* Upscale
* Classic Look
* Modern Look
* Web Optimize

## Architecture

```text
Image
  ↓
Enhancement Request
  ↓
Enhancement Service
  ↓
Provider/Engine Abstraction
  ↓
Derived Image
  ↓
Validation
  ↓
Before/After
  ↓
Client Approval
  ↓
Explicit Publish
```

## Critical Rules

The original image must remain immutable.

Enhancement must not:

* Add major objects
* Remove major objects
* Change architecture
* Change products
* Change materials
* Fabricate project details
* Generate fake project imagery

## Exit Criteria

* Enhancement works
* Original remains available
* Derived version is separately tracked
* Before/After review works
* Approval works
* Rejection works
* Enhanced image is not automatically published
* Provider failure is handled safely

---

# 13. Phase 8 — Lead Management

## Objective

Receive and manage website enquiries.

## Modules

* Lead Intake
* Lead Storage
* Lead List
* Lead Detail
* Lead Status
* Lead Validation
* Lead Privacy

## Website Flow

```text
Client Website
      ↓
Lead API
      ↓
Validate
      ↓
Resolve Tenant
      ↓
Create Lead
      ↓
Client Admin
```

## Minimum Website Lead Fields

* Name
* Phone
* Email where provided
* Message
* Date/time
* Source = Website

## Basic Status

Example:

```text
New
Contacted
Closed
```

The exact approved status values must remain consistent across the implementation.

## Exit Criteria

* Website enquiry creates lead
* Correct tenant receives lead
* Invalid submissions fail safely
* Lead list works
* Lead detail works
* Status update works
* Privacy tests pass

---

# 14. Phase 9 — WhatsApp Lead Intake

## Objective

Allow supported WhatsApp integration to create/update leads when configured.

## Scope

WhatsApp is a lead intake source, not a full WhatsApp CRM.

## Flow

```text
WhatsApp Integration
        ↓
Webhook / Intake Layer
        ↓
Validate / Authenticate Source
        ↓
Resolve Tenant
        ↓
Create or Update Lead
        ↓
Source = WhatsApp
        ↓
Client Lead Management
```

## Minimum Data

Where available:

* Customer name
* Phone
* Message
* Date/time
* Source = WhatsApp
* Conversation/message reference

## Excluded

* Automated replies
* Campaigns
* AI agents
* Full conversation inbox
* Conversation automation
* Advanced lead scoring

## Exit Criteria

* Valid WhatsApp message can become a lead
* Tenant is correctly identified
* Duplicate/update behavior is controlled
* Invalid webhook requests are rejected
* WhatsApp failures do not affect website lead intake

---

# 15. Phase 10 — Audit, Observability & Hardening

## Objective

Prepare the system for real-client production usage.

## Audit

Track important actions including:

* Authentication events
* Business Context changes
* Content changes
* AI operations
* Image uploads
* Image replacements
* Image enhancement
* Approvals
* Rejections
* Publishing
* Lead changes
* Security failures

## Observability

Implement:

* Structured logs
* Correlation IDs
* API request metrics
* Error tracking
* AI operation tracking
* Image processing status
* Background job status
* Storage failures
* Authentication failures

## Health Checks

At minimum:

* API health
* Database connectivity
* Required infrastructure dependencies

## Exit Criteria

* Production errors are diagnosable
* Important operations are auditable
* Health checks work
* Sensitive data is not logged
* Correlation IDs allow request tracing

---

# 16. Module Dependency Map

```text
                    ┌────────────────────┐
                    │ Infrastructure     │
                    │ Database / Storage  │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │ Authentication     │
                    │ Tenant / AuthZ     │
                    └─────────┬──────────┘
                              │
              ┌───────────────┼────────────────┐
              ▼               ▼                ▼
        Business Context   Website Content    Images
              │               │                │
              │               │                │
              ▼               ▼                ▼
             AI Content      Website       AI Enhancement
                              │
                              │
                              ▼
                            Leads
                              │
                              ▼
                         WhatsApp
```

Cross-cutting:

```text
Security
Validation
Audit
Logging
Error Handling
Testing
Observability
```

must apply across all modules.

---

# 17. Recommended Engineering Sequence

Do not implement features in random order.

Use this sequence:

```text
1. Repository foundation
2. Database foundation
3. Authentication
4. Tenant isolation
5. Authorization
6. Business Context
7. Website/content domain
8. Content API
9. Website connection
10. Image storage
11. Image management
12. AI provider abstraction & registry
13. Tenant AI connection & credential storage
14. AI model selection & connection validation
15. AI service foundation
16. AI content workflow
17. AI image enhancement
18. Lead domain
19. Website lead intake
20. WhatsApp lead intake
21. Audit
22. Observability
23. Security hardening
24. Automated testing
25. UAT
26. Production deployment
27. Pilot stabilization
```

---

# 18. Database Implementation Order

Create database entities in dependency order.

Recommended order:

```text
Tenant
User / Identity Reference
TenantAIConfiguration
BusinessContext
BusinessType
Service
Website
WebsiteContent
ImageAsset
ImageVersion / DerivedImage
AIOperation
Lead
LeadSource / Status
AuditEntry
```

The final implementation must follow the approved domain/data model rather than introducing duplicate concepts.

---

# 19. API Implementation Order

Implement APIs in this order:

```text
Authentication
      ↓
Business Context
      ↓
Website Content
      ↓
Images
      ↓
AI Provider Connection & Model Selection
      ↓
AI Content
      ↓
AI Image Enhancement
      ↓
Website Leads
      ↓
Lead Management
      ↓
WhatsApp Lead Intake
```

Each API group must be tested before dependent features are built on top of it.

---

# 20. Frontend/Admin Implementation Order

Recommended screen order:

```text
1. Authentication
2. Onboarding
3. Dashboard
4. Business Context
5. Website Content
6. Images
7. AI Provider Connection & Model Selection (/admin/ai-models)
8. Content AI (Embedded)
9. Image Enhancement (Embedded)
10. Explore Our Work
11. Leads
12. Settings
```

Every screen must implement:

* Loading state
* Empty state
* Validation state
* Success state
* Error state
* Disabled/submitting state where applicable
* Responsive behavior

---

# 21. Background Processing

Use background processing for operations that may be slow or unreliable when performed synchronously.

Primary candidate:

* AI image enhancement
* Image optimization
* Other provider-dependent processing where required

## Job Requirements

Every job must have:

* Tenant context
* Resource reference
* Operation type
* Status
* Retry policy
* Failure state
* Correlation ID
* Audit reference

## Security Rule

A background worker must never process a resource without verifying its tenant ownership.

---

# 22. Testing Strategy

Testing is required throughout implementation, not only at the end.

Testing layers:

```text
Unit Tests
   ↓
Integration Tests
   ↓
API Tests
   ↓
Security/Tenant Tests
   ↓
UI Tests
   ↓
End-to-End Tests
   ↓
UAT
```

---

# 23. Unit Testing

Unit tests must cover business rules independently of infrastructure.

Minimum areas:

### Business Context

* Required fields
* Field limits
* Valid business types
* Service rules

### Content

* Validation
* Supported fields
* Content rules

### AI

* Context construction
* Grounding rules
* Output validation
* No-invented-facts checks

### Images

* Enhancement operation validation
* Image lifecycle rules
* Approval rules
* Original preservation

### Leads

* Required fields
* Source validation
* Status transitions
* Duplicate/update rules

### Security

* Authorization decisions
* Tenant ownership rules

---

# 24. Integration Testing

Integration tests must verify real component interaction.

Minimum:

* Database persistence
* EF Core mappings
* Authentication
* Tenant resolution
* Content retrieval
* Image metadata persistence
* Lead persistence
* Audit persistence
* Storage integration
* Background job processing where applicable

---

# 25. API Testing

Every production endpoint must test:

### Success

* Valid request
* Correct response
* Correct data

### Validation

* Missing required fields
* Invalid values
* Oversized input
* Invalid file

### Authentication

* Unauthenticated request
* Invalid credentials/token

### Authorization

* Unauthorized operation
* Cross-tenant access

### Failure

* Database failure
* Storage failure
* Provider failure where applicable

---

# 26. Tenant Isolation Testing

Tenant isolation is a release-blocking test category.

Test scenarios:

```text
Tenant A → Tenant A resource       PASS

Tenant A → Tenant B resource       DENY

Tenant A → Tenant B image          DENY

Tenant A → Tenant B lead           DENY

Tenant A → Tenant B content        DENY

Tenant A → Tenant B AI operation   DENY

Tenant A → Tenant B audit data     DENY
```

Also test:

* Query filters
* Direct ID access
* API manipulation
* Background jobs
* Storage access
* Cached responses
* Webhook processing

No cross-tenant leakage is acceptable.

---

# 27. AI Testing

AI tests must verify both quality and safety.

## Content

Test:

* Context is supplied
* Existing content is considered
* Unsupported claims are rejected
* AI output can be edited
* AI output can be rejected
* AI output is not automatically published

## Image

Test:

* Original is preserved
* Derived version is created
* Supported operations work
* Prohibited transformations are rejected
* Approval is required
* Failed processing does not replace the original

## Provider Independence

Test that:

* Provider failure is handled
* Provider timeout is handled
* Provider response errors are handled
* Provider can be replaced behind the abstraction
* Core content/image workflows do not depend directly on provider-specific code

---

# 28. Image Testing

Test:

* Valid formats
* Invalid formats
* Size limits
* Dimension limits
* Corrupt files
* Duplicate uploads where applicable
* Original preservation
* Replacement
* Derived version creation
* Before/After display
* Approval
* Rejection
* Publishing
* Optimization
* Storage failure
* Processing failure
* Benchmark suite regression (see 30-image benchmark suite in [`BUILD_IMAGE_STUDIO_REBUILD.md`](BUILD_IMAGE_STUDIO_REBUILD.md))

---

# 29. Lead Testing

Test:

### Website

```text
Valid enquiry
→ Lead created
→ Correct tenant
→ Visible in Admin
```

### WhatsApp

```text
Valid message
→ Intake
→ Correct tenant
→ Lead created/updated
→ Visible in Admin
```

### Security

```text
Invalid webhook
→ Rejected

Cross-tenant attempt
→ Rejected
```

---

# 30. End-to-End Testing

At minimum, validate the complete client journey.

## Scenario 1 — New Client

```text
Register
→ Onboard
→ Save Business Context
→ Open Content
```

## Scenario 2 — Content Update

```text
Edit Content
→ Validate
→ Save
→ Website receives update
```

## Scenario 3 — AI Content

```text
Open Content
→ Improve with AI
→ Review
→ Edit
→ Accept
→ Publish
```

## Scenario 4 — Image

```text
Upload Image
→ Validate
→ Review
→ Publish
```

## Scenario 5 — AI Image

```text
Upload
→ Enhance
→ Before/After
→ Approve
→ Publish
```

## Scenario 6 — Website Lead

```text
Website Enquiry
→ API
→ Lead Created
→ Admin
→ Status Update
```

## Scenario 7 — WhatsApp Lead

```text
WhatsApp Message
→ Integration
→ Lead Created/Updated
→ Admin
```

---

# 31. Performance Requirements

Pilot V1 should remain responsive under normal expected client usage.

Measure:

* API response time
* Database query performance
* Image upload performance
* Website content retrieval
* Lead submission
* AI request duration
* Image processing duration

Slow AI/image processing must not block unrelated Admin functionality.

---

# 32. Security Hardening

Before production:

* Validate all input
* Enforce authorization server-side
* Enforce tenant ownership
* Protect secrets
* Secure authentication
* Configure CORS correctly
* Configure HTTPS
* Apply rate limits
* Validate file uploads
* Prevent unsafe file execution
* Avoid sensitive logs
* Protect webhook endpoints
* Review dependency vulnerabilities
* Review database permissions
* Review storage permissions
* Review API error leakage

---

# 33. Deployment Environments

Recommended:

```text
Local
  ↓
Development
  ↓
Staging
  ↓
Production
```

Production deployment must not be the first environment where full integration is tested.

---

# 34. CI/CD Pipeline

Minimum pipeline:

```text
Commit
  ↓
Restore Dependencies
  ↓
Build
  ↓
Unit Tests
  ↓
Integration Tests
  ↓
Security/Quality Checks
  ↓
Package
  ↓
Deploy Staging
  ↓
Smoke Tests
  ↓
Production Approval
  ↓
Deploy Production
```

---

# 35. Database Deployment

Database changes must use versioned migrations.

Rules:

* Never manually modify production schema without a migration strategy
* Review destructive migrations
* Back up production before risky changes
* Test migrations in staging
* Ensure application compatibility during deployment
* Maintain rollback/recovery strategy

---

# 36. Production Configuration

Production secrets must not be committed to source control.

Examples:

* Database credentials
* Authentication secrets
* Storage credentials
* AI provider credentials
* WhatsApp integration credentials
* External service credentials

Use environment/secret management appropriate to the hosting platform.

---

# 37. Deployment Smoke Tests

Immediately after deployment verify:

### API

* Health endpoint
* Authentication
* Database connectivity

### Admin

* Login
* Dashboard
* Business Context
* Content
* Images
* Leads

### Website

* Content retrieval
* Image retrieval
* Lead submission

### AI

* Content AI request
* Image enhancement request where enabled

### Security

* Tenant isolation
* Authentication protection

---

# 38. Rollback Strategy

Deployment must have a documented rollback path.

Rollback may include:

* Application version rollback
* Configuration rollback
* Database recovery where required
* Disabling AI/image processing if provider failure occurs

Critical rule:

> A failed AI provider must never require rolling back the entire Sparovia platform.

---

# 39. Feature Failure Isolation

The system must degrade safely.

Examples:

### AI unavailable

Content editing still works.

### Image enhancement unavailable

Normal image upload/replacement still works.

### WhatsApp unavailable

Website lead intake still works.

### AI provider timeout

User receives a retry/failure state.

### Image processing failure

Original image remains safe.

---

# 40. Production Readiness Checklist

Before release, verify:

### Architecture

* [ ] Clean Architecture boundaries respected
* [ ] Feature responsibilities are clear
* [ ] No unnecessary V1 modules

### Authentication

* [ ] Login works
* [ ] Unauthorized requests blocked
* [ ] Session/token security verified

### Tenant Isolation

* [ ] Tenant resolved server-side
* [ ] All tenant resources protected
* [ ] Cross-tenant tests pass
* [ ] Background jobs enforce tenant ownership

### Business Context

* [ ] Onboarding works
* [ ] Business Context persists
* [ ] Guidance exists
* [ ] Validation works

### Content

* [ ] Content editing works
* [ ] Validation works
* [ ] Save/update works
* [ ] Website receives changes

### AI Content

* [ ] Context grounding works
* [ ] No-invented-facts rule enforced
* [ ] Accept/Edit/Reject works
* [ ] Human approval required
* [ ] Provider failure handled

### Images

* [ ] Upload works
* [ ] Replacement works
* [ ] Explore Our Work works
* [ ] Original preserved
* [ ] Validation works

### AI Images

* [ ] Supported enhancement operations work
* [ ] Original preserved
* [ ] Before/After works
* [ ] Approval works
* [ ] Explicit publish required
* [ ] Failure/retry works

### Leads

* [ ] Website lead intake works
* [ ] Lead list works
* [ ] Lead detail works
* [ ] Status management works
* [ ] WhatsApp intake works when configured

### Security

* [ ] Input validation
* [ ] Authorization
* [ ] Tenant isolation
* [ ] File validation
* [ ] Rate limiting
* [ ] Secret protection
* [ ] Secure webhook handling

### Operations

* [ ] Logging
* [ ] Health checks
* [ ] Error monitoring
* [ ] Audit tracking
* [ ] Backup/recovery strategy
* [ ] Deployment rollback path

---

# 41. User Acceptance Testing

A real pilot client must perform the primary workflows.

Minimum UAT:

1. Complete onboarding
2. Review Business Context
3. Update website content
4. Use Improve with AI
5. Accept/edit/reject AI suggestion
6. Upload an image
7. Replace an image
8. Upload Explore Our Work image
9. Enhance an image
10. Review Before/After
11. Approve enhanced image
12. Publish image
13. Submit website enquiry
14. View lead
15. Update lead status
16. Receive WhatsApp lead when integration is configured

UAT feedback must be recorded before expanding V1 scope.

---

# 42. Pilot Release Criteria

Pilot V1 is eligible for production when:

* All High-priority requirements are complete
* All critical security tests pass
* Tenant isolation passes
* Core workflows pass end-to-end
* No known release-blocking defects remain
* Production deployment is repeatable
* Monitoring is operational
* Backup/recovery is understood
* Real client can complete supported workflows
* AI safety requirements are verified
* Original image preservation is verified
* Lead delivery is reliable

---

# 43. Definition of Done

A Pilot V1 feature is **Done** only when:

### Product

* Requirement matches approved V1 scope
* No unauthorized feature expansion
* UX matches approved workflow

### Engineering

* Production-quality implementation
* Correct architecture boundaries
* Validation implemented
* Error handling implemented
* Security implemented
* Audit requirements implemented where applicable

### Data

* Correct tenant ownership
* Correct persistence
* Correct migrations
* No unintended data leakage

### API

* Contract implemented
* Authentication enforced
* Authorization enforced
* Validation implemented
* Standard errors implemented

### Frontend

* Loading state
* Empty state
* Validation state
* Success state
* Error state
* Responsive behavior

### AI

* Trusted context used
* No-invented-facts protection
* Human approval
* Provider abstraction
* Failure handling

### Images

* Original preserved
* Derived versions tracked
* Validation implemented
* Approval implemented
* Publish behavior verified

### Testing

* Unit tests
* Integration tests
* API tests
* Tenant isolation tests
* End-to-end tests where applicable

### Operations

* Logging
* Monitoring
* Health checks
* Deployment verification
* Rollback strategy

A feature is not Done merely because the code works locally.

---

# 44. Pilot V1 Release Definition of Done

The entire Pilot V1 is Done only when:

```text
Architecture
      +
Security
      +
Tenant Isolation
      +
Business Context
      +
Content
      +
Images
      +
AI Assistance
      +
AI Image Enhancement
      +
Website Leads
      +
WhatsApp Lead Intake
      +
Testing
      +
Deployment
      +
Monitoring
      +
Real Client UAT
```

all meet their approved acceptance criteria.

---

# 45. Post-Release Stabilization

After production release:

## First Priority

Fix:

* Security issues
* Data integrity issues
* Tenant isolation issues
* Lead loss
* Website-breaking defects
* Image corruption
* Authentication failures

## Second Priority

Fix:

* UX friction
* Validation problems
* AI quality issues
* Image enhancement quality
* Performance problems

## Third Priority

Consider:

* Small usability improvements
* Pilot-driven workflow improvements

Do not immediately add new platform modules.

---

# 46. Change Control During Pilot

Any proposed feature must be classified as:

```text
Bug
Usability Improvement
Required V1 Fix
V1 Scope Change
Future Feature
```

Only bugs, required V1 fixes, and carefully approved usability improvements should normally enter the active pilot build.

New functionality must not silently expand Pilot V1.

---

# 47. Implementation Priority

When engineering capacity is limited, prioritize:

```text
P0 — Security / Tenant Isolation
P0 — Authentication
P0 — Data Integrity
P0 — Core Client Workflows

P1 — Content
P1 — Images
P1 — Leads

P1 — AI Assistance
P1 — AI Image Enhancement

P2 — WhatsApp Lead Intake
P2 — UX Refinement
P2 — Optimization
```

AI must never take priority over the reliability of the core platform.

---

# 48. Final Implementation Boundary

Sparovia Client Pilot V1 is a **controlled client-management platform**, not a website builder.

The implementation must deliver:

```text
Client
  ↓
Onboarding
  ↓
Business Context
  ↓
Manage Website Content
  ↓
Improve Content with AI
  ↓
Manage Website Images
  ↓
Enhance Existing Images
  ↓
Approve
  ↓
Publish
  ↓
Receive Website / WhatsApp Leads
  ↓
Manage Leads
```

with:

```text
Tenant Isolation
Authentication
Authorization
Validation
Audit
Observability
Testing
Production Deployment
```

as the foundation.

The implementation must preserve the central Sparovia principle:

> **Sparovia controls the platform experience and structure; the client controls approved business content and media; AI assists inside controlled workflows; nothing AI-generated becomes public without human approval.**

---

# 49. Final Engineering Rule

Build only what Pilot V1 requires.

Do not build the future platform before validating the current one.

The first production objective is not feature count.

It is:

> **One real client successfully using Sparovia in production, safely, reliably, and without developer intervention for supported workflows.**

Once that objective is achieved, pilot feedback becomes the primary input for the next controlled release.

