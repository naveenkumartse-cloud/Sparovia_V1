# PILOT_V1_AI_IMAGE_SPECIFICATION.md

# Sparovia Client Pilot V1 — AI & Image Specification

**Document Status:** Production Ready  
**Version:** 1.0  
**Scope:** Sparovia Client Pilot V1  
**Audience:** Backend, Frontend, AI/ML, Image Processing, QA, DevOps  
**Authority:** AI and image-processing implementation source of truth for Pilot V1

---

# 1. Purpose

This document defines the production behavior for:

- AI-assisted website content improvement
- AI image enhancement
- Image upload and replacement
- Explore Our Work images
- Image lifecycle
- Original-image preservation
- Image optimization and delivery
- AI provider abstraction
- AI safeguards
- Factuality and fidelity controls
- Human approval
- Failure and fallback behavior

The objective is to provide useful AI assistance while ensuring that Sparovia does not invent business facts or materially alter what a client's photograph represents.

---

# 2. Core Principle

Sparovia AI follows:

```text
Ground
  ↓
Constrain
  ↓
Generate / Enhance
  ↓
Validate
  ↓
Human Review
  ↓
Approve
  ↓
Publish
````

AI is an assistant inside Sparovia workflows.

AI is not an autonomous website designer, publisher, or business decision-maker.

---

# 3. Pilot V1 AI Scope

AI is embedded in two workflows:

## Content

```text
Website Content
      ↓
Improve with AI
      ↓
Review
      ↓
Accept / Edit / Reject
```

## Images

```text
Website Image
      ↓
AI Enhance
      ↓
Before / After
      ↓
Approve / Reject
      ↓
Update Website
```

There is no standalone AI management module in Pilot V1.

---

# 4. AI Content Assistance

## 4.1 Purpose

AI content assistance helps a client improve existing website content without inventing business information.

Supported operations:

* Improve Wording
* Make More Professional
* Make Shorter
* Make Clearer
* Improve Service Description
* Custom Instruction

---

# 5. AI Content Input

The backend constructs the AI request context.

The client does not control the trusted context directly.

The effective context is:

```text
Approved Business Context
        +
Approved Website Content
        +
Current Draft
        +
Current Section
        +
Current Field
        +
Requested Improvement
        +
Sparovia AI Rules
```

Only the minimum information required for the task should be supplied.

---

# 6. AI Content Trust Hierarchy

AI must treat information according to this hierarchy:

| Priority | Source                    | Trust                          |
| -------- | ------------------------- | ------------------------------ |
| 1        | Approved Business Context | Highest                        |
| 2        | Approved Website Content  | Trusted                        |
| 3        | Current Client Draft      | Working content                |
| 4        | AI Suggestion             | Untrusted until approved       |
| 5        | General AI knowledge      | Not a source of business facts |

General model knowledge must never be used to fill missing client-specific facts.

---

# 7. Business Context as AI Grounding

Approved Business Context may contain:

* Business name
* Business type
* Primary category
* Phone
* Email
* Website
* Address
* Service areas
* Services
* Target customers
* Business description
* Differentiators
* Years in business
* Certifications
* Awards
* Warranties
* Accreditations
* Other approved claims

Only approved information is trusted as a business fact.

---

# 8. No-Invented-Facts Rule

The AI must never invent or assume:

* Years in business
* Certifications
* Awards
* Accreditations
* Warranties
* Prices
* Offers
* Locations
* Service areas
* Customer counts
* Project counts
* Completed projects
* Client names
* Partnerships
* Authorized/dealer status
* Qualifications
* Guarantees
* Services not confirmed by the client

Core rule:

> No source → No fact.

If required information is unavailable, AI must omit it or ask for it rather than guess.

---

# 9. Allowed AI Content Transformations

AI may:

* Rewrite wording.
* Improve clarity.
* Improve professionalism.
* Shorten content.
* Improve readability.
* Reorganize existing information.
* Improve service descriptions using approved information.
* Combine approved facts without changing their meaning.

AI must preserve factual meaning.

---

# 10. Protected Content

The following should be treated as protected factual information:

* Business name
* Phone
* Email
* Address
* Service areas
* Pricing
* Certifications
* Awards
* Warranties
* Accreditations

AI should not silently rewrite or change protected factual values.

Where these values are required in website content, they should preferably be populated from structured Business Context rather than freely regenerated.

---

# 11. AI Content Output Validation

AI output must be validated before being returned as an accepted suggestion.

Validation should check:

* Empty output
* Excessive output length
* Unsupported claims
* Protected factual changes
* Contradictions
* Invalid formatting
* Malformed content
* Policy/rule violations

Invalid output must not be applied automatically.

---

# 12. AI Content Approval

The interaction is:

```text
AI Suggestion
     ↓
