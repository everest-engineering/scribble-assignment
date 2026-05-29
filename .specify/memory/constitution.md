<!--
SYNC IMPACT REPORT
==================
Version change: (template) → 1.0.0
Modified principles: All placeholders replaced with concrete project rules
Added sections: N/A (template structure preserved)
Removed sections: N/A
Templates reviewed:
  - .specify/templates/plan-template.md ✅ no structural changes required
  - .specify/templates/spec-template.md ✅ no structural changes required
  - .specify/templates/tasks-template.md ✅ no structural changes required
Follow-up TODOs: None — all placeholders resolved
-->

# Scribble Constitution

## Core Principles

### I. Brownfield-First

This project is a brownfield enhancement of an existing starter application.
All work MUST extend the existing codebase — rewriting the starter from scratch
is prohibited. Before adding any file or function, confirm the starter does not
already provide it. Prefer minimal additions over sweeping restructuring.
Existing conventions (naming, file structure, import style) MUST be followed
unless the spec explicitly introduces a new pattern with justification.

### II. Spec-Driven Development

Every code change MUST be traceable to an artifact (spec, plan, or task).
Implementation decisions that deviate from the spec MUST be documented in
the spec before committing. No code is written before the relevant acceptance
criterion exists in `speckit.specify`. No task is started before it appears in
`speckit.tasks`.

Artifacts are updated incrementally — one feature group at a time — in this
strict order: specify → clarify → plan → tasks → checklist → implement → validate.

### III. Deterministic Game Rules

All game-rule outcomes MUST be deterministic and reproducible given the same
inputs. Specifically:

- Secret word: selected by `STARTER_WORDS[(round - 1) % word count]` — index 0,
  so the first (and only) round always uses `"rocket"`.
- Drawer assignment: the room creator (host, first participant) is always the
  drawer for this single-round game.
- Scoring: correct guess = 100 points; incorrect guess = 0 points. No bonuses,
  no partial credit, no time modifiers.

Any deviation from these rules MUST be documented as a spec amendment before
implementation.

### IV. Strict Scope Discipline

The following are permanently out of scope and MUST NOT appear in any artifact
or code:

- WebSockets or real-time sync (polling only, ~2 s cadence)
- Databases or persistent storage (in-memory only)
- Authentication, accounts, or sessions
- Multiple rounds, drawer rotation, timers, countdowns, or bonuses
- Custom word packs, spectator mode, room moderation, passwords, or invite links
- Deployment, CI/CD, or Docker configuration
- New top-level npm dependencies not justified by a spec requirement
- Refactors of unrelated starter code

When an edge case is ambiguous, the simpler interpretation within scope MUST be
chosen and recorded as an assumption.

### V. Incremental Validation

Work proceeds in four feature groups, each gated by a validation checkpoint.
A group is complete only when its acceptance criteria pass in two browser tabs.
The next group MUST NOT begin implementation until the current group passes.

| Group | Gate |
|-------|------|
| 1. Room Setup & Lobby | Host tracking, polling, host-only start, 2-player minimum |
| 2. Game Start & Drawer Flow | Name validation, drawer assignment, drawer-only word |
| 3. Gameplay Interaction | Canvas, guess submit, synced history, scoring |
| 4. Result, Restart & Final Validation | Result state, clean restart, preserved players |

### VI. AI-Assisted, Human-Reviewed

AI output (code, specs, plans, tasks) MUST be reviewed and understood before
committing. The developer is responsible for every line in the diff, regardless
of whether AI generated it. AI suggestions that introduce out-of-scope features
or deviate from the spec MUST be rejected.

All AI usage decisions and tradeoffs MUST be recorded in `REFLECTION.md`.

## Coding Standards

- TypeScript strict mode required on both frontend and backend.
- No `any` except where the existing starter already uses it.
- No comments explaining what code does — only comments for non-obvious WHY
  (hidden constraints, spec-specific invariants).
- Validation occurs at system boundaries only (HTTP request body, user form
  input). Internal functions trust their callers.
- User-facing error messages MUST be human-readable (e.g., "Name cannot be
  empty", not "Validation error").
- Polling MUST use `setInterval` / `clearInterval` inside `useEffect` with
  proper cleanup. No `setTimeout` chains.

## Review Discipline

Before committing any implementation:

1. Verify the changed behavior matches at least one acceptance criterion in the
   current feature group's spec.
2. Run `npm run build` in both `backend/` and `frontend/` — zero TypeScript
   errors required.
3. Manually test the happy path and at least one error path in the browser.
4. Confirm no out-of-scope code was introduced.

## Governance

This constitution supersedes all other informal conventions for the duration of
this lab. Amendments require a version bump following semantic versioning:

- MAJOR: removal or redefinition of an existing principle.
- MINOR: new principle or materially expanded guidance.
- PATCH: clarification, wording, or typo fix.

`LAST_AMENDED_DATE` is updated on every change. All PRs must verify compliance
before approval.

**Version**: 1.0.0 | **Ratified**: 2026-05-28 | **Last Amended**: 2026-05-28
