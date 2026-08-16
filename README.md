````markdown
# Sparovia

> Multi-tenant Business Experience & Intelligence Platform

## 1. Product Definition

Sparovia is a multi-tenant platform designed to understand a client's business, establish and maintain its digital presence, manage website content and media, capture and manage leads, connect communication channels, provide business intelligence, and progressively enable automation and agents.

Sparovia is not simply an Admin Panel.

The Admin Workspace is the operational interface through which Sparovia understands, manages, and eventually assists the client's business.

The core product principle is:

Business Understanding → Business Presence → Website → Content → Media → Leads → Communication → Intelligence → Recommendations → Automation → Agents

---

## 2. Core Product Vision

Sparovia should make the client feel:

> "Sparovia understands my business."

The platform must understand the client's:

- Business identity
- Industry
- Services
- Products where applicable
- Customers
- Target audience
- Customer needs
- Locations
- Contact information
- Working hours
- Website
- Online presence
- Google Business presence
- Media
- Leads
- Communication preferences
- Business preferences

This business context becomes the foundation for future:

- Website experiences
- Lead management
- Google Business
- WhatsApp
- AI
- Sparovia Intelligence
- Recommendations
- Agents
- Automation

---

## 3. What Sparovia Is

Sparovia is:

- A multi-tenant Business Experience Platform.
- A Business Understanding platform.
- A controlled Website Experience platform.
- A Business Presence platform.
- A Media Management platform.
- A Lead Management foundation.
- A future Communication platform.
- A future AI Intelligence platform.
- A future Agentic Automation platform.

---

## 4. What Sparovia Is NOT

Sparovia must NOT become:

- A generic Admin Dashboard.
- A generic CRM.
- A Website Builder.
- A Webflow clone.
- A WordPress clone.
- An Elementor clone.
- A drag-and-drop website builder.
- An AI Website Generator.
- A generic AI chatbot.
- A generic marketing automation platform.
- An ERP.
- An accounting system.
- A payroll system.

Do not introduce unrelated generic SaaS functionality.

Every feature must have a clear business purpose within the Sparovia product direction.

---

## 5. Core Client Journey

The primary client journey is:

```text
Register
    ↓
Login
    ↓
Create Business
    ↓
Business Understanding
    ↓
Business Information
    ↓
Business Completeness
    ↓
Business Presence
    ↓
Google Business Check
    ↓
Google Business Exists?
    ├── YES
    │     ↓
    │  Match / Confirm / Connect
    │     ↓
    │  Return to Sparovia
    │
    └── NO
          ↓
       Official Google Business Setup
          ↓
       Create / Continue
          ↓
       Return to Sparovia
    ↓
Business Workspace
    ↓
Website
    ↓
Media
    ↓
Leads
    ↓
Communication
    ↓
Sparovia Intelligence
    ↓
Recommendations
    ↓
Agents
    ↓
Automation
````

This flow is a core product requirement.

---

# 6. Multi-Tenant Architecture

Sparovia is multi-tenant from the foundation.

Core relationship:

```text
User
  ↓
Membership
  ↓
Business
  ↓
Business Data
```

A Business is the tenant boundary.

Every tenant-owned resource must belong to a Business.

Examples:

```text
Business
 ├── Business Information
 ├── Business Preferences
 ├── Website
 ├── Website Content
 ├── Media
 ├── Leads
 ├── Business Presence
 ├── Google Business Connection
 └── Future Communication Data
```

Tenant isolation must be enforced server-side.

Never trust the browser to determine:

* BusinessId
* TenantId
* UserId
* Role
* Permissions

The backend must determine authorization from the authenticated identity and membership.

---

# 7. Repository Architecture

Sparovia uses one repository and one Next.js application.

The public Landing Page and Admin Workspace must remain inside the same application.

Conceptual structure:

```text
Sparovia_V1/
│
├── app/
│   ├── public/
│   ├── auth/
│   └── admin/
│
├── components/
│   ├── landing/
│   ├── admin/
│   ├── layout/
│   └── ui/
│
├── config/
│
├── backend/
│   ├── Sparovia.sln
│   ├── src/
│   │   ├── Sparovia.Domain/
│   │   ├── Sparovia.Application/
│   │   ├── Sparovia.Infrastructure/
│   │   └── Sparovia.API/
│   │
│   └── tests/
│       ├── Sparovia.UnitTests/
│       └── Sparovia.IntegrationTests/
│
├── docs/
│
├── public/
│
├── package.json
└── README.md
```

Do not create:

```text
frontend/
admin-app/
second-next-app/
second-backend/
```

unless explicitly approved.

---

# 8. Public Landing Page

The existing Premium Landing Page is the public website foundation.

The public route must remain:

```text
/
```

The Landing Page is already implemented and approved.

Do not unnecessarily redesign or rebuild it.

Existing sections include the approved premium website experience such as:

* Hero
* Brand Introduction
* Interior Storytelling
* uPVC
* Project Gallery
* Why Choose Us
* Testimonials
* FAQ
* Final CTA
* Contact
* Footer

The Landing Page must remain visually intact unless a future product decision explicitly changes it.

---

# 9. Website Strategy

Sparovia is NOT a Website Builder.

The platform owns the website architecture.

Clients manage approved business content.

The model is:

```text
Sparovia Website Architecture
        ↓
