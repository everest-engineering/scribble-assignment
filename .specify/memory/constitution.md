<!--
SYNC IMPACT REPORT
Version change: (uninitialized template) → 1.0.0
Bump rationale: Initial ratification of the project constitution (MAJOR baseline).
Modified principles: none (first definition)
Added principles:
  - I. TypeScript-First & Type Safety
  - II. Architectural Constraints (In-Memory, Polling, No Real-Time/DB/Auth)
  - III. Deterministic Game Rules
  - IV. Spec-Driven Workflow
  - V. Disciplined AI Usage & Self-Review
  - VI. Testing & Validation Discipline
Added sections:
  - Additional Constraints (Tech Stack & Structure)
  - Development Workflow & Quality Gates
  - Governance
Removed sections: none
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ reviewed (Constitution Check aligns; generic gates)
  - .specify/templates/spec-template.md ✅ reviewed (no mandatory-section conflicts)
  - .specify/templates/tasks-template.md ✅ reviewed (testing/validation task types compatible)
Deferred TODOs: none
-->

# Scribble Constitution

This constitution governs the brownfield enhancement of the Scribble multiplayer drawing
game. It constrains how features are specified, planned, implemented, and reviewed. It
supersedes ad-hoc practice. Source guidance in `AGENTS.md` is authoritative for tech stack
and structure; this document encodes the non-negotiable principles built on top of it.

## Core Principles

### I. TypeScript-First & Type Safety
All new code and refactors MUST be fully typed. `any` MUST NOT be used; use `unknown` for
genuinely dynamic values and narrow before use. Prefer immutable data structures and pure
functions; avoid in-place mutation of shared state outside the designated store layer.
Errors MUST be handled explicitly: the backend uses centralized error handling and Zod
validation at every request boundary; the frontend MUST NOT crash on API exceptions and
MUST surface clear, user-facing feedback.
**Rationale**: A typed, fail-fast codebase keeps a multiplayer state machine debuggable and
prevents whole classes of runtime errors in an environment with no persistence to fall back on.

### II. Architectural Constraints (In-Memory, Polling, No Real-Time/DB/Auth)
The following are STRICTLY FORBIDDEN and MUST NOT appear in any spec, plan, task, or
implementation: WebSockets or any real-time push protocol; databases or persistent storage
of any kind; authentication, sessions, JWT, or OAuth. All cross-client synchronization MUST
use HTTP polling (~2s cadence for lobby and gameplay). All room and game state lives in
memory only; inactive rooms MUST be removable and the memory footprint kept minimal.
**Rationale**: These boundaries define the lab. Crossing them creates drift between
artifacts and implementation and is explicitly out of scope.

### III. Deterministic Game Rules
Game logic MUST be deterministic and reproducible. Secret-word selection MUST be a
deterministic function of room state drawn from the seeded starter word list — never random
or from custom packs. Drawer assignment MUST follow a defined, predictable rule (host/first
player). Scoring MUST be exact: a correct guess scores 100, an incorrect guess adds 0; all
scores start at 0. Guess comparison MUST trim input and compare case-insensitively. Identical
inputs MUST always produce identical outcomes.
**Rationale**: Determinism makes behavior testable against acceptance criteria and verifiable
across two browser tabs without flakiness.

### IV. Spec-Driven Workflow
Work MUST flow through Spec Kit artifacts in order: discovery → specify → clarify → plan →
tasks → implement → validate. Code MUST trace back to a specification with explicit
acceptance criteria. Each business scenario MUST be completed and validated before the next
begins. A minimum of four specify iterations (one per scenario group) MUST be maintained.
Ambiguity MUST be resolved via clarification before planning, not during implementation.
**Rationale**: Spec Kit is the focus of the lab; the game is the vehicle. Traceability is
how the work is assessed.

### V. Disciplined AI Usage & Self-Review
AI-generated output MUST be critically reviewed before it is committed — never accepted
blindly. Every change MUST be checked against the active spec, the forbidden-pattern list,
and the existing directory structure for consistency. Deviations from the spec MUST be
documented, not hidden. Commits MUST be granular, meaningful, and individually explainable.
**Rationale**: Reviewer trust depends on a diff where every decision is traceable and
justified; unreviewed AI output erodes that.

### VI. Testing & Validation Discipline
Acceptance criteria MUST be validated with two browser tabs before a scenario is considered
done. Core deterministic logic (room store, schemas, scoring, guess comparison) SHOULD be
covered by unit tests, extending the existing test setup rather than replacing it. Both
builds (`backend` and `frontend`) MUST pass before changes are handed off. Edge cases —
empty/whitespace input, invalid/empty room codes, case-insensitive guesses, multi-room
isolation — MUST be explicitly exercised.
**Rationale**: A guessing game's value is in its edge behavior; validating it is the
difference between "looks done" and "is done".

## Additional Constraints (Tech Stack & Structure)

Tech stack is fixed by `AGENTS.md`: backend is Node.js + Express + TypeScript + Zod (run via
`tsx`); frontend is React 18 + React Router 6 + Vite + TypeScript. No new state-management or
routing libraries beyond what the starter ships. No unjustified top-level dependencies and no
unrelated refactors. Structure MUST be respected: backend `src/api` (routes), `src/services`
(business logic), `src/models` (types); frontend complex state in `src/state` following the
established `roomStore.ts` pattern, styling in `app.css` or CSS modules. Out-of-scope items
listed in `README.md` (multiple rounds, timers, drawer rotation, spectators, moderation, room
passwords, etc.) MUST NOT be built or referenced in artifacts.

## Development Workflow & Quality Gates

1. Discovery before code: read relevant starter files; document gaps and assumptions.
2. Specify acceptance criteria; clarify ambiguity before planning.
3. Plan against real files and the real state model; decompose into ordered, testable tasks.
4. Implement one meaningful slice at a time and commit it.
5. Validate the slice's acceptance criteria in two browser tabs before moving on.
6. Run both builds before handoff.
7. Keep `REFLECTION.md` current as scope is added.

Each gate is a stop condition: a scenario does not advance while its acceptance criteria or
builds are failing.

## Governance

This constitution supersedes ad-hoc practice for this repository. Amendments MUST be made by
editing this file, MUST state a rationale, and MUST follow semantic versioning: MAJOR for
backward-incompatible principle removal/redefinition, MINOR for a newly added or materially
expanded principle/section, PATCH for clarifications and wording. On amendment, dependent
Spec Kit templates (`plan-template.md`, `spec-template.md`, `tasks-template.md`) MUST be
re-checked for alignment and a Sync Impact Report recorded at the top of this file. All specs,
plans, tasks, and reviews MUST verify compliance with these principles; any added complexity
MUST be justified against them. `AGENTS.md` remains the runtime guidance file for tech-stack
and structural detail.

**Version**: 1.0.0 | **Ratified**: 2026-06-05 | **Last Amended**: 2026-06-05
