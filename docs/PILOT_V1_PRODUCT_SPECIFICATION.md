# Sparovia Client Pilot V1 — Product Specification

**Document:** `PILOT_V1_PRODUCT_SPECIFICATION.md`  
**Product:** Sparovia  
**Release:** Client Pilot V1  
**Status:** 🔒 Locked / Production Implementation Baseline  
**Audience:** Product, UX, Backend, Frontend, AI, QA, Deployment

---

## 1. Purpose

Sparovia Client Pilot V1 is the first production-usable version of Sparovia to be used by a real client.

The pilot allows a client to:

1. Complete business onboarding and establish approved Business Context.
2. Manage supported website content.
3. Improve website content with contextual AI assistance.
4. Upload and replace website images.
5. Enhance existing images with AI while preserving the original.
6. Connect a supported external AI provider (e.g. OpenAI, Google Gemini, Anthropic Claude) using their own API credentials and select an approved model.
7. Receive and manage leads from the website and, when configured, WhatsApp.
8. Perform these workflows securely within their own tenant.

The pilot is intentionally small. It validates the core Sparovia product model before broader platform development.

---

## 2. Product Principle

Sparovia is a **controlled website management platform**, not a freeform website builder.

The client manages structured business content and media.

Sparovia controls:

- Website structure
- Layout
- Design
- Responsive behavior
- Supported components
- Animations
- Publishing behavior
- AI safety boundaries

AI assists the client inside relevant workflows. It does not autonomously redesign, modify, or publish the website.

---

## 3. Pilot V1 Scope

### 3.1 Business Context

The client completes onboarding and provides approved business information.

The Business Context includes:

- Business name
- Business type
- Primary business category
- Business phone
- Business email
- Website
- Business address where applicable
- Service areas where applicable
- Services
- Target customers
- Business description
- Differentiators
- Approved facts and claims

Approved facts may include:

- Years in business
- Certifications
- Awards
- Accreditations
- Warranties
- Authorized/dealer status
- Other client-approved claims

Business Context is the trusted source of business facts for AI assistance.

---

### 3.2 Website Content

The client can edit supported content mapped to the connected website.

Supported sections may include:

- Hero / Business
- About
- Services
- Why Choose Us
- Explore Our Work
- Contact
- Footer

Only sections actually supported and mapped by the connected website are exposed.

Content is structured into fields.

The client cannot modify:

- HTML
- CSS
- Layout
- Component structure
- Responsive breakpoints
- Animations
- Navigation architecture
- Custom design

---

### 3.3 Embedded AI Content Assistance

AI is embedded directly inside the content editing workflow.

Available actions:

- Improve Wording
- Make More Professional
- Make Shorter
- Make Clearer
- Improve Service Description
- Custom Instruction

AI receives only the context required for the current operation:

- Approved Business Context
- Relevant approved website content
- Current field/content
- Current section
- Client's requested improvement
- Sparovia AI rules

Content AI executes using the tenant's single configured AI provider and model. The selected model must possess the Content AI capability; otherwise, the operation is safely rejected with an explanation that a content-capable model is required.

AI suggestions are untrusted until the client approves them.

The client can:

- Accept
- Edit
- Reject

Accepting an AI suggestion changes the draft only.

It does not:

- Publish the website
- Change Business Context
- Automatically update other fields
- Automatically replace live content

---

### 3.4 Website Images

The client can:

- Upload supported website images
- Replace supported website images
- Preview images
- Add images to Explore Our Work
- Optionally enhance images with AI

Supported initial formats:

- JPEG / JPG
- PNG
- WebP

Recommended maximum upload size:

- 10 MB per image

The server performs authoritative file validation.

---

### 3.5 Explore Our Work

Explore Our Work provides a lightweight collection of genuine client work/project images.

Each item may contain:

- Image
- Caption
- Project/work name

The feature is intentionally simple.

It is not a project management system, portfolio CMS, or advanced gallery manager.

AI-generated project images are not allowed.

---

