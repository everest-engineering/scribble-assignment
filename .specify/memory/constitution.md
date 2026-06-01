<!-- 
SYNC IMPACT REPORT
Version: 1.0.0 (new constitution, no prior version)
Modified Principles: N/A (first version)
Added Sections: Technology Constraints, Development & Code Quality
Removed Sections: N/A
Templates Updated: Pending review of plan-template.md, spec-template.md, tasks-template.md, and all command files
Follow-up TODOs: None at this time
-->

# Scribble Constitution

## Core Principles

### I. TypeScript First (Non-Negotiable)
All new code and refactors MUST be fully typed in TypeScript. Avoid `any`; use `unknown` only when a type is truly dynamic and cannot be inferred. TypeScript provides the foundation for maintainability, IDE support, and compile-time error catching essential to a distributed multiplayer game system.

### II. Test-First Development (Non-Negotiable)
Tests MUST be written before implementation (TDD). The Red-Green-Refactor cycle is strictly enforced:
- User requirements and acceptance criteria documented
- Test cases written and fail (Red)
- Implementation code written to pass tests (Green)
- Code refactored for clarity and consistency (Refactor)

This ensures correctness, reduces regressions, and provides a safety net for game logic modifications.

### III. Immutability & Pure Functions
Prefer immutable data structures and pure functions. State mutations MUST be explicit and localized. This principle reduces side effects, makes reasoning about game state deterministic, and simplifies debugging of concurrent player interactions.

### IV. Error Handling: Fail Fast & Gracefully
On the backend, errors MUST be caught at the earliest point and handled via centralized error handlers. On the frontend, the UI MUST NOT crash on API exceptions; instead, display user-friendly error messages. Game state consistency MUST be maintained even when network or server errors occur.

### V. Strict Backend & Frontend Architecture
- **Backend** (`/backend`): Validation (Zod), Routes (api/), Business Logic (services/), Data Models (models/)
- **Frontend** (`/frontend`): React functional components with strict hooks, routing via react-router-dom v6, state in `/state` (e.g., Zustand, Context API), styling in `app.css` or CSS modules

These separations ensure testability, maintainability, and clear responsibility boundaries.

## Technology Constraints

The following are non-negotiable architectural constraints:

- **No WebSockets**: All synchronization between players MUST use HTTP polling. No Socket.io, real-time push, or bidirectional streaming.
- **No Databases**: All game state and room data MUST be stored in-memory only. No SQL, NoSQL, SQLite, or any persistent storage.
- **No Authentication**: No authentication systems, sessions, JWT, or OAuth. All rooms are public and identified by code only.

These constraints ensure the system remains lightweight, testable, and focused on game mechanics.

## Development & Code Quality

- **Validation**: Use Zod for all request payload and response validations on the backend.
- **State Management**: Keep memory footprint for active game rooms minimal. Explicitly remove inactive rooms to prevent leaks.
- **Code Organization**: Follow established patterns in `roomStore.ts`, `api.ts`, and component structure. No deviation without architectural review.
- **Styling**: All CSS belongs in `app.css` or CSS modules; keep components structurally clean and presentation-agnostic.
- **Imports**: Use standard relative and absolute ES module imports. In the backend, file extensions are omitted or handled via `.js` standard per Node.js convention.

## Governance

This Constitution supersedes all other practices and guidelines. It is the source of truth for development decisions on the Scribble project.

**Amendment Process**: Changes to this document MUST be documented with rationale. Major principle changes require review of downstream templates (plan-template.md, spec-template.md, tasks-template.md) and all dependent guidance files to ensure consistency.

**Compliance Review**: Before each release, all code MUST be verified against these principles. Pull requests MUST reference which principles they uphold or why they defer to practical constraints.

**Version Semantics**:
- MAJOR: Backward-incompatible principle removal or redefinition
- MINOR: New principle, section, or materially expanded guidance
- PATCH: Clarifications, wording, typo fixes, non-semantic refinements

**Runtime Guidance**: Developers MUST consult [AGENTS.md](AGENTS.md) for specific implementation patterns, command references, and TypeScript/React idioms aligned with this Constitution.

---

**Version**: 1.0.0 | **Ratified**: 2026-05-29 | **Last Amended**: 2026-05-29
