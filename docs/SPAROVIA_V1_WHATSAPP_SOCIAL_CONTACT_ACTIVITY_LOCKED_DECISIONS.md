# Sparovia V1 — WhatsApp, Social Links, and Contact Activity
## Locked Product and Technical Decisions

**Status:** LOCKED PRODUCT DECISIONS  
**Product:** Sparovia Client Pilot V1

## 1. Authority and Change Control

This document records the approved V1 behavior. It supplements, and does not silently replace, the existing source-of-truth documents.

Before implementation, inspect and reconcile:
- `PILOT_V1_PRODUCT_SPECIFICATION.md`
- `PILOT_V1_DOMAIN_DATA_MODEL.md`
- `PILOT_V1_IMPLEMENTATION_PLAN.md`
- `PILOT_V1_UX_SCREEN_SPECIFICATION.md`
- `PILOT_V1_API_SPECIFICATION.md`
- `DESIGN.md`
- Existing project rules, architecture documents, and actual code

If documents conflict with this decision:
1. Identify the exact conflict.
2. Preserve these approved product decisions unless the product owner changes them.
3. Make the smallest justified documentation changes.
4. Do not silently rewrite unrelated documentation.
5. Inspect the actual implementation before assuming a feature is present or absent.

No paid third-party provider, middleware, subscription, or API integration is approved. Direct platform APIs may incur charges and must not be assumed free. This scope uses outbound links and prefilled WhatsApp links; it does not authorize Meta API integration.

## 2. Product Intent

Sparovia remains a controlled, multi-tenant website management platform—not a website builder, full CRM, or social-media management suite.

Approved journey:

**Business Context → Client-configured contact templates and social URLs → Public website contact choices → Outbound click → Contact Activity**

Website form submissions remain genuine Leads. A contact click must never be represented as a confirmed enquiry.

## 3. WhatsApp: Client-Managed Template Choices

### 3.1 Admin configuration

Reuse the existing Admin settings and components where appropriate. The client can:
- Configure the business WhatsApp phone number.
- Create and edit **3–4 independent prefilled message templates**.
- Set each template's display title and message text.
- Reorder templates.
- Activate/deactivate each template.
- Preview the public choices and resulting message.
- Save using the existing configuration workflow.

Templates are written by the client. **AI-generated messages are not part of this feature.** Do not add AI generation, an AI provider, or a paid AI dependency.

Validate required fields and lengths using existing conventions. Validate/normalize the phone number safely. Encode message text correctly for a WhatsApp URL. Reject unsafe URL schemes and untrusted destinations.

### 3.2 Public website behavior

- Show the configured WhatsApp contact choices in the appropriate existing website contact area.
- Display only active, valid templates.
- Visitors may select **any template independently**; no prior template selection is required.
- Selecting a template opens WhatsApp for the tenant's configured business number with the selected message prefilled.
- The visitor decides whether to send the message.
- Do not claim that a message was sent, received, or that an enquiry was completed.
- If WhatsApp is not configured or no valid templates are active, do not render broken actions. Follow the existing safe fallback and make configuration state clear in Admin.
- Preserve existing contact sections and responsive/accessibility behavior.

These choices are not a sequential questionnaire, chatbot, automated reply flow, campaign, inbox, or conversation manager.

### 3.3 Completion semantics

Selecting a template or opening WhatsApp is **not** a completed lead. A simple outbound link cannot prove the visitor sent the message or that the business received it. Do not create/update a Lead or change Lead status/count because of a click.

## 4. Facebook and Instagram: Outbound Profile Links

For V1:
- Clients can configure Facebook page/profile and Instagram profile URLs using existing settings where possible.
- Public website links appear only when the URL is valid and enabled.
- Clicking redirects to the configured external profile.
- No social API connection, publishing, message capture, inbox, synchronization, or paid integration is included.
- Do not add LinkedIn, TikTok, YouTube, or other platforms unless existing approved scope already supports them or the product owner separately approves them.
- Validate URL scheme and destination. Prevent unsafe schemes and open redirects.
- Preserve working social-link behavior.

## 5. Contact Activity

### 5.1 Placement

Add lightweight activity tracking within existing Admin surfaces:
- Compact Contact Activity summary on the existing dashboard, if a suitable surface exists.
- Detailed Contact Activity within the existing Leads area or closest established navigation location.

Do not build a full analytics platform or CRM.

### 5.2 Events

