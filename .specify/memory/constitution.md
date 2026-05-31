<!--
SYNC IMPACT REPORT
==================
Version change: (none — initial fill) → 1.0.0
Bump rationale: MINOR — first concrete population of all principle slots from blank template.

Modified principles:
  [PRINCIPLE_1_NAME]  → I. Brownfield: Extend, Never Rewrite
  [PRINCIPLE_2_NAME]  → II. Spec-Driven Delivery
  [PRINCIPLE_3_NAME]  → III. Scope Discipline (Hard Boundaries)
  [PRINCIPLE_4_NAME]  → IV. TypeScript-First and Type Safety
  [PRINCIPLE_5_NAME]  → V. Validation and Graceful Failure
  Added Principle VI  → VI. Deterministic Game Rules
  Added Principle VII → VII. State Model and Viewer-Scoped Responses
  Added Principle VIII→ VIII. Testing Expectations
  Added Principle IX  → IX. AI Usage and Self-Review
  Added Principle X   → X. Commit and Submission Discipline

Added sections: Scope Boundaries (inline in P3), Governance

Templates requiring updates:
  ✅ .specify/memory/constitution.md — updated (this file)
  ✅ .specify/templates/plan-template.md — Constitution Check section aligns with
     updated principles; no structural changes required.
  ✅ .specify/templates/spec-template.md — scope/requirements pattern aligns with P1–P5;
     no structural changes required.
  ✅ .specify/templates/tasks-template.md — task categories align with P8 testing
     expectations; no structural changes required.

Deferred TODOs:
  TODO(RATIFICATION_DATE): Date recorded as first authoring date 2026-05-29.
-->

# Scribble Lab Constitution

This constitution governs all AI-assisted and human work on this brownfield
enhancement of the Scribble starter. It is the root authority: when a spec, plan,
task, or generated diff conflicts with a principle here, this document wins.
It exists to keep the spec → plan → tasks → implementation chain consistent and
to keep the work inside the lab's deliberately narrow scope.

## Core Principles

### I. Brownfield: Extend, Never Rewrite

The starter is a working room-creation/join flow plus scaffolding. Work MUST add
behavior incrementally on top of the existing structure. Rewriting working code,
restructuring folders, or cleaning up unrelated areas is prohibited. Every change
MUST be explainable as serving one of the four business scenarios. Reusing the
existing `roomStore` service, `RoomStore` frontend pattern, Zod schemas, and route
layout is REQUIRED over introducing parallel mechanisms.

### II. Spec-Driven Delivery

No production code MAY be written before its behavior is captured in a `spec.md`,
sequenced in a `plan.md`, and decomposed in a `tasks.md` for the relevant feature
group. The project MUST complete at least four specify iterations, one per scenario:

- `specs/001-room-setup-lobby`
- `specs/002-game-start-drawer`
- `specs/003-gameplay-interaction`
- `specs/004-result-restart`

Each folder holds `spec.md`, `plan.md`, and `tasks.md`. Ambiguities MUST be
resolved in a clarify step and recorded in the spec before planning. Work MUST
proceed one scenario at a time and MUST NOT advance until the current scenario's
acceptance criteria pass in two browser tabs.

### III. Scope Discipline (Hard Boundaries)

The following are **forbidden** in code, dependencies, specs, plans, and tasks:

- WebSockets / Socket.io / any real-time push technology
- Databases or persistent storage of any kind
- Authentication, sessions, JWT, or OAuth
- Deployment, CI pipelines, or Docker work
- New state-management or routing libraries
- Multiple rounds, drawer rotation, timers, bonuses, custom word packs
- Spectator mode, moderation, passwords, or invite links

All synchronization MUST use HTTP polling at roughly a two-second cadence. All
state MUST be held in-memory in the single backend process and is expected to reset
on restart. Any dependency added MUST be justified by a written spec requirement.

### IV. TypeScript-First and Type Safety

All new code MUST be fully typed. The `any` type is prohibited; `unknown` plus
narrowing MUST be used when a type is genuinely dynamic. Shared shapes (room,
participant, snapshot, guess, result) MUST be defined once in
`backend/src/models/game.ts` and mirrored in the frontend `services/api.ts` types
so the contract stays explicit. Data updates MUST be immutable and business logic
MUST be expressed as pure functions where practical, consistent with the existing
`structuredClone` approach in `roomStore.ts`.

### V. Validation and Graceful Failure

