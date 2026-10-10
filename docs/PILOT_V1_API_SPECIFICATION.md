# PILOT_V1_API_SPECIFICATION.md

# Sparovia Client Pilot V1 — API Specification

**Document Status:** Production Ready  
**Version:** 1.0  
**Scope:** Client Pilot V1  
**Audience:** Backend, Frontend, Website Integration, QA  
**Authority:** API implementation source of truth for Pilot V1

---

# 1. Purpose

This document defines the HTTP API contract required for Sparovia Client Pilot V1.

It specifies:

- API conventions
- Authentication
- Tenant resolution
- Endpoint contracts
- Request models
- Response models
- Validation
- Error handling
- Website integration
- Content management
- Image management
- AI operations
- Lead intake and management
- Publishing/update behavior
- Security requirements

The API is intentionally limited to Pilot V1 capabilities.

*(For detailed implementation guidelines and DTO integration for the Image Quality Studio rebuild, refer to [`BUILD_IMAGE_STUDIO_REBUILD.md`](BUILD_IMAGE_STUDIO_REBUILD.md). For platform visual design tokens, refer to [`DESIGN.md`](DESIGN.md).)*

---

# 2. API Design Principles

The API must be:

- Versioned
- Structured
- Predictable
- Tenant-safe
- Server-authoritative
- Validated
- Secure
- Idempotent where appropriate
- Safe under failure

The API must never expose internal database structure directly.

---

# 3. Base URL

Production API:

```text
https://api.sparovia.com/api/v1
````

The actual production domain may differ by deployment environment.

Environment-specific configuration must not change the API contract.

---

# 4. API Versioning

Pilot V1 uses:

```text
/api/v1
```

Example:

```http
GET /api/v1/business-context
```

Breaking API changes require a new version.

Non-breaking additions may remain within the current version.

---

# 5. Content Type

JSON endpoints use:

```http
Content-Type: application/json
```

Image uploads use:

```http
multipart/form-data
```

Responses containing JSON use:

```http
Content-Type: application/json
```

---

# 6. Authentication

## 6.1 Admin API

Authenticated Client Admin operations require a secure authenticated session/token.

Conceptually:

```http
Authorization: Bearer <access-token>
```

The exact authentication mechanism may be implemented using the selected authentication infrastructure.

The API contract requires:

```text
Authenticate
    ↓
Resolve User
    ↓
Resolve Tenant
    ↓
Authorize
    ↓
Validate
    ↓
Execute
```

---

# 7. Tenant Resolution

Tenant ownership is always resolved server-side.

The API must not trust:

```json
{
  "tenantId": "..."
}
```

from client requests to determine ownership.

For authenticated Admin requests:

```text
Authenticated User
        ↓
User.TenantId
        ↓
Current Tenant
```

For website-originated requests:

```text
Trusted Website Identity
        ↓
Website
        ↓
Website.TenantId
```

---

# 8. Common Request Headers

Recommended:

```http
Authorization: Bearer <token>
Content-Type: application/json
Accept: application/json
X-Request-Id: <optional-client-request-id>
```

`X-Request-Id` may be accepted for tracing.

The server should generate a correlation/request ID when one is not supplied.

---

# 9. Common Response Envelope

Successful responses should use a consistent structure.

Example:

```json
{
  "data": {},
  "requestId": "..."
}
```

Collection example:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 42
  },
  "requestId": "..."
}
```

The exact pagination implementation may be simplified for V1 where result sets are small.

---

# 10. Standard Error Response

All API errors should use a predictable structure.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "fields": {
      "businessName": "Business name is required."
    }
  },
  "requestId": "..."
}
```

Do not expose:

* Stack traces
* Database errors
* SQL
* Provider internals
* Infrastructure details
* Secrets
* Internal tenant information

---

# 11. HTTP Status Codes

| Status  | Meaning                                               |
| ------- | ----------------------------------------------------- |
| 200     | Successful operation                                  |
| 201     | Resource created                                      |
| 202     | Accepted for asynchronous processing                  |
| 204     | Successful operation without response body            |
| 400     | Invalid request/validation failure                    |
| 401     | Authentication required/failed                        |
| 403     | Authenticated but not authorized                      |
| 404     | Resource not found                                    |
| 409     | Resource/state conflict                               |
| 413     | Request/file too large                                |
| 415     | Unsupported media type                                |
| 422     | Semantically invalid input where appropriate          |
| 429     | Rate limited                                          |
| 500     | Internal server error                                 |
| 502/503 | External/service processing failure where appropriate |

The application may normalize provider/service failures into the standard API error model.

---

# 12. Standard Error Codes

Pilot V1 supports:

```text
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
CONFLICT
RATE_LIMITED
PROCESSING_FAILED
PUBLISH_FAILED
INTERNAL_ERROR
```

Additional internal codes may exist, but client-visible codes should remain stable and meaningful.

---

# 13. Authentication Endpoints

## 13.1 Register

```http
POST /api/v1/auth/register
```

### Request

```json
{
  "fullName": "John Doe",
  "phoneNumber": "+91 98765 43210",
  "email": "john@example.com",
  "password": "********",
  "confirmPassword": "********"
}
```

### Validation

* `fullName` required.
* `phoneNumber` required and normalized to E.164 format (`+919876543210`).
* `email` optional; if provided must be valid email format.
* `password` required (minimum 8 characters).
* Password must satisfy configured security requirements.
* `confirmPassword` must match.
* Phone number and email uniqueness rules must be enforced.

### Success

```http
201 Created
```

```json
{
  "data": {
    "userId": "uuid",
    "phoneNumber": "+919876543210",
    "verificationRequired": true,
    "devOtp": "123456"
  },
  "requestId": "..."
}
```

* Note: `devOtp` is only included in local Development environment responses for seamless testing. It is strictly excluded in Production.
* The response must never contain the password or password hash.

---

# 14. Phone OTP Verification

## 14.1 Send Phone OTP

```http
POST /api/v1/auth/phone/send-otp
```

### Request

```json
{
  "phoneNumber": "+91 98765 43210"
}
```

### Success

```http
200 OK
```

```json
{
  "data": {
    "message": "OTP sent successfully.",
    "cooldownSeconds": 60,
    "expiresInMinutes": 5,
    "devOtp": "123456"
  },
  "requestId": "..."
}
```

## 14.2 Verify Phone OTP

```http
POST /api/v1/auth/phone/verify-otp
```

### Request

```json
{
  "phoneNumber": "+91 98765 43210",
  "otp": "123456"
}
```

### Success

```http
200 OK
```

```json
{
  "data": {
    "message": "Phone number verified successfully.",
    "isVerified": true,
    "nextUrl": "/admin/onboarding/business-basics"
  },
  "requestId": "..."
}
```

Upon successful verification, the backend issues the authenticated session cookie (`SparoviaAuth`).

### Failure

Returns structured error envelope:

```json
{
  "error": {
    "code": "INVALID_OTP",
    "message": "Invalid verification code. 4 attempt(s) remaining."
  },
  "requestId": "..."
}
```

---

# 15. Sign In

```http
POST /api/v1/auth/login
```

### Request

```json
{
  "email": "john@example.com",
  "password": "********"
}
```

### Success

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "fullName": "John Doe",
      "email": "john@example.com"
    }
  },
  "requestId": "..."
}
```

