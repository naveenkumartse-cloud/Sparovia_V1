# PILOT_V1_UX_SCREEN_SPECIFICATION.md

# Sparovia Client Pilot V1 — UX & Screen Specification

**Document Status:** Production Ready  
**Version:** 1.0  
**Scope:** Client Pilot V1  
**Audience:** Product, UX/UI, Frontend, Backend, QA  
**Authority:** Implementation source of truth for Pilot V1 UX

---

## 1. Purpose

This document defines the production UX for Sparovia Client Pilot V1.

It specifies:

- Application navigation
- Screens
- Screen responsibilities
- Forms and fields
- User interactions
- Validation behavior
- Loading states
- Empty states
- Success states
- Failure states
- AI interactions
- Image workflows
- Lead management
- Responsive/mobile behavior

This document does not define database implementation, API contracts, infrastructure, or provider-specific implementation.

---

# 2. UX Principles

Sparovia Pilot V1 must feel like a simple tool for managing a business website, not a complex CMS.

### Core principles

1. **Simple**
   - Show only what the client needs.
   - Avoid technical terminology.

2. **Structured**
   - Clients edit predefined fields.
   - Clients do not edit HTML, CSS, layouts, or application code.

3. **Guided**
   - Every client-facing input that may require explanation provides `ⓘ` guidance.

4. **Safe**
   - Draft changes do not immediately affect the live website.
   - AI suggestions require client review.
   - AI never publishes automatically.

5. **Predictable**
   - Save, approval, and website update are clearly separate actions.

6. **Responsive**
   - Core workflows must work on desktop, tablet, and mobile.

7. **AI as assistance**
   - AI appears inside relevant workflows.
   - AI is not a separate standalone product area.

---

# 3. Application Structure

## 3.1 Primary Navigation

The authenticated Client Admin application contains:

```text
Dashboard

Business
└── Business Context

Website
├── Content
└── Images
    └── Explore Our Work

Leads

Settings
├── Account
└── AI Connections (or AI Models)
````

AI provider connection and model configuration are managed under Settings / AI Connections.

AI generation workflows do not appear as a standalone freeform prompt playground. AI assistance is accessed contextually from:

* Content fields (Content AI suggestions)
* Image workflows (Image Enhancement AI)

---

# 4. Authentication Screens

## 4.1 Create Account

### Purpose

Allow a client to create their Sparovia account.

### Fields

| Field            | Type     | Required |
| ---------------- | -------- | -------: |
| Full Name        | Text     |      Yes |
| Email            | Email    |      Yes |
| Password         | Password |      Yes |
| Confirm Password | Password |      Yes |

### Actions

* Create Account
* Sign In

### Validation

* Required fields cannot be empty.
* Email must be valid.
* Password must satisfy configured security requirements.
* Password confirmation must match.

### Error behavior

Display validation errors next to the affected field.

Do not clear valid fields after an error.

---

## 4.2 Verify Email

### Purpose

Confirm the client's email address.

### UI

```text
Check your email

We sent a verification link to:
client@example.com

[Resend Email]

[Continue]
```

### States

* Sending
* Sent
* Resend available
* Resend failed
* Verified

---

## 4.3 Sign In

### Fields

* Email
* Password

### Actions

* Sign In
* Forgot Password
* Create Account

### Failure

Use a safe client-facing message:

> We couldn't sign you in. Please check your details and try again.

Do not expose authentication-system details.

---

# 5. Onboarding

Onboarding establishes the client's approved Business Context.

## 5.1 Onboarding Flow

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

A visible progress indicator should show the current step.

---

# 6. Business Basics Screen

## 6.1 Fields

| Field                     | Type                    | Required |
| ------------------------- | ----------------------- | -------: |
| Business Name             | Text                    |      Yes |
| Business Type             | Select                  |      Yes |
| Primary Business Category | Search Select           |      Yes |
| Business Phone            | Phone                   |      Yes |
| Business Email            | Email                   |      Yes |
| Website                   | URL / Connected Website |      Yes |

### Business Type Options

```text
Storefront
Service Area
Hybrid
Online
Other
```

If `Other` is selected:

```text
Business Category
[________________]
```

### Interactions

* `ⓘ` guidance available for each field.
* Continue disabled when required fields are invalid.
* Save progress where applicable.
* Back returns to the previous onboarding step without losing saved data.

---

# 7. Services Screen

## 7.1 Service List

Display existing services as structured cards/rows.

Example:

```text
Services

