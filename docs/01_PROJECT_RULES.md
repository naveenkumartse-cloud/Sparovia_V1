# Sparovia — Project Rules

> **Status: LOCKED**
>
> These rules apply to the entire Sparovia project and must be followed by every developer, AI assistant, coding agent, and implementation tool.

---

## 1. Purpose

This document defines the non-negotiable rules for building Sparovia.

The purpose is to ensure that Sparovia:

- Remains aligned with the approved product vision
- Avoids unnecessary scope expansion
- Preserves existing working functionality
- Uses a production-ready architecture
- Remains multi-tenant from the foundation
- Keeps AI controlled and provider-independent
- Maintains a premium user experience
- Can evolve without requiring unnecessary rewrites

These rules apply throughout the entire project lifecycle.

---

# 2. Product Definition Rule

Sparovia is a:

> **Multi-tenant business experience and intelligence platform.**

Sparovia helps businesses establish, manage, and improve:

- Digital presence
- Website experience
- Business information
- Leads
- Customers
- Communications
- Business knowledge
- Business workflows
- Intelligence
- Recommendations
- Controlled automation

Sparovia is not simply an Admin Panel.

The Admin Panel is one interface through which the Sparovia platform is operated.

---

# 3. What Sparovia Is NOT

The following are explicitly prohibited as the core product direction.

Sparovia must NOT become:

- An AI website generator
- An unrestricted website builder
- A Wix clone
- A Webflow clone
- A Framer clone
- A WordPress clone
- A generic drag-and-drop page builder
- A proprietary LLM platform
- An uncontrolled autonomous AI system
- A collection of unrelated AI features

Future capabilities must remain aligned with the core Sparovia business-platform vision.

---

# 4. Single Source of Truth

The `/docs` directory is the project's primary product and architecture documentation source.

Before implementing a major feature, the implementation agent must review the relevant documentation.

The documentation set is:

```text
docs/
├── README.md
├── 01_PROJECT_RULES.md
├── 02_VISION.md
├── 03_MVP_PRD.md
├── 04_USER_FLOW.md
├── 05_AI_FEATURES.md
├── 06_DESIGN_SYSTEM.md
├── 07_MASTER_BUILD_PROMPT.md
├── 08_MASTER_PLATFORM_ARCHITECTURE.md
├── 09_IMPLEMENTATION_ROADMAP.md
├── 10_CURRENT_PROJECT_STATUS.md
└── 11_ANTIGRAVITY_CONTEXT.md