Authentication credentials/session information must be handled according to the selected secure authentication mechanism.

---

# 16. Current User

```http
GET /api/v1/auth/me
```

### Success

```json
{
  "data": {
    "id": "uuid",
    "fullName": "John Doe",
    "email": "john@example.com"
  },
  "requestId": "..."
}
```

Tenant IDs should not be exposed unless there is a concrete implementation requirement.

---

# 17. Business Context Endpoints

## 17.1 Get Business Context

```http
GET /api/v1/business-context
```

### Authorization

Authenticated client user.

### Success

```json
{
  "data": {
    "id": "uuid",
    "businessName": "Example Business",
    "businessType": "ServiceArea",
    "primaryBusinessCategory": "Interior Design",
    "businessPhone": "+91...",
    "businessEmail": "hello@example.com",
    "websiteUrl": "https://example.com",
    "customerVisitLocation": "No",
    "businessAddress": null,
    "providesAtCustomerLocation": true,
    "serviceAreas": [
      "Coimbatore"
    ],
    "targetCustomers": [
      "HomeOwners"
    ],
    "otherCustomerTypes": null,
    "customerDescription": null,
    "differentiators": null,
    "businessDescription": "....",
    "yearsInBusiness": null,
    "certifications": [],
    "awards": [],
    "warranties": [],
    "accreditations": [],
    "otherApprovedClaims": [],
    "isConfirmed": true
  },
  "requestId": "..."
}
```

---

# 18. Create Business Context

```http
POST /api/v1/business-context
```

### Request

```json
{
  "businessName": "Example Business",
  "businessType": "ServiceArea",
  "primaryBusinessCategory": "Interior Design",
  "businessPhone": "+91...",
  "businessEmail": "hello@example.com",
  "websiteUrl": "https://example.com",
  "customerVisitLocation": "No",
  "businessAddress": null,
  "providesAtCustomerLocation": true,
  "serviceAreas": [
    "Coimbatore"
  ],
  "targetCustomers": [
    "HomeOwners"
  ],
  "otherCustomerTypes": null,
  "customerDescription": null,
  "differentiators": null,
  "businessDescription": "....",
  "yearsInBusiness": null,
  "certifications": [],
  "awards": [],
  "warranties": [],
  "accreditations": [],
  "otherApprovedClaims": []
}
```

### Success

```http
201 Created
```

---

# 19. Update Business Context

```http
PUT /api/v1/business-context
```

### Request

Same structured model as creation.

### Rules

* Validate all fields.
* Tenant is determined server-side.
* Client cannot modify another tenant.
* Approved Business Context remains the trusted source for AI.
* Changes must be auditable.

---

# 20. Confirm Business Context

```http
POST /api/v1/business-context/confirm
```

### Request

No body required.

### Success

```json
{
  "data": {
    "isConfirmed": true,
    "confirmedAt": "2026-09-02T00:00:00Z"
  },
  "requestId": "..."
}
```

This action explicitly establishes the client's Business Context as approved/trusted.

---

# 21. Service Endpoints

## 21.1 List Services

```http
GET /api/v1/business-context/services
```

## 21.2 Create Service

```http
POST /api/v1/business-context/services
```

### Request

```json
{
  "name": "Interior Design",
  "shortDescription": "Professional interior design services.",
  "detailedDescription": "..."
}
```

### Validation

* Name required.
* Short description required.
* Detailed description optional.
* Maximum lengths enforced.
* Tenant ownership server-derived.

---

# 22. Update Service

```http
PUT /api/v1/business-context/services/{serviceId}
```

