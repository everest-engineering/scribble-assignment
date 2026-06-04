<!--
SYNC IMPACT REPORT
==================
Version change: (none) → 1.0.0  (initial fill from template)
Modified principles: all placeholders replaced (first-time authoring)
Added sections: Core Principles (I–V), Brownfield Constraints, AI Usage & Review Discipline, Governance
Removed sections: none
Templates requiring updates:
  - .specify/templates/plan-template.md  ✅ Constitution Check gates now defined
  - .specify/templates/spec-template.md  ✅ Scope/out-of-scope constraints align with Section II
  - .specify/templates/tasks-template.md ✅ Task categories reflect principles (no auth, no DB, no WS tasks)
Follow-up TODOs: none — all fields resolved from README.md
-->

# Scribble Constitution

## Core Principles

### I. Brownfield-First — Preserve the Scaffold

All work MUST extend the existing starter codebase; rewriting starter files from scratch is forbidden.
Before touching any file, read and understand it. Changes MUST leave the codebase in a runnable state after
every commit. Unrelated refactors are prohibited.

**Rationale**: The scaffold provides a proven baseline. Drift between the spec, plan, and implementation is
the primary risk; preserving structure minimises it.

### II. In-Memory Only — No Persistence Layer

All runtime state MUST be stored exclusively in server-side memory (the existing room map).
No database (SQL, NoSQL, file-based, or embedded) is permitted at any layer.
The backend MUST remain stateless across restarts: restarting clears all rooms, and this is expected behaviour.

**Rationale**: Persistence introduces deployment, migration, and consistency concerns that are out of scope
for this lab. The constraint keeps complexity bounded and evaluation focused.

### III. HTTP Polling — No Real-Time Push

All client–server synchronisation MUST use HTTP polling (interval ≈ 2 s where specified).
WebSockets, Server-Sent Events, long-polling, and any real-time push protocol are forbidden.
Polling intervals MUST be implemented with `setInterval`/`clearInterval` and cleaned up on component unmount.

**Rationale**: The lab explicitly forbids WebSockets. Polling is sufficient for the session-scoped,
low-concurrency game flow and keeps the networking model simple and auditable.

### IV. Deterministic Game Rules — No Randomness

Game logic (word selection, scoring) MUST be deterministic and derived from the fixed starter seed data.
Words are drawn from the seed list `[rocket, pizza, castle, guitar, sunflower]`.
Scoring is fixed: correct guess = 100 points, incorrect guess = 0 points.
Timer, speed bonuses, drawer bonuses, and multiple rounds are forbidden.

**Rationale**: Determinism makes acceptance criteria testable and reproducible across reviewers without
shared state or mocking.

### V. TypeScript Strictness — No `any`

All new and modified code MUST be fully typed TypeScript.
Use of `any` is forbidden; use `unknown` when the type is genuinely dynamic and narrow explicitly.
Zod MUST be used on the backend to validate all incoming request payloads.
React components MUST use functional components with typed props.

**Rationale**: Type safety surfaces contract mismatches between frontend and backend early and keeps
AI-generated code reviewable and refactorable.

## Brownfield Constraints & Out-of-Scope Rules

The following items are **absolutely out of scope** and MUST NOT appear in any spec, plan, task, or commit:

- WebSockets, SSE, or any push protocol
- Databases or persistent storage of any kind
- Authentication, sessions, JWT, or accounts
- New state-management or routing libraries beyond what the starter ships
- Multiple rounds, drawer rotation, timers, countdowns, or bonus scoring
- Custom or random word packs beyond the five starter words
- Spectator mode, moderation, room passwords, or invite links
- Deployment, CI configuration, or Docker work

The starter API surface (`GET /health`, `POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code`) MUST
be preserved as-is. New endpoints MAY be added; existing contracts MUST NOT break.

New top-level npm dependencies MUST be justified in the PR description. Unjustified additions are rejected.

## AI Usage & Review Discipline

- AI-generated code MUST be read and understood before committing; blind acceptance is prohibited.
- Every AI-suggested change MUST be traced to an acceptance criterion in the spec before it is kept.
- AI output that violates any principle in this constitution MUST be discarded or corrected.
- Commits MUST be granular and meaningful; each commit SHOULD map to one task or one acceptance criterion.
- The PR diff is the primary review artefact; commits that bundle unrelated changes will be flagged.

Self-review checklist before each commit:
1. Does this change match a spec acceptance criterion?
2. Does it introduce any out-of-scope item listed above?
3. Is it fully typed (no `any`)?
4. Is the codebase still runnable after this change?
5. Is the commit message traceable to the spec or task?

## Governance

This constitution supersedes all other informal practices for the duration of this lab.
Amendments require: a written rationale, a version bump following semantic versioning, and an update to this
file committed before the amended practice is applied.

All spec, plan, and task artefacts MUST remain internally consistent with this constitution.
Any deviation found during review MUST be documented as a known gap with a justification.

Compliance is verified during PR review against the evaluation rubric in `README.md`.
The runtime development guidance file is `AGENTS.md` at the repository root.

**Version**: 1.0.0 | **Ratified**: 2026-06-04 | **Last Amended**: 2026-06-04
