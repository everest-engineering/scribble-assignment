# Scribble Constitution

## Core Principles

### I. TypeScript-First & Type Safety
All code MUST be fully typed with no use of `any`. Dynamic types MUST use
`unknown` with proper narrowing. Zod MUST be used for every request payload
and response validation on the backend. Type safety is a non-negotiable
quality gate.

### II. Constraint-Driven Architecture
Three hard constraints MUST NOT be violated:
- NO WebSockets, Socket.io, or any real-time push protocol — all sync MUST
  use HTTP polling.
- NO databases (SQL, NoSQL, SQLite, etc.) — all data MUST be in-memory only.
- NO authentication, sessions, JWT, or OAuth.

### III. Fail-Fast Error Handling
Backend MUST use centralized error handlers that catch and respond with
consistent error shapes. Frontend MUST catch all API exceptions without
crashing the UI. Empty or invalid inputs MUST be rejected at the validation
layer before reaching business logic.

### IV. Immutable & Minimal State
State MUST be treated as immutable — use read-only types and pure
reducers/transformers where possible. In-memory stores MUST clean up
inactive rooms. State projections (RoomSnapshot) MUST be derived, not
duplicated.

### V. Modular Separation of Concerns
Backend layering: `models/` → `services/` → `api/`. Frontend: separate
pages, state, and API services. Components MUST be functional with hooks.

## Technology Stack
- **Runtime**: Node.js 20+, TypeScript strict, ES Modules
- **Backend**: Express, Zod validation, tsx for dev
- **Frontend**: React 18, React Router 6, Vite, TypeScript
- **Testing**: Vitest (backend + frontend)

### VI. AI-Assisted Development Discipline
+ AI tools (coding assistants, code generators) MAY be used to accelerate
+ development, subject to the following constraints:
+ - Every AI-generated code change MUST be reviewed by a human for correctness,
+   security, and alignment with the constitution before committing.
+ - AI MUST NOT be instructed to bypass, remove, or ignore any of the hard
+   constraints in Section II (no WebSockets, no databases, no auth).
+ - AI-generated code MUST follow the same type-safety, error-handling, and
+   architectural standards as human-written code.
+ - The human developer retains full responsibility for all code committed,
+   regardless of its origin.

## Governance
This constitution supersedes ad-hoc practices. Amendments require:
1. A documented proposal.
2. Review by at least one other contributor.
3. A semver version bump.
4. All PRs MUST verify compliance.

**Version**: 1.0.0 | **Ratified**: 2026-06-04 | **Last Amended**: 2026-06-04