### Request

```json
{
  "name": "Interior Design",
  "shortDescription": "Updated description.",
  "detailedDescription": "..."
}
```

---

# 23. Delete Service

```http
DELETE /api/v1/business-context/services/{serviceId}
```

Deletion requires authorization and should use confirmation at the UI level.

If service history/preservation requirements later require soft deletion, the persistence implementation may use it without changing the client-facing contract.

---

# 24. Website Endpoints

## 24.1 Get Connected Website

```http
GET /api/v1/website
```

### Success

```json
{
  "data": {
    "id": "uuid",
    "name": "Example Website",
    "domain": "example.com",
    "connectionStatus": "Connected"
  },
  "requestId": "..."
}
```

---

# 25. Website Content

## 25.1 List Content Sections

```http
GET /api/v1/website/content
```

### Success

```json
{
  "data": [
    {
      "sectionKey": "BusinessHero",
      "status": "Published",
      "version": 3
    },
    {
      "sectionKey": "About",
      "status": "Draft",
      "version": 4
    }
  ],
  "requestId": "..."
}
```

Only supported mapped sections are returned.

---

# 26. Get Content Section

```http
GET /api/v1/website/content/{sectionKey}
```

Example:

```http
GET /api/v1/website/content/BusinessHero
```

### Success

```json
{
  "data": {
    "sectionKey": "BusinessHero",
    "status": "Draft",
    "version": 4,
    "fields": {
      "businessName": "Example Business",
      "headline": "Beautiful spaces for modern living.",
      "supportingDescription": "...",
      "primaryCtaText": "Contact Us"
    }
  },
  "requestId": "..."
}
```

---

# 27. Save Content Draft

```http
PUT /api/v1/website/content/{sectionKey}/draft
```

### Request

```json
{
  "fields": {
    "businessName": "Example Business",
    "headline": "Updated headline",
    "supportingDescription": "Updated description",
    "primaryCtaText": "Contact Us"
  }
}
```

### Rules

* Validate section.
* Validate supported fields.
* Validate field lengths.
* Validate field formats.
* Reject unsupported fields.
* Save as Draft.
* Do not update live website.

### Success

```json
{
  "data": {
    "sectionKey": "BusinessHero",
    "status": "Draft",
    "version": 5
  },
  "requestId": "..."
}
```

---

# 28. Preview Content

```http
GET /api/v1/website/content/{sectionKey}/preview
```

The response may contain the structured preview representation required by the frontend.

The preview must represent draft content without making it publicly live.

---

# 29. Update Website Content

```http
POST /api/v1/website/content/{sectionKey}/publish
```

### Request

```json
{
  "version": 5
}
```

The server must verify that the version belongs to the current tenant and is eligible for publishing.

### Processing

```text
Validate
   ↓
Authorize
   ↓
Publish
   ↓
Update Connected Website
   ↓
Invalidate Affected Cache
```

### Success

```json
{
  "data": {
    "sectionKey": "BusinessHero",
    "status": "Published",
    "version": 5,
    "publishedAt": "2026-09-02T00:00:00Z"
  },
  "requestId": "..."
}
```

### Failure

```json
{
  "error": {
    "code": "PUBLISH_FAILED",
    "message": "We couldn't update your website."
  },
  "requestId": "..."
}
```

The currently live version must remain unchanged.

---

# 30. AI Provider Connection & Model Selection Endpoints

These endpoints manage the tenant's external AI provider connection and model selection.
Sparovia does not create fictional AI models. The client connects a supported external provider using their own credentials and selects an approved model.

API keys are **never** returned in plaintext (only masked representation like `••••••••••••••••`).

## 30.1 List Supported Providers

```http
GET /api/v1/ai/providers
```

### Response (200 OK)

```json
{
  "data": [
    {
      "key": "openai",
      "displayName": "OpenAI",
      "description": "Industry-leading reasoning and conversational nuance.",
      "supportedCapabilities": ["Content", "Image", "General"]
    },
    {
      "key": "gemini",
      "displayName": "Google Gemini",
      "description": "High-throughput multimodal understanding and content generation.",
      "supportedCapabilities": ["Content", "General"]
    },
    {
      "key": "claude",
      "displayName": "Anthropic Claude",
      "description": "Advanced editorial refinement, nuance, and structural clarity.",
      "supportedCapabilities": ["Content", "General"]
    }
  ],
  "requestId": "..."
}
```

---

## 30.2 List Approved Models

```http
GET /api/v1/ai/models?providerKey=openai&capability=Content
```

### Query Parameters (Optional)

* `providerKey`: Filter by provider (`openai`, `gemini`, `claude`)
* `capability`: Filter by capability (`Content`, `Image`, `General`)

### Response (200 OK)

```json
{
  "data": [
    {
      "key": "gpt-4o-mini",
      "providerKey": "openai",
      "displayName": "GPT-4o Mini",
      "description": "Fast, cost-efficient model for quick wording improvements.",
      "capability": "Content",
      "status": "Available",
      "isDefault": true
    },
    {
      "key": "gpt-4o",
      "providerKey": "openai",
      "displayName": "GPT-4o",
      "description": "Advanced flagship reasoning for nuanced brand storytelling.",
      "capability": "Content",
      "status": "Available",
      "isDefault": false
    }
  ],
  "requestId": "..."
}
```

---

## 30.3 Get Current Connection

```http
GET /api/v1/ai/connection
```

### Response (200 OK)

