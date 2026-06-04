<!--
SYNC IMPACT REPORT
==================
Version change: [TEMPLATE] → 1.0.0
Modified principles: All — initial population from template placeholders
Added sections:
  - Core Principles (5 principles)
  - Technology Constraints
  - Development Workflow
  - Governance
Removed sections: None (template was blank)
Templates requiring updates:
  - .specify/templates/plan-template.md — Constitution Check gates now defined ✅ (referenced below)
  - .specify/templates/spec-template.md — No structural changes required ✅
  - .specify/templates/tasks-template.md — No structural changes required ✅
Deferred TODOs: None
-->

# Scribble Lab Constitution

## Core Principles

### I. Brownfield Discipline

Before writing any code, read and understand the relevant existing files. Changes MUST be
targeted additions or corrections — never wholesale rewrites of working code. Every change
must be traceable to a gap documented in discovery notes or a spec acceptance criterion.

No top-level dependency may be added unless justified in the plan with a clear reason why
the existing stack is insufficient.

### II. Spec-Driven Workflow

The workflow MUST follow this sequence without skipping steps:

1. Discovery → 2. Specify → 3. Clarify → 4. Plan → 5. Tasks → 6. Implement → 7. Validate

Code MUST NOT be written before tasks exist. Tasks MUST NOT be created before a plan exists.
Clarification MUST resolve ambiguity before planning begins. Deviations from the spec MUST be
documented in the plan or tasks file before the code is committed.

### III. Deterministic Game Rules (NON-NEGOTIABLE)

Game mechanics MUST follow these exact, coded rules with no variation:

- **Word selection**: `STARTER_WORDS[participantCount % STARTER_WORDS.length]`
- **Drawer assignment**: `room.participants[0]` — first participant; single round, no rotation
- **Scoring**: correct guess = +100 points; incorrect guess = +0 points
- **Guess comparison**: trimmed, case-insensitive string equality
- **Name validation**: trimmed name that is empty or whitespace-only MUST be rejected with
  a user-visible error message; silent coercion (e.g., `""` → `"Player"`) is forbidden
- **Polling cadence**: lobby and game state MUST poll at approximately 2-second intervals
  via `setInterval` in `useEffect` with cleanup on unmount

These rules are invariants. Any change to a game rule requires a constitution amendment.

### IV. AI Review Discipline

All AI-generated code MUST be reviewed by the developer before committing. Blind
acceptance of AI output is a violation. The developer MUST be able to explain every line
committed. If AI output diverges from the spec, the deviation MUST be documented in the
plan or tasks file. Commit messages MUST be meaningful and traceable to spec or tasks.

### V. Incremental Validation

Implementation MUST proceed one scenario at a time. Each scenario MUST be validated in two
browser tabs against its acceptance criteria before work on the next scenario begins. A
scenario is considered complete only when all its acceptance criteria pass in the running
application — passing type checks or builds alone does not constitute completion.

## Technology Constraints

**Frontend**: Vite + React + TypeScript — no new routing or state-management libraries
beyond what the starter ships.

**Backend**: Node.js + Express + TypeScript — in-memory store only; no database, no
persistence layer.

**Explicitly out of scope** (MUST NOT build or spec): WebSockets, authentication, sessions,
deployment/CI/Docker, multiple rounds, drawer rotation, timers, spectator mode, moderation,
room passwords, custom word packs, or any rewrite of working starter code.

**Build validation**: Both `backend/npm run build` and `frontend/npm run build` MUST pass
before a PR is raised.

## Development Workflow

1. Commit Spec Kit artifacts (constitution, spec, plan, tasks) before implementation begins.
2. Commits MUST be granular and meaningful — each commit should be explainable and
   traceable to a spec or task entry.
3. Each phased checkpoint (Scenarios 1 → 4) MUST be complete and validated before the next
   begins.
4. Maintain at least 4 spec iterations across the lab.
5. A reflection report MUST be included before PR submission.
6. The PR description MUST include the submitter's email and role.

## Governance

This constitution supersedes all other development practices and preferences for this
project. Amendments require: (1) updating this file with a new version, (2) documenting
the change in the Sync Impact Report comment block above, (3) propagating any impacted
constraints to plan, spec, or tasks artifacts, and (4) committing the amendment before
implementing any code that depends on the changed rule.

Versioning follows semantic versioning:
- MAJOR: removal or redefinition of an existing principle
- MINOR: new principle or section added
- PATCH: clarification or wording fix

All PRs and AI-assisted implementations MUST be verified against this constitution before
merge.

**Version**: 1.0.0 | **Ratified**: 2026-06-04 | **Last Amended**: 2026-06-04
