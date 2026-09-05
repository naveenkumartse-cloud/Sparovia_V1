# PILOT_V1_DOMAIN_DATA_MODEL.md

# Sparovia Client Pilot V1 — Domain & Data Model

**Document Status:** Production Ready  
**Version:** 1.0  
**Scope:** Client Pilot V1  
**Audience:** Backend, Frontend, Database, API, QA  
**Authority:** Implementation source of truth for Pilot V1 domain and persistence model

---

## 1. Purpose

This document defines the domain entities, fields, relationships, ownership, lifecycle states, and persistence rules required to implement Sparovia Client Pilot V1.

The model covers only the Pilot V1 scope:

- Tenant and user identity
- Business Context
- Services
- Connected website
- Website content
- Website images
- Image variants
- AI requests
- Leads
- Audit records

The model intentionally excludes future platform complexity.

---

# 2. Domain Principles

## 2.1 Tenant Isolation

Every client-owned resource belongs to exactly one `Tenant`.

Tenant ownership is a mandatory security boundary.

```text
Tenant
 ├── Users
 ├── BusinessContext
 ├── Website
 ├── Images
 ├── Leads
 ├── AIRequests
 └── AuditRecords
````

No client-owned resource may exist without a tenant association.

---

## 2.2 Server-Owned Tenant Resolution

The client must never be trusted to determine ownership.

The server resolves the tenant from:

```text
Authenticated User
        ↓
User.TenantId
        ↓
Authorized Resource
```

For website-originated operations:

```text
Authenticated / Trusted Website Identity
        ↓
Website
        ↓
Website.TenantId
```

A client-supplied `TenantId` must never override server-side tenant resolution.

---

## 2.3 Source of Truth

Business facts follow this hierarchy:

```text
1. Approved Business Context
2. Approved Website Content
3. Current Draft
4. AI Suggestion
5. General AI Knowledge
```

AI suggestions are not trusted business facts until explicitly approved by the client.

---

# 3. Entity Overview

Pilot V1 contains the following core entities:

| Entity          | Purpose                                |
| --------------- | -------------------------------------- |
| Tenant          | Client/business ownership boundary     |
| User            | Authenticated client/admin user        |
| BusinessContext | Approved understanding of the business |
| Service         | Structured business offering           |
| Website         | Connected client website               |
| WebsiteContent  | Structured website content             |
| Image           | Original client-uploaded image         |
| ImageVariant    | Derived image versions                 |
| Lead            | Customer enquiry                       |
| AIRequest       | Record of contextual AI operation      |
| AuditRecord     | Important change/security history      |

---

# 4. Entity Relationship Overview

```text
Tenant
│
├── User
│
├── BusinessContext
│   └── Service
│
├── Website
│   ├── WebsiteContent
│   └── Image
│       └── ImageVariant
│
├── Lead
│
├── AIRequest
│
└── AuditRecord
```

Primary relationships:

```text
Tenant 1 ─── N User
Tenant 1 ─── 1 BusinessContext
BusinessContext 1 ─── N Service

Tenant 1 ─── 1 Website
Website 1 ─── N WebsiteContent
Website 1 ─── N Image
Image 1 ─── N ImageVariant

Tenant 1 ─── N Lead
Tenant 1 ─── N AIRequest
Tenant 1 ─── N AuditRecord
```

---

# 5. Common Entity Rules

All persistent entities should use a consistent identifier strategy.

Recommended:

```text
Id
CreatedAt
UpdatedAt
```

Identifiers should be generated server-side.

Recommended identifier type:

```text
UUID / GUID
```

Do not expose database implementation details through the API.

---

# 6. Tenant

## Purpose

Represents one Sparovia client/business ownership boundary.

## Fields

| Field     | Type     | Required | Notes                        |
| --------- | -------- | -------: | ---------------------------- |
| Id        | UUID     |      Yes | Primary key                  |
| Name      | String   |      Yes | Tenant/business display name |
| CreatedAt | DateTime |      Yes | Server generated             |
| UpdatedAt | DateTime |      Yes | Server maintained            |

`Name` should normally correspond to the client's business identity but must not replace `BusinessContext`.

## Relationships

```text
Tenant
 ├── Users
 ├── BusinessContext
 ├── Website
 ├── Images
 ├── Leads
 ├── AIRequests
 └── AuditRecords
