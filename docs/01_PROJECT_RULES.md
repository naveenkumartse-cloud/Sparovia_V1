````markdown
# 01_PROJECT_RULES.md

# Sparovia — Project Rules

## 1. Purpose

This document defines the non-negotiable rules for designing, developing, reviewing, testing, and extending Sparovia.

These rules apply to the entire repository and all future phases.

Sparovia must be developed as a real production product, not as a collection of prototype screens.

---

## 2. Product Direction

Sparovia is a:

> Multi-tenant Business Experience & Intelligence Platform.

The platform must progressively:

```text
Understand Business
        ↓
Understand Business Presence
        ↓
Establish Website
        ↓
Manage Content
        ↓
Manage Media
        ↓
Manage Leads
        ↓
Connect Communication
        ↓
Provide Intelligence
        ↓
Recommend Actions
        ↓
Automate
        ↓
Agents
````

Every implementation decision must support this direction.

---

## 3. Business-First Rule

Sparovia must understand the client's business before attempting to provide advanced functionality.

The platform must understand relevant:

* Business identity
* Industry
* Services
* Products
* Customers
* Target audience
* Locations
* Contact information
* Working hours
* Website
* Business presence
* Google Business presence
* Media
* Leads
* Communication preferences
* Business preferences

Do not collect information without a real product purpose.

---

## 4. Sparovia Is Not a Generic Admin Panel

Never design the Admin Workspace as a generic SaaS dashboard.

The Admin Workspace exists to help Sparovia:

* Understand the business.
* Identify missing information.
* Manage business presence.
* Manage the controlled website.
* Manage media.
* Manage leads.
* Prepare for communication.
* Eventually provide intelligence and automation.

Every menu, screen, card, action, and workflow must have a clear business purpose.

---

## 5. Sparovia Is Not a Website Builder

Sparovia must not become:

* Webflow
* WordPress
* Elementor
* Drag-and-drop page builder
* AI website generator
* Arbitrary page builder

The platform owns the website architecture.

Clients manage approved content within the controlled website architecture.

Do not introduce unrestricted page-building functionality.

---

## 6. Single Application Rule

The public Landing Page and Admin Workspace must remain inside the same Next.js application.

Do not create:

* A second frontend.
* A separate Admin application.
* A second Next.js project.

Use route and component separation inside the existing application.

---

## 7. Existing Landing Page Protection

The existing approved Landing Page is valuable existing work.

Do not unnecessarily:

* Rewrite it.
* Replace it.
* Redesign it.
* Move it to another application.
* Duplicate it.

Before changing Landing Page functionality:

1. Inspect the existing implementation.
2. Understand dependencies.
3. Identify the exact requirement.
4. Change only what is necessary.
5. Verify the public route after the change.

The public website must remain functional throughout development.

---

## 8. Multi-Tenant First

Multi-tenancy is a core architectural rule.

The fundamental relationship is:

```text
User
 ↓
Membership
 ↓
Business
 ↓
Business Resources
```

A Business represents the tenant boundary.

All tenant-owned resources must be associated with the correct Business.

Examples:

```text
Business
 ├── Business Information
 ├── Website Content
 ├── Media
 ├── Leads
 ├── Business Presence
 ├── Google Business Connection
 └── Future Communication Data
```

---

## 9. Tenant Isolation

Tenant isolation must always be enforced on the backend.

Never trust the browser for:

* BusinessId
* TenantId
* UserId
* Role
* Permissions
* Ownership

The backend must determine access from the authenticated identity and membership.

A valid authentication token does not automatically grant access to every Business.

---

## 10. Tenant Isolation Testing

Every tenant-owned feature must support a cross-tenant security test.

Example:

```text
Business A
Business B