Review
     ├── Accept
     ├── Edit
     └── Reject
```

### Accept

Applies the suggestion to the current draft.

It does not:

* Publish
* Update the live website
* Update Business Context

### Edit

Places the suggestion into the normal editor.

The client can modify it before saving.

### Reject

Discards the suggestion.

The existing draft remains unchanged.

---

# 13. AI Content Audit

Important AI content actions should be auditable.

Record, where appropriate:

* Tenant
* User
* AI request ID
* Resource/field
* Operation
* Timestamp
* Context/version reference
* Provider/model reference internally
* Result
* Approval/rejection
* Final accepted content where appropriate

Do not store unnecessary secrets or sensitive information.

---

# 14. AI Image Enhancement

## 14.1 Purpose

AI image enhancement improves the quality of a client's existing photograph.

The enhancement must preserve the identity and factual representation of the original image.

Core rule:

> Improve quality, not reality.

---

# 15. Supported Enhancement Operations

Pilot V1 exposes only these client-facing operations:

```text
Improve Clarity
Improve Sharpness
Reduce Noise
Upscale
Classic Look
Modern Look
Web Optimize
```

The underlying provider may implement these operations differently.

The operations execute through the tenant's configured external AI provider using an approved model that supports Image Enhancement capabilities. Sparovia validates capability compatibility server-side before execution.

---

# 16. Improve Clarity

Purpose:

* Improve perceived image clarity.
* Recover reasonable detail where possible.
* Improve overall visual readability.

Must not:

* Invent project details.
* Add objects.
* Remove meaningful objects.
* Change architecture.
* Change product characteristics.

---

# 17. Improve Sharpness

Purpose:

* Improve apparent sharpness.
* Reduce mild softness caused by capture/compression.

Must not create fabricated structural details.

---

# 18. Reduce Noise

Purpose:

* Reduce unwanted image noise.
* Improve visual cleanliness.

The process must avoid excessive smoothing that materially removes real subject details.

---

# 19. Upscale

Purpose:

* Increase usable image resolution.
* Improve suitability for website display.

Upscaling is enhancement, not creation of a new photograph.

It must not:

* Invent rooms.
* Invent buildings.
* Invent products.
* Add people or objects.
* Change materials.
* Change project characteristics.

---

# 20. Classic Look

Classic Look may apply a controlled visual treatment to the existing photograph.

It must preserve:

* Subject
* Composition
* Architecture
* Products
* Materials
* Project identity

It must not become a generative transformation.

---

# 21. Modern Look

Modern Look may apply a controlled visual treatment to improve presentation.

It must preserve the underlying photograph and its factual representation.

It must not:

* Replace the project.
* Change materials.
* Add architectural elements.
* Remove meaningful objects.
* Generate missing details.

---

# 22. Web Optimize

Web Optimize prepares the image for website delivery.

It may include:

* Appropriate resizing
* Compression
* Format optimization
* Metadata optimization
* Delivery optimization

It must preserve the image's subject and factual representation.

---

# 23. Prohibited Image Alterations

Pilot V1 AI image enhancement must not:

* Add major objects.
* Remove major objects.
* Add buildings.
* Remove buildings.
* Add rooms.
* Remove rooms.
* Change architecture.
* Change structural elements.
* Change materials.
* Change product characteristics.
* Add people.
* Remove people.
* Add vehicles.
* Remove vehicles.
* Fabricate project details.
* Turn an unfinished project into a completed project.
* Make one project look like another.
* Generate a project from scratch.
* Create fake portfolio imagery.
* Replace the original image.

---

# 24. Explore Our Work Fidelity Rule

Explore Our Work images represent genuine client work.

Therefore:

```text
Original Client Photograph
        ↓
