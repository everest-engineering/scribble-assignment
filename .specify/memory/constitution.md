<!--
SYNC IMPACT REPORT
==================
Version change: (template, unversioned) → 1.0.0
Bump rationale: MINOR — initial population of all principles and governance from template skeleton.

Modified principles:
  All sections: template placeholders → concrete content (first authoring, not a rename)

Added sections:
  - I. Brownfield-First
  - II. TypeScript Everywhere
  - III. Spec-Driven Development
  - IV. Polling-Only Sync
  - V. In-Memory Store Only
  - VI. Incremental Validation
  - Out-of-Scope Constraints (Section 2)
  - AI Usage and Self-Review Discipline (Section 3)
  - Governance

Templates reviewed:
  ✅ .specify/templates/plan-template.md  — "Constitution Check" gate is generic; aligns with principles
  ✅ .specify/templates/spec-template.md  — no constitution references; structure is compatible
  ✅ .specify/templates/tasks-template.md — optional-test policy matches Principle VI; no conflicts

Follow-up TODOs: none — all placeholders resolved.
-->

# Scribble Constitution

## Core Principles

### I. Brownfield-First

Before writing any new code, read the relevant existing files and document what is already
implemented, what is missing, and what assumptions you are making. New behavior MUST be
introduced by extending or editing existing files, not by rewriting them from scratch.
Unrelated refactors are forbidden — every change must be traceable to a scenario in the spec.

**Rationale**: The starter ships working routes, a store, and a UI shell. Rewriting it destroys
traceability and wastes lab time. Discovery notes anchor all downstream decisions.

### II. TypeScript Everywhere

All new and modified code MUST be fully typed. `any` is forbidden; use `unknown` for genuinely
dynamic values and narrow at the boundary. Backend types live in `backend/src/models/`; frontend
shared types live in `frontend/src/services/api.ts`. Type definitions MUST stay in sync — if
`RoomStatus` expands on the backend it MUST expand on the frontend in the same commit.

**Rationale**: TypeScript catches contract drift between frontend and backend at compile time.
Shared-type divergence is the most common source of silent bugs in this stack.

### III. Spec-Driven Development

No implementation work begins without an acceptance criterion in the spec. Each scenario in
`spec.md` MUST map to at least one testable acceptance scenario (`Given / When / Then`). Every
task in `tasks.md` MUST reference the scenario or requirement it satisfies. Deviations between
code behavior and the spec MUST be documented before merging.

**Rationale**: The lab is assessed on spec-to-implementation traceability. Code that works but
is not in the spec does not count; spec criteria that have no corresponding code are gaps that
reviewers will flag.

### IV. Polling-Only Sync

All multi-player state synchronisation MUST use HTTP polling (`setInterval` + `fetch`). WebSockets,
Server-Sent Events, and any other real-time push protocol are forbidden. Polling intervals MUST
be configurable via a named constant (default 2000 ms). Polls MUST be cleaned up on component
unmount (`clearInterval` in the `useEffect` return). Polling MUST be paused or stopped when the
room transitions to `"result"` status to avoid unnecessary requests.

**Rationale**: The AGENTS.md and README both forbid WebSockets. Polling keeps the architecture
simple and testable with standard HTTP tools.

### V. In-Memory Store Only

All game state is stored in the backend `rooms` Map. No database, file system, or external store
may be introduced. The store MUST be the single source of truth — the frontend holds only a
cached snapshot, never authoritative state. Because the store is cleared on restart, any behavior
that depends on persistence (e.g., login, history across sessions) is out of scope.

**Rationale**: Persistence adds accidental complexity and is explicitly forbidden in AGENTS.md.
In-memory storage keeps the backend stateless from an infrastructure perspective.

### VI. Incremental Validation

Work progresses one scenario at a time: specify → plan → tasks → implement → validate.
A scenario is not complete until it passes manually with two browser tabs open. The next scenario
MUST NOT begin until the current one passes. Commits MUST be granular — one logical change per
commit, not a bulk dump at the end.

**Rationale**: The lab rubric rewards traceability and clear commit history. Large undifferentiated
commits make it impossible to assess which change introduced which behavior.

## Out-of-Scope Constraints

The following items are explicitly forbidden in this project. They MUST NOT appear in the spec,
plan, tasks, or implementation. If the AI assistant suggests any of them, reject the suggestion
and document the rejection.

- WebSockets, Socket.io, Server-Sent Events, or any real-time push protocol
- Databases, file system persistence, localStorage, or cookies for game state
- Authentication, sessions, JWT, OAuth, or user accounts
- Multiple rounds, drawer rotation, timers, countdowns, or bonus scoring
- Custom or random word packs beyond the five starter words
- Spectator mode, room passwords, invite links, or moderation features
- New top-level npm dependencies without explicit justification in the plan
- Deployment, CI configuration changes, or Docker work
- Rewriting the starter from scratch

**Enforcement**: Any PR that includes out-of-scope work MUST have those changes reverted before
merge, regardless of whether the in-scope work is correct.

## AI Usage and Self-Review Discipline

AI-assisted output MUST be reviewed before committing. The following checks are mandatory after
any AI-generated code block:

1. **Type safety**: Does it introduce `any` or skip type annotations?
2. **Scope creep**: Does it touch files or behaviors outside the current scenario?
3. **Spec alignment**: Does the behavior match the acceptance criteria exactly?
4. **Polling hygiene**: Are all `setInterval` calls cleaned up on unmount?
5. **Error handling**: Are API failures surfaced to the user with a visible message?

AI tools MUST NOT be used to bypass these checks. The reflection report MUST describe at least
one instance where AI output was corrected or rejected and why.

## Governance

This constitution supersedes all informal conventions. Amendments require:

1. A documented reason (in the PR description or a comment in this file).
2. A version bump following semantic versioning:
   - MAJOR: principle removed, renamed, or fundamentally redefined.
   - MINOR: new principle or section added.
   - PATCH: wording clarification, typo fix, non-semantic refinement.
3. `LAST_AMENDED_DATE` updated to the amendment date.

All PRs and reviews MUST verify compliance with this constitution before approval.
Complexity violations (e.g., a dependency not in the starter) MUST be justified in the plan's
Complexity Tracking table. Unjustified violations are grounds for PR rejection.

For runtime development guidance see `AGENTS.md` and `README.md`.

**Version**: 1.0.0 | **Ratified**: 2026-06-04 | **Last Amended**: 2026-06-04