[Interior Design]
Short description...

[Edit] [Remove]

[+ Add Service]
```

## 7.2 Add/Edit Service

### Fields

| Field                | Type     | Required |
| -------------------- | -------- | -------: |
| Service Name         | Text     |      Yes |
| Short Description    | Textarea |      Yes |
| Detailed Description | Textarea |       No |

### Actions

* Save Service
* Cancel
* Remove

### Rules

* Service name must be unique within the client's Business Context where practical.
* Invalid service data cannot be saved.
* Removing a service requires confirmation.

---

# 8. Location & Customers Screen

## 8.1 Customer Visit Location

Question:

> Do customers visit your business location?

Options:

```text
Yes
No
Both
```

If applicable, display business address fields.

## 8.2 Service Area

Question:

> Do you provide services at customer locations?

Options:

```text
Yes
No
```

If `Yes`, display:

```text
Service Areas
[Search or enter service area]
```

## 8.3 Target Customers

Multi-select options may include:

```text
Home owners
Builders
Architects
Commercial businesses
Property developers
Other
```

If `Other` is selected:

```text
Other customer types
[________________]
```

Optional customer description may be provided.

---

# 9. Business Description Screen

## Fields

### Business Description

Textarea.

Guidance:

> Briefly explain what your business does, what you offer, and who you serve. Use information you can confirm as accurate.

### What Makes Your Business Different?

Textarea, optional.

Guidance explains that the client should provide genuine differentiators rather than unsupported marketing claims.

---

# 10. Approved Facts Screen

Purpose: collect factual information that Sparovia may safely use as trusted Business Context.

## Fields

| Field                 | Type                | Required |
| --------------------- | ------------------- | -------: |
| Years in Business     | Number              |       No |
| Certifications        | Repeatable Text     |       No |
| Awards                | Repeatable Text     |       No |
| Warranties            | Repeatable Text     |       No |
| Accreditations        | Repeatable Text     |       No |
| Other Approved Claims | Repeatable Textarea |       No |

### Guidance

Explain:

> Add only facts you can confirm as accurate and that you are comfortable using on your website.

No fact should be required simply to complete onboarding.

---

# 11. Review Business Context

Display a read-only summary of all collected information.

Sections:

```text
Business
Contact
Location
Services
Customers
Description
What Makes Us Different
Approved Facts
```

### Actions

* Edit
* Confirm Business Context

### Confirmation

The client must explicitly confirm the information.

After confirmation:

```text
Your Business Context is ready.

Sparovia can now use this approved information to assist you
with website content.
```

### Important

AI-generated information must never be silently inserted into this screen.

---

# 12. Dashboard

## Purpose

Provide a simple overview of the client's website management state.

### Recommended layout

```text
Welcome back, [Business Name]

Website
[Connected / Needs Attention]

Quick Actions
[Edit Website Content]
[Manage Images]
[View Leads]

Recent Website Updates
...

Recent Leads
...
```

### Dashboard should not become

* Analytics dashboard
* CRM dashboard
* Marketing dashboard
* AI dashboard

Keep V1 simple.

---

# 13. Website Content

## 13.1 Content Overview

Path:

```text
Website → Content
```

Display supported website sections.

Example:

```text
Website Content

Business / Hero       Published
About                 Draft
Services              Published
Why Choose Us         Published
Explore Our Work      Published
Contact               Published
Footer                Published
```

Each section provides:

* Section name
* Status
* Edit action

Only sections mapped to the connected website are displayed.

---

# 14. Content Section Editor

## 14.1 General Layout

```text
← Website Content