Optional Quality Enhancement
        ↓
Client Review
        ↓
Approval
        ↓
Website
```

AI must never generate a replacement project photograph for the portfolio.

The enhancement must remain faithful to the original work.

---

# 25. Image Upload

Supported formats:

```text
JPEG / JPG
PNG
WebP
```

Pilot V1 should defer:

```text
SVG
GIF
TIFF
RAW
HEIC / HEIF
```

Recommended maximum upload size:

```text
10 MB per image
```

---

# 26. Image Validation

Validation must occur server-side.

The system must verify:

* Actual image format
* MIME type
* Extension consistency
* File size
* Image integrity
* Reasonable dimensions
* Safe processing capability

The browser-provided MIME type must not be trusted as the only validation mechanism.

---

# 27. Image Upload Security

Uploaded files must:

* Use server-controlled storage keys.
* Never execute as application code.
* Never expose internal storage paths.
* Be tenant scoped.
* Be processed through safe image libraries/services.
* Be scanned/validated according to the production security architecture.

The original upload must remain protected from accidental modification.

---

# 28. Image Lifecycle

The canonical lifecycle is:

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

The original is immutable.

---

# 29. Original Image

The original is the authoritative source photograph uploaded by the client.

Properties:

* Immutable
* Preserved
* Tenant-owned
* Never overwritten
* Not modified by AI
* Not used as a temporary processing file

All derived versions must retain a reference to their source.

---

# 30. Derived Images

Derived images include:

* AI-enhanced versions
* Upscaled versions
* Optimized website versions
* Format variants
* Responsive delivery variants

Derived images must never replace the original source.

---

# 31. Image Replacement

When a client replaces an image:

```text
Old Original
    ↓
Preserved

New Upload
    ↓
New Original
    ↓
Validation
    ↓
Optional Enhancement
    ↓
Approval
    ↓
Publish
```

The old original should remain preserved according to the system's retention policy.

The current live website image remains unchanged until the new image is successfully approved and published.

---

# 32. Image States

The implementation may use:

```text
Original
Processing
Enhanced
Approved
Published
Rejected
Unused
```

State transitions must be controlled by the application.

Invalid transitions must be rejected.

---

# 33. Enhancement Processing Flow

```text
Client selects image
        ↓
Select enhancement
        ↓
Validate image
        ↓
Create AI request
        ↓
Send through AI abstraction
        ↓
Provider processing
        ↓
Receive result
        ↓
Validate result
        ↓
Store derived image
        ↓
Before/After review
        ↓
Client approval
```

---

# 34. AI Enhancement Result Validation

The system must validate the resulting image before allowing it into the approval workflow.

Checks should include:

* Processing completed successfully
* Valid image
* Expected output dimensions
* Supported output format
* File integrity
* Source image relationship
* Safe storage
* No processing corruption

Where practical, automated fidelity checks should detect suspicious material changes.

Automated checks do not replace human approval.

---

# 35. Before/After Review

The client must be able to compare:

```text
Before = Original
After  = Enhanced
```

Preferred presentation:

* Side-by-side
* Slider comparison

The review should make it easy to identify:

* Added objects
* Removed objects
* Changed structure
* Changed materials
* Fabricated details
* Excessive processing

---

# 36. Enhancement Approval

Client action:

```text
Approve Enhancement
```

means:

```text
Enhanced image is acceptable as a derived approved image.
```

It does not mean:

```text
Publish to website.
```

Website publishing remains a separate explicit action.

---

# 37. Enhancement Rejection

Client action:

```text
Reject Enhancement
```

must:

* Keep original unchanged.
* Prevent rejected result from becoming published.
* Allow another enhancement attempt.
* Preserve any already-approved/live image.

---

# 38. Fidelity Decision

The client should be encouraged to confirm:

* It is the same photograph/project.
* No major object was added.
* No major object was removed.
* No structural element changed.
* No material/product characteristic changed.
* No project details were fabricated.

---

# 39. Provider Abstraction

Sparovia must not tightly couple its core application to one AI provider.

Architecture:

```text
Sparovia Workflow
        ↓