```json
{
  "data": {
    "status": "Connected",
    "providerKey": "openai",
    "providerDisplayName": "OpenAI",
    "selectedModelKey": "gpt-4o-mini",
    "selectedModelDisplayName": "GPT-4o Mini",
    "maskedApiKey": "sk-...••••1234",
    "supportedCapability": "Content",
    "lastValidatedAt": "2026-09-27T10:00:00Z",
    "updatedAt": "2026-09-27T10:00:00Z"
  },
  "requestId": "..."
}
```

If not connected:
```json
{
  "data": {
    "status": "NotConnected",
    "providerKey": null,
    "selectedModelKey": null
  },
  "requestId": "..."
}
```

---

## 30.4 Test Provider Connection

```http
POST /api/v1/ai/connection/test
```

Tests whether the supplied credentials (or currently stored credentials) can authenticate successfully with the provider.

### Request

```json
{
  "providerKey": "openai",
  "apiKey": "sk-proj-..."
}
```

*(If `apiKey` is omitted, tests using the currently stored credential for the tenant).*

### Success (200 OK)

```json
{
  "data": {
    "success": true,
    "providerKey": "openai",
    "message": "Connection to OpenAI verified successfully."
  },
  "requestId": "..."
}
```

### Failure (400 Bad Request)

```json
{
  "error": {
    "code": "CONNECTION_TEST_FAILED",
    "message": "Could not authenticate with OpenAI. Please verify your API key."
  },
  "requestId": "..."
}
```

---

## 30.5 Create / Connect Provider

```http
POST /api/v1/ai/connection
```

### Request

```json
{
  "providerKey": "openai",
  "apiKey": "sk-proj-...",
  "selectedModelKey": "gpt-4o-mini"
}
```

### Processing

1. Authorize user and resolve tenant.
2. Validate provider is in approved registry.
3. Validate selected model belongs to provider and is `Available`.
4. Perform server-side connection test against external provider API.
5. Encrypt API key using platform encryption key.
6. Persist `TenantAIConfiguration` with status `Connected`.
7. Audit event: `AIProviderConnectionCreated`.

### Response (200 OK / 201 Created)

```json
{
  "data": {
    "status": "Connected",
    "providerKey": "openai",
    "selectedModelKey": "gpt-4o-mini",
    "maskedApiKey": "sk-...••••1234",
    "lastValidatedAt": "2026-09-27T10:05:00Z"
  },
  "requestId": "..."
}
```

---

## 30.6 Update Connection / Model Selection

```http
PUT /api/v1/ai/connection
```

### Request (Changing Model or Rotating Key)

```json
{
  "selectedModelKey": "gpt-4o",
  "apiKey": "sk-proj-new-key..." 
}
```

*(Note: `apiKey` is optional when only changing the selected model).*

### Response (200 OK)

```json
{
  "data": {
    "status": "Connected",
    "providerKey": "openai",
    "selectedModelKey": "gpt-4o",
    "maskedApiKey": "sk-...••••9876",
    "updatedAt": "2026-09-27T10:10:00Z"
  },
  "requestId": "..."
}
```

---

## 30.7 Disconnect Provider

```http
DELETE /api/v1/ai/connection
```

### Response (200 OK)

```json
{
  "data": {
    "status": "NotConnected",
    "message": "AI provider disconnected successfully."
  },
  "requestId": "..."
}
```

---

# 31. AI Content Endpoints

## 31.1 Improve Content

```http
POST /api/v1/ai/content/improve
```

### Request

```json
{
  "sectionKey": "BusinessHero",
  "field": "headline",
  "operation": "MakeMoreProfessional",
  "currentText": "Beautiful spaces for everyone."
}
```

### Allowed Operations

```text
ImproveWording
MakeMoreProfessional
MakeShorter
MakeClearer
ImproveServiceDescription
CustomInstruction
```

### Custom Instruction

```json
{
  "sectionKey": "BusinessHero",
  "field": "headline",
  "operation": "CustomInstruction",
  "currentText": "....",
  "instruction": "Make this easier to understand."
}
```

Custom instructions must still comply with Sparovia AI rules.

---

# 31. AI Content Context

The backend determines the trusted AI context.

Conceptually:

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
Requested Operation
        +