Hero

Business Name
[________________] ⓘ

Headline
[________________] ⓘ

Supporting Description
[________________________]

[✨ Improve with AI]

Primary CTA
[________________]

[Save Draft] [Preview] [Update Website]
```

### Rules

* No HTML editor.
* No CSS controls.
* No layout controls.
* No animation controls.
* No breakpoint controls.
* No arbitrary section creation.

---

# 15. Content Fields

Supported fields depend on the connected website.

Possible fields:

### Business / Hero

* Business Name
* Headline
* Supporting Description
* Primary CTA

### About

* Business Description
* Supporting Text

### Services

* Service Name
* Service Description
* Service Details

### Why Choose Us

* Approved Benefits
* Differentiators

### Explore Our Work

* Images
* Optional captions
* Optional project/work names

### Contact

* Phone
* Email
* Address
* Service Area
* Contact Text

### Footer

* Supported business information
* Supported contact information

Only mapped fields can be edited.

---

# 16. Content Validation

Validation happens both client-side and server-side.

### Client-side

Provide immediate feedback.

Example:

```text
Business Name
[              ]
Business Name is required.
```

### Server-side

Server validation is authoritative.

Invalid data must not be saved or published.

### Rules

* Trim unnecessary whitespace.
* Reject empty required values.
* Enforce maximum lengths.
* Validate email, phone, and URL formats.
* Do not silently truncate user content.

---

# 17. Save Draft

When the client selects:

`Save Draft`

The system:

1. Validates the fields.
2. Saves the draft.
3. Keeps the existing live website unchanged.
4. Shows confirmation.

Example:

```text
Draft saved successfully.
```

Save Draft must never publish automatically.

---

# 18. Preview

Preview should show the client how the supported content will appear in the connected website context where practical.

Preview must clearly indicate that the changes are not yet live.

Example:

```text
Preview

This is a preview of your draft.
Your live website has not been changed.

[Back to Editor]
[Update Website]
```

---

# 19. Update Website

`Update Website` is the explicit publishing/update action.

Before update:

```text
Update Website?

Your approved changes will replace the current live
website content.

[Cancel] [Update Website]
```

### Processing

```text
Updating your website...
```

### Success

```text
Website updated successfully.
```

### Failure

```text
We couldn't update your website.

Your current live website is unchanged.

[Try Again]
```

The approved draft remains available for retry.

---

# 20. Embedded AI — Improve with AI

AI is accessed from supported content fields.

## 20.1 Entry Point

```text
Headline
[Existing content...]

[✨ Improve with AI]
```

## 20.2 AI Actions

Display:

```text
Improve Wording
Make More Professional
Make Shorter
Make Clearer
Improve Service Description
Custom Instruction
```

No model, provider, temperature, token, or technical settings are exposed.

---

# 21. AI Suggestion Generation

When an action is selected:

```text
Improving your content...
```

The system uses relevant:

* Approved Business Context
* Approved website content
* Current field
* Current section
* Current client request
* Sparovia AI rules

Only the necessary current-tenant context should be supplied.

---

# 22. AI Suggestion Review

Display current content and suggested content.

Example:

```text
Current

We provide interior design services.

Suggested

We provide professional interior design services
tailored to your needs.

[Accept] [Edit] [Reject]
```

On larger screens, side-by-side comparison may be used.

On mobile, use stacked comparison.

---

# 23. AI Accept

When the client selects `Accept`:

* Suggested content replaces the current draft field.
* Normal field validation runs.
* Content remains a draft.
* Live website is unchanged.
* Business Context is unchanged.

Show:

```text
Suggestion added to your draft.
Review the content before updating your website.
```

---

# 24. AI Edit

`Edit` places the suggestion into the normal editor.

The client can modify it before saving.

Flow:

```text
AI Suggestion
     ↓
Edit
     ↓
Normal Editor
     ↓