AI Service
        ↓
Provider Abstraction
        ↓
Provider Adapter (OpenAI, Gemini, Claude, etc.)
        ↓
External AI Provider
```

For images:

```text
Image Workflow
        ↓
Image Enhancement Service
        ↓
Capability Validation (Verify Image Enhancement capability)
        ↓
Tenant's Configured AI Provider & Model
        ↓
Enhancement Engine Abstraction
        ↓
Provider Adapter
        ↓
External AI Provider API
```

### Capability Validation Rules

Before an image enhancement workflow executes:

1. The system resolves the tenant's configured provider and selected model from `TenantAIConfiguration`.
2. The system validates whether the selected model supports the `Image` or `General` capability.
3. If the model does not support image enhancement:
   - The operation is immediately rejected before contacting external services.
   - Return a clear, safe error: `MODEL_CAPABILITY_MISMATCH`.
   - The client is informed that an image-capable model must be selected under AI Connections.
   - Never silently switch providers or models.

---

# 40. Provider Independence

The core Sparovia domain must not depend directly on:

* Provider SDK types
* Provider-specific request models
* Provider-specific response models
* Provider-specific status values
* Provider-specific storage identifiers

Provider-specific implementation belongs inside adapters.

---

# 41. Standard AI Operation Contract

Internally, the abstraction should represent an operation conceptually as:

```text
Operation
Input
Context
Rules
Options
```

and return:

```text
Success
Output
Metadata
Error
```

The exact programming-language interface is an engineering implementation detail.

---

# 42. Content AI Adapter

Conceptually:

```text
Content AI Request
        ↓
IAIContentService
        ↓
Provider Adapter
        ↓
Selected Provider
```

The application should not call a provider SDK directly from controllers or domain entities.

---

# 43. Image AI Adapter

Conceptually:

```text
Image Enhancement Request
        ↓
IImageEnhancementService
        ↓
Provider Adapter
        ↓
Selected Enhancement Engine
```

This allows the implementation to start with one engine and replace it later without redesigning the application workflow.

---

# 44. Provider Selection

Provider selection is an internal implementation concern.

Pilot V1 must not expose:

* Model selection
* Provider selection
* API keys
* Provider settings
* Temperature
* Prompt engineering controls
* Technical image model controls
* Provider quotas

to the client.

---

# 45. Initial Provider Strategy

The implementation may initially use:

* A hosted provider
* A self-hosted/open-source engine
* A hybrid approach

The architecture must keep the provider replaceable.

No provider is part of the Sparovia product contract.

---

# 46. Provider Failure

If a provider fails:

```text
Provider Failure
      ↓
Standardize Error
      ↓
Preserve Existing State
      ↓
Show Simple Error
      ↓
Retry
```

Do not expose provider-specific errors to the client.

---

# 47. Retry Policy

Retries should be controlled.

The system should distinguish between:

* Temporary provider failure
* Invalid input
* Processing timeout
* Unsupported operation
* Permanent processing failure

Only retry conditions that are reasonably transient.

Avoid uncontrolled retry loops.

---

# 48. Enhancement Fallback

If enhancement repeatedly fails:

```text
AI Enhanced
   X
   ↓
Keep Original
```

The original image remains available for website use.

The failure must never damage the current published image.

---

# 49. Website Image Publishing

The final flow is:

```text
Upload
   ↓
Validate
   ↓
Optional Enhance
   ↓
Before/After
   ↓
Approve
   ↓
Optimize
   ↓
Publish
```

Publishing must be explicit.

AI must never publish automatically.

---

# 50. Website Optimization

The system automatically determines suitable delivery variants based on the actual website component requirements.

It should:

* Preserve aspect ratio.
* Avoid unnecessary upscaling.
* Resize where required.
* Compress appropriately.
* Use modern formats where supported.
* Provide suitable fallback formats.
* Cache optimized variants.
* Support responsive delivery.
* Lazy-load non-critical images.
* Prioritize important above-fold images.

The client does not manually configure these settings.

---

# 51. Avoid Repeated Lossy Processing

The processing pipeline should avoid repeatedly recompressing already-compressed images.

Preferred:

```text
Original
   ↓