Sparovia AI Rules
```

The client must not directly supply authoritative Business Context.

The backend retrieves it from the current tenant.

---

# 32. AI Content Response

### Success

```http
200 OK
```

```json
{
  "data": {
    "aiRequestId": "uuid",
    "suggestion": "Improved suggested content.",
    "status": "Succeeded"
  },
  "requestId": "..."
}
```

The suggestion is not published.

The suggestion is not automatically added to Business Context.

---

# 33. AI Content Rules

The service must:

* Use only current tenant context.
* Use approved Business Context as trusted business facts.
* Preserve factual meaning.
* Avoid inventing missing information.
* Avoid changing protected factual fields.
* Validate generated output.
* Return a suggestion for client review.

The service must never:

* Publish directly.
* Modify Business Context automatically.
* Modify another tenant's data.
* Invent certifications, awards, years, warranties, prices, locations, counts, clients, partnerships, qualifications, or guarantees.

---

# 34. Image Endpoints

## 34.1 List Website Images

```http
GET /api/v1/website/images
```

### Optional filter

```text
?usageType=WebsiteImage
```

---

# 35. Upload Image

```http
POST /api/v1/website/images
```

### Content Type

```http
multipart/form-data
```

### Form Fields

```text
file
usageType
projectWorkName (optional)
caption (optional)
```

### Allowed Formats

```text
image/jpeg
image/png
image/webp
```

### Recommended Maximum

```text
10 MB
```

---

# 36. Image Validation

The server must verify:

* Actual file type.
* MIME type.
* Extension consistency.
* File size.
* Image integrity.
* Reasonable dimensions.
* Safe processing.

The server must not trust the browser-provided MIME type alone.

---

# 37. Image Upload Response

```http
201 Created
```

```json
{
  "data": {
    "imageId": "uuid",
    "status": "Processing",
    "usageType": "WebsiteImage"
  },
  "requestId": "..."
}
```

The original must be preserved.

---

# 38. Replace Website Image

```http
POST /api/v1/website/images/{imageId}/replace
```

### Request

```text
multipart/form-data
file=<new image>
```

### Rules

* Validate uploaded image.
* Create a new source/original asset.
* Do not overwrite the existing original.
* Existing live image remains active until successful approval/publishing.
* Tenant ownership must be verified.

---

# 39. Explore Our Work

## Add Image

```http
POST /api/v1/website/images/explore-our-work
```

### Multipart fields

```text
file
projectWorkName
caption
```

### Rules

* Image required.
* Project/work name optional.
* Caption optional.
* Genuine client work only.
* No generated/fabricated project imagery.

---

# 40. Update Explore Our Work Metadata

```http
PUT /api/v1/website/images/{imageId}/metadata
```

### Request

```json
{
  "projectWorkName": "Modern Living Room",
  "caption": "Completed interior design project."
}
```

Only supported metadata fields may be modified.

---

# 41. Image Preview

```http
GET /api/v1/website/images/{imageId}/preview
```

The response must provide a safe representation suitable for authenticated preview.

Internal storage paths must not be exposed.

---

# 42. AI Image Enhancement

## Start Enhancement

```http
POST /api/v1/ai/images/{imageId}/enhance
```

### Request

```json
{
  "operation": "ImproveClarity"
}
```

### Allowed Operations

```text
ImproveClarity
ImproveSharpness
ReduceNoise
Upscale
ClassicLook
ModernLook
WebOptimize
```

### Success

For asynchronous processing:

```http
202 Accepted
```

```json
{
  "data": {
    "aiRequestId": "uuid",
    "status": "Processing"
  },
  "requestId": "..."
}
```

---

# 43. Get Enhancement Status

```http
GET /api/v1/ai/requests/{aiRequestId}
```

### Processing

```json
{
  "data": {
    "id": "uuid",
    "status": "Processing"
  },
  "requestId": "..."
}
```

### Success

```json
{
  "data": {
    "id": "uuid",
    "status": "Succeeded",
    "resultImageId": "uuid"
  },
  "requestId": "..."
}
```

### Failure

```json
{
  "data": {
    "id": "uuid",
    "status": "Failed"
  },
  "requestId": "..."
}
```

---

# 44. Before/After Image Review

The API must allow the frontend to retrieve both:

```text
Original
Enhanced
```

for authenticated review.

The original must remain immutable.

The enhanced version must remain a derived image until explicitly approved.

---

# 45. Approve Image Enhancement

```http
POST /api/v1/website/images/{imageId}/enhancement/approve
```

### Request

```json
{
  "variantId": "uuid"
}
```

### Rules

* Verify variant belongs to image.
* Verify image belongs to current tenant.
* Verify enhancement exists.
* Mark derived result as approved.
* Preserve original.
* Do not publish automatically.

### Success

```json
{
  "data": {
    "imageId": "uuid",
    "approvedVariantId": "uuid"
  },
  "requestId": "..."
}
```

---

# 46. Reject Image Enhancement

```http
POST /api/v1/website/images/{imageId}/enhancement/reject
```

### Request

```json
{
  "variantId": "uuid"
}
```

### Rules

* Mark enhancement as rejected/unused.
* Original remains unchanged.
* Client may retry.

---

# 47. Publish Website Image

```http
POST /api/v1/website/images/{imageId}/publish
```

### Request

```json
{
  "variantId": "uuid"
}
```

The server verifies that:

* Variant belongs to image.
* Image belongs to current tenant.
* Variant is approved.
* Image is mapped to the connected website.

### Success

```json
{
  "data": {
    "imageId": "uuid",
    "variantId": "uuid",
    "status": "Published"
  },
  "requestId": "..."
}
```

### Failure

```text
PUBLISH_FAILED
```

The existing live image remains unchanged.

---

# 48. Image Optimization

Optimization occurs server-side.

The client does not select:

* Width
* Compression quality
* Format
* CDN settings
* Cache settings

The system determines appropriate delivery variants from the actual website requirements.

Original files remain preserved.

---

# 49. Lead Intake API

## 49.1 Website Lead

```http
POST /api/v1/leads
```

This endpoint is intended for controlled website lead submission.

### Request

```json
{
  "name": "John Doe",
  "phone": "+91...",
  "email": "john@example.com",
  "message": "I would like to know more about your services.",
  "source": "Website"
}
```

### Required

* `name`
* `phone`
* `message`
* `source`

### Optional

* `email`

---

# 50. Lead Tenant Resolution

The request must not contain a trusted tenant identifier.

The server determines the tenant from the authenticated/trusted website identity.

Conceptually:

```text
Website Request
      ↓
Identify Website
      ↓
Resolve Website.TenantId
      ↓
