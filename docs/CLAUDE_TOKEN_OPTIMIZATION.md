# CLAUDE_TOKEN_OPTIMIZATION.md

## Purpose

Use this document as a mandatory execution rule when Claude/Antigravity is implementing Sparovia.

The goal is to reduce unnecessary token usage while keeping implementation quality, production readiness, and project alignment.

## Core Rule

Do not spend tokens explaining what can be verified directly.

Prioritize:

1. Inspect only what is required.
2. Reuse existing implementation.
3. Modify only necessary files.
4. Implement the requested scope.
5. Verify the result.
6. Report only the important outcome.

Do not generate long explanations, repeated summaries, or speculative architecture.

## Documentation Reading

Do NOT read every project document for every task.

First identify which documents are relevant to the current task.

Use this priority:

- Product decision → relevant vision / product documents
- UI work → design system + current implementation
- Backend work → architecture + current backend implementation
- Database work → architecture + current migrations/schema
- AI work → AI architecture + provider rules
- WhatsApp work → communication requirements + business context
- Google Business work → business presence requirements

Read only the required sections when possible.

Do not repeatedly reread documents that have not changed.

## Existing Code

Before creating anything:

1. Search for the existing implementation.
2. Reuse it if it already satisfies the requirement.
3. Modify it only when necessary.

Do NOT:

- Recreate existing components
- Create duplicate services
- Create duplicate entities
- Create duplicate API clients
- Create duplicate configuration
- Create duplicate database models
- Rewrite working code unnecessarily

## File Inspection

Do not read entire large files when only one section is required.

Prefer:

- Search
- Targeted file reading
- Relevant functions/components
- Relevant configuration sections

Only read the full file when its overall structure is necessary.

## Search Strategy

Use targeted searches.

Prefer:

`Search "BusinessProfile"`

over:

`Search the entire repository for everything related to Business`

Search exact symbols, filenames, routes, entities, and configuration names first.

Expand the search only if the result is insufficient.

## Implementation Strategy

Work in small implementation units.

Use:

```text
Inspect
↓
Plan internally
↓
Implement
↓
Verify