Approved Source
   ↓
Derived Delivery Variants
```

rather than:

```text
Compressed
   ↓
Compressed Again
   ↓
Compressed Again
```

---

# 52. Image Metadata

Derived image metadata may include:

```text
ImageId
TenantId
ParentImageId
StorageKey
ImageType
Version
MimeType
FileSize
Width
Height
Status
CreatedAt
```

Internal provider metadata may be stored separately where useful.

Do not expose unnecessary internal metadata to the client.

---

# 53. AI Request Metadata

AI requests may internally track:

```text
AIRequestId
TenantId
UserId
Operation
ResourceType
ResourceId
Provider
Model
Status
StartedAt
CompletedAt
FailureCode
```

Provider/model information is operational metadata, not client-facing configuration.

---

# 54. AI Context Privacy

AI requests must include only information required for the operation.

Do not send unrelated:

* Lead data
* Financial information
* Secrets
* Authentication credentials
* Internal system configuration
* Other tenant information

Business Context must always be tenant scoped.

---

# 55. Tenant Isolation for AI

Every AI request must belong to exactly one tenant.

Before processing:

```text
Authenticated Request
       ↓
Resolve Tenant
       ↓
Resolve Resource
       ↓
Verify Resource Ownership
       ↓
Build AI Context
       ↓
Process
```

AI processing must never mix context between tenants.

---

# 56. Background Job Isolation

AI/image processing may run asynchronously.

Every background job must carry sufficient tenant/resource ownership context to ensure:

* Correct tenant
* Correct resource
* Correct image
* Correct AI request

Background jobs must not rely on untrusted client-provided tenant information.

---

# 57. AI Content Safety Pipeline

The content pipeline is:

```text
Approved Context
       ↓
Prompt / Rules
       ↓
AI Generation
       ↓
Output Validation
       ↓
Suggestion
       ↓
Human Review
       ↓
Draft
       ↓
Explicit Publish
```

---

# 58. AI Image Safety Pipeline

The image pipeline is:

```text
Original
   ↓
Enhancement Request
   ↓
AI Processing
   ↓
Output Validation
   ↓
Fidelity Review
   ↓
Human Approval
   ↓
Website Optimization
   ↓
Explicit Publish
```

---

# 59. Human Approval Requirement

Human approval is mandatory before:

### Content

AI-generated content can become approved website content.

### Images

AI-enhanced images can become approved website images.

AI output may be generated automatically, but it must not become live automatically.

---

# 60. Business Context Protection

AI suggestions must never automatically modify Business Context.

For example:

```text
AI suggests:
"We have 15 years of experience."
```

This does not become:

```text
BusinessContext.yearsInBusiness = 15
```

unless the client explicitly provides/approves that fact through the Business Context workflow.

---

# 61. Contradiction Handling

If AI output conflicts with trusted Business Context:

```text
Trusted Business Context
        ↓
Higher Priority
```

The conflicting AI output must be rejected or corrected.

Example:

```text
Business Context:
Service Area = Coimbatore

AI:
"We serve customers across Chennai."
```

The AI statement must not be accepted as a business fact.

---

# 62. Missing Information

When information is missing:

```text
No Trusted Fact
       ↓
