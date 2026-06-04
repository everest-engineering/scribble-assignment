<!--
Sync Impact Report
Version change: none -> 1.0.0
Modified principles: none -> added Node.js 18 runtime, React functional components, short-polling sync, in-memory only storage, strict input validation
Added sections: Technology & Deployment Constraints, Development Workflow & Compliance
Removed sections: none
Templates requiring updates: ✅ .specify/templates/plan-template.md, ✅ .specify/templates/spec-template.md, ✅ .specify/templates/tasks-template.md
Follow-up TODOs: none
-->

# Scribble Constitution

## Core Principles

### I. Node.js 18 Runtime Stability
All backend and tooling MUST target Node.js 18. Runtime compatibility, dependency selection, and CI MUST validate against Node.js 18, preventing upgrades to experimental Node versions until explicitly ratified.

### II. React Functional Components Only
Frontend components MUST use React functional components and hooks. Class components, legacy lifecycle methods, and non-functional React paradigms are prohibited to maintain predictable state and modern React practices.

### III. Short-Polling Sync with 2-Second Maximum
Client-server synchronization MUST use HTTP polling only, with a maximum interval of 2 seconds. WebSockets, Socket.io, SSE, and any push-based realtime transport are forbidden.

### IV. In-Memory Only Storage; No Databases
All persistent or transient game state MUST be stored in-memory only. Database integrations of any kind are forbidden. State must be explicitly managed and cleared when rooms expire.

### V. Strict Input and Name Validation
All external input, including room names, player names, guesses, and API request payloads, MUST be validated before use. Use schema validation to reject invalid values and return explicit error responses rather than allowing unsafe application state.

## Technology & Deployment Constraints
This repository MUST stay within the documented stack:
- Node.js 18 for backend execution and CLI tooling
- TypeScript for backend and frontend code
- React 18 frontend with functional components and hooks
- HTTP polling only, maximum 2-second interval
- No WebSockets, no database layer, no authentication systems
- In-memory room state only, with explicit cleanup of inactive rooms

## Development Workflow & Compliance
Development MUST follow these rules:
- All new code paths MUST include validation guards and clear error handling
- PRs MUST verify compliance with runtime, polling, storage, and validation rules
- Testing MUST cover API schema validation, room lifecycle boundaries, and polling behavior
- Complexity MUST be justified in PR descriptions when deviating from the simplest valid implementation

## Governance
This constitution is the authoritative source for repository-specific technical constraints and development discipline. Amendments require:
- a documented change in `.specify/memory/constitution.md`
- an explicit rationale describing why the existing runtime, stack, or safety constraints must change
- review and approval by the active maintainers of this repository

**Version**: 1.0.0 | **Ratified**: 2026-06-05 | **Last Amended**: 2026-06-05