User A → Business A
User B → Business B
```

User A must not access Business B data.

This must be tested at the API/backend level.

Frontend route protection alone is insufficient.

---

## 11. One Business Context

The active Business must be the central context of the Admin Workspace.

The system should know:

```text
Current User
Current Membership
Current Business
```

All Business operations must operate within that context.

Do not repeatedly ask the client to provide BusinessId manually.

---

## 12. Business Understanding

Business Understanding is a core platform capability.

The system should progressively collect relevant information.

Potential areas:

### Identity

* Business name
* Industry
* Business category
* Description

### Offerings

* Services
* Products
* Specialties
* Differentiators

### Customers

* Target customer
* Customer type
* Customer needs
* Problems solved

### Location

* Address
* City
* State
* Country
* Postal code
* Service areas

### Contact

* Phone
* Email
* Website
* Preferred contact method

### Operations

* Working days
* Business hours

### Online Presence

* Website
* Google Business
* Other online presence

### Preferences

* Lead handling
* Communication
* Business-specific preferences

Only implement information that has a defined purpose.

---

## 13. Progressive Onboarding

Do not create one large generic registration form.

Business onboarding should progressively understand the client.

The client should be able to:

* Save progress.
* Leave and return.
* Complete missing information later.
* See what is incomplete.
* Continue from the correct point.

Returning users should not be forced through completed onboarding.

---

## 14. Business Completeness

Business completeness must be calculated from real persisted data.

Never hardcode completion percentages.

For example:

```text
Business Profile       80%
Website                60%
Business Presence      50%
Google Business        Not Connected
```

These values must come from actual state.

---

## 15. Business Setup Tasks

Setup tasks must be derived from actual missing requirements.

Examples:

* Complete description.
* Add services.
* Add business hours.
* Add contact information.
* Complete website information.
* Upload media.
* Connect Google Business.

A task must not disappear because the UI button was clicked.

It must change because the underlying requirement was actually completed.

---

## 16. Business Presence

Business Presence is a first-class domain concept.

Initial presence areas:

```text
Website
Google Business
Other Online Presence
```

The state must always be truthful.

Never display a fake:

* Connected
* Verified
* Published
* Created

status.

---

## 17. Google Business Rule

Google Business is an important Business Presence capability.

The expected flow is:

```text
Business Information
        ↓
Google Business Check
        ↓
Profile Found?
```

If found:

```text
Match
 ↓
Review
 ↓
Confirm
 ↓
Connect / Continue
 ↓
Return to Sparovia
```

If not found:

```text
No Match
 ↓
Explain
 ↓
Official Google Business Setup
 ↓
Create / Continue
 ↓
Return to Sparovia
```

Never fake Google API results.

---

## 18. Google Business Truthfulness

Never claim:

* Profile exists.
* Profile created.
* Profile connected.
* Profile verified.

unless the actual integration confirms it.

Creating a location and verifying a location are different states.

Do not merge them.

---

## 19. External Integration Rule

External integrations must be treated as real dependencies.

Examples:

* Google Business
* WhatsApp
* AI Providers
* Object Storage

If credentials, API access, approval, or configuration are unavailable:

* Do not fake the integration.
* Do not create fake API responses.
* Clearly identify the external dependency.
* Build only the appropriate integration boundary.
* Show truthful status.

---

## 20. Website Rule

Sparovia owns the website architecture.

The client controls approved business content.

Expected flow:

```text
Admin
 ↓
Approved Section
 ↓
Content Update
 ↓
API
 ↓
Database
 ↓
Public Website
```

The client should not need to rebuild the page.

---

## 21. Website Content Persistence

If a content-management feature is presented as complete, it must persist.

Required flow:

```text
Edit
 ↓
Save
 ↓
API
 ↓
PostgreSQL
 ↓
Refresh
 ↓
Data remains
 ↓
Public Website reflects data
```

Local React state is not production persistence.

---

## 22. Existing Content Architecture

Before creating a new content model:

1. Search the repository.
2. Identify existing content entities.
3. Identify existing APIs.
4. Identify existing configuration.
5. Reuse or extend existing architecture.

Do not create duplicate ContentSection systems.

---

## 23. Media Rule

Media management must be persistent.

Do not treat the following as permanent storage:

```text
React state
URL.createObjectURL()
Browser memory
Mock arrays
```

Media must survive:

* Refresh.
* Logout/login.
* Application restart.

---

## 24. Media Security

Validate:

* File type.
* File size.
* Filename.
* Storage key.
* Upload permissions.

Prevent:

* Executable uploads.
* Path traversal.
* Unsafe filenames.
* Unauthorized access.

Media must remain tenant-isolated.

---

## 25. Lead Management Rule

Lead Management is a real Business capability.

Initial functionality:

* Create.
* List.
* View.
* Update.
* Status.

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

Do not build unnecessary advanced CRM features early.

---

## 26. Lead Persistence

Leads must be persisted in PostgreSQL.

The following are not acceptable as permanent Lead storage:

```text
React state
localStorage
sessionStorage
mock arrays
```

---

## 27. Website Contact → Lead

The public website contact form should eventually create a real Lead.

Flow:

```text
Visitor
 ↓
Contact Form
 ↓
API
 ↓
Correct Business
 ↓
Lead
 ↓
PostgreSQL
 ↓