Approved Sections
        ↓
Business Content
        ↓
Business Media
        ↓
Public Website
```

Clients should not freely redesign page architecture.

Do not implement:

* Drag-and-drop page building.
* Arbitrary section creation.
* Webflow-like editing.
* WordPress-like editing.
* Elementor-like editing.
* AI-generated website structure.

---

# 10. Business Understanding

Business Understanding is a first-class Sparovia capability.

The system must progressively understand the client's business.

The information collected must have a future purpose.

## Business Identity

* Business name
* Industry
* Business category
* Business description

## Offerings

* Services
* Products where applicable
* Main offerings
* Specialties
* Key differentiators

## Customers

* Target customer
* Customer type
* Customer needs
* Customer problems

## Location

* Address
* City
* State
* Country
* Postal code
* Service areas

## Contact

* Phone
* Email
* Website
* Preferred contact method

## Operating Information

* Working days
* Business hours

## Online Presence

* Existing website
* Google Business Profile
* Other online presence

## Business Preferences

* Lead handling preference
* Communication preference
* Business-specific preferences

Do not collect unnecessary information.

---

# 11. Progressive Business Onboarding

Do not create one giant generic form.

The onboarding should be progressive.

Recommended flow:

```text
Step 1
Business Identity
        ↓
Step 2
What You Offer
        ↓
Step 3
Who You Serve
        ↓
Step 4
Where You Operate
        ↓
Step 5
How Customers Contact You
        ↓
Step 6
Business Hours
        ↓
Step 7
Online Presence
        ↓
Step 8
Google Business
        ↓
Step 9
Review & Continue
```

The client must be able to save progress.

Returning users must continue from their current state.

Completed businesses should not be forced through onboarding again.

---

# 12. Business Completeness

Sparovia must know what information is complete and what is missing.

Example:

```text
Business Profile       80%
Website                60%
Business Presence      50%
Google Business        Not Connected
Media                  Ready
Leads                  Ready
```

Percentages must be calculated from actual persisted data.

Never hardcode:

```text
100%
80%
50%
```

just for UI appearance.

Setup tasks must be generated from actual business state.

---

# 13. Business Setup Tasks

Examples:

* Complete business description.
* Add services.
* Add contact information.
* Add working hours.
* Complete website information.
* Upload media.
* Connect Google Business.
* Complete website content.
* Configure lead preferences.

Tasks must disappear or change state when the underlying requirement is actually completed.

Do not create fake completion.

---

# 14. Business Presence

Sparovia must understand where the client exists online.

Initial presence areas:

```text
Website
Google Business
Other Online Presence
```

Presence must have truthful states.

Possible states:

```text
NOT_CONNECTED
CHECKING
MATCH_FOUND
CONNECTION_REQUIRED
CREATION_STARTED
AWAITING_VERIFICATION
CONNECTED
FAILED
SKIPPED
```

Only use states supported by the actual implementation.

Never display a false connection.

---

# 15. Google Business Profile

Google Business is a first-class Business Presence capability.

The system must check whether the client's business has a Google Business Profile.

Required flow:

```text
Business Understanding
        ↓
Google Business Check
        ↓
Search / Match
        ↓
Profile Found?
```

If a profile is found:

```text
Match Found
    ↓
Show Candidate
    ↓
Client Confirms
    ↓
Connect / Continue
    ↓
Return to Sparovia
```

If no profile is found:

```text
No Match
    ↓
Explain Result
    ↓
Official Google Business Setup
    ↓
Create / Continue
    ↓