All request payloads and meaningful responses MUST be validated with Zod on the
backend. Player names MUST be trimmed and empty/whitespace-only values MUST be
rejected with a clear, user-facing message — never silently coerced to a default.
Room codes MUST be treated as canonical uppercase. The backend MUST use the
centralized `errorHandler`/`notFoundHandler`; new error cases MUST throw
`HttpError` with an appropriate status. The frontend MUST NOT crash on an API
exception: every call path MUST surface the error message through existing state
(`withLoading`/`error`) and leave the UI usable.

### VI. Deterministic Game Rules

Game outcomes MUST be reproducible and testable. The secret word MUST be selected
from `STARTER_WORDS` by a stable function of the room — `Math.random()` is
prohibited in gameplay logic. Guess comparison MUST use trim + case-insensitive
equality against the secret word. Scoring is fixed: a correct guess awards 100
points; an incorrect guess awards 0; all scores start at 0. The drawer, the word,
the score delta, and the result contents MUST all be derivable from room state
without hidden randomness, so the same inputs always yield the same outcome.

### VII. State Model and Viewer-Scoped Responses

A room MUST own an explicit `hostId`, a status (`lobby` → `active` → `ended`),
the secret word, the drawer id, per-participant scores, and an ordered guess
history. The snapshot returned by `toRoomSnapshot` MUST be scoped to the viewing
participant: the secret word is included only for the drawer; guessers MUST receive
a redacted snapshot. Memory MUST be kept lean; transient round state MUST be
cleared on restart rather than accumulated.

### VIII. Testing Expectations

The existing Vitest suites (`schemas.test.ts`, `roomStore.test.ts`, `api.test.ts`)
MUST remain green at all times. New deterministic logic — name validation, word
selection, guess comparison, scoring, host gating — MUST ship with unit tests.
`npm run build` and `npm test` MUST pass in both `backend` and `frontend` before
any commit is pushed, matching the CI and pre-evaluation gates. Acceptance criteria
MUST be verified manually with two browser tabs at the end of each scenario.

### IX. AI Usage and Self-Review

AI assistance is used for drafting and exploration, never as an unreviewed source
of truth. Every AI-generated diff MUST be read line by line before commit and
checked against three questions:

1. Does it trace to a current spec requirement?
2. Does it stay in scope?
3. Does it introduce any forbidden technology or `any` type?

Generated dependencies, endpoints, or files that the spec does not justify MUST be
rejected. Where the implementation deviates from the spec, the deviation MUST be
documented in the plan or reflection rather than left implicit.

### X. Commit and Submission Discipline

Commits MUST be granular and meaningful: one coherent slice per commit, with a
message that names the scenario and the behavior added. The diff is the primary
artifact reviewers assess. All four scenarios MUST be delivered in a single Pull
Request from the working branch to `main` (no per-scenario PRs). The PR description
MUST include a non-empty Everest email and a checked role box, and MUST follow the
repository template. A root `reflection.md` MUST accompany the work.

## Scope Summary

| Area | Status |
|---|---|
| HTTP polling (≈2 s cadence) | ✅ Required |
| In-memory state | ✅ Required |
| Zod validation | ✅ Required |
| TypeScript strict types | ✅ Required |
| WebSockets / real-time push | ❌ Forbidden |
| Databases / persistent storage | ❌ Forbidden |
| Auth / sessions / JWT | ❌ Forbidden |
| Multiple rounds / timers / bonuses | ❌ Forbidden |
| New state-management libraries | ❌ Forbidden |

## Governance

This constitution supersedes all other practices, guidelines, and conventions on
this project. When any spec, plan, task list, or generated diff conflicts with a
principle here, this document wins.

**Amendment procedure**: Amendments require a written rationale, a version bump
following the semantic versioning policy below, and an update to this file before
the amended principle may be acted upon. Amendments that remove or fundamentally
redefine a principle require MAJOR version increment. Additions or material
expansions require MINOR increment. Clarifications and wording fixes require PATCH
increment.

**Compliance review**: Every AI-generated or human-authored diff MUST be checked
against the principles before merge. The checklist in each `plan.md` Constitution
Check section is the primary review gate.

**Versioning policy**:

- MAJOR: backward-incompatible governance changes, principle removals or
  redefinitions.
- MINOR: new principle or section added, materially expanded guidance.
- PATCH: clarifications, wording fixes, typo corrections.

**Version**: 1.0.0 | **Ratified**: 2026-05-29 | **Last Amended**: 2026-05-29