Admin
```

Business assignment must be secure.

Never trust a BusinessId supplied by an unauthenticated browser.

---

## 28. Authentication Rule

Use the existing authentication architecture.

Do not create a second authentication system.

Authentication should support:

* Registration
* Login
* JWT
* `/me`
* Protected routes
* Logout
* Password hashing
* Session persistence

---

## 29. Authorization Rule

Authentication answers:

> Who are you?

Authorization answers:

> What can you access?

Never confuse the two.

Every protected Business operation must verify:

```text
Authenticated User
 ↓
Membership
 ↓
Business
 ↓
Resource
```

---

## 30. Role Rule

Initial roles:

```text
Owner
Staff
```

Owner permissions must not automatically be available to Staff.

Do not implement unnecessary enterprise RBAC complexity unless approved.

---

## 31. Backend Rule

Backend technology is:

* .NET 9
* ASP.NET Core
* Clean Architecture
* EF Core
* PostgreSQL
* Npgsql

Existing backend structure must be preserved.

---

## 32. Clean Architecture Rule

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

Do not bypass Application/Domain architecture with database logic inside controllers.

---

## 33. Database Rule

PostgreSQL is the primary relational database.

EF Core migrations must manage schema changes.

Never manually change production schema without an appropriate migration strategy.

---

## 34. Database Persistence Rule

Business-critical production data must be server-side.

Do not use:

* localStorage
* sessionStorage
* React state
* temporary browser URLs

as permanent business data storage.

---

## 35. Database Reuse Rule

Before creating a new entity/table:

1. Search existing entities.
2. Search migrations.
3. Search DbContext.
4. Search configurations.
5. Search repositories/services.
6. Determine whether an existing entity can be extended.

Do not create duplicate database concepts.

---

## 36. API Rule

Business APIs must include:

* Authentication.
* Authorization.
* Validation.
* DTOs.
* Application services.
* Tenant checks.
* Structured error handling.

Do not expose internal domain entities unnecessarily.

---

## 37. Controller Rule

Controllers should remain thin.

Controllers should coordinate:

```text
HTTP
 ↓
Application
 ↓
Result
```

Business logic should not be accumulated inside controllers.

---

## 38. Validation Rule

Validate input at the API boundary.

Frontend validation improves UX but cannot replace backend validation.

Validate:

* Required fields.
* Format.
* Length.
* Business rules.
* File uploads.
* External integration inputs.

---

## 39. Error Handling Rule

Production API responses must never expose:

* Stack traces.
* Internal implementation details.
* Database credentials.
* Secrets.
* Sensitive exception details.

Use centralized exception handling.

---

## 40. Logging Rule

Use structured logging.

Never log:

* Passwords.
* JWT secrets.
* API keys.
* OAuth secrets.
* Refresh tokens.

---

## 41. Security Rule

Every feature must be reviewed for:

* Authentication.
* Authorization.
* Tenant isolation.
* Input validation.
* Sensitive data exposure.
* File security.
* External integration security.
* Secret management.

Security is part of implementation, not a later phase.

---

## 42. AI Rule

Sparovia does not assume an unlimited proprietary AI subscription.

AI must be provider-neutral.

Future architecture:

```text
Application
 ↓
AI Provider Gateway
 ↓
Usage Policy
 ↓
AI Provider
 ↓
Model
```

---

## 43. Client-Owned AI

Clients may eventually connect their own AI provider/API credentials.

Credentials must:

* Remain server-side.
* Be securely stored.
* Never be returned to frontend code.
* Never be logged.

---

## 44. Limited Free AI

A future limited free AI option may exist.

It must have:

* Usage limits.
* Token limits.
* Rate limits.
* Cost controls.
* Usage visibility.

Never promise unlimited free AI.

---

## 45. AI Token Management

Future AI usage should be trackable by:

* Business/client.
* Provider.
* Model.
* Request.
* Token usage.
* Cost where available.
* Time period.
* Limits.

---

## 46. Sparovia Intelligence Rule

Sparovia Intelligence is a future capability.

It should be based on real:

* Business data.
* Website data.
* Lead data.
* Presence data.
* Communication data.
* Preferences.
* History.

Never create fake AI insights to make the dashboard appear intelligent.

---

## 47. Recommendation Rule

Recommendations must be based on actual Business state.

Example:

```text
Google Business missing
        ↓
Recommendation

Website content incomplete
        ↓
Recommendation

Business information incomplete
        ↓
Recommendation
```

Recommendations must be explainable.

---

## 48. WhatsApp Rule

WhatsApp is planned as a first-class communication channel.

Future architecture:

```text
Customer
 ↓
WhatsApp
 ↓
Sparovia
 ↓
Business Context
 ↓
Customer Context
 ↓