### 3.6 AI Image Enhancement

AI can improve an existing client image.

User-facing operations:

- Improve Clarity
- Improve Sharpness
- Reduce Noise
- Upscale
- Classic Look
- Modern Look
- Web Optimize

Image Enhancement executes using the tenant's single configured AI provider and model. The selected model must possess the Image Enhancement capability. If the model supports only Content AI, image enhancement is unavailable with that model, and the client is guided to select an image-capable model under AI Connections.

The enhancement must improve the photograph without materially changing what it represents.

AI must not:

- Add major objects
- Remove major objects
- Change buildings or rooms
- Change products
- Change materials
- Fabricate project details
- Turn unfinished work into completed work
- Create a different project
- Generate a project image from scratch
- Replace the original

The original image is always preserved.

*(For detailed implementation requirements for the Image Quality Studio rebuild, refer to [`BUILD_IMAGE_STUDIO_REBUILD.md`](BUILD_IMAGE_STUDIO_REBUILD.md). Visual presentation follows [`DESIGN.md`](DESIGN.md).)*

---

### 3.7 Image Review and Approval

Enhanced images must go through:

```text
Original
  ↓
Enhancement
  ↓
Before / After Review
  ↓
Client Approval
  ↓
Approved Image
  ↓
Update Website
````

The client must be able to compare the original and enhanced versions.

Approving an enhancement does not publish it.

Website update remains a separate explicit action.

---

### 3.8 AI Provider Connection and Model Selection

Sparovia allows a tenant to connect supported external AI providers using the client's own API credentials and select an approved model from that provider.

Sparovia does NOT create or present fictional AI models (e.g., "Sparovia Fast" or "Sparovia Quality").

Supported provider families include:

- OpenAI / ChatGPT
- Google Gemini
- Anthropic Claude

The architecture is provider-neutral, allowing additional providers to be supported without altering core Sparovia workflows.

#### Core Capabilities:

- **Connect Provider**: Choose from Sparovia-approved providers and supply the tenant's API key/credential.
- **Connection Validation**: Test credentials securely before saving to verify active status and quota.
- **Model Selection**: Select an approved model from the provider's allowlist based on capability (Content AI, Image Enhancement AI, or Both).
- **Manage Connection**: Rotate or update API credentials, switch selected models, or disconnect.

#### Shared Model Configuration for Content & Images

In Pilot V1, the client does NOT configure two separate AI accounts, systems, or screens for content and images.
The client connects AI once:
- Provider
- API Credential
- Selected Model

This single active configuration powers both workflows when the model supports the required capability:
- **Model supports Both**: Content AI and Image Enhancement AI both use that single selected model.
- **Model supports Content only**: Content AI is available; Image Enhancement AI is unavailable with this model, and the UI clearly guides the client to select an image-capable model.
- **Model supports Image Enhancement only**: Image Enhancement AI is available; Content AI is unavailable with this model.

Sparovia never silently switches models or providers. Capability compatibility is verified server-side before executing any AI workflow.

#### Security & Boundaries:

- Provider API credentials are sensitive secrets belonging to the tenant.
- Credentials are encrypted at rest, never exposed in client source code, never returned in plaintext, never logged, and masked in the UI (`••••••••••••••••`).
- The client cannot add arbitrary provider endpoints, upload custom SDKs, or configure internal infrastructure.
- Downstream AI workflows (Content AI and Image Enhancement) automatically use the tenant's single configured, validated provider and model.

---

### 3.9 Lead Management

Leads may originate from:

* Website
* WhatsApp, when configured

Minimum website lead fields:

* Name
* Phone
* Email (optional)
* Message
* Source
* Submitted date/time

Lead statuses:

* New
* Contacted
* Qualified
* Closed

The client can:

* View leads
* Open lead details
* Filter by status
* Filter by source
* Update status

WhatsApp integration in V1 is limited to receiving customer enquiries and creating/updating leads.

It does not provide a full WhatsApp CRM or inbox.

---

## 4. Core User Workflows

### 4.1 Onboarding

```text
Create Account
    ↓