Return to Sparovia
    ↓
Continue Setup
```

Sparovia must never falsely state that a profile has been created or verified.

---

# 16. Google Business API

Google Business integration must use official Google APIs and OAuth where available.

Do not fake:

* Search results.
* Locations.
* Account connections.
* Location IDs.
* Creation responses.
* Verification responses.

Google Business API access may require:

* Google Cloud project.
* OAuth configuration.
* API enablement.
* Google Business Profile API access/approval.
* Correct scopes.
* Production configuration.

If external configuration is unavailable:

Implement the integration boundary and official external flow.

Do not fake successful integration.

The UI must clearly show the actual state.

---

# 17. Google Business Creation and Verification

Creating a Google Business location and verifying that location are different states.

Do not assume:

```text
Created = Verified
```

The system must distinguish the actual state.

Possible lifecycle:

```text
NOT_CONNECTED
    ↓
CHECKING
    ↓
NO_MATCH
    ↓
CREATION_STARTED
    ↓
CREATED
    ↓
AWAITING_VERIFICATION
    ↓
VERIFIED / CONNECTED
```

Only implement states supported by the real Google integration.

---

# 18. Google OAuth Security

Never:

* Ask the client for their Google password.
* Store Google passwords.
* Expose refresh tokens to the browser.
* Commit Google credentials.
* Hardcode OAuth secrets.

Use secure OAuth.

Sensitive credentials must remain server-side.

---

# 19. Website Content Management

The existing Landing Page should become database-driven through controlled content management.

Flow:

```text
Admin
   ↓
Approved Website Section
   ↓
Edit Content
   ↓
API
   ↓
PostgreSQL
   ↓
Public Landing Page
```

The client changes content, not website architecture.

Supported content may include:

* Headings
* Descriptions
* CTA text
* Business information
* Services
* Testimonials
* FAQs
* Contact information
* Approved images

Do not expose unrestricted HTML editing.

---

# 20. Website Content Architecture

If an existing ContentSection/JSONB architecture exists, extend it.

Do not create duplicate content architectures.

Conceptually:

```text
Business
   ↓
Website
   ↓
Content Sections
```

Every content record must be Business-scoped.

---

# 21. Media Management

Media must be real persistent functionality.

Required:

* Upload
* List
* Preview
* Delete
* Replace where appropriate
* Website association

Do not use:

```text
React state
URL.createObjectURL()
Browser memory
Mock arrays
```

as permanent storage.

Media must survive:

* Browser refresh.
* Logout/login.
* Application restart.

---

# 22. Media Storage

Use a storage abstraction.

Concept:

```text
IMediaStorage
      ↓
Development Storage
      ↓
Production Object Storage
```

PostgreSQL stores metadata.

Metadata may include:

* Media ID
* Business ID
* File name
* Content type
* Size
* Storage key
* URL/reference
* CreatedAt
* UpdatedAt

Large binary files should not be stored directly in PostgreSQL unless explicitly required.

---

# 23. Media Security

Validate:

* File type.
* File size.
* File extension.
* Filename.
* Storage key.
* Path traversal.

Do not allow executable files.

Do not expose server filesystem paths.

All Media operations must be Business-scoped.

---

# 24. Lead Management

Lead Management is a core platform foundation.

Initial lifecycle:

```text
New
 ↓
Contacted
 ↓
Qualified
 ↓
Closed
```

Required:

* Create
* List
* View
* Update
* Status update

Do not build an advanced CRM in the foundation phase.

---

# 25. Lead Sources

The Lead model should support future sources:

```text
Website
Manual
WhatsApp
Google
Other
```

Only actual implemented sources should be enabled.

The model must remain extensible.

---

# 26. Website Contact → Lead

The public Contact form should create a real Lead.

Flow:

```text
Website Visitor
      ↓
Contact Form
      ↓
Sparovia API
      ↓
Lead
      ↓
Correct Business
      ↓
PostgreSQL
      ↓
Admin Lead Management
```

The public client must not be allowed to arbitrarily select BusinessId.

Business context must be securely determined by the server/application.

---

# 27. Lead Tenant Isolation

Business A must never see Business B leads.

Test:

```text
Business A
Business B

User A → Business A

User A attempts Business B Lead
        ↓
403 / Unauthorized
```

This must be tested server-side.

---

# 28. Admin Workspace

The Admin Workspace is the business operating workspace.

It should conceptually contain:

```text
Dashboard

