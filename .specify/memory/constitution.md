<!--
SYNC IMPACT REPORT
==================
Version change: (template, unversioned) → 1.0.0
Rationale: First concrete ratification of the constitution from the template.
           MAJOR bump because the document moves from placeholder tokens to
           binding, project-specific governance.

Principles defined:
  1. Spec-Driven Workflow (NON-NEGOTIABLE)
  2. Brownfield Discipline & Scope Boundaries
  3. Deterministic Game Rules
  4. Reviewed AI-Assisted Development
  5. Incremental Delivery & Validation

Sections defined:
  - Technology & Scope Constraints (was [SECTION_2_NAME])
  - Development Workflow & Quality Gates (was [SECTION_3_NAME])
  - Governance

Templates reviewed for alignment:
  ✅ .specify/templates/plan-template.md — Constitution Check gate references this file generically; no change needed
  ✅ .specify/templates/spec-template.md — scope/acceptance sections align with Principles 1, 3, 5
  ✅ .specify/templates/tasks-template.md — discovery/testing/review task types align with Principles 1, 4, 5
  ✅ README.md — "Artifact Contents" (constitution coverage) and scope boundaries align with all principles

Deferred TODOs: none. RATIFICATION_DATE set to project scaffold date.
-->

# Scribble Lab Constitution

This constitution governs the Scribble-style guessing game lab. It constrains how AI-assisted,
spec-driven development is performed against an intentionally incomplete brownfield starter
(Vite + React + TypeScript frontend, Node.js + Express + TypeScript backend, in-memory state).

## Core Principles

### I. Spec-Driven Workflow (NON-NEGOTIABLE)

Every behavior change MUST flow through the Spec Kit loop in order: Discovery → Specify →
Clarify → Plan → Tasks → Implement → Validate. Implementation MUST NOT begin before a
specification with explicit acceptance criteria and a plan tied to real files exist for the
slice being built. Discovery MUST document at least 3 incomplete behaviors, at least 2
assumptions, and the relevant starter files before any code is written. Ambiguity is resolved
through structured clarification, not invented in code.

**Rationale**: Spec Kit is the subject of the lab; the game is only the vehicle. Traceability
from artifact to commit is the primary thing reviewers assess.

### II. Brownfield Discipline & Scope Boundaries

The starter MUST be enhanced, never rewritten from scratch. The following are out of scope and
MUST NOT appear in any spec, plan, task, or implementation: WebSockets/real-time sync,
databases or persistent storage, authentication/accounts/sessions, deployment/hosting/CI/Docker,
new state-management or routing libraries beyond what the starter ships, multiple rounds, drawer
rotation, timers/countdowns/bonuses, custom or random word packs, spectator mode, moderation
(kick/mute), room passwords or invite links, and unrelated refactors. New top-level dependencies
MUST be justified in the plan. Room and game state remain in-memory only.

**Rationale**: These boundaries keep the lab at a focused, medium difficulty and prevent drift
between the spec, plan, tasks, and implementation.

### III. Deterministic Game Rules

Game logic MUST be deterministic and specified explicitly. The secret word MUST be selected
deterministically from the seeded starter list (`rocket`, `pizza`, `castle`, `guitar`,
`sunflower`) — never randomly. Guesses MUST be trimmed and compared case-insensitively; empty or
whitespace-only guesses MUST be rejected with clear feedback. Scoring is fixed: a correct guess
scores 100, an incorrect guess adds 0, and all scores start at 0. Lobby and guess-history state
MUST stay synchronized across players via polling at approximately 2-second cadence. Player names
MUST be trimmed, with empty/whitespace-only names rejected.

**Rationale**: Deterministic rules make acceptance criteria objectively testable and keep
multi-tab validation reproducible.

### IV. Reviewed AI-Assisted Development

AI-generated output MUST be critically reviewed by the author before it is committed; the author
is accountable for every committed line. Commits MUST be granular, meaningful, and explainable,
each traceable to a spec, plan, or task. Where implementation deviates from the spec, the
deviation MUST be documented. AI usage and key tradeoffs MUST be captured in the reflection
report.

**Rationale**: The PR diff and reflection are what reviewers grade; unreviewed AI output erodes
both correctness and traceability.

### V. Incremental Delivery & Validation

Work proceeds one meaningful, independently testable slice at a time, in business-scenario order
(Room Setup → Game Start & Drawer → Gameplay → Result & Restart). A slice is complete only when
its acceptance criteria are validated — including the multi-room isolation and two-browser-tab
flows — and only then does the next scenario begin. Both `backend` and `frontend` builds MUST
pass (`npm run build`) before changes are handed off. Code MUST be TypeScript and match the
existing style, structure, and conventions of the starter.

**Rationale**: Incremental, validated delivery keeps each commit demonstrable and prevents
regressions across the four checkpoints.

## Technology & Scope Constraints

- **Frontend**: Vite + React + TypeScript (`frontend/`); runs on `http://localhost:5173`.
- **Backend**: Node.js + Express + TypeScript (`backend/`); runs on `http://localhost:3001`;
  exposes `GET /health`, `POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code` plus any
  endpoints justified by the spec.
- **State**: in-memory only; restarting the backend clears all rooms. No persistence layer.
- **Tooling baseline**: Node.js 18+, npm 9+, Git.
- **Sync model**: polling only (~2s); no WebSockets or server push.
- Any technology choice beyond the above MUST be justified in the plan's Complexity Tracking
  section or it is rejected.

## Development Workflow & Quality Gates

- Maintain the required Spec Kit artifacts throughout: discovery notes, `/speckit.constitution`,
  `/speckit.specify`, `/speckit.plan`, and `/speckit.tasks`, updated incrementally per feature
  group. Complete a minimum of 4 specify iterations (one per business scenario).
- For each slice, follow the loop: read starter files → update spec with acceptance criteria →
  clarify → plan state/data-flow/file changes → decompose into ordered testable tasks →
  implement → validate with two browser tabs → advance only on pass.
- **Quality gates before hand-off**: both builds succeed; acceptance criteria for the slice pass;
  edge cases (empty/invalid input, case-insensitive guess, multi-room isolation) are exercised;
  commits are granular and traceable.
- Provide a reflection report (`.md`) covering what the starter already had, what was added, key
  decisions, AI usage, and tradeoffs.

## Governance

This constitution supersedes ad-hoc development practices for this lab. All work, including
AI-assisted contributions, MUST comply with the principles above; any pull request that violates
a principle MUST either be corrected or carry an explicit, justified exception recorded in the
plan's Complexity Tracking section.

Amendments are made by editing this file. Versioning follows semantic versioning:
- **MAJOR**: removing or redefining a principle, or backward-incompatible governance changes.
- **MINOR**: adding a principle/section or materially expanding guidance.
- **PATCH**: clarifications, wording, and non-semantic refinements.

Each amendment MUST update the version line and the Sync Impact Report, and MUST re-check the
`plan`, `spec`, and `tasks` templates plus `README.md` for alignment. Compliance is reviewed at
every checkpoint and at PR time.

**Version**: 1.0.0 | **Ratified**: 2026-06-05 | **Last Amended**: 2026-06-05