Save Draft
```

---

# 25. AI Reject

`Reject` discards the suggestion.

The existing draft remains unchanged.

The client may request another suggestion.

---

# 26. AI Safety UX

The UI must never imply that AI output is automatically factual or approved.

Where appropriate, show concise guidance:

> Review AI suggestions before using them on your website.

AI must not:

* Invent certifications.
* Invent awards.
* Invent years in business.
* Invent warranties.
* Invent prices.
* Invent locations.
* Invent service areas.
* Invent customer/project counts.
* Invent clients or partnerships.
* Invent qualifications.
* Invent guarantees.

If required information is unavailable, AI must not guess.

---

# 27. Website Images Overview

Path:

```text
Website → Images
```

Sections:

```text
Website Images
Explore Our Work
```

Each image card can display:

* Thumbnail
* Usage/location
* Status
* Replace
* AI Enhance

Example:

```text
Hero Image

[ IMAGE ]

Hero section
Published

[Replace] [AI Enhance]
```

---

# 28. Image Upload / Replace

Flow:

```text
Select Image
     ↓
Upload
     ↓
Validate
     ↓
Preview
     ↓
Confirm
```

Supported formats:

* JPG/JPEG
* PNG
* WebP

Recommended maximum upload size:

```text
10 MB
```

Server-side validation is authoritative.

---

# 29. Image Upload Validation

Reject:

* Unsupported formats
* Oversized files
* Corrupt files
* Invalid image data
* Unsafe/malformed uploads

Client-friendly error:

> This image couldn't be uploaded. Please choose a supported image under 10 MB.

Do not expose storage or processing internals.

The existing live image must remain unchanged after a failed upload.

---

# 30. Image Preview

Before activation, display the image in its intended website placement where practical.

Actions:

```text
[Cancel]
[Confirm]
```

The client must clearly understand that confirmation prepares the image for website use but does not silently alter unrelated content.

---

# 31. Explore Our Work

Path:

```text
Website → Images → Explore Our Work
```

Purpose:

Provide a lightweight collection of genuine project/work images.

## Add Image

Fields:

| Field               | Type     | Required |
| ------------------- | -------- | -------: |
| Image               | Upload   |      Yes |
| Caption             | Textarea |       No |
| Project / Work Name | Text     |       No |

### Guidance

> Upload genuine photos of your completed work or projects. Do not upload AI-generated or misleading project images.

### Actions

* Add Image
* Cancel
* Replace
* AI Enhance

---

# 32. Explore Our Work Empty State

Example:

```text
Showcase your work

Add genuine photos of your completed work or projects
to display them on your website.

[+ Add Image]
```

Do not display fake placeholder project images as real client work.

---

# 33. AI Image Enhancement

AI enhancement is accessed from an uploaded image.

```text
Image
   ↓
AI Enhance
   ↓
Choose Improvement
```

Options:

```text
Improve Clarity
Improve Sharpness
Reduce Noise
Upscale
Classic Look
Modern Look
Web Optimize
```

Each option should include concise `ⓘ` guidance where needed.

---

# 34. Enhancement Processing

After selecting an enhancement:

```text
Improving your image...

This may take a moment.
```

Do not expose provider/model details.

The original image must remain available throughout processing.

---

# 35. Enhancement Failure

Example:

```text
We couldn't improve this image.

Your original image is safe and unchanged.

[Retry] [Keep Original]
```

Repeated failure must not affect the original.

---

# 36. Before / After Review

After successful enhancement:

```text
Original                 Enhanced

[ IMAGE ]                [ IMAGE ]

[Reject]                 [Approve Enhancement]
```

A slider may be used where practical.

Mobile may use:

```text
Original
[ IMAGE ]

Enhanced
[ IMAGE ]
```

### Review guidance

The client should confirm:

* It is the same photograph.
* The subject is unchanged.
* No major objects were added or removed.
* No fabricated project details appear.
* The image still represents the real business/project accurately.

---

# 37. Approve Enhancement

`Approve Enhancement` means:

* The enhanced image becomes an approved derived image.
* The original remains preserved.
* The enhanced image is not automatically published.

Show:

> Enhancement approved. Update your website when you're ready.

---

# 38. Reject Enhancement

`Reject` means:

* Enhanced result is not used.
* Original remains unchanged.
* Client can retry or keep the original.

---

# 39. Image Update Website

After image approval:

```text
Approved Image
      ↓
