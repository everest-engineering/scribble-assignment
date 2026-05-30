<!--
Sync Impact Report
==================
Version change: (template/unratified) → 1.0.0
Modified principles: N/A (initial ratification from template placeholders)
Added sections:
  - Core Principles (5 principles)
  - Technology & Out-of-Scope Constraints
  - AI-Assisted Development & Review Discipline
  - Governance
Removed sections: None
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ updated
  - .specify/templates/spec-template.md ✅ no changes required (generic; aligns with acceptance-criteria model)
  - .specify/templates/tasks-template.md ✅ updated (foundational examples aligned to in-memory REST stack)
  - README.md ✅ no changes required (already references constitution scope)
  - AGENTS.md ✅ no changes required (runtime guidance; constitution supersedes on conflict)
Follow-up TODOs: None
-->

# Scribble Constitution

## Core Principles

### I. Brownfield First, Minimal Scope

All work MUST extend the existing Scribble starter; rewriting from scratch is forbidden.
Before adding code, inspect relevant starter files and document gaps, assumptions, and
affected paths. Changes MUST be the smallest correct diff that satisfies the current
spec slice. Unrelated refactors, unjustified top-level dependencies, and out-of-scope
features MUST NOT be introduced.

**Rationale**: This lab is a brownfield enhancement. Focused diffs keep artifacts,
implementation, and review traceable.

### II. TypeScript-First with Zod Validation

All new and modified code MUST be fully typed TypeScript using ES modules. Avoid `any`;
use `unknown` only when input is genuinely dynamic. Backend request and response payloads
MUST be validated with Zod. Prefer immutable data and pure functions. Backend errors MUST
fail fast through centralized handlers; frontend UI MUST NOT crash on API failures.

**Rationale**: Shared typing and runtime validation prevent silent contract drift between
the React client and Express API.

### III. HTTP Polling Sync & In-Memory State Only (NON-NEGOTIABLE)

Multiplayer sync MUST use HTTP polling only (~2s cadence in lobby and gameplay). WebSockets,
Socket.io, and other real-time push protocols are forbidden. All room and game state MUST
live in backend memory; databases and persistent storage are forbidden. Inactive rooms MUST
be removed explicitly to limit memory footprint. Authentication, sessions, JWT, and OAuth
are forbidden.

**Rationale**: Lab constraints mirror the starter architecture and keep scope focused on
spec-driven REST design.

### IV. Spec Kit Traceability

Every implementation slice MUST trace to Spec Kit artifacts: discovery notes, spec
(with acceptance criteria), plan (state model, data flow, file paths), and ordered tasks.
Work proceeds scenario-by-scenario (Room Setup → Game Start → Gameplay → Result/Restart).
Deviations from the spec MUST be documented before merge. Commits MUST be granular and
explainable against a task or acceptance criterion.

**Rationale**: Spec Kit is the focus of the lab; the game is the vehicle for demonstrating
structured AI-assisted delivery.

### V. Deterministic Game Rules & Two-Browser Validation

Game behavior MUST be deterministic and match README business scenarios: host on room
creation; trimmed, non-empty player names; deterministic word selection from the starter
list; drawer-only secret word visibility; case-insensitive guess comparison; correct guess
scores 100; incorrect guesses score 0; synced guess history via polling; clean restart
preserving players while clearing round state. Each completed slice MUST be validated with
two browser tabs before advancing. Backend and frontend builds MUST pass (`npm run build`
in each app) before handoff.

**Rationale**: Deterministic rules make acceptance criteria testable without hidden randomness
or ambiguous scoring.

## Technology & Out-of-Scope Constraints

**Stack (fixed)**:

- Backend: Node.js, Express, TypeScript, Zod, `tsx`; structure under `backend/src/{api,services,models}`
- Frontend: React 18, React Router v6, Vite, TypeScript; state in `frontend/src/state`; styling in
  `app.css` or CSS modules

**Explicitly out of scope** (MUST NOT appear in spec, plan, tasks, or code):

- WebSockets or real-time sync beyond HTTP polling
- Databases or persistent storage
- Authentication, accounts, or sessions
- Deployment, hosting, CI, or Docker
- New state-management or routing libraries beyond the starter
- Multiple rounds, drawer rotation, timers, countdowns, or bonus scoring
- Custom or random word packs, spectator mode, moderation (kick/mute), room passwords
- Unjustified top-level dependencies or unrelated refactors

**Runtime guidance**: See `AGENTS.md` for day-to-day agent and developer conventions.
On conflict, this constitution takes precedence.

## AI-Assisted Development & Review Discipline

AI-generated output MUST be critically reviewed before commit. Agents MUST give concise,
direct answers and prefer minimal diffs over large rewrites. When specifying or planning,
resolve ambiguity through structured clarification before implementation. Each feature
group follows: Discovery → Specify → Clarify → Plan → Tasks → Implement → Validate.

Self-review checklist before each commit:

1. Behavior matches the current spec acceptance criteria
2. No forbidden technologies or out-of-scope features introduced
3. Types and Zod schemas cover new API surfaces
4. Two-browser manual test passes for the current scenario
5. Builds succeed in `backend/` and `frontend/`

Automated test tasks are optional unless explicitly requested in the feature spec; manual
two-browser validation is the minimum bar for gameplay features.

## Governance

This constitution supersedes ad-hoc practices for the Scribble lab. Amendments require:

1. Documented rationale in a constitution update (via `/speckit-constitution`)
2. Semantic version bump per change type:
   - **MAJOR**: Principle removal or backward-incompatible governance change
   - **MINOR**: New principle or materially expanded guidance
   - **PATCH**: Clarifications, wording, or non-semantic refinements
3. Propagation to dependent templates (plan, spec, tasks) and verification of internal
   consistency across artifacts

All specs, plans, and tasks MUST pass a Constitution Check before implementation.
Complexity that violates a principle MUST be recorded in the plan's Complexity Tracking
table with justification. Compliance SHOULD be re-checked at each phased checkpoint and
before pull request submission.

**Version**: 1.0.0 | **Ratified**: 2026-05-30 | **Last Amended**: 2026-05-30