```

## Ownership

Tenant is the root ownership boundary for all client data.

---

# 7. User

## Purpose

Represents an authenticated Sparovia client/admin account.

## Fields

| Field         | Type     | Required | Notes                                    |
| ------------- | -------- | -------: | ---------------------------------------- |
| Id            | UUID     |      Yes | Primary key                              |
| TenantId      | UUID     |      Yes | Tenant owner                             |
| FullName      | String   |      Yes | Client name                              |
| Email         | String   |      Yes | Unique according to authentication rules |
| PasswordHash  | String   |      Yes | Never store plaintext password           |
| EmailVerified | Boolean  |      Yes | Verification state                       |
| CreatedAt     | DateTime |      Yes | Server generated                         |
| UpdatedAt     | DateTime |      Yes | Server maintained                        |
| LastLoginAt   | DateTime |       No | Optional                                 |

Authentication-provider-specific fields may be added internally if required.

## Relationships

```text
User → Tenant
```

## Rules

* A user may access only authorized resources within their tenant.
* Passwords are never stored in plaintext.
* User authentication does not automatically grant cross-tenant access.

---

# 8. BusinessContext

## Purpose

Stores the approved information Sparovia uses to understand the client's business.

Pilot V1 should maintain one primary approved Business Context per tenant.

## Fields

### Identity

| Field                   | Type                      | Required |
| ----------------------- | ------------------------- | -------: |
| Id                      | UUID                      |      Yes |
| TenantId                | UUID                      |      Yes |
| BusinessName            | String                    |      Yes |
| BusinessType            | Enum                      |      Yes |
| PrimaryBusinessCategory | String / Controlled Value |      Yes |

### Contact

| Field         | Type   | Required |
| ------------- | ------ | -------: |
| BusinessPhone | String |      Yes |
| BusinessEmail | String |      Yes |
| WebsiteUrl    | String |      Yes |

### Location

| Field                      | Type               |    Required |
| -------------------------- | ------------------ | ----------: |
| CustomerVisitLocation      | Enum               |         Yes |
| BusinessAddress            | Structured Address | Conditional |
| ProvidesAtCustomerLocation | Boolean            |         Yes |
| ServiceAreas               | Collection         | Conditional |

### Audience

| Field               | Type       | Required |
| ------------------- | ---------- | -------: |
| TargetCustomers     | Collection |      Yes |
| OtherCustomerTypes  | String     |       No |
| CustomerDescription | Text       |       No |

### Positioning

| Field           | Type | Required |
| --------------- | ---- | -------: |
| Differentiators | Text |       No |

### Description

| Field               | Type | Required |
| ------------------- | ---- | -------: |
| BusinessDescription | Text |      Yes |

### Approved Facts

| Field               | Type       | Required |
| ------------------- | ---------- | -------: |
| YearsInBusiness     | Integer    |       No |
| Certifications      | Collection |       No |
| Awards              | Collection |       No |
| Warranties          | Collection |       No |
| Accreditations      | Collection |       No |
| OtherApprovedClaims | Collection |       No |

### Lifecycle

| Field       | Type     | Required |
| ----------- | -------- | -------: |
| IsConfirmed | Boolean  |      Yes |
| ConfirmedAt | DateTime |       No |
| CreatedAt   | DateTime |      Yes |
| UpdatedAt   | DateTime |      Yes |

---

# 9. Business Type

Controlled single-select values:

```text
Storefront
ServiceArea
Hybrid
Online
Other
```

The stored representation should use stable internal enum/value identifiers.

Display labels may change independently.

---

# 10. Customer Visit Location

Recommended values:

```text
Yes
No
Both
```

This determines whether a physical business address is relevant.

---

# 11. Address

Address should be represented as structured data rather than one uncontrolled string where practical.

Recommended fields:

| Field        | Type             |
| ------------ | ---------------- |
| AddressLine1 | String           |
| AddressLine2 | String, optional |
| City         | String           |
| State        | String           |
| PostalCode   | String           |
| Country      | String           |

Exact normalization requirements may be finalized during API/database implementation.

---

# 12. Service

## Purpose

Represents one structured business offering.

## Fields

| Field               | Type     | Required |
| ------------------- | -------- | -------: |
| Id                  | UUID     |      Yes |
| TenantId            | UUID     |      Yes |
| BusinessContextId   | UUID     |      Yes |
| Name                | String   |      Yes |
| ShortDescription    | Text     |      Yes |
| DetailedDescription | Text     |       No |
| CreatedAt           | DateTime |      Yes |
| UpdatedAt           | DateTime |      Yes |

## Relationship

```text
Tenant
  ↓