Update Website
      ↓
Validate
      ↓
Optimize
      ↓
Publish
```

The live image must only change after successful website update.

Failure:

> We couldn't update your website. Your current website image is unchanged.

---

# 40. Image Preservation UX

The client does not need a complex version-management interface.

Internally:

```text
Original
   ↓
Optional Enhanced
   ↓
Approved
   ↓
Website Optimized
   ↓
Published
```

The original is never overwritten.

---

# 41. Image Enhancement Fidelity Rule

The UX must reinforce:

> Improve quality, not reality.

Enhancement must not be presented as a way to:

* Create a project photo.
* Add a building/room/product/person/vehicle.
* Remove major objects.
* Change architecture.
* Change materials.
* Change product characteristics.
* Fabricate missing project details.
* Turn an unfinished project into a completed project.

---

# 42. Leads

Path:

```text
Leads
```

Supported lead sources:

```text
Website
WhatsApp
```

WhatsApp is available only when the client's supported WhatsApp integration is configured.

---

# 43. Lead List

Display:

| Information | Display            |
| ----------- | ------------------ |
| Name        | Yes                |
| Phone       | Yes                |
| Email       | If available       |
| Source      | Website / WhatsApp |
| Status      | Yes                |
| Submitted   | Yes                |

Default ordering:

```text
Newest first
```

### Filters

* All
* Website
* WhatsApp
* New
* Contacted
* Qualified
* Closed

Keep filtering simple.

---

# 44. Lead List Empty State

If no leads exist:

```text
No leads yet

Website enquiries and supported WhatsApp enquiries
will appear here when customers contact your business.
```

No fake sample leads should be displayed in production.

---

# 45. Lead Detail

Display:

```text
Customer Name
Phone
Email

Message

Source
Submitted
Status
```

### Actions

* Change Status
* Call customer
* Email customer where email is available

External actions should use appropriate device/browser behavior.

---

# 46. Lead Status

Supported statuses:

```text
New
Contacted
Qualified
Closed
```

Status can be changed from the lead detail screen.

Example:

```text
Status
[ New ▼ ]
```

Changing status should provide immediate confirmation.

---

# 47. Website Lead Experience

Website flow:

```text
Customer
   ↓
Website Enquiry Form
   ↓
Validation
   ↓
Sparovia
   ↓
Lead Created
   ↓
Lead List
```

Customer-facing success:

> Thanks! Your enquiry has been received.

Failure:

> We couldn't send your enquiry. Please try again.

Do not expose internal API errors.

---

# 48. WhatsApp Lead Experience

When configured:

```text
Customer Message
      ↓
WhatsApp Integration
      ↓
Sparovia
      ↓
Lead Created / Updated
      ↓