Verify Email
    ↓
Business Basics
    ↓
Services
    ↓
Location & Customers
    ↓
Business Description
    ↓
Approved Facts
    ↓
Review Business Context
    ↓
Confirm
    ↓
Dashboard
```

The client explicitly confirms the Business Context before it becomes trusted AI context.

---

### 4.2 Content

```text
Website
  ↓
Content
  ↓
Select Section
  ↓
Edit Field
  ↓
Optional AI Improvement
  ↓
Review
  ↓
Save Draft
  ↓
Preview
  ↓
Update Website
```

---

### 4.3 Image

```text
Website
  ↓
Images
  ↓
Upload / Replace
  ↓
Validate
  ↓
Preview
  ↓
Approve
  ↓
Update Website
```

---

---

### 4.4 AI Provider Connection & Model Selection

```text
Settings / AI Connections
          ↓
Choose Supported Provider (OpenAI, Gemini, Claude)
          ↓
Enter Provider API Key / Credential
          ↓
Securely Validate Connection (Test Connection)
          ↓
Choose Supported Model (from Allowlist)
          ↓
Save AI Configuration (Encrypted at Rest)
          ↓
Active Tenant AI Configuration
          ↓
Used by Content AI & Image Enhancement
```

---

### 4.5 AI Image Enhancement

```text
Select Image
  ↓
AI Enhance
  ↓
Select Enhancement (Compatible Model)
  ↓
Process
  ↓
Before / After
  ↓
Approve / Reject
  ↓
Update Website
```

---

### 4.6 Leads

```text
Website / WhatsApp
       ↓
Sparovia Lead API
       ↓
Validate
       ↓
Resolve Tenant
       ↓
Create / Update Lead
       ↓
New
       ↓
Client manages status
```

---

## 5. Content State Model

### Content

Supported states:

* Draft
* Published

Rules:

* Saving a draft does not change the live website.
* Publishing requires explicit client action.
* Failed publishing must not destroy the existing live version.

### AI Suggestion

Supported states:

* Suggested
* Accepted
* Rejected

Accepting an AI suggestion applies it to the draft only.

---

## 6. Image State Model

Logical image lifecycle:

```text
Original
   ↓
Processing
   ↓
Enhanced
   ↓
Approved
   ↓
Published
```

Rejected or unused derived images must not become live website images.

The original remains immutable throughout the lifecycle.

---

## 7. AI Safety Model

Sparovia follows:

```text
Ground
  ↓
Constrain
  ↓
Validate
  ↓
Human Approve
  ↓
Publish
```

### Trusted Source Hierarchy

1. Approved Business Context
2. Approved Website Content
3. Current Client Draft
4. AI-generated suggestion
5. General AI knowledge

AI-generated suggestions are not trusted business facts.

### No-Invented-Facts Rule

AI must never invent or assume:

* Years
* Certifications
* Awards
* Accreditations
* Warranties
* Prices
* Locations
* Service areas
* Customer counts
* Project counts
* Clients
* Partnerships
* Guarantees
* Qualifications
* Authorized/dealer status
* Unsupported services/products

If information is missing, AI must omit it or request clarification.

**Principle:**

> No source → No fact.

---

## 8. Approval Rules

Human approval is mandatory before AI-generated or AI-enhanced output becomes public.

### Content

```text
AI Suggestion
  ↓
Accept/Edit/Reject
  ↓
Save Draft
  ↓
Update Website
```

### Images

```text
AI Enhancement
  ↓
Before/After
  ↓
Approve/Reject
  ↓
