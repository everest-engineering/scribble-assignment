<!--
Sync Impact Report:
- Version change: Initial -> 1.0.0
- Principles added: I. TypeScript-First & Coding Standards, II. Architecture & State Constraints, III. Security & Validation, IV. Testing & Code Quality, V. Error Handling & Observability
- Added sections: Workflow & Collaboration Standards, Out of Scope Items (Non-Negotiable)
- Removed sections: None
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md
  - ✅ .specify/templates/spec-template.md
  - ✅ .specify/templates/tasks-template.md
- Follow-up TODOs: None
-->
# Scribble Starter Constitution

## Core Principles

### I. TypeScript-First & Coding Standards
All new code MUST be fully typed in TypeScript. Avoid `any`; use `unknown` if a type is truly dynamic. Immutability is preferred; use pure functions where possible. Adhere strictly to the established React hook patterns on the frontend and Express paradigms on the backend.

### II. Architecture & State Constraints
Strict adherence to the monolithic backend/frontend split. The backend handles HTTP polling-based requests (no WebSockets). All application state MUST reside in-memory on the backend; no databases (SQL/NoSQL/SQLite) are permitted. Keep the memory footprint for active game rooms minimal and explicitly remove inactive rooms.

### III. Security & Validation
All request payloads and responses MUST be validated using `Zod` to ensure strict contract enforcement. Since there is no Authentication (no sessions, JWT, OAuth), rely entirely on room code isolation and state validation to prevent malicious input. Cross-site scripting (XSS) MUST be mitigated by properly escaping outputs, especially user guesses and names.

### IV. Testing & Code Quality
Automated verification SHOULD cover boundary conditions (empty inputs, case-insensitive checks). New features MUST be broken into testable tasks. All code changes SHOULD maintain internal consistency and traceability from specification to implementation.

### V. Error Handling & Observability
Fail fast and gracefully. Centralize error handlers on the backend so clients receive consistent, actionable error payloads. The frontend MUST catch API exceptions so the UI does not crash, providing clear feedback to the user. Use structured logging for easy debuggability.

## Workflow & Collaboration Standards

- **Git Workflow:** Feature branches MUST be created from the `scribble-lab` branch (not `main`). Use granular, meaningful commits.
- **Code Review:** The PR diff is what reviewers will assess. Reviewers MUST check traceability to the specification and testability.
- **Performance/Scalability Guidelines:** Keep the memory footprint minimal. The frontend MUST implement efficient polling (~2s intervals) to simulate real-time updates without overwhelming the server.
- **CI/CD:** Builds MUST be validated locally using `npm run build` in both frontend and backend before committing.

## Out of Scope Items (Non-Negotiable)

The following are strictly out of scope and MUST NOT be built:
- WebSockets or real-time sync (use HTTP polling only).
- Databases or persistent storage (use in-memory backend only).
- Authentication, accounts, sessions, or moderation features (kick/mute).
- Deployment, hosting, CI, or Docker work.
- New state-management or routing libraries outside the starter's defaults.
- Complex gameplay extensions: multiple rounds, drawer rotation, timers, custom word packs.

## Governance

This constitution supersedes standard AI or coding guidelines. Spec Kit artifacts (constitution, specify, plan, tasks) MUST remain internally consistent. Amendments to this constitution require justification and version incrementing following Semantic Versioning (MAJOR.MINOR.PATCH).

**Version**: 1.0.0 | **Ratified**: 2026-05-29 | **Last Amended**: 2026-05-29