Business
 ├── Overview
 ├── Business Information
 ├── Services
 ├── Customers / Target Audience
 ├── Locations
 └── Preferences

Presence
 ├── Website
 ├── Google Business
 └── Other Presence

Website
 ├── Overview
 ├── Sections
 └── Preview

Media

Leads

Settings
```

Do not create screens without real functionality.

---

# 29. Dashboard

The Dashboard should answer:

> What does Sparovia know about my business and what needs attention?

It should show actual:

* Business completeness.
* Website status.
* Media status.
* Lead status.
* Google Business status.
* Setup tasks.

Do not display:

* Fake statistics.
* Fake AI insights.
* Fake analytics.
* Fake Google status.

Future Intelligence areas must be clearly marked as future.

---

# 30. Authentication

Existing authentication foundation:

* Registration.
* Login.
* JWT.
* `/me`.
* Protected Admin routes.
* Logout.
* Session persistence.
* Password hashing.

Reuse the Phase 3 architecture.

Do not create a second authentication system.

---

# 31. Roles

Initial roles:

```text
Owner
Staff
```

Owner has administrative authority.

Staff permissions must be controlled.

Do not implement an unnecessarily complex RBAC system.

---

# 32. Backend Technology

Backend:

* .NET 9
* ASP.NET Core
* Clean Architecture
* Entity Framework Core
* PostgreSQL
* Npgsql

Backend structure:

```text
backend/
├── Sparovia.sln
├── src/
│   ├── Sparovia.Domain/
│   ├── Sparovia.Application/
│   ├── Sparovia.Infrastructure/
│   └── Sparovia.API/
└── tests/
    ├── Sparovia.UnitTests/
    └── Sparovia.IntegrationTests/
```

---

# 33. Clean Architecture

Dependency direction:

```text
API
 ↓
Application
 ↓
Domain

Infrastructure
implements Application abstractions
```

Domain must not depend on Infrastructure.

Application must not depend directly on API.

Controllers must remain thin.

Business logic belongs in appropriate application/domain services.

---

# 34. Database

Database:

```text
PostgreSQL
```

ORM:

```text
Entity Framework Core
```

Provider:

```text
Npgsql
```

Database changes must use EF Core migrations.

Do not manually modify production schema without migration strategy.

---

# 35. Core Entities

Existing core foundation:

```text
User
Business
Membership
```

Future domain entities may include:

```text
Business Information
Business Presence
Google Business Connection
Website Content
Media Asset
Lead
```

Only create entities required by approved functionality.

Do not duplicate existing models.

---

# 36. API Architecture

APIs must use:

* Authentication.
* Authorization.
* DTOs.
* Validation.
* Application services.
* Tenant authorization.
* Structured error handling.
* Logging.

Do not expose domain entities directly from controllers.

---

# 37. Error Handling

Production responses must never expose:

* Stack traces.
* Database connection strings.
* Secrets.
* Internal exception details.

Use centralized exception handling.

---

# 38. Validation

Validate all external input.

Validate:

* Registration.
* Login.
* Business data.
* Website content.
* Media.
* Leads.
* Google integration data.
* Future communication data.

Frontend validation is not sufficient.

---

# 39. Logging

Use structured logging.

Do not log:

* Passwords.
* JWT secrets.
* OAuth secrets.
* Refresh tokens.
* API keys.

---

# 40. Security

Mandatory:

* Tenant isolation.
* Server-side authorization.
* Secure authentication.
* Password hashing.
* Input validation.
* File validation.
* Secure OAuth.
* Secret management.
* Safe errors.
* No client-trusted tenant identity.

---

# 41. AI Strategy

Sparovia does not own an unlimited AI subscription.

Sparovia must remain AI-provider neutral.

Future architecture:

```text
Client AI Provider
        +
Optional Limited AI
        ↓
AI Provider Gateway
        ↓
LLM
        ↓
Business Context
```

Clients may eventually bring their own AI subscriptions/API keys.

---

# 42. AI Provider Gateway

Future AI requests should go through a centralized gateway.

Concept:

```text
Application
    ↓
AI Gateway
    ↓
Usage Policy
    ↓
Provider
    ↓
