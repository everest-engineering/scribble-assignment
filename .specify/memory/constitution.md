<!--
Sync Impact Report
- Version change: none → 1.0.0
- Modified principles: placeholder template → quality, testing, UX, security, performance
- Added sections: Implementation Constraints; Review Process
- Removed sections: none
- Templates reviewed: .specify/templates/spec-template.md (generic placeholder, no update required), .specify/templates/plan-template.md (generic placeholder, no update required), .specify/templates/tasks-template.md (generic placeholder, no update required)
- Follow-up TODOs: none
-->

# Scribble Starter Constitution

## Core Principles

### I. Type-Safe Quality First
Every feature and refactor MUST be implemented with strict TypeScript typing, clear separation of concerns, and maintainable structure. Backend logic belongs in `backend/src/services` and `backend/src/models`; frontend behavior belongs in `frontend/src/components`, `frontend/src/pages`, and `frontend/src/services`. Avoid `any`; use `unknown` only when external input is validated before use.

### II. Test-Driven Validation
Every new behavior MUST be covered by automated tests before its implementation is accepted. Use Vitest for unit and integration tests across both backend and frontend. Critical flows like room creation, join validation, lobby polling, and error handling MUST have tests that deliberately fail before the corresponding code is written.

### III. UX Consistency and Deterministic Feedback
The user interface MUST present consistent states and deterministic feedback across room setup, lobby, and game flows. Controls and messages MUST only appear when their actions are valid. Loading, error, and empty states MUST be explicit so users never encounter ambiguous or stale information.

### IV. Secure-by-Design Inputs
Backend APIs MUST treat all external data as untrusted and validate every request payload with Zod schemas. Every route MUST reject malformed or out-of-scope input with safe error responses. Even without authentication, room isolation, trimmed non-empty names, and valid room codes MUST be enforced server-side.

### V. Performance with Minimal Overhead
The system MUST remain responsive on the starter architecture. Keep backend room operations lightweight and frontend renders efficient. Use HTTP polling deliberately for shared state sync and avoid unnecessary fetches, extra re-renders, or heavyweight runtime abstractions.

## Implementation Constraints
This repository follows the starter architecture and explicit lab constraints.
- Use TypeScript + Express on the backend and React + Vite on the frontend.
- Keep room state in-memory only; backend restarts may clear all rooms.
- Do not add WebSockets, Socket.io, databases, authentication, sessions, or any persistent storage.
- Use HTTP polling for shared state refresh; do not introduce real-time push protocols.
- Preserve the existing REST contract and UI routing patterns unless a feature requirement explicitly demands an intentional change.

## Review Process
- Every pull request MUST verify compliance with these principles before merge.
- Reviewers MUST confirm type safety, test coverage, UX state clarity, input validation, and performance impact for changed behavior.
- Any deviation from these principles MUST be documented in the PR and justified by the implementation notes.
- Acceptance requires green tests for modified backend/frontend behavior and validation of the affected user flows in at least one browser tab.

## Governance
This constitution is the authoritative engineering guide for this repository. Amendments require a documented pull request that updates this file, explains the rationale, and adjusts any impacted spec or plan artifacts.
- Patch: wording clarifications or non-behavioral refinements.
- Minor: adding a principle, adding a section, or materially expanding review requirements.
- Major: redefining or removing a principle in a way that changes development expectations.

All PRs MUST confirm compliance with this constitution in the review checklist and cite the latest version.

**Version**: 1.0.0 | **Ratified**: 2026-05-30 | **Last Amended**: 2026-05-30
