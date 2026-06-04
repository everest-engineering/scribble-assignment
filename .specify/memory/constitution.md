<!--
  Sync Impact Report
  Version change: (new) 0.0.0 → 1.0.0
  Modified principles: N/A (initial creation)
  Added sections: Core Principles (5), Technology Stack, Development Workflow, Governance
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ Already aligned (Constitution Check section exists)
    - .specify/templates/spec-template.md ✅ Already aligned
    - .specify/templates/tasks-template.md ✅ Already aligned
  Follow-up TODOs: None
-->

# Scribble Constitution

## Core Principles

### I. TypeScript-First & Type Safety
All code MUST be fully typed with no use of `any`. Dynamic types MUST use
`unknown` with proper narrowing. Zod MUST be used for every request payload
and response validation on the backend. Type safety is a non-negotiable
quality gate — no exception without explicit design review.
Rationale: Catches contract violations at compile time rather than runtime,
which is critical for a polling-based multiplayer game where state
consistency is paramount.

### II. Constraint-Driven Architecture
Three hard constraints MUST NOT be violated:
- NO WebSockets, Socket.io, or any real-time push protocol — all sync MUST
  use HTTP polling.
- NO databases (SQL, NoSQL, SQLite, etc.) — all data MUST be in-memory only.
- NO authentication, sessions, JWT, or OAuth.
Any design or implementation that violates these constraints MUST be
rejected regardless of convenience.
Rationale: These constraints keep the project deployable as a single,
zero-dependency server that any contributor can run instantly.

### III. Fail-Fast Error Handling
Backend MUST use centralized error handlers that catch and respond with
consistent error shapes. Frontend MUST catch all API exceptions without
crashing the UI. User-facing errors MUST be clear and actionable. Empty
or invalid inputs MUST be rejected at the validation layer before reaching
business logic.
Rationale: In a polling architecture, silent failures cause confusing
stale-state bugs. Fast, visible failures make debugging and testing
straightforward.

### IV. Immutable & Minimal State
State MUST be treated as immutable — use read-only types and pure
reducers/transformers where possible. In-memory stores MUST clean up
inactive rooms to keep memory footprint minimal. State projections
(RoomSnapshot) MUST be derived, not duplicated.
Rationale: Multiplayer game state is shared and mutated by multiple
participants. Immutability prevents accidental cross-request contamination
in the single-server model.

### V. Modular Separation of Concerns
Backend layering MUST follow strict dependency direction:
`models/` → `services/` → `api/`. Services encapsulate business logic;
API layer handles HTTP concerns only. Frontend MUST separate pages,
state, and API services into distinct directories. Components MUST be
functional with hooks. Cross-layer imports in the wrong direction are a
design violation.
Rationale: Clear layering makes the codebase navigable for new
contributors and keeps each unit independently testable.

## Technology Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript (strict mode), ES Modules
- **Backend**: Express, Zod validation, tsx for development execution
- **Frontend**: React 18, React Router 6, Vite, TypeScript
- **Testing**: Vitest (both backend and frontend)
- **Formatting/Linting**: Prettier + ESLint (TypeScript-aware config)
- **No external state services**: No databases, no caches, no message queues

## Development Workflow

- Features are developed on dedicated branches following the pattern
  `feat/<feature-name>`.
- Spec-first: each feature MUST have a spec, plan, and tasks before
  implementation begins.
- Tests MUST be written before implementation for any behavior with
  defined acceptance criteria.
- All changes MUST pass TypeScript compilation (`tsc --noEmit`) and
  existing tests before merge.
- Commits should be atomic and descriptive — one logical change per
  commit.

## Governance

This constitution supersedes ad-hoc practices. Amendments require:
1. A documented proposal in the feature spec or a dedicated governance
   document.
2. Review and approval by at least one other contributor.
3. A version bump following semver (MAJOR for incompatible principle
   changes, MINOR for new principles, PATCH for clarifications).
4. All PRs and reviews MUST verify compliance with the current
   constitution. Complexity introductions beyond what the principles
   permit MUST be justified in the plan's Complexity Tracking section.

**Version**: 1.0.0 | **Ratified**: 2026-06-04 | **Last Amended**: 2026-06-04