Update Website
```

AI must never autonomously publish.

---

## 9. Image Preservation and Delivery

Original images are immutable.

Derived versions may include:

* AI Enhanced
* Website Optimized
* Responsive delivery variants where required

The original is never resized, compressed, or overwritten.

Website delivery should:

* Use optimized versions
* Preserve aspect ratio
* Select suitable dimensions based on actual component requirements
* Compress automatically
* Use modern web formats where supported
* Cache optimized assets
* Use efficient delivery
* Lazy-load non-critical images where appropriate

The client should upload once and should not need to manually resize or compress images.

---

## 10. Failure, Retry and Fallback

### AI Failure

If AI processing fails:

* Preserve the original.
* Do not approve failed output.
* Show a client-friendly error.
* Allow retry.
* Allow the client to keep the original.

### Website Update Failure

If publishing fails:

* Existing live content/image remains unchanged.
* Approved draft remains available.
* Show a clear error.
* Allow retry.

### Upload Failure

If upload fails:

* Existing live image remains unchanged.
* Invalid/incomplete image is not activated.
* Client can retry.

### General Principle

> Fail safely → preserve current state → explain simply → retry → fall back to the existing/original version.

---

## 11. Tenant Isolation

Tenant isolation is a mandatory system-wide boundary.

Every client-owned resource belongs to exactly one tenant.

Tenant-owned resources include:

* Users
* Business Context
* Services
* Website
* Website Content
* Images
* Image Variants
* Leads
* AI Requests
* Audit records

Every protected operation follows:

```text
Authenticate
  ↓
Resolve Tenant
  ↓
Authorize Resource
  ↓
Validate
  ↓
Execute
```

A client must never access another tenant's:

* Business data
* Content
* Images
* AI context
* Leads
* Website resources

Tenant ownership must be enforced server-side.

Client-supplied tenant identifiers must never be treated as proof of ownership.

The same rule applies to:

* APIs
* Background jobs
* AI processing
* Image processing
* Website publishing
* Website integrations
* WhatsApp integration

---

## 12. Authentication and Authorization

Authentication verifies the requesting user or integration.

Authorization determines whether that authenticated identity can perform the requested operation.

Both are required for protected operations.

V1 must support:

* Secure account registration
* Phone OTP verification
* Secure login
* Secure password handling
* Session/token management
* Logout/session invalidation
* Server-side authorization
* Tenant-scoped access

Frontend protection alone is insufficient.

---

## 13. Lead Privacy

Lead data contains customer contact information.

Sparovia must:

* Collect only required information.
* Transmit data securely.
* Store data securely.
* Restrict access to authorized tenant users.
* Avoid unnecessary personal information in logs.
* Avoid public lead exposure.
* Provide appropriate privacy information for enquiry submission.

A retention period must be defined before public production.

Leads must not be retained indefinitely by default.

---

## 14. API Principles

Pilot V1 APIs must be:

* Versioned
* Structured
* Validated
* Tenant-aware
* Authenticated where required
* Authorized server-side
* Predictable in success/error behavior
* Independent of internal database structure

Example API version:

```text
/api/v1/...
```

Core API areas:

* Authentication
* Business Context
* Website Content
* Images
* AI
* Leads
* Website Update

No unrestricted database access is provided to client websites.

---

## 15. Standard API Errors

Use consistent error categories:

* `VALIDATION_ERROR`
* `UNAUTHORIZED`
* `FORBIDDEN`
* `NOT_FOUND`
* `CONFLICT`
* `RATE_LIMITED`
* `PROCESSING_FAILED`
* `PUBLISH_FAILED`
* `INTERNAL_ERROR`

Responses may include:

* Error code
* Safe client-facing message
* Field-level validation errors
* Correlation/request ID

Do not expose:

* Stack traces
* Database errors
* Internal infrastructure details
* Provider secrets
* Authentication secrets
* Cross-tenant resource information

---

## 16. API Security Controls

V1 APIs must use:

* HTTPS in production
* Authentication for protected operations
* Server-side authorization
* Tenant isolation
* Server-side validation
* Request/file size limits
* Rate limiting where appropriate
* Secure token/session handling
* Safe CORS configuration
* Injection/abuse protections
* Security-focused logging
* No password/token logging

Public/high-risk endpoints such as lead submission and AI operations should have appropriate abuse controls.

---

## 17. Audit and Change Tracking

Important actions should record:

* Audit ID
* Tenant ID
* User ID where applicable
* Action
* Resource type
* Resource ID
* Server timestamp
* Result
* Minimal additional metadata where necessary

Track important events including:

* Business Context confirmation/update
* Content save/publish
* Image upload/replacement
* AI enhancement request
* AI approval/rejection
* AI provider connection created/updated/tested/removed
* AI model selection changed
* Website update
* Lead creation
* Lead status changes
* Important security events

Do not store passwords, secrets, API keys, or unnecessary customer data in audit records.

---

## 18. Responsive Admin Requirement

The Admin must be usable on:

* Desktop
* Tablet
* Mobile

Core workflows must remain usable on smaller screens:

* Onboarding
* Business Context
* Content editing
* AI content assistance
* Image upload
* AI image enhancement
* Before/After review
* AI provider connection & model selection
* Lead management

Avoid unnecessary horizontal scrolling.

Controls must remain usable with touch input.

No separate mobile application is required for Pilot V1.

---

## 19. Information Architecture

Primary navigation:

```text
Sparovia
│
├── Dashboard
│
├── Business
│   └── Business Context
│
├── Website
│   ├── Content
│   └── Images
│       └── Explore Our Work
│
├── Leads
│
└── Settings
    ├── Account
    └── AI Connections (or /admin/ai-models)