Model
```

The gateway should eventually support:

* Provider selection.
* Model selection.
* Client configuration.
* Usage limits.
* Token tracking.
* Error handling.
* Rate limiting.

Do not implement unlimited AI usage.

---

# 43. AI Usage Management

Future AI usage should track:

* Business/client.
* Provider.
* Model.
* Request.
* Tokens.
* Usage.
* Cost where available.
* Period.
* Limits.

AI credentials must never be exposed to browser code.

---

# 44. Limited Free AI

A future optional limited AI offering may exist.

It must have:

* Usage limits.
* Token limits.
* Rate limits.
* Clear usage visibility.
* Cost controls.

Do not promise unlimited free AI.

---

# 45. Sparovia Intelligence

Sparovia Intelligence is a future intelligence layer.

It should understand:

```text
Business
Website
Media
Leads
Presence
Communication
Preferences
History
```

It should eventually provide:

* Business insights.
* Suggestions.
* Missing information detection.
* Lead recommendations.
* Website recommendations.
* Presence recommendations.
* Growth opportunities.

Do not create fake AI insights.

---

# 46. Recommendations

Future recommendations must be based on actual business state.

Examples:

```text
Google Business not connected
        ↓
Recommendation

Website content incomplete
        ↓
Recommendation

Business has many new leads
        ↓
Recommendation

Business information missing
        ↓
Recommendation
```

Recommendations must be explainable.

---

# 47. WhatsApp

WhatsApp is intended to become a first-class communication channel.

Future flow:

```text
Customer
   ↓
WhatsApp
   ↓
Sparovia
   ↓
Business Context
   ↓
Client Preferences
   ↓
Conversation Context
   ↓
Reply / Lead
```

The system should eventually understand:

* Customer message.
* Business context.
* Client preferences.
* Lead state.
* Conversation history.

Do not implement WhatsApp automation before its dedicated phase.

---

# 48. WhatsApp First Message

Future intended behavior:

```text
Customer sends:
"Hi"
```

Sparovia should understand the configured business context and communication preferences before responding.

Responses must not be blindly generated.

Future communication must respect:

* Business configuration.
* Client preferences.
* Conversation context.
* Safety rules.
* Approved communication behavior.

---

# 49. Agents

Agents are a future capability.

Concept:

```text
Sparovia Intelligence
        ↓
Agent
        ↓
Observe
        ↓
Understand
        ↓
Recommend
        ↓
Act
        ↓
Verify
```

Agents must eventually operate within:

* Permissions.
* Business rules.
* Client preferences.
* Tool access.
* Safety limits.
* Audit logs.

Do not implement autonomous agents in early phases.

---

# 50. Human Control

High-impact future actions must support:

* Approval.
* Permissions.
* Limits.
* Audit logs.
* Reversible actions where possible.

Automation should not silently take critical business actions.

---

# 51. Business Context Reuse

Business information must become reusable context.

Example:

```text
Business Name
Description
Services
Location
Phone
Hours
Customer Type
Preferences
```

should not be entered repeatedly in:

* Website.
* Google.
* Leads.
* WhatsApp.
* AI.

Modules should reuse the same Business Context.

---

# 52. Customer Experience Principle

The client should not feel that they are filling out unrelated SaaS forms.

The experience should feel like:

```text
Sparovia learns my business
        ↓
Sparovia knows what is missing
        ↓
Sparovia helps establish my presence
        ↓
Sparovia manages my business experience
        ↓
Sparovia eventually helps me operate
```

---

# 53. Communication Context

Future communication must combine:

```text
Business Context
+
Customer Context
+
Lead Context
+
Conversation History
+
Client Preferences
```

This becomes the foundation for future context-aware communication.

---

# 54. Automation Principle

Automation comes after understanding.

Correct progression:

```text
Understand
   ↓
Recommend
   ↓
Approve
   ↓
Automate
   ↓
