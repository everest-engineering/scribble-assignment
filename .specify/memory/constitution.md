<!--
SYNC IMPACT REPORT
==================
Version change: (template) → 1.0.0
Bump rationale: First concrete publication. Replaces unfilled template placeholders
with five ratified principles plus Technology, Workflow, and Governance sections.
Semantic version starts at 1.0.0 per project policy for the initial ratified release.

Modified principles:
  - [PRINCIPLE_1_NAME] → I. Spec Kit First (NON-NEGOTIABLE)
  - [PRINCIPLE_2_NAME] → II. Brownfield Discipline (NON-NEGOTIABLE)
  - [PRINCIPLE_3_NAME] → III. TypeScript Strictness & Validated Boundaries
  - [PRINCIPLE_4_NAME] → IV. Deterministic Game Rules
  - [PRINCIPLE_5_NAME] → V. AI-Assisted Self-Review

Added sections:
  - Technology & Scope Constraints (Section 2)
  - Development Workflow & Quality Gates (Section 3)
  - Governance

Removed sections: none

Templates requiring updates:
  - .specify/templates/plan-template.md — ⚠ pending: "Constitution Check" section is a
    generic placeholder; future /speckit-plan runs should enumerate concrete gates derived
    from Principles I–V (Spec traceability, scope check, type/validation check, determinism
    check, self-review check). No edit required to the template itself; gates are filled
    per-feature at plan time.
  - .specify/templates/spec-template.md — ✅ aligned (acceptance criteria + edge cases
    already mandatory; no constitution-driven changes needed).
  - .specify/templates/tasks-template.md — ✅ aligned (story-grouped, independent-testable
    decomposition matches Principle I and the README build order).
  - README.md — ✅ aligned (already enumerates scope, out-of-scope, scenarios, build order).
  - AGENTS.md — ✅ aligned (tech stack and "Strictly Forbidden" list match Principles II–III).
  - CLAUDE.md — ✅ aligned (delegates to current plan; no constitution-specific edits).

Follow-up TODOs: none. All placeholders resolved.
-->

# Scribble Lab Constitution

## Core Principles

### I. Spec Kit First (NON-NEGOTIABLE)

Every change MUST trace to a Spec Kit artifact. The order is fixed:
Discovery → `/speckit-specify` → `/speckit-clarify` → `/speckit-plan` →
`/speckit-tasks` → `/speckit-implement` → two-tab validation.
No production code lands without a corresponding task that references a
specification scenario or explicit acceptance criterion. Ambiguity MUST be
resolved through `/speckit-clarify` before planning; speculative implementation
ahead of the spec is prohibited.

**Rationale**: The lab grades on internal consistency and traceability between
artifacts and implementation. Out-of-order work creates drift that the rubric
penalizes and that future contributors cannot follow.

### II. Brownfield Discipline (NON-NEGOTIABLE)

The starter is the baseline; work is additive enhancement, never a rewrite.
The Explicitly Out Of Scope list in `README.md` MUST NOT appear in any spec,
plan, task, or implementation. New top-level dependencies are forbidden unless
a plan section names the dependency, justifies why an in-tree solution is
insufficient, and identifies the file paths that will consume it. Unrelated
refactors are excluded from any feature branch.

**Rationale**: The lab’s scope boundaries exist to keep difficulty focused.
Scope creep masks signal in the PR diff and makes acceptance impossible to
demonstrate.

### III. TypeScript Strictness & Validated Boundaries

All code MUST be fully typed. `any` is forbidden; use `unknown` plus narrowing
where dynamism is genuine. Backend request and response payloads MUST be
validated with Zod schemas declared alongside the route. Frontend code MUST
handle API failures without crashing the UI and MUST NOT trust server fields
that are not modeled in a shared or mirrored type. ES Modules are mandatory on
both sides; CommonJS additions are forbidden.

**Rationale**: The starter ships strict TS + Zod conventions. Diverging from
them silently widens the surface area for bugs the rubric tests for
(empty/invalid inputs, multi-room isolation, case-insensitive comparison).

### IV. Deterministic Game Rules

Game-rule behavior MUST be deterministic and identical across all connected
clients. This means: secret-word selection MUST be deterministic from room
state (no `Math.random()` at draw time); guess comparison MUST trim and
lower-case both sides; scoring MUST be exactly 100 for a correct guess and 0
otherwise; lobby and guess-history polling cadence MUST be approximately 2
seconds; room codes MUST isolate state so two rooms never observe each other's
words, drawings, guesses, or scores. Any deviation MUST be documented in the
plan’s risks section and approved before implementation.