Lead List
```

Lead source must display:

```text
WhatsApp
```

The pilot does not provide a full WhatsApp inbox or chat-management interface.

No V1:

* automated replies
* campaigns
* AI agents
* conversation automation
* advanced WhatsApp CRM

---

# 49. Settings

## 49.1 Account

Display:

* Full Name
* Email
* Password/security actions where implemented

Do not expose technical tenant identifiers.

---

## 49.2 AI Connections & Model Selection

### Purpose

Allow the client to connect supported external AI providers (e.g., OpenAI, Google Gemini, Anthropic Claude) using their own API credentials, securely test the connection, and select an approved model for their business workflows.

Sparovia does NOT create or present fictional AI models (e.g. "Sparovia Fast" or "Sparovia Quality"). The client connects a real supported provider and selects an approved model from that provider's allowlist.

### Screen Layout & States

#### 1. Current Connection Card (when connected)
* **Provider**: Display Name (e.g. "OpenAI")
* **Model**: Selected Model (e.g. "GPT-4o Mini")
* **Status**: `Connected` (green badge)
* **API Credential**: Masked presentation (`••••••••••••••••`)
* **Capability**: Primary capability (e.g., "Content AI")
* **Last Validated**: Date/time of last successful verification
* **Actions**:
  * `Change Model`: Allows switching to another approved model from the connected provider.
  * `Rotate API Key`: Allows replacing the stored API credential safely.
  * `Disconnect`: Disconnects provider connection with confirmation dialog.

#### 2. Connect Provider Form (when not connected or updating)
* **Provider Selector**:
  * Dropdown/Cards of Sparovia-approved providers (OpenAI, Google Gemini, Anthropic Claude).
* **API Credential Input**:
  * Masked password-style field (`type="password"`).
  * Accompanied by Sparovia reusable `ⓘ` Information Guidance:
    > "Enter your API secret key from your provider console (e.g., OpenAI, Google, Anthropic). Sparovia uses your key solely to execute your approved content and image requests. Credentials are encrypted at rest using strong AES-256 encryption, never logged, and never displayed back in plaintext."
* **Test Connection Action**:
  * `[Test Connection]` button. Validates authentication against provider API before persistence.
  * Displays inline connection status indicator (Validating... / Connection Verified / Authentication Failed).
* **Model Selector**:
  * Dropdown showing approved models for the selected provider.
  * Each model displays: Display Name, Description, Capability (Content, Image), and Recommended/Default tags.
* **Save Connection Action**:
  * `[Save AI Configuration]` button.

### UX Security Rules:
* Provider API keys must never be rendered in plaintext in the DOM.
* Form clears credential inputs after successful encryption and persistence.
* Unapproved, unavailable, or deprecated models cannot be selected.
* Changing providers or disconnecting shows a clear confirmation modal.

---

# 50. Navigation Behavior

## Desktop

Use persistent sidebar navigation.

Example:

```text
Sparovia

Dashboard

Business
  Business Context

Website
  Content
  Images
    Explore Our Work

Leads

Settings
```

## Mobile

Use a compact header with menu/drawer navigation.

Navigation must not permanently consume excessive screen space.

---

# 51. Unsaved Changes

If the client attempts to leave a screen with unsaved changes:

```text
You have unsaved changes.

If you leave now, your changes will not be saved.

[Stay] [Leave]
```

Do not silently discard edits.

---

# 52. Loading States

Every asynchronous operation must provide feedback.

Examples:

```text
Loading Business Context...
Loading Content...
Uploading image...
Improving content...
Enhancing image...
Saving...
Updating website...
```

Buttons involved in the operation should prevent accidental duplicate submission while processing.

---

# 53. Empty States

Empty states must:

1. Explain what is empty.
2. Explain why it matters.
3. Provide the next useful action.

Example:

```text
No website images yet.

Add images to keep your website up to date.

[Add Image]
```

Avoid empty screens with no explanation.

---

# 54. Success States

Success feedback must be concise and clear.

Examples:

```text
Draft saved.
Business Context confirmed.
Image uploaded.
Enhancement approved.
Lead status updated.
Website updated successfully.
```

Success messages must not imply publication when only a draft was saved.

---

# 55. Error States

Errors must be:

* Client-friendly
* Actionable
* Safe
* Concise

Example:

```text
Something went wrong.

Your current website is unchanged.

[Try Again]
```

Never expose:

* Stack traces
* Database errors
* Provider names
* Internal IDs
* Secrets
* Tenant identifiers
* Infrastructure details

---

# 56. Confirmation Dialogs

Confirmation is required for potentially destructive or consequential actions.

Examples:

### Remove Service

```text
Remove this service?

This will remove it from your Business Context.

[Cancel] [Remove]
```

### Update Website

```text
Update your website?

Your approved changes will become live.

[Cancel] [Update Website]
```

### Reject Enhancement

```text
Reject this enhancement?

The enhanced version will not be used.