BusinessContext
  ↓
Service
```

## Rules

* Services belong to the current tenant.
* Service data may be used as Business Context.
* Services are structured records.
* No AI-generated service may become trusted automatically.
* No complex service taxonomy is required for V1.

---

# 13. Website

## Purpose

Represents the client's connected website.

Pilot V1 supports one connected website per tenant.

## Fields

| Field                 | Type     |             Required |
| --------------------- | -------- | -------------------: |
| Id                    | UUID     |                  Yes |
| TenantId              | UUID     |                  Yes |
| Name                  | String   |                  Yes |
| Domain                | String   |                  Yes |
| ConnectionStatus      | Enum     |                  Yes |
| IntegrationIdentifier | String   | Internal/Conditional |
| CreatedAt             | DateTime |                  Yes |
| UpdatedAt             | DateTime |                  Yes |

## Connection Status

Recommended values:

```text
Connected
Disconnected
NeedsAttention
```

Exact status set may be refined during API implementation if required.

## Relationships

```text
Tenant 1 ─── 1 Website
Website 1 ─── N WebsiteContent
Website 1 ─── N Image
```

---

# 14. WebsiteContent

## Purpose

Stores structured content mapped to supported website sections.

It is not a generic CMS document.

## Fields

| Field           | Type              |    Required |
| --------------- | ----------------- | ----------: |
| Id              | UUID              |         Yes |
| TenantId        | UUID              |         Yes |
| WebsiteId       | UUID              |         Yes |
| SectionKey      | String / Enum     |         Yes |
| ContentData     | Structured Object |         Yes |
| Status          | Enum              |         Yes |
| Version         | Integer           |         Yes |
| CreatedByUserId | UUID              | Conditional |
| UpdatedByUserId | UUID              | Conditional |
| CreatedAt       | DateTime          |         Yes |
| UpdatedAt       | DateTime          |         Yes |
| PublishedAt     | DateTime          |          No |

The exact relational representation of `ContentData` depends on implementation.

The domain rule is that only predefined supported fields may be stored.

---

# 15. Supported Website Sections

Pilot V1 supports:

```text
BusinessHero
About
Services
WhyChooseUs
ExploreOurWork
Contact
Footer
```

Additional sections may be supported only when explicitly mapped for the connected pilot website.

---

# 16. Website Content Status

```text
Draft
Published
```

### Draft

Editable content that is not live.

### Published

The currently approved/live website content version.

Rules:

* Draft does not automatically become Published.
* AI output starts as draft content.
* Publishing requires explicit client action.
* Failed website update must not destroy the current Published version.

---

# 17. Website Content Versioning

Pilot V1 requires enough version information to safely distinguish current draft and published content.

At minimum:

```text
Version
Status
CreatedAt
UpdatedAt
PublishedAt
```

A full client-facing revision-history system is not required for V1.

---

# 18. Image

## Purpose

Represents an original client-uploaded image.

The `Image` entity represents the source asset and its website usage.

## Fields

| Field            | Type         | Required |
| ---------------- | ------------ | -------: |
| Id               | UUID         |      Yes |
| TenantId         | UUID         |      Yes |
| WebsiteId        | UUID         |      Yes |
| StorageKey       | String       |      Yes |
| OriginalFileName | String       |       No |
| MimeType         | String       |      Yes |
| FileSize         | Integer/Long |      Yes |
| Width            | Integer      |      Yes |
| Height           | Integer      |      Yes |
| UsageType        | Enum         |      Yes |
| Status           | Enum         |      Yes |
| CreatedAt        | DateTime     |      Yes |
| UpdatedAt        | DateTime     |      Yes |

The physical storage location must not be exposed directly to clients.

---

# 19. Image Usage Type

Recommended values:

```text
WebsiteImage
ExploreOurWork
```

Additional usage types may be introduced only when required by a mapped website component.

---

# 20. Image Status

Recommended lifecycle states:

```text
Processing
Enhanced
Approved
Published
Rejected
```

The original source itself must remain preserved regardless of derived lifecycle state.

Implementation may distinguish source-asset state from website publication state internally if that produces a cleaner model.

---

# 21. ImageVariant

## Purpose

Represents a derived version of an image.

Examples:

* AI-enhanced image
* Website optimized image
* Responsive delivery variant

## Fields

| Field           | Type         | Required |
| --------------- | ------------ | -------: |
| Id              | UUID         |      Yes |
| TenantId        | UUID         |      Yes |
| ImageId         | UUID         |      Yes |
| ParentVariantId | UUID         |       No |
| VariantType     | Enum         |      Yes |
| StorageKey      | String       |      Yes |
| MimeType        | String       |      Yes |
| FileSize        | Integer/Long |      Yes |
| Width           | Integer      |      Yes |
| Height          | Integer      |      Yes |
| Version         | Integer      |      Yes |
| Status          | Enum         |      Yes |
| CreatedAt       | DateTime     |      Yes |
| UpdatedAt       | DateTime     |      Yes |

---

# 22. Image Variant Types

Recommended values:

```text
AIEnhanced
WebsiteOptimized
Responsive
```

`Responsive` variants may be generated only when required by the actual website component.

Do not create arbitrary variants without a delivery requirement.

---

# 23. Image Lifecycle

The conceptual lifecycle is:

```text
Original
   ↓