Do Not Guess
```

Possible behavior:

* Omit the statement.
* Use neutral wording.
* Ask the client to provide the missing information.

---

# 63. AI Prompt Rules

AI instructions must explicitly communicate:

* Use approved context.
* Preserve factual meaning.
* Do not invent business facts.
* Do not infer unsupported claims.
* Do not change protected factual values.
* Improve only the requested content.
* Return useful content suitable for the requested field.

The exact prompt text is an implementation detail and may evolve without changing this product contract.

---

# 64. AI Output Length

Generated content must respect the destination field's validation limits.

For example:

```text
Business Name → 150 characters
Service Name → 100 characters
Short Description → 300 characters
Detailed Description → 2000 characters
Business Description → 2000 characters
```

The authoritative limits remain defined by the API/domain validation rules.

AI must not bypass them.

---

# 65. AI Security

AI endpoints must implement:

* Authentication
* Authorization
* Tenant isolation
* Input validation
* Rate limiting
* Request size limits
* Output validation
* Abuse protection
* Safe error handling
* Audit logging

---

# 66. AI Failure UX

The client should see a simple message such as:

> We couldn't improve this content right now. Please try again.

or:

> We couldn't enhance this image right now. Please try again or keep the original.

Do not expose:

* Stack traces
* Provider names unless intentionally required
* API errors
* Model internals
* Infrastructure details

---

# 67. Image Processing States in UI

Recommended client states:

```text
Ready
Uploading
Processing
Review
Approved
Published
Failed
```

The UI must always make the current state clear.

---

# 68. Loading Behavior

While processing:

* Disable conflicting actions.
* Show clear progress state.
* Prevent duplicate enhancement requests where possible.
* Preserve existing image.
* Allow safe navigation where practical.

The user must never believe that a processing image is already live.

---

# 69. Duplicate Enhancement Requests

The backend should prevent accidental duplicate requests where practical.

Use:

* Request state checks
* Idempotency keys
* Existing processing detection

depending on implementation.

---

# 70. Existing Live Image Protection

At every stage:

```text
Upload Failure
→ Live Image Safe

AI Failure
→ Live Image Safe

Validation Failure
→ Live Image Safe

Approval Rejection
→ Live Image Safe

Publish Failure
→ Live Image Safe
```

This is mandatory.

---

# 71. Content Failure Protection

Similarly:

```text
AI Failure
→ Existing Draft Safe

Validation Failure
→ Existing Draft Safe

Publish Failure
→ Existing Live Content Safe
```

AI must never destroy valid content because an enhancement attempt failed.

---

# 72. Audit Requirements

Audit important AI/image events:

```text
AIContentRequested
AIContentAccepted
AIContentRejected

ImageUploaded
ImageReplaced

AIImageEnhancementRequested
AIImageEnhancementApproved
AIImageEnhancementRejected

ImagePublished
ImagePublishFailed
```

Audit entries must remain tenant scoped.

---

# 73. Testing Requirements

AI and image functionality must be tested against:

## Content

* Correct Business Context grounding.
* Unsupported claim prevention.
* Protected fact preservation.
* Empty output.
* Excessive output.
* Contradictory output.
* Malicious/custom instructions.
* Cross-tenant context leakage.
* AI provider failure.
* Rate limiting.

## Images

* Valid uploads.
* Invalid MIME types.
* Corrupt images.
* Oversized images.
* Unsupported formats.
* Enhancement failure.
* Enhancement retry.
* Original preservation.
* Before/After correctness.
* Material alteration detection.
* Cross-tenant image access.
* Publish failure.
* Concurrent changes.

---

# 74. AI Quality Acceptance Targets

Pilot V1 should target:

```text
0 known unsupported business claims
0 protected factual changes
0 known cross-tenant AI context leaks
0 automatic AI publications
100% original image preservation
100% explicit approval before AI output becomes live
```

These are quality/security targets for the Pilot V1 implementation.

---

# 75. Observability

The system should monitor:

* AI request count
* AI success/failure rate
* Enhancement success/failure rate
* Processing duration
* Provider errors
* Validation rejection rate
* Retry rate
* Publish failures
* Image processing failures

Metrics must not expose sensitive client information.

---

# 76. Cost Protection

AI operations must be protected against uncontrolled usage.

Implement appropriate:

* Per-user rate limits
* Per-tenant rate limits
* Request size limits
* Image size limits
* Processing timeouts
* Duplicate request prevention

Exact quotas may be configured operationally and are not part of the client-facing contract.

---

# 77. Provider Replacement

Replacing the underlying provider must not require changes to:

* Business Context
* Website Content domain model
* Image domain model
* Lead domain model
* Client-facing workflow
* Client-facing enhancement options

Only the provider adapter/service implementation should need substantial change.

---

# 78. Provider Failure Independence

If an AI provider becomes unavailable:

```text
Sparovia
   ↓