Create Lead
```

A malicious client cannot select another tenant by changing a request field.

---

# 51. Lead Success

```http
201 Created
```

```json
{
  "data": {
    "leadId": "uuid",
    "status": "New"
  },
  "requestId": "..."
}
```

Do not expose unnecessary internal tenant information.

---

# 52. WhatsApp Lead Intake

WhatsApp integration may create/update leads through an internal integration endpoint.

Conceptual endpoint:

```http
POST /api/v1/integrations/whatsapp/leads
```

The exact integration authentication mechanism is implementation-specific.

### Input

```json
{
  "customerName": "John Doe",
  "phone": "+91...",
  "message": "I need information about your service.",
  "sourceReference": "external-message-reference"
}
```

The server assigns:

```text
Source = WhatsApp
Status = New
TenantId = resolved from trusted integration configuration
SubmittedAt = server timestamp
```

---

# 53. WhatsApp Security

The WhatsApp integration must use a trusted server-side integration mechanism.

Do not allow arbitrary callers to claim:

```json
{
  "source": "WhatsApp",
  "tenantId": "..."
}
```

as proof of tenant ownership.

Integration credentials/secrets must never be exposed to the browser.

---

# 54. Get Leads

```http
GET /api/v1/leads
```

### Optional Filters

```text
?source=Website
?source=WhatsApp
?status=New
```

Multiple supported filters may be combined.

### Response

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "phone": "+91...",
      "email": "john@example.com",
      "source": "Website",
      "status": "New",
      "submittedAt": "2026-09-02T08:00:00Z"
    }
  ],
  "requestId": "..."
}
```

All results must be tenant-scoped.

---

# 55. Get Lead

```http
GET /api/v1/leads/{leadId}
```

### Response

```json
{
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "phone": "+91...",
    "email": "john@example.com",
    "message": "I would like to know more.",
    "source": "Website",
    "status": "New",
    "submittedAt": "2026-09-02T08:00:00Z"
  },
  "requestId": "..."
}
```

---

# 56. Update Lead Status

```http
PATCH /api/v1/leads/{leadId}/status
```

### Request

```json
{
  "status": "Contacted"
}
```

### Allowed Values

```text
New
Contacted
Qualified
Closed
```

### Success

```json
{
  "data": {
    "leadId": "uuid",
    "status": "Contacted"
  },
  "requestId": "..."
}
```

The action must be auditable.

---

# 57. Lead Validation

### Name

* Required.
* Trim whitespace.
* Maximum 150 characters.

### Phone

* Required.
* Validate acceptable phone structure.
* Normalize where appropriate.

### Email

* Optional.
* Validate if supplied.

### Message

* Required.
* Trim whitespace.
* Maximum 2000 characters.

### Source

Must be one of:

```text
Website
WhatsApp
```

The server controls valid source values.

---

# 58. Lead Abuse Protection

Lead intake endpoints should implement appropriate:

* Rate limiting
* Request size limits
* Abuse protection
* Input validation
* Bot/spam protection where appropriate

Do not log unnecessary lead PII.

---

# 59. Website Read API

The connected website requires access to published content.

A controlled website-facing API may expose only the published data required by the connected website.

Conceptually:

```http
GET /api/v1/website/{websiteIdentifier}/published-content
```

The exact authentication mechanism must ensure that one website cannot retrieve another website's data.

Only published content should be returned.

Draft content must never be publicly exposed.

---

# 60. Website Published Image API

A controlled website-facing mechanism may retrieve published optimized images.

The website must not receive:

* Original storage paths
* Internal image metadata
* AI request information
* Other tenant images
* Draft images

Only the required published asset should be accessible.

---

# 61. API Tenant Isolation

Every protected endpoint must execute tenant authorization.

Minimum flow:

```text
Request
  ↓
Authenticate
  ↓
Resolve Tenant
  ↓
Resolve Resource
  ↓
Validate Resource.TenantId
  ↓
Authorize
  ↓
Validate Input
  ↓
Execute
```

Never:

```text
Request
  ↓
Trust TenantId from JSON
  ↓
Query Database
```

---

# 62. Resource Ownership Validation

For nested resources:

```text
WebsiteContent
 → Website
 → Tenant
```

```text
ImageVariant
 → Image
 → Website
 → Tenant
```

```text
Service
 → BusinessContext
 → Tenant
```

The server must validate the entire ownership chain where required.

---

# 63. Cross-Tenant Access Response

For unauthorized resource access, the API should return a safe:

```http
404 Not Found
```

or:

```http
403 Forbidden
```

according to the security strategy.

Do not reveal whether another tenant's resource exists.

---

# 64. Validation Rules

Validation must occur server-side for every endpoint.

Client-side validation is only for user experience.

Server validation must enforce:

* Required fields
* Maximum lengths
* Data types
* Enum values
* Email format
* Phone format
* URL format
* File size
* File type
* Image integrity
* Resource ownership
* Tenant ownership
* Status validity

---

# 65. No Silent Truncation

If input exceeds the allowed limit:

```text
Reject
```

Do not silently truncate client content.

Example:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "fields": {
      "businessDescription": "Business description must be 2000 characters or fewer."
    }
  },
  "requestId": "..."
}
```

---

# 66. Concurrency and Version Conflicts

Where content or images may be edited concurrently, the API should use a version/concurrency mechanism.

Example request:

```json
{
  "version": 5,
  "fields": {}
}
```

If the submitted version is stale:

```http
409 Conflict
```

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "This content was changed elsewhere. Please reload and try again."
  },
  "requestId": "..."
}
```