```

AI configuration (connecting supported providers with tenant credentials and selecting approved models) is managed under Settings / AI Connections.

AI generation workflows do not appear as a standalone freeform prompt playground. AI workflows remain embedded contextually inside:

* Content editing (Content AI suggestions)
* Image enhancement (Image Enhancement AI)

---

## 20. V1 Entities

Core entities:

* Tenant
* User
* TenantAIConfiguration (AI Connection & Model Selection)
* BusinessContext
* Service
* Website
* WebsiteContent
* Image
* ImageVariant
* Lead
* AIRequest
* AuditRecord

Relationships must preserve tenant boundaries.

A resource belonging to one tenant cannot be attached to another tenant's resource.

---

## 21. Explicit V1 Exclusions

The following are outside Pilot V1:

### Website

* Freeform website builder
* Drag-and-drop builder
* Layout editing
* Design editing
* Custom CSS
* Custom HTML
* Autonomous website redesign
* AI-generated websites
* Arbitrary section creation

### AI

* Arbitrary external provider registration or custom endpoint overrides (only Sparovia-approved providers supported)
* Custom provider SDK uploads or internal provider adapter modifications
* Provider infrastructure administration / billing / token resale management
* Standalone AI prompt playground / chat interface
* Autonomous AI
* AI agents
* AI publishing
* AI-generated business facts
* AI-generated project history
* Generative project image creation
* Material image alteration

### Images

* Full DAM
* Complex asset folders
* Advanced gallery management
* Generative image editing
* Fake project images
* Advanced image editing suite

### Leads / CRM

* Full CRM
* Advanced sales pipeline
* Lead scoring
* Automated lead assignment
* Email automation
* WhatsApp automation
* WhatsApp CRM/inbox
* AI lead agents

### Platform

* Google Business Profile integration
* Advanced analytics/BI
* Personalization
* Recommendations engine
* Multi-workspace
* Billing
* Super Admin
* Multi-website management
* Native mobile app
* Public developer API platform
* Complex enterprise permissions
* Advanced integration marketplace

These capabilities may be considered after Pilot V1 validation.

---

## 22. Pilot V1 Success Criteria

Pilot V1 is successful when a real client can use Sparovia without developer intervention for supported workflows.

The pilot must demonstrate:

### Business Context

* Client can complete onboarding.
* Approved Business Context is stored correctly.
* AI can use approved Business Context.

### Content

* Client can edit supported content.
* Validation works.
* AI assistance is useful and contextual.
* AI does not invent unsupported facts.
* Client can review and approve content.
* Website updates succeed safely.

### Images

* Client can upload images.
* Client can replace supported images.
* Client can add Explore Our Work images.
* Original images remain preserved.
* Images are optimized for website delivery.

### AI Enhancement

* Enhancement operations work.
* Original image remains unchanged.
* Before/After review works.
* Client explicitly approves enhancement.
* Enhanced image does not materially alter reality.

### Leads

* Website leads arrive reliably.
* WhatsApp leads arrive when configured.
* Leads belong to the correct tenant.
* Client can view lead details.
* Client can manage basic status.

### Security & Reliability

* Tenant isolation holds.
* Unauthorized access is rejected.
* Invalid uploads are rejected safely.
* Important changes are auditable.
* AI/provider failures do not destroy existing data.
* Website publishing failures do not destroy the current live version.

---

## 23. Definition of Done

Pilot V1 is ready for a real client only when:

* All in-scope workflows are implemented.
* Required validation is implemented server-side.
* Authentication and authorization are implemented.
* Tenant isolation is tested.
* Content workflow works end-to-end.
* AI content assistance works with approved Business Context.
* AI factuality safeguards are tested.
* Image upload/replacement works.
* Original/derived image lifecycle works.
* AI enhancement and Before/After approval work.
* Image optimization and delivery work.
* Website lead submission works.
* WhatsApp lead intake works where configured.
* Lead management works.
* Failure/retry/fallback behavior works.
* Responsive Admin behavior is verified.
* Important audit events are recorded.
* Security testing is completed.
* Production deployment is repeatable.
* No critical/high-severity defects remain unresolved.
* A real client can complete supported workflows without developer intervention.

---

## 24. Final Product Boundary

Pilot V1 validates one focused product loop:

```text
Understand the Business
        ↓