Provider Adapter
   X
```

The following must continue to work:

* Login
* Business Context
* Content editing
* Saving drafts
* Image upload
* Existing website images
* Lead management
* Existing published website

AI failure must not become a platform failure.

---

# 79. V1 Exclusions

The following are explicitly excluded:

* AI website generation
* AI website redesign
* Autonomous publishing
* AI agents
* AI chatbots
* Generative project images
* Fake portfolio imagery
* Material image manipulation
* Object insertion/removal
* Product replacement
* Architecture modification
* AI-generated business facts
* Automatic Business Context updates
* Arbitrary external provider endpoint overrides
* Custom provider SDK uploads or internal adapter modifications
* Provider infrastructure administration / billing / token resale management
* Provider marketplace
* Advanced image editing
* Advanced DAM
* Advanced AI analytics
* Autonomous content workflows

---

# 80. Production Definition of Done

AI and image functionality is complete when:

* [ ] AI content assistance is embedded in the content editor.
* [ ] Approved Business Context is used for grounding.
* [ ] AI cannot invent unsupported business facts.
* [ ] Protected facts are preserved.
* [ ] AI suggestions require human review.
* [ ] Accept/Edit/Reject works.
* [ ] AI suggestions do not automatically publish.
* [ ] AI suggestions do not automatically update Business Context.
* [ ] AI image enhancement supports all approved V1 operations.
* [ ] Original images are immutable.
* [ ] Derived images are separately tracked.
* [ ] Before/After review works.
* [ ] Enhancement approval works.
* [ ] Enhancement rejection works.
* [ ] Image publishing remains explicit.
* [ ] Explore Our Work images remain faithful to genuine client work.
* [ ] File validation works.
* [ ] AI/provider failures preserve existing state.
* [ ] Retry behavior works.
* [ ] Image optimization works automatically.
* [ ] Provider abstraction is implemented.
* [ ] Provider-specific details remain outside core business logic.
* [ ] Tenant isolation is enforced for AI and images.
* [ ] AI/image actions are auditable.
* [ ] Rate limiting and abuse protection are implemented.
* [ ] Cross-tenant security tests pass.
* [ ] AI factuality tests pass.
* [ ] Image fidelity tests pass.
* [ ] Production observability is available.

---

# 81. Final Architecture

```text
                         SPAROVIA
                            │
             ┌──────────────┴──────────────┐
             │                             │
        Content AI                    Image AI
             │                             │
             ▼                             ▼
     AI Content Service          Image Enhancement Service
             │                             │
             └──────────────┬──────────────┘
                            ▼
              Tenant AI Configuration
              (Configured Provider & Model)
                            │
             ┌──────────────┴──────────────┐
             ▼                             ▼
      Provider Abstraction         Provider Abstraction
             │                             │
             ▼                             ▼
       Provider Adapter             Provider Adapter
             │                             │
             ▼                             ▼
        External AI Provider        External AI Provider
        (OpenAI, Gemini, Claude)    (OpenAI, Gemini, Claude)
```

Content:

```text
Business Context
      +
Approved Content
      +
Current Draft
      +
Task
      ↓
AI Suggestion
      ↓
Validate
      ↓
Human Review
      ↓
Draft
      ↓
Publish
```

Images:

```text
Original
   ↓
Enhancement
   ↓
Validate
   ↓
Before / After
   ↓
Human Approval
   ↓
Optimize
   ↓
Publish
```

---

# 82. Final AI & Image Boundary

Sparovia Pilot V1 AI exists to **assist the client without taking control away from the client**.

The system must preserve these boundaries:

```text
AI proposes
Client decides

AI improves
AI does not fabricate

AI enhances
AI does not change reality

Original is preserved
Derived versions are separate

Provider is replaceable
Sparovia workflow is stable

Approval is explicit
Publishing is explicit

Tenant context is isolated
AI never crosses tenants
```

**This document is the AI and image-processing implementation source of truth for Sparovia Client Pilot V1.**