Verify
```

Do not begin with autonomous automation.

---

# 55. Auditability

Future important actions should eventually be auditable.

Audit records should be capable of identifying:

* Who performed the action.
* Which Business.
* What action.
* When.
* Source.
* Result.

This becomes especially important for:

* AI.
* Google.
* WhatsApp.
* Agents.
* Automation.

---

# 56. Design Principles

Sparovia UI should be:

* Premium.
* Clean.
* Professional.
* Modern.
* Business-focused.
* Responsive.
* Accessible.
* Consistent.

Avoid generic SaaS templates.

Avoid unnecessary cards.

Avoid unnecessary dashboards.

Prioritize useful information and clear actions.

---

# 57. Public Website Design

The Landing Page should remain:

* Premium.
* Editorial.
* Image-first.
* Architectural.
* Clean.
* Responsive.

Existing approved design decisions must be preserved.

---

# 58. Admin Design

Admin should prioritize:

* Business context.
* Clarity.
* Tasks.
* Information hierarchy.
* Fast workflows.
* Loading states.
* Empty states.
* Error states.
* Mobile usability.

---

# 59. Responsive Design

Core workflows must support:

* Desktop.
* Tablet.
* Mobile.

Important mobile workflows:

* Business onboarding.
* Business profile.
* Google Business.
* Website content.
* Media.
* Leads.

---

# 60. Accessibility

Production features must support:

* Semantic HTML.
* Keyboard navigation.
* Focus states.
* Form labels.
* Error messages.
* Accessible dialogs.
* Accessible navigation.
* Reduced motion.

---

# 61. SEO

Public website should support:

* Correct metadata.
* Title.
* Description.
* Open Graph where applicable.
* Semantic structure.
* Image alt text.
* Clean URLs.

---

# 62. Performance

Prioritize:

* Optimized images.
* Responsive images.
* Lazy loading where appropriate.
* Minimal unnecessary JavaScript.
* Controlled animations.
* Good Core Web Vitals.

---

# 63. Environment Strategy

Maintain:

```text
Development
Staging
Production
```

Secrets must be supplied through secure environment configuration.

Never commit:

* Database passwords.
* JWT secrets.
* OAuth secrets.
* API keys.
* AI provider keys.

---

# 64. Storage Strategy

Development:

```text
Development Storage Provider
```

Production:

```text
Production Object Storage
```

Use abstraction so storage implementation can evolve without changing business logic.

---

# 65. Testing Strategy

Backend must contain:

* Unit tests.
* Integration tests.
* Authentication tests.
* Authorization tests.
* Tenant isolation tests.
* Persistence tests.

Important workflows must be verified end-to-end where appropriate.

---

# 66. Tenant Isolation Testing

Mandatory scenario:

```text
Business A
Business B

User A → Business A
User B → Business B
```

User A must not access:

* Business B.
* Business B website content.
* Business B media.
* Business B leads.
* Business B presence.
* Business B integrations.

Test this through actual API calls.

---

# 67. Production Definition of Done

A feature is NOT complete because:

* A page exists.
* A button exists.
* A modal opens.
* A form displays.
* Local React state changes.
* Mock data appears.

A production feature must follow:

```text
UI
 ↓
API
 ↓
Application Logic
 ↓
Database / External Service
 ↓
Real Persistence / Real State
 ↓
Verification
```

---

# 68. No Fake Functionality

Never represent these as completed unless actually working:

* Google Business.
* AI.
* WhatsApp.
* Media persistence.
* Lead persistence.
* Analytics.
* Intelligence.
* Agents.
* Automation.
* External integrations.

Future placeholders must be clearly labelled.

---

# 69. Implementation Rules

Before implementing any feature:

1. Read the project documentation.
2. Inspect the current implementation.
3. Determine whether the feature already exists.
4. Reuse existing architecture.
5. Avoid duplicate models.
6. Avoid duplicate services.
7. Avoid duplicate components.
8. Determine whether database persistence is required.
9. Determine whether tenant isolation is required.
10. Determine whether an external integration is required.
11. Determine whether it is current or future scope.
12. Implement the smallest correct production foundation.
13. Test the implementation.
14. Update project status.

---

# 70. Do Not Break Existing Functionality

Do not unnecessarily replace:

* Landing Page.
* Authentication.
* Business model.
* Membership model.
* Tenant architecture.
* Clean Architecture.
* Database migrations.
* Existing approved components.

Prefer extension over replacement.

---

# 71. No Duplicate Architecture

Do not create:

* Second frontend.
* Second Admin application.
* Second backend.
* Second database.
* Second authentication system.
* Duplicate Business entity.
* Duplicate Content system.
* Duplicate Media system.
* Duplicate Lead system.

---

# 72. Documentation

Project documentation must remain the source of truth.

Core documents:

```text
README.md
01_PROJECT_RULES.md
02_VISION.md
03_MVP_PRD.md
04_USER_FLOW.md
05_AI_FEATURES.md
06_DESIGN_SYSTEM.md
07_MASTER_BUILD_PROMPT.md
08_MASTER_PLATFORM_ARCHITECTURE.md
09_IMPLEMENTATION_ROADMAP.md
10_CURRENT_PROJECT_STATUS.md
```

Additional domain-specific documents may be created when required.

---

# 73. Documentation Status Rules

Every capability must be classified as:

```text
IMPLEMENTED
REQUIRED
FUTURE
EXTERNAL DEPENDENCY
NOT IMPLEMENTED
```

Never classify UI-only functionality as implemented production functionality.

---

# 74. Development Phases

High-level roadmap:

```text
PHASE 1
Premium Landing Page
        ↓