**Rationale**: Scenarios 1–4 in the README depend on observable equivalence
across two browser tabs. Non-determinism is the most common source of
"works-on-my-machine" failures during validation.

### V. AI-Assisted Self-Review

Every AI-generated change MUST be read line-by-line and reconciled against the
spec scenario it claims to implement before commit. Commits MUST be granular
and individually explainable; each commit message MUST identify the scenario
or task ID it advances. Manual validation in two browser tabs is mandatory
before a scenario is marked complete; passing type-checks and builds is
necessary but not sufficient. Before opening the PR, both `backend` and
`frontend` `npm run build` MUST succeed on a clean install.

**Rationale**: The reflection report and PR diff are the primary review
artifacts. Coarse or unreviewed AI commits hide decisions reviewers need to
assess and produce drift between spec and code.

## Technology & Scope Constraints

The project’s technology stack is fixed by the starter and MUST NOT be changed:

- Frontend: Vite + React 18 + React Router v6 + TypeScript
- Backend: Node.js 18+ + Express + TypeScript + Zod, executed via `tsx`
- State: in-memory on the backend; client state via existing patterns in
  `frontend/src/state/` (e.g., `roomStore.ts`)
- Sync: HTTP polling at approximately 2 seconds; no WebSockets or push protocols
- Persistence: none; restarting the backend clears all rooms — this is expected
- Identity: none; no authentication, sessions, JWT, or OAuth

The following are out of scope and MUST NOT appear in artifacts or code:
WebSockets/real-time push, databases or any persistent storage, auth/accounts,
deployment/CI/Docker, new state-management or routing libraries, multiple
rounds, drawer rotation, timers, countdowns, speed/drawer bonuses, custom or
random word packs, spectator mode, moderation (kick/mute), room passwords or
invite links, rewrites of the starter, and unrelated refactors.

The seed data (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`; roles
`drawer`, `guesser`) is the authoritative starter content; selection logic
MUST consume this list rather than redefining it.

## Development Workflow & Quality Gates

1. **Discovery before specification**: every feature group begins with reading
   the relevant starter files and recording at least the gaps and assumptions
   the README requires (≥3 incomplete behaviors, ≥2 assumptions, relevant
   files). Discovery output is a prerequisite for `/speckit-specify`.

2. **Granular commits**: one logical slice per commit; commit message names
   the scenario or task ID. Squashing across scenarios is forbidden; the PR
   diff must remain explainable scenario-by-scenario.

3. **Build validation gate**: both `cd backend && npm run build` and
   `cd frontend && npm run build` MUST succeed before any PR is opened or any
   scenario is marked complete.

4. **Two-tab acceptance gate**: each scenario MUST be validated by opening two
   browser tabs against the running app and exercising the scenario’s
   acceptance criteria end-to-end. Type checks and unit tests do not satisfy
   this gate.

5. **Polling cadence rule**: any new polling loop MUST target ~2 seconds and
   MUST stop cleanly on unmount or room exit. Burst polling, exponential
   backoff, or push-style heuristics are out of scope.

6. **Validation discipline**: empty/whitespace-only player names, room codes,
   and guesses MUST be rejected at both the API boundary (Zod) and the UI with
   a user-visible message. Multi-room isolation MUST be verified during
   two-tab validation, not assumed.

7. **Reflection report**: a brief `.md` reflection accompanies the PR,
   covering what the starter provided, what was added, AI usage, and key
   tradeoffs.

## Governance

This constitution supersedes ad-hoc heuristics, agent prompts, and personal
preference when they conflict. Amendments are made by editing this file in a
dedicated commit that (a) bumps the version per the policy below, (b) updates
`Last Amended`, and (c) records the change in a Sync Impact Report comment at
the top of the file.

**Versioning policy** (semantic):

- **MAJOR**: removal or backward-incompatible redefinition of a principle,
  the technology stack, or a governance rule.
- **MINOR**: addition of a new principle or section, or materially expanded
  guidance that introduces a new gate.
- **PATCH**: clarifications, wording, typo fixes, non-semantic refinements.

**Compliance review**: every PR description MUST state, or implicitly
demonstrate via its task list, which principles apply and how the change
respects them. Reviewers MUST flag drift from Principles I, II, and IV as
blocking. `/speckit-plan` runs MUST populate the "Constitution Check" section
with concrete gates derived from the principles above (Spec traceability,
scope check, type/validation check, determinism check, self-review check)
rather than leaving the placeholder.

**Runtime guidance**: `README.md` is the authoritative scope and scenario
reference; `AGENTS.md` is the authoritative coding-standard reference for
AI assistants; this constitution governs both when they disagree.

**Version**: 1.0.0 | **Ratified**: 2026-06-02 | **Last Amended**: 2026-06-02