Track observable activation of:
- WhatsApp template links (store template ID/title where useful; do not store the full message by default).
- Facebook profile links.
- Instagram profile links.

Use only minimum operational data:
- Tenant association resolved from trusted context.
- Channel: `WhatsApp`, `Facebook`, or `Instagram`.
- Event type such as `ContactLinkClicked`.
- Server timestamp.
- Page/source reference where available.
- WhatsApp template reference where applicable.
- Existing safe event/correlation identifier where useful.

Avoid unnecessary personal data, message content, fingerprinting, precise location, and persistent IP/user-agent storage unless an existing approved security policy requires it.

### 5.3 Separation from Leads

- Contact Activity is not a Lead.
- Outbound clicks must not increase confirmed lead counts.
- Website form submissions continue creating genuine Leads through the existing workflow.
- Incoming WhatsApp messages may create/update Leads only through a separately configured, verified incoming-message integration.
- A click-to-chat URL does not provide inbound message text, customer phone, send status, or conversation status.
- Admin labels and counts must clearly distinguish activity from enquiries.

### 5.4 Reliability and security

- Tracking is best-effort and must not block or materially delay external navigation.
- If tracking fails, the contact action must still work.
- Use existing validation, rate limiting/abuse controls, tenant isolation, and logging patterns.
- Never trust a client-supplied tenant ID as proof of ownership.
- Avoid invasive visitor identity tracking.

## 6. Multi-Tenant Security

- Every configuration and activity record belongs to the correct tenant.
- Resolve tenant context through existing trusted routing/authentication/public-site configuration.
- Enforce authorization server-side for Admin reads and writes.
- Public tracking must not rely on arbitrary caller-supplied tenant IDs.
- Prevent cross-tenant access to templates, numbers, URLs, or activity.
- Reuse existing entities, repositories, services, audit conventions, and API patterns where suitable.
- Do not introduce duplicate Leads infrastructure, WhatsApp conversation/message models, or generic analytics subsystems.

## 7. Existing Incoming WhatsApp Integration

Existing V1 documents describe incoming WhatsApp messages creating/updating Leads. This is distinct from outbound prefilled links.

Before changing it:
1. Inspect actual implementation and configuration.
2. Determine whether inbound integration is implemented, partial, or documentation-only.
3. Preserve working behavior.
4. Do not claim outbound link tracking implements inbound capture.
5. If absent, do not invent a paid provider or silently expand scope. Report the gap and preserve the existing contract unless separately approved.

## 8. UX and Design

Use `DESIGN.md` as the visual authority:
- Primary cobalt `#315FEA`
- Secondary purple `#7950B8`
- Primary text `#172033`
- Supporting text `#475569`
- Main surface `#FFFFFF`
- Supporting surface `#F3F6FA`
- Brand-tinted surface `#F5F0FB`
- Subtle border `#E3E7ED`
- Inter typography
- Simple line icons; no emoji icons
- No pill-shaped buttons
- No decorative purple gradients outside the approved wordmark treatment
- No fabricated metrics or fake activity
- Clean, responsive, accessible UI

Reuse existing tokens and shared components. Do not redesign the entire Admin Panel or website.

## 9. Acceptance Criteria

1. Admin can create/edit 3–4 client-authored templates.
2. Admin can activate/deactivate and order templates.
3. Public website displays only active valid templates.
4. Each template independently opens the correct WhatsApp number with correctly encoded text.
5. No sequential selection is required.
6. Facebook and Instagram redirect only to configured valid URLs.
7. Missing/invalid configuration does not create broken links.
8. Contact clicks are recorded as Contact Activity, not Leads.
9. Website form submissions continue creating Leads.
10. UI does not imply clicks prove messages were sent or enquiries completed.
11. Tracking failure does not block external navigation.
12. Tenant isolation is verified.
13. Existing incoming WhatsApp intake is preserved if implemented.
14. Relevant tests/builds run and actual results are reported.
15. Responsive, keyboard, and accessible states are reviewed.
16. No paid integration or out-of-scope feature is introduced.

## 10. Out of Scope

Unless separately approved:
- AI-generated templates
- WhatsApp Business/Cloud API or paid provider
- WhatsApp inbox, message history, automated replies, campaigns, or chatbots
- Facebook/Instagram API integration, social publishing, or DM capture
- Full CRM or analytics suite
- Sequential visitor questionnaires
- Additional social platforms
- Billing or unrelated redesign

**Decision status:** Locked for implementation planning. Any material deviation requires explicit product-owner approval.
