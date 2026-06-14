<!--
Sync Impact Report
==================
Version change: 0.0.0 (template) → 1.0.0 (initial ratification)
Bump rationale: First ratified constitution. Replaces placeholder template with five
concrete, testable principles plus scope and workflow sections; this is a MAJOR bump
because every principle and section was previously undefined.

Modified principles: none (all five are new)
  - I. Lab-Scope Discipline
  - II. Polling-Only, In-Memory, Stateless
  - III. TypeScript-First with Zod-Validated Boundaries
  - IV. Extend, Don't Replace
  - V. Spec-First, Traceable Slices

Added sections:
  - Technology & Scope Boundaries
  - Development Workflow & Quality Gates
  - Governance (filled)

Removed sections: none

Templates / docs requiring updates:
  - .specify/templates/plan-template.md      ✅ aligned (Constitution Check placeholder
    references this file; gate items will be enumerated by /speckit.plan from the
    principles below)
  - .specify/templates/spec-template.md      ✅ aligned (no constitution-mandated
    sections beyond what the template already defines)
  - .specify/templates/tasks-template.md     ✅ aligned (task categorization unaffected)
  - AGENTS.md                                ✅ aligned (this constitution codifies the
    "Strictly Forbidden" list and coding guidelines already documented there)
  - README.md                                ✅ aligned (no copy changes required)

Follow-up TODOs: none
-->

# Scribble Lab Constitution

## Core Principles

### I. Lab-Scope Discipline

The set of items below is **out of scope** for this lab. Specifications, plans, tasks,
and code MUST NOT introduce them, and `/speckit.*` commands MUST refuse to plan them
without an explicit constitution amendment.

- Technical: WebSockets / real-time push, databases or persistent storage,
  authentication / accounts / sessions, deployment / hosting / CI pipelines, Docker
  or containerization, new top-level state-management or routing libraries beyond
  what the starter ships.
- Gameplay: multiple rounds, drawer rotation, round timers or countdowns, speed or
  drawer bonuses, custom or random word packs, spectator mode, room moderation
  (kick / mute), room passwords, invite links.

**Rationale**: The lab is calibrated for medium difficulty around the room/lobby/
single-round drawing loop. Out-of-scope work creates drift between spec, plan, tasks,
and implementation, and rarely improves the outcome.

### II. Polling-Only, In-Memory, Stateless

- All client–server synchronization MUST use HTTP polling. Real-time push protocols
  (WebSocket, Socket.io, SSE, long-polling held connections) are forbidden.
- All room and participant state MUST live in process memory (a single `Map`-keyed
  store on the backend). No SQL, NoSQL, SQLite, file-backed stores, or external
  caches.
- There is no authentication layer. Identity MUST be carried by an opaque
  `participantId` issued by the server at create-or-join time, supplied by the client
  on subsequent requests for that room.

**Rationale**: Matches the lab's stated platform constraints, keeps the surface area
small enough to reason about end-to-end, and makes every behavior observable through
plain HTTP.

### III. TypeScript-First with Zod-Validated Boundaries

- Both packages MUST compile under strict TypeScript. `any` is disallowed; use
  `unknown` and narrow at the boundary.
- Every backend HTTP route MUST validate its request body, path params, and query
  params with a Zod schema before any handler logic runs. Validation failures MUST
  return a JSON error envelope (`{ "message": "..." }`) with an appropriate 4xx code.
- Shared wire types (room snapshots, session responses) MUST be expressed as
  TypeScript interfaces and kept in sync between `backend/src/models/` and
  `frontend/src/services/api.ts`.

**Rationale**: Catches integration drift at the type and route boundary, where it is
cheapest to fix, and keeps the unhappy-path UX consistent across endpoints.

### IV. Extend, Don't Replace

- The starter scaffold (routing in `frontend/src/routes/`, page shells in
  `frontend/src/pages/`, the in-memory store in `backend/src/services/roomStore.ts`,
  the snapshot helper, and the existing API surface) is the substrate. Feature work
  MUST extend these modules rather than rewrite them.
- Refactors of code outside the feature's scope are not allowed in the same change
  set. Drive-by cleanups go in a separate, justified PR.
- New top-level dependencies in `backend/package.json` or `frontend/package.json`
  require an explicit spec-level justification before they may be added. The current
  baseline (Express, Zod, React, React Router v6, Vite, Vitest, `tsx`) is the default
  ceiling.