Optional AI Enhanced
   ↓
Approved
   ↓
Website Optimized
   ↓
Published
```

Important:

```text
Original ≠ Derived
```

The original must never be overwritten by an AI or optimization operation.

---

# 24. Explore Our Work Data

Explore Our Work uses the standard `Image` entity with optional metadata.

Recommended fields:

| Field           | Type               | Required |
| --------------- | ------------------ | -------: |
| Image           | Image relationship |      Yes |
| ProjectWorkName | String             |       No |
| Caption         | Text               |       No |

V1 does not require separate project entities.

Do not create:

```text
Project
Gallery
Album
PortfolioCategory
```

unless future requirements explicitly justify them.

---

# 25. Lead

## Purpose

Represents a customer enquiry received by Sparovia.

Supported sources:

```text
Website
WhatsApp
```

WhatsApp leads are supported only when the relevant integration is configured.

## Fields

| Field           | Type     | Required |
| --------------- | -------- | -------: |
| Id              | UUID     |      Yes |
| TenantId        | UUID     |      Yes |
| Name            | String   |      Yes |
| Phone           | String   |      Yes |
| Email           | String   |       No |
| Message         | Text     |      Yes |
| Source          | Enum     |      Yes |
| Status          | Enum     |      Yes |
| SubmittedAt     | DateTime |      Yes |
| SourceReference | String   |       No |
| CreatedAt       | DateTime |      Yes |
| UpdatedAt       | DateTime |      Yes |

`SubmittedAt` is server-generated.

`TenantId` is server-derived.

---

# 26. Lead Source

Controlled values:

```text
Website
WhatsApp
```

The source must not be an arbitrary client-provided value.

---

# 27. Lead Status

Controlled values:

```text
New
Contacted
Qualified
Closed
```

V1 does not require a complex state machine.

Clients may update lead status through authorized actions.

---

# 28. WhatsApp Lead Data

WhatsApp lead intake may provide:

* Customer name, if available
* Phone
* Message
* Date/time
* Source = WhatsApp
* SourceReference where appropriate

The Lead entity remains the primary client-facing record.

V1 does not require storing a complete WhatsApp conversation model.

Do not introduce:

```text
WhatsAppConversation
WhatsAppMessage
WhatsAppInbox
```

unless required by actual integration implementation.

---

# 29. Lead Ownership

Every Lead belongs to exactly one Tenant.

```text
Lead.TenantId
```

must always resolve server-side.

All lead queries must be tenant-scoped.

A user from Tenant A must never be able to:

* Read Tenant B leads.
* Update Tenant B leads.
* Infer Tenant B lead existence.
* Attach a lead to Tenant B.

---

# 30. AIRequest

## Purpose

Records an AI operation performed within a Sparovia workflow.

AIRequest is an operational domain record, not a standalone AI product/module.

## Fields

| Field             | Type              | Required |
| ----------------- | ----------------- | -------: |
| Id                | UUID              |      Yes |
| TenantId          | UUID              |      Yes |
| UserId            | UUID              |       No |
| OperationType     | Enum              |      Yes |
| ResourceType      | String/Enum       |      Yes |
| ResourceId        | UUID              |      Yes |
| Status            | Enum              |      Yes |
| ProviderReference | String            |       No |
| ModelReference    | String            |       No |
| ContextVersion    | String/Identifier |       No |
| CreatedAt         | DateTime          |      Yes |
| CompletedAt       | DateTime          |       No |
| ErrorCode         | String            |       No |

Provider/model fields are internal implementation metadata and must not be exposed as client configuration.

---

# 31. AI Operation Types

Recommended values:

```text
ImproveWording
MakeProfessional
MakeShorter
MakeClearer
ImproveServiceDescription

