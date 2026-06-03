# Scribble Lab Constitution

This constitution governs the brownfield enhancement of the Scribble starter. It
constrains how features are specified, built, and reviewed — including
AI-assisted work — so that the specs, plans, tasks, and implementation stay
mutually consistent and easy to assess.

## Core Principles

### I. Extend, Never Replace
The starter is the baseline. Every change extends existing files, types, and
patterns rather than rewriting them. New behavior reuses the established
structures: backend `api`/`services`/`models` layering, the frontend
`useSyncExternalStore` room store, and React Router v6 pages. Unrelated
refactors are out of scope; a refactor is justified only when a scenario cannot
be implemented cleanly without it, and the justification is recorded in the plan.

### II. Spec-Driven, Incremental Delivery
Work proceeds one feature group at a time through the loop
specify → (clarify) → plan → tasks → implement → validate. No code for a feature
group is written before its spec has acceptance criteria and its plan names the
files and state changes. Each validated slice is a small, self-explaining commit
that traces back to a task. The PR diff is the artifact reviewers assess.

### III. Deterministic Game Rules (NON-NEGOTIABLE)
Game outcomes must be reproducible and independent of wall-clock timing or
randomness. Secret-word selection is a pure function of stable room data (e.g.
the room code) so every client agrees without extra coordination. Guess matching
is trim + case-insensitive equality. Scoring is fixed: a correct guess is worth
100, an incorrect guess 0; all scores start at 0. Identical inputs always produce
identical results, which keeps the logic unit-testable.

### IV. In-Memory State, Polling-Only Sync
All room and game state lives in the existing in-memory store; no database or
persistence. All multi-client synchronization is HTTP polling at ~2s; no
WebSockets or any push protocol. The server is the single source of truth, and
clients render from the latest fetched snapshot. State that no longer matters is
cleared explicitly (e.g. round state on restart) to avoid stateful bloat.

### V. Typed Contracts and Graceful Failure
All code is fully typed TypeScript — no `any` (`unknown` only when genuinely
dynamic). Request and response shapes are validated with Zod on the backend, and
the backend and frontend type definitions for shared shapes are kept in sync.
Invalid input is rejected with a clear, specific message; the UI surfaces errors
without crashing and never leaks the secret word to non-drawers.

## Additional Constraints

Scope is fixed by the lab's out-of-scope list and must not appear in any spec,
plan, task, or dependency: no WebSockets/real-time, databases, auth/sessions,
deployment/Docker/CI work, new state-management or routing libraries, multiple
rounds, drawer rotation, timers/countdowns, bonuses, custom/random word packs,
spectator mode, moderation, or room passwords/invite links. No top-level
dependency is added unless a committed spec justifies it. Word visibility is
enforced server-side: the secret word is included in a snapshot only for the
drawer.

## AI Usage Rules

AI assistance is used to draft artifacts and code, but the author owns every
committed line. AI output is accepted only after it is read and verified against
the relevant spec; unexplained or speculative additions are removed. AI must not
introduce out-of-scope features, forbidden technologies, or dependencies the spec
does not justify. When AI proposes a non-obvious decision, the decision (and any
deviation from the spec) is documented in the plan or reflection, not left
implicit in the diff.

## Review Process & Quality Gates

Before any commit: the change maps to a task; `npm run build` and `npm test` pass
on both backend and frontend; new game logic has unit tests; and the diff
contains nothing unrelated to the slice. Before a feature group is considered
done: its acceptance criteria are validated manually with two browser tabs.
Deterministic logic (word selection, guess matching, scoring) is covered by
backend unit tests. Deviations from the spec are documented rather than hidden.

## Governance

This constitution supersedes convenience. Amendments are made by editing this
file in a dedicated commit that states what changed and why, with the version and
amendment date bumped. Every commit and review verifies compliance; complexity
and any out-of-scope temptation must be justified against these principles or
dropped.

**Version**: 1.0.0 | **Ratified**: 2026-06-03 | **Last Amended**: 2026-06-03
