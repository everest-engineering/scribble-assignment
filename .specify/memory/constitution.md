<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- Placeholder Principle 1 -> I. Scenario-Scoped Incremental Delivery
- Placeholder Principle 2 -> II. Type-Safe API and State Contracts
- Placeholder Principle 3 -> III. Polling-Only, In-Memory Multiplayer Rules
- Placeholder Principle 4 -> IV. Verification Before Progression
- Placeholder Principle 5 -> V. Brownfield Discipline and Minimal Surface Area
Added sections:
- Operational Constraints
- Delivery Workflow and Review Gates
Removed sections:
- None
Templates requiring updates:
- ✅ .specify/templates/plan-template.md
- ✅ .specify/templates/spec-template.md
- ✅ .specify/templates/tasks-template.md
- ✅ README.md
- ⚠ pending .specify/templates/commands/ (directory does not exist in this repository)
Follow-up TODOs:
- None
-->
# Scribble Constitution

## Core Principles

### I. Scenario-Scoped Incremental Delivery
Every change MUST map to a concrete business scenario or user story and remain
independently testable. Specs, plans, tasks, and implementation MUST preserve
the README checkpoint order: room setup and lobby, game start and drawer flow,
gameplay interaction, then result and restart. Work that skips ahead, bundles
multiple scenario groups without justification, or rewrites existing starter
behavior instead of extending it is non-compliant.
Rationale: the assignment is graded on traceability, incremental reasoning, and
brownfield judgment rather than volume of code.

### II. Type-Safe API and State Contracts
All backend and frontend changes MUST be fully typed in TypeScript. `any` is
prohibited unless an explicit reviewer-approved exception is documented; use
`unknown` at dynamic boundaries instead. Backend request and response shapes
MUST be validated with Zod at the API boundary, and shared gameplay/state
transitions MUST have explicit types in `backend/src/models`, `backend/src/services`,
or `frontend/src/state` as appropriate.
Rationale: multiplayer state bugs compound quickly when request payloads,
derived room state, or UI assumptions drift.

### III. Polling-Only, In-Memory Multiplayer Rules
The game MUST synchronize exclusively through HTTP request/response polling.
WebSockets, Socket.io, Server-Sent Events, background brokers, databases,
sessions, authentication, or any other persistence layer are forbidden. Room
state MUST remain in memory only, deterministic, isolated by room code, and
small enough to be discarded cleanly when inactive. Gameplay rules such as
host permissions, drawer assignment, word selection, guess evaluation, scoring,
and restart reset MUST be deterministic and explicitly documented in the spec.
Rationale: the lab intentionally constrains architecture so implementation
quality can be judged without infrastructure noise.

### IV. Verification Before Progression
Behavior changes MUST ship with verification that matches the touched surface.
At minimum, contributors MUST run the affected app builds and affected test
suites before handoff. Changes that affect multiplayer behavior, room state,
or user-visible flows MUST also include a manual validation path using two
browser tabs or equivalent evidence. Plans MUST state the verification
strategy, tasks MUST include verification work, and reviews MUST block
progression when failing tests or unverified acceptance criteria remain.
Rationale: polling-based multiplayer defects often survive static review unless
they are exercised end to end.

### V. Brownfield Discipline and Minimal Surface Area
Contributors MUST preserve the established monorepo structure and extend the
starter in place: backend routes in `backend/src/api`, gameplay logic in
`backend/src/services`, core types in `backend/src/models`, client pages in
`frontend/src/pages`, reusable UI in `frontend/src/components`, API calls in
`frontend/src/services`, and complex client state in `frontend/src/state`.
New top-level dependencies, new architectural layers, or broad refactors
require explicit justification in the plan. Error handling MUST fail fast and
gracefully, and UI changes MUST not crash on API failures.
Rationale: the assignment expects disciplined enhancement of an existing codebase,
not a wholesale redesign.

## Operational Constraints

- The repository is a TypeScript-first monorepo with an Express backend and a
  React 18 + Vite frontend using ES Modules throughout.
- Backend payload validation MUST use Zod.
- Multiplayer synchronization MUST use HTTP polling at the cadence defined by
  the current spec; near-2-second lobby/game refresh is the default constraint
  unless a narrower requirement is specified.
- All data storage MUST remain in memory only. Restarting the backend is
  allowed to clear rooms.
- Authentication, authorization, sessions, and account systems MUST NOT be
  introduced.
- New state-management or routing libraries on the frontend MUST NOT be added
  unless the plan documents why the existing stack cannot satisfy the need.
- Out-of-scope features listed in `README.md` MUST remain out of scope unless
  the constitution is amended first.

## Delivery Workflow and Review Gates

1. Discovery MUST happen before design or coding. Contributors MUST inspect the
   relevant starter files, document gaps and assumptions, and avoid rewriting
   code they have not understood.
2. Specifications MUST define acceptance criteria, edge cases, deterministic
   game rules, and explicit non-goals consistent with this constitution.
3. Plans MUST reference real repository paths, identify changed backend and
   frontend surfaces, and pass the Constitution Check before implementation
   begins.
4. Tasks MUST be organized by user story or scenario slice, include exact file
   paths, and include verification work for each story plus final cross-cutting
   validation.
5. Code review and self-review MUST reject changes that add forbidden
   technologies, weaken typing, skip Zod validation at new backend boundaries,
   or omit required verification.
6. Before handoff, contributors MUST run the affected commands from this set
   unless a command is genuinely unaffected: `cd backend && npm run build`,
   `cd backend && npm test`, `cd frontend && npm run build`,
   `cd frontend && npm test`.

## Governance

This constitution overrides conflicting local habits, draft artifacts, and AI
suggestions. Amendments require: (1) the proposed rule change to be written in
the constitution, (2) the impact on templates and active artifacts to be
documented, and (3) dependent templates or guidance files to be updated in the
same change set when applicable.

Versioning policy:
- MAJOR: remove a principle, redefine a non-negotiable constraint, or allow a
  previously forbidden architectural class.
- MINOR: add a new principle, section, or materially stronger delivery or
  review requirement.
- PATCH: clarify wording, examples, or non-semantic guidance without changing
  obligations.

Compliance review expectations:
- Every spec, plan, tasks file, and implementation review MUST perform an
  explicit constitution compliance check.
- Any justified exception MUST be documented in the relevant plan under
  complexity or tradeoff tracking and approved before implementation.
- Unverified or non-compliant work MUST not be treated as complete.

**Version**: 1.0.0 | **Ratified**: 2026-05-29 | **Last Amended**: 2026-05-29