**Rationale**: Prevents "rewrite the starter from scratch" drift and keeps each
feature reviewable in isolation.

### V. Spec-First, Traceable Slices

- Every functional change MUST trace to at least one numbered `FR-###` in a
  `specs/<feature>/spec.md`. Code without a traceable requirement is rejected.
- New work flows through the Spec Kit sequence: `/speckit.specify` →
  `/speckit.clarify` (when needed) → `/speckit.plan` → `/speckit.tasks` →
  `/speckit.implement`. Skipping straight from spec to code is permitted only for
  trivial bug fixes that do not change the contract.
- `tasks.md` MUST list exact file paths; vague tasks ("update the codebase") are
  rejected.
- Tests are mandatory for spec-mandated behavior: input validation (empty/invalid
  names and codes), host gating (visibility and authorization), room isolation, and
  polling cadence. Existing tests MUST NOT be deleted or weakened to make new code
  pass.

**Rationale**: Keeps the lab artifacts (spec, plan, tasks, code) in lockstep so the
review and reflection steps have something concrete to evaluate.

## Technology & Scope Boundaries

- **Allowed stack**: Node 20 + TypeScript + Express + Zod on the backend; Vite +
  React 18 + React Router v6 + TypeScript on the frontend; Vitest for tests on both
  sides; `tsx` for backend dev execution. CSS lives in `frontend/src/styles/app.css`
  or co-located CSS modules.
- **Disallowed stack additions** (without amendment): WebSockets/Socket.io/SSE
  libraries, any database driver or ORM, auth libraries (Passport, JWT, OAuth
  clients), Docker/Compose files, deployment configuration, alternative state
  managers (Redux, Zustand, Jotai, MobX, etc.), alternative routers, CSS frameworks
  beyond plain CSS.
- **Module layout** is fixed: backend code lives under `backend/src/{api,services,
  models,seed}/`; frontend code under `frontend/src/{components,pages,routes,
  services,state,hooks,styles}/`. Tests are colocated as `*.test.ts(x)`.
- **Scope envelope**: a single round of the drawing game with a host-driven start,
  drawer/guesser roles assigned once per round, a guess flow, scoring, and a results
  screen. No round 2, no rotation, no timers.

## Development Workflow & Quality Gates

- **Constitution Check** in `plan.md` MUST enumerate each principle above and mark
  it PASS / DEVIATE with justification. A DEVIATE entry without a corresponding row
  in `Complexity Tracking` blocks the plan.
- **Validation checklist** at `specs/<feature>/checklists/requirements.md` MUST be
  generated by `/speckit.specify` and resolved (all items checked) before
  `/speckit.plan` may run. Items deferred MUST be listed in checklist Notes.
- **Tests run on every change**: `npm test` in `backend/` and `frontend/` MUST pass
  locally before a feature is declared complete. CI is out of scope, but the local
  green-build precondition is not.
- **Quickstart parity**: `quickstart.md` MUST stay runnable. If a code change breaks
  a documented scenario, either the code or the quickstart is updated in the same
  change set.
- **Commit hygiene**: feature work goes on the feature branch created by
  `speckit.git.feature`; commits are scoped to one task or one logical group.

## Governance

- This constitution supersedes ad-hoc conventions in `AGENTS.md`, `README.md`, and
  any agent-specific guidance file. Conflicts are resolved in favor of this document;
  affected files are updated in the same amendment.
- **Amendments** require: (1) a written rationale at the top of the change, (2) an
  updated Sync Impact Report at the top of this file, (3) a version bump per the
  policy below, and (4) a corresponding update to `AGENTS.md` if the change affects
  day-to-day rules.
- **Versioning policy** (semantic):
  - MAJOR: a principle is removed or its meaning is reversed; a forbidden item is
    moved into scope or vice versa.
  - MINOR: a new principle, section, or materially expanded rule is added.
  - PATCH: clarifications, wording, typo fixes, non-semantic refinements.
- **Compliance review**: every `/speckit.plan` execution re-evaluates this
  constitution as a gate; every `/speckit.analyze` execution flags drift between
  spec, plan, tasks, and code against these principles.
- **Runtime guidance**: `AGENTS.md` is the day-to-day cheat sheet. It MUST stay
  consistent with this constitution; when they disagree, this document wins until
  `AGENTS.md` is updated.

**Version**: 1.0.0 | **Ratified**: 2026-06-10 | **Last Amended**: 2026-06-10