Lead Context
 ↓
Client Preferences
 ↓
Response
```

Do not implement autonomous WhatsApp behavior without the required:

* API integration.
* Business configuration.
* Communication rules.
* Safety controls.
* Conversation context.

---

## 49. Agent Rule

Agents are future functionality.

Future progression:

```text
Observe
 ↓
Understand
 ↓
Recommend
 ↓
Approve
 ↓
Act
 ↓
Verify
```

Agents must operate within:

* Permissions.
* Business rules.
* Client preferences.
* Tool boundaries.
* Safety controls.
* Audit logs.

---

## 50. Automation Rule

Automation must come after understanding.

The correct progression is:

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

Do not introduce autonomous automation prematurely.

---

## 51. Business Context Rule

Business information should become reusable context.

If Sparovia already knows:

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

do not ask the client to enter the same information repeatedly.

Reuse the Business Context.

---

## 52. UI Rule

The UI must be:

* Premium.
* Clean.
* Professional.
* Modern.
* Business-focused.
* Responsive.
* Accessible.
* Consistent.

Do not use generic SaaS UI patterns without a product reason.

---

## 53. Admin UX Rule

Admin should prioritize:

* Business context.
* What needs attention.
* Clear next steps.
* Useful information.
* Simple workflows.
* Good empty states.
* Good loading states.
* Good error states.

Avoid dashboard clutter.

---

## 54. Mobile Rule

Core workflows must work on:

* Desktop.
* Tablet.
* Mobile.

Important workflows include:

* Business onboarding.
* Business profile.
* Google Business.
* Website content.
* Media.
* Leads.

---

## 55. Accessibility Rule

Production UI must support:

* Keyboard navigation.
* Focus states.
* Labels.
* Accessible dialogs.
* Accessible errors.
* Semantic HTML.
* Reduced motion where appropriate.

---

## 56. Performance Rule

Prioritize:

* Image optimization.
* Responsive images.
* Lazy loading where appropriate.
* Efficient data fetching.
* Minimal unnecessary JavaScript.
* Controlled animations.

Do not sacrifice functionality for superficial performance optimizations.

---

## 57. No Fake Data Rule

Never use fake production data for:

* Leads.
* Business metrics.
* Google status.
* AI output.
* Media.
* Analytics.
* Integrations.

Development fixtures are acceptable only when clearly isolated from production behavior.

---

## 58. No Fake Completion Rule

Never mark a capability as complete because:

* A page exists.
* A button works visually.
* A modal opens.
* Local state changes.
* A mock response appears.

Production completion requires real functionality.

---

## 59. Definition of Done

A feature is considered production-ready only when appropriate:

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
Security
 ↓
Testing
 ↓
Verification
```

---

## 60. Existing Architecture First

Before implementing:

1. Inspect the repository.
2. Search for existing functionality.
3. Search for existing models.
4. Search for existing services.
5. Search for existing components.
6. Search for existing APIs.
7. Search for existing database tables.
8. Extend existing architecture where appropriate.

Never create duplicate implementations without a documented reason.

---

## 61. Minimal Correct Implementation

Do not build unnecessarily large systems.

Do not build temporary shortcuts that must later be discarded.

Build the smallest correct production foundation that supports the locked product direction.

The desired implementation quality is:

```text
Small
+
Correct
+
Persistent
+
Tenant-Safe
+
Secure
+
Extensible
+
Testable
+
Production-Ready
```

---

## 62. No Random Features

Do not add features because:

* They are common in SaaS.
* Another CRM has them.
* Another Admin Panel has them.
* They look good in a dashboard.
* They make the application appear larger.

Every feature must trace back to:

* Product vision.
* Approved requirements.
* Client business problem.
* Current roadmap phase.

---

## 63. No Random Technology

Do not introduce a new library, framework, database, provider, or architecture without checking:

* Existing dependencies.
* Existing architecture.
* Compatibility.
* Maintenance implications.
* Production impact.

Prefer existing project technology where it is appropriate.

---

## 64. No Breaking Changes Without Review

Before changing foundational functionality:

* Authentication.
* Database.
* Tenant model.
* Business model.
* API contracts.
* Landing Page.
* Routing.
* Storage.

Review all dependencies first.

---

## 65. Documentation Rule

Documentation is part of the product architecture.

Core documents include:

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

Additional domain-specific documents may be created when necessary.

---

## 66. Documentation Truthfulness

Documentation must distinguish:

```text
IMPLEMENTED
REQUIRED
FUTURE
EXTERNAL DEPENDENCY
NOT IMPLEMENTED
```