PHASE 2
Landing Page Review / Approval
        ↓
PHASE 3
Repository + Backend Foundation + PostgreSQL
        ↓
PHASE 4
Business Understanding +
Business Workspace +
Business Presence +
Google Business +
Website Content +
Media +
Leads
        ↓
PHASE 5
Advanced Content + Media + Business Experience
        ↓
PHASE 6
Theme + Preview + Publish
        ↓
PHASE 7
AI Provider Gateway + AI Usage Management
        ↓
PHASE 8
WhatsApp First-Class Communication
        ↓
PHASE 9
Sparovia Intelligence
        ↓
PHASE 10
Agents + Automation
        ↓
QA
        ↓
Production Deployment
```

Phase definitions must always be checked against the latest roadmap documentation.

---

# 75. Phase Completion Rule

Never move to the next phase simply because implementation commands succeeded.

Required:

```text
Implementation
    ↓
Review
    ↓
Gap Identification
    ↓
Gap Fix
    ↓
Verification
    ↓
Phase Locked
    ↓
Next Phase
```

---

# 76. Phase 1

Premium Landing Page.

Requirements:

* Premium public website.
* Responsive design.
* Approved design system.
* Business-oriented content.
* Client imagery.
* Production-quality frontend.

---

# 77. Phase 2

Landing Page Review / Approval.

Requirements:

* Bug fixing.
* Responsive validation.
* Accessibility validation.
* Design validation.
* Placeholder removal.
* Build validation.

---

# 78. Phase 3

Repository + Backend Foundation + PostgreSQL.

Foundation includes:

* .NET 9.
* ASP.NET Core.
* Clean Architecture.
* PostgreSQL.
* EF Core.
* Npgsql.
* User.
* Business.
* Membership.
* Authentication.
* Authorization.
* Tenant isolation.
* API.
* Migrations.
* Logging.
* Error handling.
* Swagger/OpenAPI.
* Unit tests.
* Integration tests.

---

# 79. Phase 4

Phase 4 is NOT a generic Admin Panel.

Phase 4 establishes the real Business Workspace.

Required:

* Business Understanding.
* Progressive onboarding.
* Business persistence.
* Business completeness.
* Business Presence.
* Google Business check.
* Google connection/creation flow.
* Website content foundation.
* Real Media.
* Real Leads.
* Website Contact → Lead.
* Tenant isolation.

Phase 4 must reflect the client's actual business journey.

---

# 80. Phase 5

Phase 5 must only begin after Phase 4 has passed final review.

The exact implementation scope must be taken from the approved roadmap and current project status.

Do not invent Phase 5 functionality.

---

# 81. External Integrations

External integrations include:

* Google Business.
* WhatsApp.
* AI Providers.
* Object Storage.
* Future communication providers.

External dependencies must be explicitly documented.

If credentials/API access are unavailable:

* Do not fake the integration.
* Implement the correct boundary where appropriate.
* Document the required configuration.
* Show truthful status.

---

# 82. Production Database Rules

All persistent business data must be server-side.

Do not use:

```text
localStorage
sessionStorage
React state
temporary browser URLs
```

as permanent storage.

---

# 83. Production API Rules

All business-critical operations must use authenticated and authorized backend APIs.

The browser must never determine:

* Tenant ownership.
* Permissions.
* Role.
* Business ownership.

---

# 84. Production File Rules

Never commit:

* Client uploads.
* Secrets.
* Credentials.
* Production database dumps.
* Sensitive generated files.

Use `.gitignore`.

---

# 85. Production Deployment

Before production:

* Build frontend.
* Build backend.
* Run tests.
* Apply migrations safely.
* Configure database.
* Configure object storage.
* Configure external integrations.
* Configure secrets.
* Configure monitoring.
* Verify health checks.
* Verify rollback strategy.

---

# 86. Backup and Recovery

Production PostgreSQL must have:

* Automated backups.
* Recovery strategy.
* Migration discipline.

Object storage must have an appropriate backup/recovery strategy.

---

# 87. Monitoring

Production should eventually monitor:

* API health.
* Database health.
* Error rates.
* Authentication failures.
* Storage failures.
* External integration failures.
* Background jobs.
* AI usage.
* Communication delivery.

---

# 88. Release Strategy

Use:

```text
Development
    ↓
