<!--
SYNC IMPACT REPORT
==================
Version change: (none — initial population) → 1.0.0
Modified principles: N/A (first authored version)
Added sections:
  - Core Principles (5 principles)
  - Engineering Standards
  - Development Workflow
  - Governance
Removed sections: N/A
Templates checked:
  - .specify/templates/plan-template.md  ✅ aligned (Constitution Check section present)
  - .specify/templates/spec-template.md  ✅ aligned (scope/requirements sections match)
  - .specify/templates/tasks-template.md ✅ aligned (phase structure matches incremental delivery)
Deferred TODOs: none
-->

# Scribble Lab Constitution

## Core Principles

### I. Brownfield-First

Before writing any new code, read and understand the relevant starter files and
document gaps and assumptions. The existing scaffold MUST NOT be rewritten from
scratch. New code MUST extend or correct what is already there; wholesale
replacement of starter modules is not permitted without documented justification.

**Rationale**: The lab explicitly starts from a runnable scaffold. Rewriting it
destroys traceability between the spec artifacts and the delivered implementation.

### II. Spec Kit Traceability

Every implementation commit MUST be traceable to a Spec Kit artifact. The
constitution, spec, plan, and tasks MUST be committed and kept internally
consistent throughout the lab. Implementation that cannot be traced back to a
spec entry, acceptance criterion, or task MUST NOT be merged.

**Rationale**: Reviewers assess the PR diff against the spec artifacts, not
against intent. Untraceable code is unverifiable code.

### III. Incremental Validation

Work MUST proceed one business scenario at a time in the order defined by the
README phased checkpoints. Each scenario MUST be validated with two browser tabs
against its acceptance criteria before the next scenario begins. Partial
implementations of a later scenario MUST NOT be committed before the current
one passes.

**Rationale**: Incremental delivery keeps the spec, plan, tasks, and code in
sync and makes regressions immediately visible.

### IV. Scope Discipline

The following items are explicitly out of scope and MUST NOT be built, specified,
planned, or tasked:

- WebSockets or real-time sync (polling only, ~2 s cadence)
- Databases or persistent storage (in-memory only)
- Authentication, accounts, or sessions
- Deployment, hosting, CI, or Docker work
- New state-management or routing libraries beyond the starter
- Multiple rounds, drawer rotation, timers, countdowns, or bonus scoring
- Custom or random word packs (starter seed list only)
- Spectator mode, moderation, room passwords, or invite links
- Rewriting the starter from scratch
- Unjustified top-level dependencies
- Unrelated refactors

Any feature request that touches an out-of-scope item MUST be declined and
documented as a deviation in the spec.

**Rationale**: Scope creep inflates complexity, breaks lab evaluation, and
creates drift between spec artifacts and implementation.

### V. AI Review Discipline

All AI-generated code MUST be critically reviewed and fully understood before
committing. A developer MUST be able to explain every line of AI output they
commit. Commits that bundle AI-generated code without review evidence in the PR
description are non-compliant. AI tools MAY assist with drafting artifacts and
code but MUST NOT make unchecked architectural decisions.

**Rationale**: The lab is an assessment of the developer's judgment, not the
AI's capability. Blind acceptance of AI output undermines the evaluation and can
introduce subtle bugs.

## Engineering Standards

- **Language**: TypeScript (strict mode) for both frontend and backend.
- **Frontend**: Vite + React + TypeScript; no new routing or state-management
  libraries beyond what the starter ships.
- **Backend**: Node.js + Express + TypeScript; in-memory store only; no ORM or
  database driver.
- **Polling**: Lobby and gameplay state MUST be refreshed via client-side polling
  at approximately a 2-second interval. WebSockets are out of scope.
- **Determinism**: Game logic (word selection, scoring) MUST be deterministic and
  reproducible given the same inputs. No `Math.random()` for game-rule outcomes.
- **Validation**: Player name input MUST be trimmed; empty or whitespace-only
  names MUST be rejected with a user-visible message. Guess comparison MUST be
  case-insensitive and trimmed.
- **Scoring**: A correct guess scores exactly 100 points. An incorrect guess
  scores 0. No other scoring formula is permitted.
- **Multi-room isolation**: Rooms MUST be fully isolated; state changes in one
  room MUST NOT affect another.
- **Build gate**: Both `npm run build` commands (backend and frontend) MUST pass
  before raising a PR.

## Development Workflow

- Work from the `scribble-lab` branch; raise a PR to `main` when the lab is
  complete.
- Commits MUST be granular and self-contained — one meaningful slice per commit.
- Commit messages MUST follow the format: single sentence, plain English, capital
  first letter, no period, no co-author attribution.
- The PR MUST include the author's email and role and follow the PR template.
- Spec Kit artifacts (constitution, spec, plan, tasks) MUST be committed
  alongside or before the implementation they describe, never after.
- The reflection report MUST be committed as a `.md` file before the PR is
  raised.

## Governance

This constitution supersedes all other informal practices for the duration of the
lab. Amendments require:

1. A documented reason (what changed and why).
2. A version bump following semantic versioning:
   - MAJOR: removal or incompatible redefinition of a principle.
   - MINOR: new principle or section added.
   - PATCH: clarifications, wording, or typo fixes.
3. Propagation to dependent templates if sections or principles are added or
   removed.

All PRs and reviews MUST verify compliance with Principles I–V. Complexity
introduced beyond what the scenario requires MUST be justified in the plan's
Complexity Tracking table.

**Version**: 1.0.0 | **Ratified**: 2026-06-02 | **Last Amended**: 2026-06-02
