<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0 (MINOR: added explicit out-of-scope catalogue)
- Modified principles:
  - I. HTTP-Only State and In-Memory Lifecycle — unchanged
  - II. Type-Safe Contracts at the Boundary — unchanged
  - III. Deterministic Game Rules — unchanged
  - IV. Spec-First Incremental Delivery — unchanged
  - V. Verify, Review, and Bound AI Output — unchanged
- Added sections:
  - VI. Explicit Out-of-Scope Boundaries (new principle)
  - Architecture Constraints: expanded with out-of-scope list reference
- Removed sections: none
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md (Constitution Check section updated)
  - ✅ .specify/templates/spec-template.md (Assumptions scaffold updated)
  - ✅ .specify/templates/tasks-template.md (Notes section updated)
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

### VI. Explicit Out-of-Scope Boundaries
The following items are PERMANENTLY out of scope for this lab. They MUST NOT
appear in any spec, plan, task list, or implementation — not even as future
work stubs unless a new constitution amendment explicitly adds them.

**Technical out-of-scope:**
- WebSockets, Socket.io, server-sent events, or any real-time push protocol
- Databases or persistent storage of any kind (SQL, NoSQL, SQLite, files)
- Authentication, accounts, sessions, JWT, or OAuth
- Deployment pipelines, hosting configuration, or CI/CD
- Docker, containerization, or infrastructure-as-code
- New state-management libraries (beyond Zustand/Context already in the starter)
- New routing libraries (beyond React Router v6 already in the starter)

**Game feature out-of-scope:**
- Multiple rounds or round management
- Drawer rotation logic
- Round timers or countdown mechanics
- Speed bonuses or drawer bonuses
- Custom or random word packs
- Spectator mode
- Room moderation (kick, mute, ban)
- Room passwords or invite links

**Process out-of-scope:**
- Rewriting the starter from scratch — extend, do not replace
- Adding top-level dependencies not justified by the current spec
- Refactoring code unrelated to the current feature

Any spec, plan, or task that references an item from this list MUST be rejected
or revised before implementation begins.

## Architecture Constraints

- The project MUST stay within the existing frontend/backend split and the
  current stack: Express, React 18, React Router v6, Vite, TypeScript, and Zod.
- Do not add databases, authentication, sessions, or new real-time transport
  layers. (See Principle VI for the complete out-of-scope list.)
- Frontend shared room state SHOULD stay in the established `src/state` pattern,
  and styling SHOULD remain in `app.css` or CSS modules.
- Prefer minimal, in-place changes over new abstraction layers. Remove dead
  state and inactive rooms when they are no longer needed.
- Do not add top-level `npm` dependencies unless the current spec explicitly
  requires them and no existing package covers the need.

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
wording fixes. Every review MUST check compliance with the six core principles
and call out any exception with a rationale.

**Version**: 1.1.0 | **Ratified**: 2026-06-04 | **Last Amended**: 2026-06-04