Verification
    ↓
Staging
    ↓
QA
    ↓
Production
```

Do not release unfinished functionality as completed functionality.

---

# 89. Product Evolution

Sparovia evolves in this order:

```text
Business Understanding
        ↓
Business Presence
        ↓
Website
        ↓
Content
        ↓
Media
        ↓
Leads
        ↓
Communication
        ↓
Intelligence
        ↓
Recommendations
        ↓
Automation
        ↓
Agents
```

Do not reverse this order without a deliberate product decision.

---

# 90. Final Product Vision

The long-term Sparovia platform is:

```text
BUSINESS
    ↓
UNDERSTAND
    ↓
ESTABLISH PRESENCE
    ↓
WEBSITE
    ↓
CONTENT
    ↓
MEDIA
    ↓
LEADS
    ↓
COMMUNICATION
    ↓
INTELLIGENCE
    ↓
RECOMMENDATIONS
    ↓
AUTOMATION
    ↓
AGENTS
```

The objective is not to create the maximum number of screens.

The objective is to create a system that progressively understands and operates around the client's business.

---

# 91. Final Engineering Principle

Build:

```text
Small
+
Correct
+
Tenant-Safe
+
Persistent
+
Extensible
+
Testable
+
Production-Ready
```

Do not build:

```text
Large
+
Generic
+
Temporary
+
Fake
+
Hardcoded
```

---

# 92. Final Product Principle

Sparovia should follow:

```text
Understand First
        ↓
Manage Second
        ↓
Communicate Third
        ↓
Recommend Fourth
        ↓
Automate Last
```

This principle governs product decisions, architecture, UX, AI, communication, and future agent design.

---

# 93. Final Implementation Decision Rule

Before implementing anything, answer:

```text
1. What business problem does this solve?

2. Which Sparovia phase does it belong to?

3. Is it already implemented?

4. Which existing architecture should be extended?

5. Does it require database persistence?

6. Does it require tenant isolation?

7. Does it require an external integration?

8. Is it current scope or future scope?

9. How will it be verified?

10. Does it preserve the Sparovia product direction?
```

If these questions cannot be answered, stop implementation and review the documentation.

---

# 94. Final Source of Truth

This README defines the top-level Sparovia product direction.

Detailed project documents may define specific domains and implementation requirements, but they must not contradict the locked product direction.

When documentation conflicts:

1. Explicitly locked product decisions take priority.
2. Approved architecture takes priority over generic patterns.
3. Production safety takes priority over convenience.
4. Actual implementation status takes priority over assumptions.
5. Future functionality must never be represented as implemented.

---

# 95. Sparovia Complete Platform Flow

```text
CLIENT
  ↓
REGISTER
  ↓
CREATE BUSINESS
  ↓
BUSINESS UNDERSTANDING
  ↓
BUSINESS COMPLETENESS
  ↓
BUSINESS PRESENCE
  ↓
GOOGLE BUSINESS CHECK
  ↓
CONNECT / CREATE / CONTINUE
  ↓
BUSINESS WORKSPACE
  ↓
CONTROLLED LANDING PAGE
  ↓
CONTENT
  ↓
MEDIA
  ↓
LEADS
  ↓
COMMUNICATION
  ↓
AI PROVIDER
  ↓
SPAROVIA INTELLIGENCE
  ↓
RECOMMENDATIONS
  ↓
AGENTS
  ↓
AUTOMATION
```

---

# 96. Definition of Sparovia

Sparovia is not being built simply as software containing pages and menus.

Sparovia is being built as a long-term multi-tenant business platform that progressively:

```text
Understands the Business
        ↓
Establishes the Business Presence
        ↓
Manages the Business Website
        ↓
Manages Content and Media
        ↓
Captures and Manages Leads
        ↓
Connects Customer Communication
        ↓
Understands Business Activity
        ↓
Provides Intelligence
        ↓
Recommends Actions
        ↓
Executes Approved Actions
        ↓
Automates Business Work
```

The platform must remain:

**Business-first.
Multi-tenant.
Production-ready.
Secure.
Persistent.
Extensible.
Truthful about implemented functionality.**

---

# END OF SPAROVIA PRODUCTION MASTER README

```
```