Never mark a UI placeholder as implemented functionality.

---

## 67. Phase Rule

Every phase follows:

```text
Implementation
 ↓
Verification
 ↓
Review
 ↓
Gap Identification
 ↓
Gap Fix
 ↓
Final Verification
 ↓
Phase Locked
 ↓
Next Phase
```

Never skip final review.

---

## 68. Phase 4 Rule

Phase 4 is not simply:

```text
Admin UI
```

Phase 4 must establish:

```text
Business Understanding
+
Business Workspace
+
Business Completeness
+
Business Presence
+
Google Business
+
Website Content Foundation
+
Media
+
Leads
+
Tenant Isolation
```

If these are not implemented correctly, Phase 4 is not complete.

---

## 69. Phase 5 Rule

Do not begin Phase 5 while critical Phase 4 gaps remain.

If Phase 4 review identifies gaps:

```text
Review
 ↓
Fix Gaps
 ↓
Verify
 ↓
Lock Phase 4
```

Then continue.

---

## 70. Phase Completion Verification

Frontend verification:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Backend verification:

```bash
dotnet build
dotnet test
```

Also verify real application workflows.

---

## 71. Real Persistence Verification

For every persistent feature:

```text
Create
 ↓
Save
 ↓
Refresh
 ↓
Read
 ↓
Logout
 ↓
Login
 ↓
Read Again
```

Data must remain available if it is supposed to be persistent.

---

## 72. Security Verification

Before marking a Business feature complete, verify:

```text
Correct User
+
Correct Membership
+
Correct Business
+
Correct Permission
```

Test unauthorized access explicitly.

---

## 73. External Dependency Verification

For integrations:

```text
Implemented
External Configuration Required
Not Configured
```

must be clearly distinguished.

Never hide an external dependency behind a fake successful UI.

---

## 74. Landing Page Verification

After Admin/backend changes:

```text
/
```

must still:

* Render.
* Build.
* Load assets.
* Preserve approved design.
* Preserve existing interactions.
* Preserve responsive behavior.

---

## 75. Production Environment Rule

Separate:

```text
Development
Staging
Production
```

Never commit production secrets.

Use environment/secret management.

---

## 76. Database Migration Rule

Database schema changes must be represented by migrations.

Before applying a migration:

* Review it.
* Verify relationships.
* Verify indexes.
* Verify delete behavior.
* Verify tenant relationships.

Never casually delete or recreate production tables.

---

## 77. Backup Rule

Production data must eventually have:

* Automated backups.
* Recovery strategy.
* Migration discipline.

---

## 78. Monitoring Rule

Production should eventually monitor:

* API health.
* Database health.
* Error rates.
* Authentication failures.
* Storage failures.
* External integrations.
* Background processing.
* AI usage.
* Communication delivery.

---

## 79. Release Rule

Production release should follow:

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

Do not deploy known critical defects.

---

## 80. Product Evolution Rule

Sparovia evolves progressively:

```text
Understand
 ↓
Manage
 ↓
Communicate
 ↓
Recommend
 ↓
Automate
```

Do not introduce advanced automation before the underlying business context exists.

---

## 81. Customer Communication Rule

Future communication must understand:

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

Communication should not be generic.

---

## 82. Human Approval Rule

High-impact automated actions should eventually support:

* Approval.
* Permission.
* Limits.
* Audit.
* Verification.

The platform must not silently perform critical business actions.

---

## 83. Audit Rule

Important future actions should be auditable.

Audit information should include:

* User.
* Business.
* Action.
* Time.
* Source.
* Result.

This becomes especially important for:

* AI.
* Google.
* WhatsApp.
* Agents.
* Automation.

---

## 84. Final Decision Rule

Before implementing any feature, answer:

```text
1. What business problem does this solve?

2. Which product requirement defines it?

3. Which phase owns it?

4. Does it already exist?

5. Which existing architecture should be extended?

6. Does it require persistence?

7. Does it require tenant isolation?

8. Does it require external integration?

9. Is it current scope or future scope?

10. How will it be verified?

11. Does it preserve the Sparovia product direction?
```

If these cannot be answered, stop implementation and review the documentation.

---

## 85. Final Non-Negotiable Principle

Sparovia must always be:

```text
Business-First
Multi-Tenant
Secure
Persistent
Truthful
Extensible
Testable
Production-Ready
```

Never optimize for:

```text
More Screens
More Menus
More Features
More AI
More Automation
```

Optimize for:

```text
Better Business Understanding
Better Business Experience
Better Real Functionality
Better Customer Outcomes
```

---

# END OF PROJECT RULES

```
```