ImproveClarity
ImproveSharpness
ReduceNoise
Upscale
ClassicLook
ModernLook
WebOptimize
```

The exact internal enum may evolve as provider capabilities are implemented, while the user-facing operations remain stable.

---

# 32. AI Request Status

Recommended values:

```text
Processing
Succeeded
Failed
Rejected
```

AI output must not be treated as approved merely because the request succeeded.

---

# 33. AI Context

An AI request may use:

```text
Approved Business Context
        +
Approved Website Content
        +
Current Draft / Field
        +
Current Section
        +
Client Request
        +
Sparovia AI Rules
```

The request must be tenant-scoped.

Only necessary context should be supplied.

Do not send unrelated:

* Lead data
* Financial data
* Secrets
* Internal credentials
* Other tenant information

---

# 34. AI Trust Model

```text
Approved Business Context
        ↓
Trusted

Approved Website Content
        ↓
Trusted

Current Draft
        ↓
Working Content

AI Suggestion
        ↓
Untrusted Until Approved
```

AI output must never automatically modify:

* Business Context
* Published Content
* Published Images

---

# 35. AuditRecord

## Purpose

Records important client, system, AI, and security actions.

## Fields

| Field        | Type              | Required |
| ------------ | ----------------- | -------: |
| Id           | UUID              |      Yes |
| TenantId     | UUID              |      Yes |
| UserId       | UUID              |       No |
| Action       | String/Enum       |      Yes |
| ResourceType | String/Enum       |      Yes |
| ResourceId   | UUID              |       No |
| Result       | String/Enum       |      Yes |
| Metadata     | Structured Object |       No |
| Timestamp    | DateTime          |      Yes |

Metadata should contain only the minimum information required for traceability.

---

# 36. Audited Actions

At minimum, track important actions such as:

### Business Context

* Create
* Update
* Confirm

### Content

* Draft saved
* Published
* Website update attempted
* Website update succeeded/failed

### Images

* Upload
* Replace
* Enhancement requested
* Enhancement approved
* Enhancement rejected
* Website update

### AI

* Request
* Success/failure
* Accept
* Reject

### Leads

* Lead created
* Lead status changed

### Security

* Authentication events
* Authorization failures
* Important security events

---

# 37. Audit Privacy

Audit records must not contain:

* Passwords
* Authentication secrets
* API keys
* Tokens
* Unnecessary personal data
* Complete sensitive lead content unless explicitly required

Audit data is tenant-scoped.

---

# 38. Tenant Ownership Matrix

| Entity          | Tenant Ownership         |
| --------------- | ------------------------ |
| Tenant          | Root                     |
| User            | Direct                   |
| BusinessContext | Direct                   |
| Service         | Direct + BusinessContext |
| Website         | Direct                   |
| WebsiteContent  | Direct + Website         |
| Image           | Direct + Website         |
| ImageVariant    | Direct + Image           |
| Lead            | Direct                   |
| AIRequest       | Direct                   |
| AuditRecord     | Direct                   |

Every row must resolve to exactly one tenant.

---

# 39. Ownership Invariants

The following invariants are mandatory.

### User

```text
User.TenantId = authenticated user's tenant
```

### Business Context

```text
BusinessContext.TenantId = current tenant
```

### Service

```text
Service.TenantId = BusinessContext.TenantId
```

### Website

```text
Website.TenantId = current tenant
```

### Website Content

```text
WebsiteContent.TenantId = Website.TenantId
```

### Image

```text
Image.TenantId = Website.TenantId
```

### Image Variant

```text
ImageVariant.TenantId = Image.TenantId
```

### Lead

```text
Lead.TenantId = resolved website/integration tenant
```

### AI Request

```text
AIRequest.TenantId = resource tenant
```

### Audit

```text
AuditRecord.TenantId = affected resource tenant
```

---

# 40. Cross-Tenant Protection

The application must reject attempts to:

* Read another tenant's resource.
* Modify another tenant's resource.
* Delete another tenant's resource where deletion exists.
* Attach another tenant's image.
* Use another tenant's Business Context for AI.
* Access another tenant's leads.
* Create a resource under another tenant.
* Publish another tenant's website content.
* Process another tenant's image through an AI job.

This applies to:

* API requests
* Background jobs
* AI processing
* Image processing
* Website publishing
* Integration handlers

---

# 41. Status Transition Rules

## Website Content

```text
Draft
  ↓