Manage Website Content
        ↓
Improve Content with AI
        ↓
Manage Website Images
        ↓
Enhance Existing Images Safely
        ↓
Receive Customer Leads
        ↓
Manage Leads
```

Sparovia remains the controlled management layer between the client and the connected website.

AI assists.

The client approves.

Sparovia validates.

The website receives only approved, supported changes.

---

## 25. Implementation Authority

This document is the **Product Specification baseline for Sparovia Client Pilot V1**.

Implementation must not expand Pilot V1 scope without an explicit product decision.

If an implementation question is not covered here:

1. Prefer the smallest solution that satisfies the approved V1 workflow.
2. Preserve tenant isolation and security.
3. Preserve original data and safe failure behavior.
4. Avoid introducing excluded platform complexity.
5. Record genuinely unresolved decisions separately rather than silently expanding scope.

### Canonical Document Relationships

- **Visual Design Authority:** [`DESIGN.md`](DESIGN.md) (Editorial Cobalt design system and UI tokens)
- **Image Studio Rebuild Prompt:** [`BUILD_IMAGE_STUDIO_REBUILD.md`](BUILD_IMAGE_STUDIO_REBUILD.md) (Image Quality Studio UI and adaptive processing rebuild)
- **Domain Data Model:** [`PILOT_V1_DOMAIN_DATA_MODEL.md`](PILOT_V1_DOMAIN_DATA_MODEL.md) (Entities, invariants, and lifecycle rules)
- **API Specification:** [`PILOT_V1_API_SPECIFICATION.md`](PILOT_V1_API_SPECIFICATION.md) (REST contracts and DTO schemas)
- **UX & Screen Specification:** [`PILOT_V1_UX_SCREEN_SPECIFICATION.md`](PILOT_V1_UX_SCREEN_SPECIFICATION.md) (Screen structure and user journeys)
- **Implementation Plan:** [`PILOT_V1_IMPLEMENTATION_PLAN.md`](PILOT_V1_IMPLEMENTATION_PLAN.md) (Phases, dependencies, and testing)

*(Historical note: Legacy specifications `PILOT_V1_SPAROVIA_THEME.md` and `PILOT_V1_AI_IMAGE_SPECIFICATION.md` have been retired and superseded.)*

**Pilot V1 status: 🔒 LOCKED FOR IMPLEMENTATION**