[Cancel] [Reject]
```

Avoid confirmation dialogs for ordinary non-destructive actions.

---

# 57. Responsive Design

Pilot V1 must support:

* Desktop
* Tablet
* Mobile

No core client workflow may require desktop-only interaction.

---

# 58. Mobile Layout Rules

On mobile:

* Navigation becomes a drawer/menu.
* Forms use a single-column layout.
* Fields stack vertically.
* Buttons should be easy to tap.
* Long forms are divided by onboarding steps.
* Tables transform into cards or readable rows.
* AI comparison becomes stacked.
* Image previews scale to available width.
* Dialogs must fit within the viewport.
* No horizontal scrolling for primary workflows.

---

# 59. Touch Interaction

Controls must be comfortable for touch use.

Avoid:

* tiny buttons
* dense tables
* hover-only actions
* hover-only guidance
* desktop-only drag interactions

All important actions must remain accessible through touch.

---

# 60. Responsive Content Editor

Desktop:

```text
Field
[................................]

ⓘ Guidance

[✨ Improve with AI]

[Save Draft] [Preview] [Update Website]
```

Mobile:

```text
Field
[....................]

ⓘ Guidance

[✨ Improve with AI]

[Save Draft]
[Preview]
[Update Website]
```

Actions may become full-width or grouped according to available space.

---

# 61. Responsive Image Review

Desktop:

```text
Original          Enhanced
[ IMAGE ]         [ IMAGE ]
```

Mobile:

```text
Original
[ IMAGE ]

Enhanced
[ IMAGE ]
```

The client must still be able to compare both versions clearly.

---

# 62. Responsive Lead Management

Desktop may use a table.

Mobile should use cards:

```text
John Doe
+91 XXXXX XXXXX

Website
New

01 Sep 2026
```

Selecting a card opens the full lead detail.

---

# 63. Accessibility

The application should provide:

* Keyboard-accessible controls.
* Visible focus states.
* Labels for all form fields.
* Accessible error messages.
* Meaningful button labels.
* Sufficient text readability.
* Alternative text support for relevant images.
* Screen-reader-friendly interactive controls.
* No critical information conveyed by color alone.

---

# 64. Form UX Rules

Every form must:

* Clearly identify required fields.
* Provide `ⓘ` guidance where needed.
* Preserve valid input after errors.
* Validate before submission.
* Show field-level errors where possible.
* Prevent duplicate submissions.
* Show save/processing state.
* Clearly distinguish Save Draft from Update Website.

---

# 65. Status Presentation

Use consistent status labels across the application.

### Content

```text
Draft
Published
```

### AI Suggestion

```text
Suggested
Accepted
Rejected
```

### Image

```text
Processing
Enhanced
Approved
Published
```

### Lead

```text
New
Contacted
Qualified
Closed
```

Status must never rely only on color.

---

# 66. Global UX Rules

The following are mandatory across Pilot V1.

### Rule 1

Client edits business content, not website design.

### Rule 2

Save Draft does not publish.

### Rule 3

Accept AI does not publish.

### Rule 4

Approve Enhancement does not publish.

### Rule 5

AI never publishes automatically.

### Rule 6

Original images are never overwritten.

### Rule 7

AI suggestions do not automatically become Business Context.

### Rule 8

Only approved/current-tenant information is supplied to AI.

### Rule 9

Every client-facing field that needs explanation provides `ⓘ` guidance.

### Rule 10

Errors must preserve the current valid/live state.

---

# 67. Primary UX Workflows

## 67.1 Business Context

```text
Account
  ↓
Onboarding
  ↓
Business Information
  ↓
Services
  ↓
Location & Customers
  ↓
Description
  ↓
Approved Facts
  ↓
Review
  ↓
Confirm
```

---

## 67.2 Content

```text
Website
  ↓
Content
  ↓
Section
  ↓
Edit
  ↓
Optional AI
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

## 67.3 AI Content

```text
Content Field
  ↓
Improve with AI
  ↓
Choose Improvement
  ↓
AI Suggestion
  ↓
Accept / Edit / Reject
  ↓
Draft
  ↓
Client Review
  ↓
Update Website
```

---

---