Published
```

Published content can be edited by creating/updating a new draft.

The existing Published version remains live until the new version is successfully published.

---

## Image

Conceptually:

```text
Processing
    ↓
Enhanced
    ↓
Approved
    ↓
Published
```

Failure:

```text
Processing
    ↓
Failed
    ↓
Original remains available
```

Rejection:

```text
Enhanced
    ↓
Rejected
```

---

## Lead

```text
New
 ↓
Contacted
 ↓
Qualified
 ↓
Closed
```

V1 does not require strict transition enforcement.

---

## AI Request

```text
Processing
     ↓
Succeeded
```

or:

```text
Processing
     ↓
Failed
```

AI output still requires human approval before becoming published content/image.

---

# 42. Data Integrity Rules

The backend must enforce:

* Required fields.
* Valid enum values.
* Tenant ownership.
* Parent-child ownership consistency.
* Valid resource relationships.
* Unique constraints where required.
* Valid status values.
* Server-generated timestamps where applicable.
* Server-generated IDs.
* No orphaned derived image records.
* No cross-tenant relationships.

---

# 43. Delete and Replacement Rules

Pilot V1 should avoid destructive deletion where preservation is important.

## Images

Replacing an image creates a new source asset.

```text
Old Original
      +
New Original
```

The new image becomes the candidate for the website after approval/publishing.

The old original should not be silently overwritten.

## Content

Publishing a new version must not destroy the currently live version until the new version is successfully activated.

## Leads

A client-facing lead deletion workflow is not required by the current V1 scope.

Retention/deletion policy must be finalized before public production.

---

# 44. Image Storage Ownership

Storage keys must be tenant-scoped.

Conceptually:

```text
tenant/{tenantId}/images/{imageId}/...
```

The exact storage structure is an implementation detail.

Clients must not control arbitrary storage paths.

---

# 45. Date and Time

All server-generated timestamps should use a consistent backend representation.

Recommended:

```text
UTC
```

Client presentation may convert timestamps to the appropriate display timezone.

Relevant timestamps include:

* CreatedAt
* UpdatedAt
* ConfirmedAt
* PublishedAt
* SubmittedAt
* CompletedAt
* Audit Timestamp
* LastLoginAt

---

# 46. Field Validation Baseline

Recommended maximum lengths:

| Field                        | Maximum |
| ---------------------------- | ------: |
| Business Name                |     150 |
| Service Name                 |     100 |
| Service Short Description    |     300 |
| Service Detailed Description |    2000 |
| Business Description         |    2000 |
| Differentiators              |    1000 |
| Approved Claim               |     500 |
| Lead Name                    |     150 |
| Lead Message                 |    2000 |

Website-specific fields may define their own appropriate limits.

Server-side validation is authoritative.

---

# 47. Database Relationship Constraints

The database implementation should enforce foreign-key relationships where appropriate.

Examples:

```text
User.TenantId → Tenant.Id

BusinessContext.TenantId → Tenant.Id

Service.TenantId → Tenant.Id
Service.BusinessContextId → BusinessContext.Id

Website.TenantId → Tenant.Id

WebsiteContent.TenantId → Tenant.Id
WebsiteContent.WebsiteId → Website.Id

Image.TenantId → Tenant.Id
Image.WebsiteId → Website.Id

ImageVariant.TenantId → Tenant.Id
ImageVariant.ImageId → Image.Id

Lead.TenantId → Tenant.Id

AIRequest.TenantId → Tenant.Id

