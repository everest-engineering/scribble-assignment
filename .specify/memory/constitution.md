<!--
SYNC IMPACT REPORT
Version change: (template) → 1.0.0
Added sections: Core Principles (I–V), Hard Constraints, AI Usage & Review Discipline, Governance
Removed sections: N/A (initial population from template)
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ Constitution Check section aligns with principles
  - .specify/templates/spec-template.md ✅ No mandatory sections conflict with constitution
  - .specify/templates/tasks-template.md ✅ Task categories align with principle-driven discipline
Deferred TODOs: none
-->

# Scribble Constitution

## Core Principles

### I. TypeScript First (NON-NEGOTIABLE)

All source files — backend and frontend — MUST be written in TypeScript with strict
type-checking enabled. Use of `any` is forbidden; use `unknown` when a type is
genuinely dynamic and narrow it before use. Every function parameter, return value,
and exported symbol MUST carry an explicit or inferable type. The TypeScript compiler
MUST emit zero errors before any change is committed.

**Rationale**: Type safety is the primary mechanism for catching integration bugs
between the frontend API client, backend route handlers, and in-memory state. In a
codebase with no database schema to enforce contracts, TypeScript types ARE the
schema.

### II. In-Memory Only — No Databases, No Persistence

All game and room state MUST be stored exclusively in the backend process memory
using plain JavaScript objects and arrays. No SQL, NoSQL, SQLite, file-system
persistence, or any other durable store is permitted. Restarting the backend MUST
clear all state completely.

**Rationale**: The lab is scoped to focus on game logic and API design, not
infrastructure. Introducing persistence would add complexity outside the learning
objectives and violate the explicit lab boundary.

### III. HTTP Polling Only — No Real-Time Push

All client-server synchronisation MUST use periodic HTTP polling. WebSockets,
Server-Sent Events, Socket.io, long-polling, and any other push or streaming protocol
are strictly forbidden. The lobby MUST poll at approximately 2-second intervals.

**Rationale**: The lab explicitly prohibits real-time protocols. Polling keeps the
implementation deterministic and easy to reason about within the scope of the
assignment.

### IV. Validate at Boundaries with Zod

Every external input — HTTP request bodies, query parameters, and API response
shapes consumed by the frontend — MUST be validated using Zod schemas defined in
`src/api/schemas.ts`. Validation MUST fail fast with a descriptive error (HTTP 400)
before the request reaches service or model logic.

**Rationale**: Zod is already present in the stack. Centralising validation at the
API boundary prevents invalid state from propagating into the in-memory store and
keeps service logic free of defensive type-narrowing.

### V. Incremental, Spec-Driven Implementation

Each feature slice MUST be specified before it is implemented. Implementation MUST
NOT begin until the relevant acceptance criteria in the spec are written and agreed.
Work MUST proceed scenario by scenario (Scenario 1 → 2 → 3 → 4) and each scenario
MUST pass its acceptance criteria before the next scenario begins. AI-generated code
MUST be reviewed, understood, and verified against the spec before committing.

**Rationale**: The lab is explicitly evaluated on artifact quality and
implementation traceability. Generating code ahead of a spec produces drift that is
difficult to untangle under time pressure.

## Hard Constraints

The following are unconditional. They MAY NOT be overridden by any feature spec,
plan, or AI suggestion.

- **No authentication, sessions, JWT, or OAuth.** Player identity is name only,
  scoped to a room session.
- **No new state-management or routing libraries.** Use only what the starter
  already provides (React state/context, React Router v6, Zustand if already
  present).
- **No unjustified top-level dependencies.** Adding a new npm dependency requires
  explicit justification in the plan and MUST NOT duplicate functionality already
  available in the starter.
- **No rewriting the starter from scratch.** All implementation MUST be brownfield
  additions or targeted edits to existing files.
- **No out-of-scope features.** Timers, countdowns, multiple rounds, drawer
  rotation, spectator mode, room passwords, and all other items listed as out-of-scope
  in the README MUST NOT be built.

## AI Usage & Review Discipline

- AI-generated code MUST be read and understood before it is committed. "Accept all"
  without review is not permitted.
- Every AI suggestion MUST be checked against the current spec and constitution
  before application.
- If AI output conflicts with a Hard Constraint or Core Principle, the constraint
  wins. Discard or rewrite the conflicting output.
- Commits MUST be granular and attributable to a specific task from the task list.
  Bulk commits that mix multiple unrelated changes are not permitted.
- Discovery notes, spec updates, and plan updates MUST precede the corresponding
  implementation commit, not follow it.

## Governance

This constitution supersedes all other development practices for the Scribble lab.
Amendments MUST be documented as a new constitution version with a bump rationale
and committed with message format: `docs: amend constitution to vX.Y.Z (<reason>)`.

Version increments follow semantic versioning:
- MAJOR: Removal or redefinition of a Core Principle or Hard Constraint.
- MINOR: New principle, section, or materially expanded guidance added.
- PATCH: Clarifications, wording fixes, non-semantic refinements.

All PRs MUST include a constitution compliance check confirming no principle is
violated. Complexity introduced beyond spec scope MUST be justified or reverted.

**Version**: 1.0.0 | **Ratified**: 2026-06-02 | **Last Amended**: 2026-06-02