## 67.4 AI Provider Connection & Model Selection

```text
Settings
  ↓
AI Connections
  ↓
Select Provider (OpenAI, Gemini, Claude)
  ↓
Enter API Key / Credential
  ↓
Test Connection
  ↓
Select Supported Model
  ↓
Save Configuration
  ↓
Active for Content AI & Image Enhancement
```

---

## 67.5 Website Images

```text
Images
  ↓
Select Image
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

## 67.6 AI Image Enhancement

```text
Image
  ↓
AI Enhance
  ↓
Choose Enhancement (Compatible Model)
  ↓
Processing
  ↓
Before / After
  ↓
Approve / Reject
  ↓
Update Website
```

---

## 67.7 Leads

```text
Website / WhatsApp
        ↓
Lead Intake
        ↓
Validation
        ↓
Tenant Resolution
        ↓
Lead
        ↓
Lead List
        ↓
Lead Detail
        ↓
Status Update
```

---

# 68. UX Security Boundaries

The UX must never allow a client to:

* Select another tenant.
* View another client's content.
* View another client's leads.
* Attach another tenant's image.
* use another tenant's Business Context for AI.
* view another tenant's AI provider connection or credentials.
* manually supply a tenant identifier to control ownership.
* access internal provider configuration.

Security enforcement remains server-side.

The UI must not be treated as the security boundary.

---

# 69. UX Performance Expectations

The interface should provide immediate feedback for user actions.

Long-running operations such as:

* AI generation
* AI image enhancement
* Image processing
* Website updates

must show a processing state.

Users must not be left wondering whether an action succeeded.

---

# 70. UX Definition of Done

Pilot V1 UX is complete when:

* [ ] Authentication screens are implemented.
* [ ] Onboarding flow is complete.
* [ ] Business Context review and confirmation work.
* [ ] Dashboard is implemented.
* [ ] Website Content section list works.
* [ ] Structured content editor works.
* [ ] Field guidance is present.
* [ ] Content validation works.
* [ ] Save Draft works.
* [ ] Preview works where supported.
* [ ] Update Website requires explicit client action.
* [ ] AI Provider Connection & Model Selection screen is implemented.
* [ ] Connection test feedback works before saving.
* [ ] Stored credentials display in masked format (`••••••••••••••••`).
* [ ] Embedded AI Improve flow works.
* [ ] AI Accept/Edit/Reject works.
* [ ] AI suggestions remain drafts until published.
* [ ] Website Images workflow works.
* [ ] Explore Our Work works.
* [ ] Upload validation works.
* [ ] Original image preservation is maintained.
* [ ] AI image enhancement options work.
* [ ] Before/After review works.
* [ ] Enhancement approval is separate from publishing.
* [ ] Image failure/retry/fallback states work.
* [ ] Lead list works.
* [ ] Lead detail works.
* [ ] Lead status updates work.
* [ ] Website leads appear correctly.
* [ ] WhatsApp leads appear correctly when configured.
* [ ] Empty states are implemented.
* [ ] Loading states are implemented.
* [ ] Success states are implemented.
* [ ] Failure states are implemented.
* [ ] Unsaved-change protection works.
* [ ] Responsive desktop/tablet/mobile layouts work.
* [ ] Keyboard/accessibility basics are implemented.
* [ ] No unsupported website-design controls are exposed.
* [ ] No standalone AI prompt playground/chatbot is introduced (AI remains contextual assistance).

---

# 71. Final UX Boundary

Sparovia Client Pilot V1 should provide this experience:

```text
Understand My Business
        ↓
Manage My Website
        ↓
Improve Content When Needed
        ↓
Manage My Images
        ↓
Safely Enhance My Images
        ↓
Receive My Customer Leads
```

The client should never feel that they are operating a complex CMS, website builder, AI platform, CRM, or media-management system.

The intended experience is:

> **“Sparovia understands my business and gives me simple, safe controls to keep my website and incoming enquiries up to date.”**

This document is the **UX implementation source of truth for Sparovia Client Pilot V1**.

