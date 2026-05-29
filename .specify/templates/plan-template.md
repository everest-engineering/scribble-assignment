# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [TypeScript with Node.js/React versions or NEEDS CLARIFICATION]

**Primary Dependencies**: [Express, Zod, React, React Router, Vite, existing packages or NEEDS CLARIFICATION]

**Storage**: [In-memory backend room state only, or N/A]

**Testing**: [Backend/frontend build, focused tests, two-tab browser validation, or NEEDS CLARIFICATION]

**Target Platform**: [Local browser plus Node.js backend or NEEDS CLARIFICATION]

**Project Type**: [Web app: React frontend + Express backend]

**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]

**Constraints**: [Polling-only sync, in-memory state, no auth/database/WebSockets, or NEEDS CLARIFICATION]

**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Brownfield Extension**: Plan identifies existing backend/frontend files to extend
  and documents why no rewrite or unrelated refactor is needed.
- **Full-Stack Input Validation**: Plan lists frontend validation behavior and backend
  request validation for every user-controlled value.
- **Polling-Only Synchronization**: Plan uses HTTP polling only, documents polling
  cadence, and includes timer cleanup/lifecycle notes.
- **Simple Implementation**: Plan keeps backend state in memory, avoids prohibited
  infrastructure, and records any complexity in the Complexity Tracking table.
- **Specification Traceability**: Each planned change maps to a user story,
  functional requirement, or acceptance scenario from `spec.md`.
- **Human Review of AI Output**: Plan includes the manual review and validation steps
  required before accepting AI-generated artifacts or code.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
