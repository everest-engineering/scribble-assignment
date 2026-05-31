<!--
Sync Impact Report
==================
Version change: (template/unratified) → 1.0.0
Modified principles: N/A (initial ratification from template placeholders)
Added sections:
  - Core Principles (5 principles defined)
  - Technology & Scope Constraints
  - Development Workflow & Quality Gates
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ updated (Constitution Check gates)
  - .specify/templates/spec-template.md ✅ aligned (no changes required)
  - .specify/templates/tasks-template.md ✅ aligned (no changes required)
  - .specify/templates/checklist-template.md ✅ aligned (no changes required)
  - README.md ✅ aligned (references constitution content)
  - AGENTS.md ✅ aligned (engineering constraints match)
Follow-up TODOs: none
-->

# Scribble Constitution

## Core Principles

### I. Brownfield First

Every feature MUST extend the existing starter codebase; rewriting from scratch is
forbidden. Before writing code, inspect relevant files and document gaps in
discovery notes. New code MUST follow the directory layout and patterns in
`AGENTS.md` (`backend/src/api`, `backend/src/services`, `backend/src/models`,
`frontend/src/pages`, `frontend/src/state`, etc.).

**Rationale:** The lab evaluates brownfield enhancement skill, not greenfield
scaffolding. Unjustified rewrites create drift between artifacts and code.

### II. Spec-Driven Incremental Delivery

Work MUST trace to Spec Kit artifacts: discovery notes, specification with
acceptance criteria, plan with state model and file-level changes, and ordered
tasks. Implement one meaningful slice at a time; validate the current scenario
before starting the next. Deviations from the spec MUST be documented in the
plan or spec.

**Rationale:** Traceability between artifacts, commits, and behavior is a core
lab outcome. Incremental slices reduce risk and keep AI output reviewable.

### III. Scope Constraints (NON-NEGOTIABLE)

The following boundaries MUST NOT be violated:

- **Sync:** HTTP polling only (~2s cadence for lobby and gameplay). WebSockets,
  Socket.io, and real-time push protocols are forbidden.
- **Storage:** In-memory state only. No databases, files, or persistent storage.
- **Auth:** No authentication, sessions, JWT, or OAuth.
- **Scope:** Items listed as out of scope in `README.md` MUST NOT appear in spec,
  plan, tasks, or implementation (e.g., multi-round rotation, timers, deployment,
  new state-management libraries).

**Rationale:** Fixed constraints keep difficulty focused and prevent scope creep
that breaks artifact consistency.

### IV. TypeScript & Validation Discipline

Both frontend and backend MUST use TypeScript with strict typing; avoid `any`,
use `unknown` when truly dynamic. Backend request and response payloads MUST be
validated with Zod. Prefer immutable data and pure functions. Backend errors MUST
use centralized handlers; frontend UI MUST NOT crash on API exceptions.

**Rationale:** Type safety and schema validation catch contract bugs early in a
polling-based, multi-client game where snapshots must stay consistent.

### V. Deterministic Game Rules & Manual Validation

Game behavior MUST be deterministic and testable without randomness beyond the
starter word list:

- Secret word selection MUST be deterministic from the seed list.
- Guesses MUST be trimmed; empty guesses rejected; comparison case-insensitive.
- Correct guesses score exactly 100; incorrect guesses add 0.
- Room isolation, host permissions, and role visibility rules MUST match the spec.

Each completed slice MUST be validated manually (typically two browser tabs)
against acceptance criteria. Automated tests are encouraged for services and
game logic but are not mandatory unless the spec requests them.

**Rationale:** Deterministic rules make multi-tab manual testing reliable and
prevent ambiguous scoring or word-selection bugs.

## Technology & Scope Constraints

| Area | Requirement |
|------|-------------|
| Runtime | Node.js 18+, npm 9+ |
| Backend | Express, TypeScript, Zod, `tsx`; port 3001 default |
| Frontend | React 18, React Router v6, Vite, TypeScript; port 5173 default |
| State | In-memory room store on backend; client session via `roomStore.ts` |
| Sync | HTTP polling; no WebSockets |
| Dependencies | No unjustified top-level dependencies beyond starter stack |
| Builds | `npm run build` MUST pass in both `backend/` and `frontend/` before handoff |

Memory footprint for active rooms MUST stay minimal; inactive rooms SHOULD be
removed explicitly when the implementation supports it.

## Development Workflow & Quality Gates

Follow the lab build loop for each feature group:

1. **Discovery** — read starter files; document gaps and assumptions.
2. **Specify** — write acceptance criteria and edge cases.
3. **Clarify** — resolve ambiguity before planning.
4. **Plan** — state model, data flow, file-level changes.
5. **Tasks** — ordered, testable work with dependencies.
6. **Implement** — one slice at a time with granular commits.
7. **Validate** — verify acceptance criteria before advancing.

**AI usage rules:**

- AI-generated code MUST be critically reviewed before commit.
- Prompts SHOULD reference spec, plan, and relevant file paths.
- Do not accept large unrelated refactors or out-of-scope features from AI output.
- Each commit SHOULD be explainable from a spec or task entry.

**Quality gates before merge/submission:**

- Constitution Check passes in the implementation plan.
- Spec, plan, tasks, and code behavior are internally consistent.
- Two-browser multiplayer flow works for completed scenarios.
- Edge cases from the spec are handled (empty inputs, invalid codes, isolation).

## Governance

This constitution supersedes ad-hoc engineering decisions for the Scribble lab.
Amendments require updating `.specify/memory/constitution.md` via
`/speckit-constitution`, incrementing the version per semantic versioning, and
propagating changes to dependent templates when principles change.

**Versioning policy:**

- **MAJOR:** Backward-incompatible principle removals or redefinitions.
- **MINOR:** New principles or materially expanded guidance.
- **PATCH:** Clarifications, wording, or non-semantic refinements.

**Compliance:** Every implementation plan MUST include a Constitution Check and
re-evaluate after design. Pull requests and self-review MUST verify compliance
with scope constraints and spec traceability. Runtime development guidance lives
in `README.md`, `AGENTS.md`, and `docs/discovery.md`.

**Version**: 1.0.0 | **Ratified**: 2026-05-31 | **Last Amended**: 2026-05-31