This prevents accidental overwriting of newer changes.

---

# 67. Idempotency

Idempotency should be supported for operations where duplicate requests could create duplicate resources or actions.

Especially relevant to:

* Website lead submission
* WhatsApp lead intake
* Website publishing
* Asynchronous AI processing where duplicate requests are undesirable

A request may provide:

```http
Idempotency-Key: <unique-key>
```

The server should safely handle repeated requests according to the operation.

---

# 68. AI Rate Limiting

AI endpoints must have appropriate rate limits.

Rate limits should protect:

* System resources
* AI provider usage
* Client experience
* Abuse prevention

Response:

```http
429 Too Many Requests
```

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Please wait a moment and try again."
  },
  "requestId": "..."
}
```

Do not expose provider quota details unnecessarily.

---

# 69. Image Processing Failure

If AI/image processing fails:

```text
Original
   ↓
UNCHANGED
```

The API returns:

```text
PROCESSING_FAILED
```

The client can retry.

No failed derived image may become the published image.

---

# 70. Website Publishing Failure

If publishing fails:

```text
Current Live Version
        ↓
UNCHANGED

Approved Draft
        ↓
PRESERVED
```

Return:

```text
PUBLISH_FAILED
```

The client can retry.

---

# 71. Transaction and State Safety

Operations that modify multiple related records should preserve consistent state.

Examples:

### Content publishing

```text
Validate
   ↓
Persist approved version
   ↓
Update website
   ↓
Confirm publication
```

### Image publishing

```text
Validate variant
   ↓
Confirm approved
   ↓
Optimize
   ↓
Update website
   ↓
Confirm publication
```

The implementation must prevent partially published state from becoming the client's apparent success state.

---

# 72. API Security Controls

Production API must implement:

* HTTPS
* Authentication
* Server-side authorization
* Tenant isolation
* Input validation
* Request limits
* File upload limits
* Rate limiting
* Secure authentication/session handling
* Safe CORS configuration
* Injection protection
* Abuse protection
* Secure secret management
* Security logging

---

# 73. CORS

CORS must allow only the origins required by the Sparovia Admin and connected website architecture.

Do not use unrestricted production configuration such as:

```text
*
```

when credentials or authenticated operations are involved.

---

# 74. Logging

Logs should contain useful operational information without exposing sensitive data.

Safe examples:

```text
requestId
endpoint
HTTP status
duration
operation
tenant-safe internal identifier where appropriate
error code
```

Avoid logging:

* Passwords
* Access tokens
* API keys
* Secrets
* Full lead messages
* Unnecessary PII
* Full AI context
* Provider credentials

---

# 75. Audit Integration

Important API actions should create AuditRecord entries.

Examples:

```text
BusinessContextConfirmed
ContentDraftSaved
ContentPublished
ImageUploaded
ImageReplaced
AIContentRequested
AIContentAccepted
AIContentRejected
ImageEnhancementRequested
ImageEnhancementApproved
ImageEnhancementRejected
ImagePublished
LeadCreated
LeadStatusChanged
AuthenticationEvent
AuthorizationFailure
```

---

# 76. API and AI Trust Boundary

The API must distinguish:

```text
Client Input
AI Suggestion
Approved Business Data
Published Data
```

AI-generated content is not trusted merely because the API returned `200`.

The API must ensure:

```text
AI Suggestion
    ↓
Client Review
    ↓
Draft
    ↓
Explicit Publish
```

---

# 77. Protected Business Facts

AI-assisted content operations must protect factual fields such as:

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

The API must not permit AI to silently alter trusted facts.

---

# 78. API Scope — Included

Pilot V1 API includes:

```text
Authentication
Business Context
Services
Connected Website
Website Content
Website Images
Explore Our Work
AI Provider Connection & Model Selection
AI Content Assistance
AI Image Enhancement
Website Publishing
Website Leads
WhatsApp Lead Intake
Lead Management
Audit Integration
```

---

# 79. API Scope — Excluded

Do not implement V1 endpoints for:

```text
Website Builder
Layout Editing
Theme Builder
Custom CSS
Animation Editor

AI Website Generation
AI Agents
Standalone AI Prompt Playground / Chat Interface
Arbitrary Provider Endpoints
Custom Provider SDK Uploads
Provider Infrastructure Administration

CRM
Lead Scoring
Sales Pipelines
Campaigns
Email Automation

WhatsApp Inbox
WhatsApp Campaigns
Automated Replies
WhatsApp AI Agents

Google Business Profile
Advanced Analytics
BI
Personalization
Recommendations

Billing
Subscriptions
Invoices
Multi-Workspace
Super Admin
Multi-Website