AuditRecord.TenantId → Tenant.Id
```

Application-level tenant validation must complement database constraints.

---

# 48. Recommended Uniqueness Rules

At minimum, consider:

### User

Email uniqueness according to the authentication model.

### Business Context

One active/primary Business Context per tenant.

### Website

One active connected website per tenant for Pilot V1.

### Website Content

One current content record per:

```text
Website + SectionKey + Version/State
```

The exact unique index strategy depends on the selected versioning implementation.

---

# 49. No V1 Entities

Do not create domain entities for:

```text
WebsiteBuilder
PageBuilder
Layout
ComponentBuilder
CustomCSS
ThemeEditor
AnimationEditor

AIProviderManagement
AIModelManagement
AIAgent
RecommendationEngine

CRM
SalesPipeline
LeadScore
Campaign
EmailAutomation

WhatsAppInbox
WhatsAppConversation
WhatsAppCampaign

GoogleBusinessProfile
AnalyticsDashboard
Report
Personalization

Workspace
OrganizationHierarchy
Billing
Subscription
Invoice
SuperAdmin

Project
Gallery
Album
DigitalAssetManager
MediaFolder

MultiWebsite
```

These are outside the Pilot V1 domain boundary.

---

# 50. Business Context as Domain Foundation

The Business Context is not simply an onboarding form.

It is the approved business knowledge used by Sparovia workflows.

```text
Client
  ↓
Business Context
  ↓
Content Assistance
  ↓
Image/Website Context where relevant
```

The Business Context must remain client-controlled.

AI cannot silently rewrite it.

---

# 51. Content and Business Context Relationship

Website content may use Business Context information.

However:

```text
Business Context
        ↓
Website Content
```

is not a one-way synchronization rule.

Website edits must not automatically overwrite Business Context.

If the client explicitly corrects a trusted business fact, the corresponding Business Context should be updated through the appropriate Business Context workflow.

---

# 52. AI and Domain Boundary

AI is represented operationally through `AIRequest`, but AI is not a standalone client domain area.

Correct architecture:

```text
Content Workflow
      ↓
AIRequest
      ↓
AI Service
```

and:

```text
Image Workflow
      ↓
AIRequest
      ↓
Image Enhancement Service
```

Not:

```text
AI Module
 ├── AI Dashboard
 ├── AI Content Database
 └── AI Website Generator
```

---

# 53. Lead Privacy Boundary

Lead data is customer-provided information.

The domain must treat it as tenant-private.

Lead data must:

* Belong to exactly one tenant.
* Be accessible only to authorized users of that tenant.
* Be transmitted securely.
* Not appear unnecessarily in logs.
* Have a defined retention/deletion policy before public production.

---

# 54. Background Processing Ownership

Any asynchronous job must carry enough trusted context to enforce tenant isolation.

Conceptually:

```text
Job
 ├── TenantId
 ├── ResourceId
 └── Operation
```

Before processing:

```text
Authenticate/Validate Job
        ↓
Resolve Tenant
        ↓
Validate Resource Ownership
        ↓
Process
```

This applies to:

* AI enhancement
* Image optimization
* Website publishing
* Other asynchronous processing

---

# 55. Domain Model Summary

The minimum production domain is:

```text
Tenant
│
├── User
│
├── BusinessContext
│   └── Service
│
├── Website
│   ├── WebsiteContent
│   └── Image
│       └── ImageVariant
│
├── Lead
│
├── AIRequest
│
└── AuditRecord
```

This model is intentionally small.

It supports the complete Pilot V1 experience without introducing unnecessary platform complexity.

---

# 56. Implementation Authority

When implementation decisions conflict with this document:

1. Locked Pilot V1 product scope has priority.
2. Tenant isolation and security requirements cannot be weakened.
3. Client approval requirements cannot be bypassed.
4. Original-image preservation cannot be removed.
5. AI no-invented-facts rules cannot be weakened.
6. V1 exclusions remain excluded unless explicitly changed.
7. Implementation details may evolve without expanding the product boundary.

---

# 57. Final Domain Boundary

Sparovia Client Pilot V1 owns and manages:

```text
Business
   ↓
Business Context
   ↓
Website Content
   ↓
Website Images
   ↓
AI-Assisted Improvements
   ↓
Customer Leads
```

with:

```text
Tenant Isolation
+
Authentication
+
Authorization
+
Auditability
+
Safe State Transitions
```

The domain model must remain intentionally small, tenant-safe, structured, and sufficient for a real client to use Sparovia in production.

**This document is the Domain & Data Model implementation source of truth for Sparovia Client Pilot V1.**
