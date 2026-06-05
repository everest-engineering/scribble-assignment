<!--
Sync Impact Report
- Version change: (template) → 1.0.0
- Ratified: 2026-06-05 | Last Amended: 2026-06-05
- Modified principles (placeholder → concrete):
  - [PRINCIPLE_1_NAME] → I. Extend, Don't Replace (Brownfield Discipline)
  - [PRINCIPLE_2_NAME] → II. Spec-Driven & Traceable
  - [PRINCIPLE_3_NAME] → III. Deterministic Game Rules
  - [PRINCIPLE_4_NAME] → IV. Typed Contracts & Validation at the Edge
  - [PRINCIPLE_5_NAME] → V. Stay In Scope (Constraints Are Non-Negotiable)
- Added sections: AI Usage Rules (SECTION_2); Review Discipline & Quality Gates (SECTION_3)
- Removed sections: none
- Templates reviewed for alignment:
  - .specify/templates/plan-template.md ✅ (Constitution Check aligns)
  - .specify/templates/spec-template.md ✅ (scope/assumptions align)
  - .specify/templates/tasks-template.md ✅ (testing/validation tasks align)
- Deferred TODOs: none
-->

# Scribble Lab Constitution

The single source of truth that constrains how this brownfield Scribble game is built,
how AI assistance is used, and how every change is reviewed before it is committed.

## Core Principles

### I. Extend, Don't Replace (Brownfield Discipline)

The starter is the baseline; we add behavior, we do not rewrite it.

- New code MUST follow the existing directory structure (`backend/src/{api,services,models,seed}`,
  `frontend/src/{pages,components,state,services}`) and the patterns already in use (external store
  in `state/roomStore.ts`, Zod schemas in `api/schemas.ts`).
- Unrelated refactors are forbidden inside a feature change. If a refactor is genuinely required, it
  MUST be its own task with its own justification.
- No new top-level dependency may be added unless a spec or plan explicitly justifies it.

**Rationale:** Drift between starter and rewrite destroys the traceability and review quality this
lab is graded on.

### II. Spec-Driven & Traceable

Code follows artifacts; artifacts are kept honest against code.

- Work proceeds in a fixed order per feature group: Discovery → Specify → (Clarify) → Plan → Tasks →
  Implement → Validate.
- Every functional requirement MUST have testable acceptance criteria, and every implemented
  behavior MUST trace back to a requirement in the spec.
- When implementation must deviate from the spec/plan, the deviation MUST be documented in the
  relevant artifact in the same change — code and artifacts never silently diverge.
- Commits are granular and explainable, each tied to a task or requirement.

**Rationale:** The artifacts are the deliverable; the game is the vehicle.

### III. Deterministic Game Rules

Game logic is pure, predictable, and reproducible.

- Word selection MUST be deterministic (derived from stable room state such as the room code), never
  `Math.random()`, so the same room yields the same word and is unit-testable.
- Guess comparison MUST be trimmed and case-insensitive; scoring MUST be fixed (correct = +100,
  incorrect = +0) with all scores starting at 0.
- Core rules (word selection, guess evaluation, scoring) MUST live in pure functions in
  `services`/`models` and be covered by unit tests, independent of HTTP and React.

**Rationale:** Determinism makes the game testable and makes acceptance criteria verifiable.

### IV. Typed Contracts & Validation at the Edge

Trust nothing at the boundary; type everything inside it.

- All request payloads and route params MUST be validated with Zod at the API edge; invalid or empty
  input returns a clear error with an appropriate HTTP status, never a silent default (no more
  empty names becoming "Player").
- TypeScript is strict everywhere. `any` is forbidden; use `unknown` and narrow when a type is truly
  dynamic. Backend and frontend types for the same contract MUST stay in sync.
- Viewer-specific data (e.g., the secret word) MUST be enforced server-side in the snapshot
  projection, not hidden only in the UI.

**Rationale:** Validation gaps (silent "Player" default, shared snapshots) are the starter's biggest
correctness holes; closing them at the edge is non-negotiable.

### V. Stay In Scope (Constraints Are Non-Negotiable)

The technical guardrails are hard limits, not suggestions.

- FORBIDDEN tech: WebSockets/real-time push, databases/persistence, auth/sessions/accounts,
  deployment/CI/Docker, new state-management or routing libraries.
- FORBIDDEN game features: multiple rounds, drawer rotation, timers/countdowns, speed/drawer bonuses,
  custom or random word packs, spectator mode, moderation (kick/mute), room passwords/invite links.
- All synchronization MUST use HTTP polling (~2s). All state is in-memory only and is expected to be
  lost on backend restart.

**Rationale:** These boundaries keep the lab focused; out-of-scope work creates artifact drift and
rarely improves the outcome.

## AI Usage Rules

- AI proposes; the developer disposes. Generated code MUST be read and understood before it is
  committed — no opaque blobs, no generated binaries or long hashes.
- AI output MUST be checked against this constitution and the active spec before acceptance; anything
  that violates scope (Principle V) is rejected outright.
- Each AI-assisted change MUST be explainable in plain language in its commit message and, where it
  affects behavior, reflected in the spec/plan/tasks.
- AI-suggested dependencies, libraries, or architectural shifts are rejected unless an artifact
  justifies them (Principles I & V).

## Review Discipline & Quality Gates

Before any change is committed:

1. **Builds pass:** `cd backend && npm run build` and `cd frontend && npm run build` succeed.
2. **Tests pass:** existing and newly added unit tests are green; new game rules ship with tests.
3. **Spec alignment:** the change maps to a requirement; deviations are documented.
4. **Scope check:** no forbidden tech or features were introduced.
5. **Manual validation:** behavior is verified in two browser tabs against the scenario's acceptance
   criteria before the feature group is considered done.

## Governance

- This constitution supersedes ad-hoc preferences. When guidance conflicts, the constitution wins,
  then the active spec, then the plan.
- Amendments MUST be made by editing this file, bumping the version per semantic versioning
  (MAJOR = incompatible principle change/removal, MINOR = new principle/section, PATCH = wording),
  and updating the Sync Impact Report comment above.
- Every commit/PR is expected to comply with the Quality Gates; complexity or scope expansion must be
  justified against these principles or it is reverted.
- Repo-specific working guidance lives in `AGENTS.md` and `README.md`; this document governs the
  principles behind them.

**Version**: 1.0.0 | **Ratified**: 2026-06-05 | **Last Amended**: 2026-06-05
