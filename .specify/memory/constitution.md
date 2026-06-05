<!--
Sync Impact Report
- Version change: (template) → 1.0.0
- Bump rationale: Initial ratification of the project constitution (MAJOR baseline).
- Principles defined:
  - I. Brownfield-First
  - II. Spec-Driven Development
  - III. Deterministic Game Rules
  - IV. Polling-Only Synchronization
  - V. Incremental Validation
  - VI. AI Review Discipline
- Added sections: Technology Constraints; Development Workflow; Governance.
- Removed sections: none.
- Templates reviewed for alignment:
  - .specify/templates/plan-template.md ✅ (Constitution Check gate covered by Principles I–VI)
  - .specify/templates/spec-template.md ✅ (acceptance-criteria + edge-case emphasis matches Principle V)
  - .specify/templates/tasks-template.md ✅ (ordered, testable tasks match Principle II)
- Follow-up TODOs: none.
-->

# Scribble Assignment Constitution

This constitution governs the Scribble brownfield enhancement. It is the highest
authority for how work is scoped, built, validated, and committed. Every spec,
plan, task list, and commit MUST comply with it.

## Core Principles

### I. Brownfield-First

Read before writing. The starter is a working scaffold and MUST be enhanced, not
rewritten. Every change MUST be the minimum needed to satisfy an accepted spec
slice; existing files, structure, naming, and idioms are preserved unless a spec
requires otherwise. No unrelated refactors. Starter bugs MAY be fixed only when
they block delivery of a spec (for example the `frontend/src/services/api.ts`
base-URL `/bug` suffix), and any such fix MUST be documented in `DISCOVERY.md`.

**Rationale:** The lab grades traceability and minimal, explainable change.
Rewrites and drive-by refactors destroy the diff's signal and break the link
between spec and implementation.

### II. Spec-Driven Development

No production code is written without an accepted spec slice. Each scenario MUST
follow this order, with no skipping:
`specify → clarify → plan → checklist → tasks → analyze → implement`.
Implementation MUST trace back to a numbered requirement in the scenario's
`spec.md`. Deviations discovered during implementation MUST be reflected back into
the spec, not left undocumented.

**Rationale:** Spec Kit is the focus of the lab; the game is the vehicle. The
artifacts must stay internally consistent and ahead of the code.

### III. Deterministic Game Rules

Game logic MUST be deterministic and reproducible. Word selection MUST be
index-based — `STARTER_WORDS[roomCreationCount % STARTER_WORDS.length]` (or an
equivalent room-derived index) — and MUST NOT use `Math.random()`. Scoring is
fixed: a correct guess is exactly 100 points, an incorrect guess adds 0. Guess
comparison MUST be trimmed and case-insensitive. There is exactly one round; no
rounds, rotation, timers, countdowns, or bonuses.

**Rationale:** Deterministic rules are testable and make acceptance criteria
verifiable across two browser tabs without flakiness.

### IV. Polling-Only Synchronization

All cross-client synchronization MUST use HTTP polling at approximately 2 seconds
via `setInterval` + `GET /rooms/:code`, with `clearInterval` cleanup on unmount.
WebSockets, Socket.io, server-sent events, and any real-time push protocol are
forbidden. The backend stores all state in memory only.

**Rationale:** The assignment fixes the sync model; introducing push protocols is
explicitly out of scope and would inflate difficulty without improving the
outcome.

### V. Incremental Validation

Work proceeds one scenario slice at a time. A slice is not done until its
acceptance criteria are validated in two browser tabs, and both `backend` and
`frontend` build with zero errors (`npm run build`) with existing tests passing.
The next scenario does not begin until the current one passes.

**Rationale:** Catching breakage at the slice boundary keeps the four artifacts
and the implementation aligned and the game continuously runnable.

### VI. AI Review Discipline

All AI-generated output MUST be reviewed line-by-line before it is committed. AI
usage MUST be disclosed in `REFLECTION.md`. Commits MUST be granular, explainable,
and traceable to a spec slice, with short, clean messages (for example
`feat: implement scenario 1 room setup and lobby`). Commit messages MUST NOT
include a `Co-Authored-By:` line.

**Rationale:** The reviewer assesses reasoning and traceability; unreviewed AI
output and noisy commits undermine both.

## Technology Constraints

Non-negotiable stack rules for this repository:

- TypeScript-first: all new code is fully typed; never use `any` — use `unknown`
  for genuinely dynamic values.
- Backend request/response validation MUST use Zod.
- Storage is in-memory only — no database (SQL, NoSQL, SQLite, etc.).
- No authentication, sessions, JWT, or OAuth.
- No new top-level npm dependencies beyond what the starter ships.
- No new state-management or routing libraries; follow the established
  `roomStore.ts` pattern and the React Router v6 already present.
- Out of scope (do not build, spec, plan, or task): WebSockets, persistence,
  auth, multiple rounds, drawer rotation, timers/countdowns/bonuses, custom or
  random word packs, spectator mode, moderation, room passwords/invite links,
  deployment/CI/Docker, and rewriting the starter.

## Development Workflow

1. Discovery is captured in `DISCOVERY.md` before any Spec Kit command runs.
2. Each of the four scenarios runs the full Principle II cycle and produces
   `specs/00N-*/spec.md`, `plan.md`, and `tasks.md`.
3. Implementation lands in granular commits, each traceable to a task and spec
   requirement.
4. Before any pull request, run both builds and the test suites; both MUST pass.
5. `REFLECTION.md` records what the starter had, what was added, AI usage, and
   tradeoffs.

## Governance

This constitution supersedes other practices for this repository. Amendments MUST
be made by editing this file, recording the change in the Sync Impact Report
comment, and bumping the version per semantic versioning:

- MAJOR: backward-incompatible removal or redefinition of a principle.
- MINOR: a new principle or materially expanded guidance.
- PATCH: clarifications and wording fixes.

Every spec, plan, task list, and commit is expected to verify compliance with
these principles. Complexity or any deviation MUST be justified in the relevant
artifact. `AGENTS.md` provides complementary runtime coding guidance and MUST not
contradict this constitution; where they differ, this constitution wins.

**Version**: 1.0.0 | **Ratified**: 2026-06-05 | **Last Amended**: 2026-06-05
