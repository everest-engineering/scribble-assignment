<!--
  Sync Impact Report
  Version change: N/A (initial fill) → 1.0.0
  Modified principles: All placeholder tokens replaced — initial constitution
  Added sections: Technology Constraints, Development Workflow
  Removed sections: N/A (template section placeholders resolved)
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ aligned — Constitution Check gate references principle violations
    - .specify/templates/spec-template.md ✅ aligned — user stories + acceptance criteria match spec-driven principle
    - .specify/templates/tasks-template.md ✅ aligned — phased-by-story structure matches incremental delivery principle
  Follow-up TODOs: None — all placeholder tokens resolved.
-->

# Scribble Constitution

## Core Principles

### I. Brownfield Respect

All implementation work MUST begin with a discovery pass over existing files before
writing any new code. Gaps and assumptions MUST be documented in `discovery.md`
(minimum 3 incomplete behaviors, 2 assumptions, relevant files listed) before any
production code is added or changed.

Rewriting the starter from scratch is explicitly out of scope and signals a failure
to read the existing system. Extend and enhance; do not replace.

### II. Spec-Driven Increments

Each feature group MUST have a committed, reviewed artifact chain (spec → clarify →
plan → tasks) before implementation begins. The loop is:

> specify → clarify → plan → tasks → implement → validate

No phase may be skipped. Spec artifacts MUST be updated incrementally — one full
loop pass per business scenario, in order. Code that cannot be traced to a spec
entry or task ID is a red flag.

### III. Polling, Not Real-Time

All multiplayer state sync MUST use REST polling at approximately 2-second intervals.
WebSockets and any real-time transport are permanently prohibited for this project.
Each polling call MUST be a plain `GET /rooms/:code` against the existing endpoint.

Adding any new transport, streaming, or push mechanism violates this principle
regardless of claimed simplicity.

### IV. Strict Scope Discipline

The following are out of scope and MUST NOT be built, specced, or planned:
WebSockets, database or persistent storage, authentication or sessions,
deployment or Docker or CI, new state-management or routing libraries beyond the
starter, multiple rounds, timers, drawer rotation, speed or drawer bonuses, custom
word packs, spectator mode, moderation features, room passwords, or any rewrite
of the starter from scratch.

Any new top-level dependency MUST be justified in the plan's Complexity Tracking
table with no simpler alternative available. Unjustified dependencies are rejected.

### V. Self-Review Before Commit

Every AI-generated change MUST be reviewed by the author before committing.
Review checklist:

1. Does the behavior match the spec's acceptance criteria for this scenario?
2. Are all input validations in place — trim, empty-check, case-insensitive compare?
3. Does the change break any previously passing scenario (regression check)?
4. Is the commit message traceable to a task ID or scenario?

Commits MUST be granular and meaningful. Squash-all or force-pushed history
obscures implementation decisions and is prohibited.

## Technology Constraints

- **Frontend**: Vite + React + TypeScript — no new routing or state-management
  libraries beyond what the starter ships
- **Backend**: Node.js + Express + TypeScript — in-memory store only; no ORM,
  database, cache, or file system persistence
- **State boundary**: All room and game state lives in
  `backend/src/services/roomStore.ts`; frontend state is derived from polling only
- **Build gate**: Both `cd backend && npm run build` and `cd frontend && npm run build`
  MUST pass before any PR is raised
- **Acceptance testing**: Manual two-browser validation is the primary gate;
  automated tests are optional unless the spec explicitly requires them

## Development Workflow

Work through each business scenario in order. Complete the full loop before
starting the next scenario.

| Step | Activity |
|------|----------|
| 1. Discovery | Document gaps and assumptions in `discovery.md` before touching source |
| 2. Specify | Update spec artifact with acceptance criteria for this scenario |
| 3. Clarify | Resolve ambiguity before planning (at least one clarification pass) |
| 4. Plan | Update plan with state model, data flow, and file-level changes |
| 5. Tasks | Decompose plan into ordered, dependency-aware tasks |
| 6. Implement | One task at a time; commit after each logical unit |
| 7. Validate | Two-browser acceptance test against spec criteria |

Scenario order: Room Setup & Lobby → Game Start & Drawer Flow →
Gameplay Interaction → Result, Restart & Final Validation.

## Governance

This constitution supersedes all other practices in this repository. Amendments
require: (1) a clear description of the change and rationale, (2) a version bump
per semantic versioning rules (MAJOR = principle removal/redefinition,
MINOR = new principle or section, PATCH = clarification or wording), and (3) an
updated `LAST_AMENDED_DATE`.

All plan Constitution Check sections MUST reference the current version and confirm
no active violations — or explicitly justify deviations in the Complexity Tracking
table.

AI usage is permitted and encouraged at every phase. All AI-generated artifacts
(spec, plan, tasks, code) MUST be reviewed and accepted by the author before
committing. The author is accountable for every committed line regardless of origin.

**Version**: 1.0.0 | **Ratified**: 2026-06-07 | **Last Amended**: 2026-06-07
