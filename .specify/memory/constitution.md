<!--
Sync Impact Report
- Version change: template → 1.0.0
- Modified principles:
  - Placeholder principle 1 → I. HTTP-Only State and In-Memory Lifecycle
  - Placeholder principle 2 → II. Type-Safe Contracts at the Boundary
  - Placeholder principle 3 → III. Deterministic Game Rules
  - Placeholder principle 4 → IV. Spec-First Incremental Delivery
  - Placeholder principle 5 → V. Verify, Review, and Bound AI Output
- Added sections: Architecture Constraints; Development Workflow
- Removed sections: none
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md
  - ✅ .specify/templates/tasks-template.md
- Deferred items: none
-->

# Scribble Constitution

## Core Principles

### I. HTTP-Only State and In-Memory Lifecycle
All room and game synchronization MUST use HTTP request/response and client polling.
No WebSockets, Socket.io, server-sent events, or other push channels are allowed.
The backend MUST keep room state in memory only, and inactive rooms MUST be
removed explicitly. This keeps the lab aligned with the starter architecture and
prevents hidden persistence or real-time complexity.

### II. Type-Safe Contracts at the Boundary
All new code and refactors MUST be fully typed in TypeScript. Request payloads
and externally consumed response shapes MUST be validated with Zod at the API
boundary. Avoid `any`; use `unknown` when data is truly dynamic. This reduces
runtime ambiguity and keeps backend and frontend contracts honest.

### III. Deterministic Game Rules
Room creation, host selection, player ordering, drawer assignment, word
selection, guess normalization, scoring, and restart behavior MUST be
deterministic and testable. Inputs MUST be trimmed before validation, and
guess checks MUST compare case-insensitively and consistently. Do not introduce
random rounds, timers, or other game mechanics unless a spec explicitly adds
them. Determinism is required so the game can be verified across browser tabs
and repeated runs.

### IV. Spec-First Incremental Delivery
Behavior changes MUST start with updated specification, plan, and tasks
artifacts before implementation. Each story slice MUST be independently
testable, small enough to review, and mapped to real files and endpoints. No
speculative architecture, no feature creep, and no hidden scope additions.
This keeps the lab teachable and the diff auditable.

### V. Verify, Review, and Bound AI Output
Treat AI-generated code and analysis as untrusted until reviewed against the
spec and the repo. Before declaring a change complete, verify the affected flow
locally, including cross-tab or multi-tab checks for polling-driven state.
Surface assumptions explicitly, stop when the spec is unclear, and commit only
granular, meaningful changes. Review discipline is mandatory because the
assistant can be wrong in subtle ways.

## Architecture Constraints

- The project MUST stay within the existing frontend/backend split and the
  current stack: Express, React 18, React Router v6, Vite, TypeScript, and Zod.
- Do not add databases, authentication, sessions, or new real-time transport
  layers.
- Frontend shared room state SHOULD stay in the established `src/state` pattern,
  and styling SHOULD remain in `app.css` or CSS modules.
- Prefer minimal, in-place changes over new abstraction layers. Remove dead
  state and inactive rooms when they are no longer needed.

## Development Workflow

- Inspect existing files before changing behavior.
- Update spec artifacts before implementing new behavior, and keep them in sync
  with the code.
- Validate user-facing flows with the browser and the backend API; polling
  features MUST be checked in more than one tab.
- Use the repo commit prefixes: `feat:`, `fix:`, `docs:`, `style:`,
  `refactor:`, `test:`, `chore:`.
- When guidance conflicts, this constitution wins.

## Governance
This constitution overrides conflicting guidance in README files, agent notes,
and template text. Amendments require a constitution update plus any dependent
Spec Kit template updates in the same change. Versioning follows semantic
rules: MAJOR for incompatible principle changes or removals, MINOR for new
principles or materially expanded guidance, PATCH for clarifications or
wording fixes. Every review MUST check compliance with the five core principles
and call out any exception with a rationale.

**Version**: 1.0.0 | **Ratified**: 2026-06-04 | **Last Amended**: 2026-06-04