Advanced DAM
Project Management
Gallery Management
```

---

# 80. Endpoint Summary

| Area         | Method | Endpoint                                   |
| ------------ | ------ | ------------------------------------------ |
| Auth         | POST   | `/auth/register`                           |
| Auth         | POST   | `/auth/phone/send-otp`                     |
| Auth         | POST   | `/auth/phone/verify-otp`                   |
| Auth         | POST   | `/auth/login`                              |
| Auth         | GET    | `/auth/me`                                 |
| Business     | GET    | `/business-context`                        |
| Business     | POST   | `/business-context`                        |
| Business     | PUT    | `/business-context`                        |
| Business     | POST   | `/business-context/confirm`                |
| Services     | GET    | `/business-context/services`               |
| Services     | POST   | `/business-context/services`               |
| Services     | PUT    | `/business-context/services/{id}`          |
| Services     | DELETE | `/business-context/services/{id}`          |
| Website      | GET    | `/website`                                 |
| Content      | GET    | `/website/content`                         |
| Content      | GET    | `/website/content/{sectionKey}`            |
| Content      | PUT    | `/website/content/{sectionKey}/draft`      |
| Content      | GET    | `/website/content/{sectionKey}/preview`    |
| Content      | POST   | `/website/content/{sectionKey}/publish`    |
| AI Content   | POST   | `/ai/content/improve`                      |
| Images       | GET    | `/website/images`                          |
| Images       | POST   | `/website/images`                          |
| Images       | POST   | `/website/images/{id}/replace`             |
| Explore Work | POST   | `/website/images/explore-our-work`         |
| Images       | PUT    | `/website/images/{id}/metadata`            |
| Images       | GET    | `/website/images/{id}/preview`             |
| AI Image     | POST   | `/ai/images/{id}/enhance`                  |
| AI           | GET    | `/ai/requests/{id}`                        |
| Image        | POST   | `/website/images/{id}/enhancement/approve` |
| Image        | POST   | `/website/images/{id}/enhancement/reject`  |
| Image        | POST   | `/website/images/{id}/publish`             |
| Leads        | POST   | `/leads`                                   |
| WhatsApp     | POST   | `/integrations/whatsapp/leads`             |
| Leads        | GET    | `/leads`                                   |
| Leads        | GET    | `/leads/{id}`                              |
| Leads        | PATCH  | `/leads/{id}/status`                       |

---

# 81. API Implementation Rules

Backend implementation must follow these rules:

1. Every protected request is authenticated.
2. Every protected resource is tenant-scoped.
3. Tenant ownership is resolved server-side.
4. Client-supplied TenantId is never trusted.
5. Server-side validation is authoritative.
6. Unsupported fields are rejected.
7. AI suggestions never publish automatically.
8. Image originals are never overwritten.
9. Failed operations preserve the current valid/live state.
10. Sensitive implementation details are never returned to clients.
11. Important mutations are auditable.
12. API contracts remain versioned.
13. V1 endpoints remain limited to Pilot V1 scope.

---

# 82. API Definition of Done

The API is production-ready when:

* [ ] API versioning is implemented.
* [ ] Authentication works.
* [ ] Tenant resolution works.
* [ ] Server-side authorization works.
* [ ] Business Context endpoints work.
* [ ] Service endpoints work.
* [ ] Website endpoint works.
* [ ] Content read/update workflow works.
* [ ] Draft/published separation works.
* [ ] Website publishing works.
* [ ] AI content assistance works.
* [ ] AI suggestions remain drafts until explicitly accepted/published.
* [ ] Image upload works.
* [ ] Image replacement works.
* [ ] Explore Our Work upload works.
* [ ] File validation works.
* [ ] Original images remain preserved.
* [ ] AI image enhancement works.
* [ ] Enhancement status works.
* [ ] Before/After assets are accessible securely.
* [ ] Enhancement approval/rejection works.
* [ ] Image publishing works.
* [ ] Website lead submission works.
* [ ] WhatsApp lead intake works when configured.
* [ ] Lead list/detail works.
* [ ] Lead status updates work.
* [ ] Tenant isolation is enforced on every client-owned resource.
* [ ] Rate limiting is implemented where required.
* [ ] API errors follow the standard format.
* [ ] Sensitive information is not exposed.
* [ ] Important mutations are audited.
* [ ] Publish failures preserve the live version.
* [ ] Image processing failures preserve the original.
* [ ] Cross-tenant access tests pass.
* [ ] Validation tests pass.
* [ ] Authentication/authorization tests pass.
* [ ] API integration tests pass.

---

# 83. Final API Architecture

The intended Pilot V1 API architecture is:

```text
                    ┌──────────────────┐
                    │ Sparovia Admin   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Sparovia API    │
                    │     /api/v1      │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
 Authentication        Tenant/AuthZ          Validation
        │                    │                    │
        └────────────────────┼────────────────────┘
                             ▼
                    Application Services
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
   Business Context      Website             Leads
        │                    │
        │             ┌──────┴──────┐
        │             ▼             ▼
        │          Content        Images
        │                            │
        │                            ▼
        │                       AI Enhancement
        │
        └───────────────┐
                        ▼
                 PostgreSQL/Supabase
```

Website integration:

```text
Client Website
      │
      ▼
Sparovia Website API
      │
      ▼
Tenant Resolution
      │
      ▼
Validation
      │
      ▼
Sparovia Application
```

The API remains the controlled boundary between the connected website, Sparovia Admin, AI processing, storage, and tenant-owned data.

---

# 84. Final API Boundary

Sparovia Pilot V1 API provides only the capabilities required to:

```text
Understand the Business
        ↓
Manage Structured Website Content
        ↓
Improve Content with AI
        ↓
Manage Website Images
        ↓
Safely Enhance Existing Images
        ↓
Publish Approved Changes
        ↓
Receive Website / WhatsApp Leads
        ↓
Manage Leads
```

with:

```text
Authentication
+
Authorization
+
Tenant Isolation
+
Validation
+
Auditability
+
Safe Failure
```

**This document is the API implementation source of truth for Sparovia Client Pilot V1.**

