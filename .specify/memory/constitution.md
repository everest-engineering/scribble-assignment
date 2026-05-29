<!--
Sync Impact Report
- Version change: (template placeholders) → 1.0.0
- Modified principles: N/A (initial adoption from template)
- Added sections: Core Principles (7), Technology Stack & Repository Layout,
  Out-of-Scope Boundaries, Development Workflow, Governance
- Removed sections: Generic template placeholder principles
- Templates: plan-template.md ✅ | spec-template.md ✅ | tasks-template.md ✅
  | AGENTS.md (no change required — already aligned)
- Follow-up TODOs: none
-->

# Scribble Constitution

## Core Principles

### I. Stack & Repository Structure

All implementation MUST use the established monorepo layout and TypeScript ES
modules throughout.

- **Backend** (`backend/`): Node.js, Express, TypeScript, Zod validation, `tsx`
  for development. Structure: `src/api` (routes/handlers), `src/services`
  (business logic), `src/models` (types/entities).
- **Frontend** (`frontend/`): React 18, React Router v6, Vite, TypeScript.
  Complex client state lives in `src/state` (e.g. `roomStore.ts`). Styling in
  `app.css` or CSS modules.
- **Imports**: Prefer relative ES module imports; avoid `any` — use `unknown`
  when types are truly dynamic.
- **Immutability**: Prefer immutable updates and pure functions where practical.

**Rationale**: A single, predictable layout keeps AI-assisted edits localized
and reviewable.

### II. Architecture Boundaries (NON-NEGOTIABLE)

The following MUST NOT be introduced in code, dependencies, specs, plans, or
tasks:

- WebSockets, Socket.io, SSE, or any real-time push protocol — **HTTP polling
  only** for multi-client sync.
- Databases or durable storage (SQL, NoSQL, SQLite, files-as-DB, etc.) — **in-
  memory rooms only**; backend restart clears all state.
- Authentication, accounts, sessions, JWT, or OAuth.
- Deployment, hosting, CI pipelines, Docker, or infrastructure work.

**Rationale**: Lab scope stays focused on REST + polling and brownfield
enhancement of the starter.

### III. Deterministic Game Rules

Game behavior MUST be predictable, server-authoritative, and aligned with the
starter seed data unless a feature spec explicitly amends it.

- **Sync**: Clients poll room snapshots on an interval of **approximately 2
  seconds** (lobby and active game). No alternative transport.
- **Rooms**: Fully isolated in memory; no cross-room leakage. Inactive rooms
  SHOULD be removed when practical to limit memory use.
- **Words**: Secret words MUST be chosen **deterministically** from the starter
  list only: `rocket`, `pizza`, `castle`, `guitar`, `sunflower` (see
  `backend/src/seed/starterData.ts`). No random packs or custom word lists.
- **Roles**: Use starter roles `drawer` and `guesser` as defined in the
  codebase.
- **Validation**: Request/response shapes MUST be validated with **Zod** on
  the backend; invalid input MUST fail fast with clear errors.

**Rationale**: Determinism makes two-tab manual validation and Vitest unit
tests reproducible.

### IV. Spec-Driven Development

Feature behavior, acceptance criteria, and edge cases live in **feature specs**,
not in this constitution.

- Authoritative behavior: `specs/NNN-<feature-name>/spec.md` (and sibling
  plan/tasks artifacts for that feature).
- This constitution defines **how** to build; specs define **what** to build.
- Do NOT embed scenario-specific Given/When/Then acceptance criteria here.
- Plans (`plan.md`) and tasks (`tasks.md`) MUST trace to spec requirements;
  implementation MUST match the spec or document a justified deviation in the
  plan.

**Rationale**: Separating governance from feature requirements prevents
constitution churn and keeps acceptance criteria testable per feature.

### V. AI-Assisted Development

When using AI coding assistants on this project:

- **Read-first**: Inspect relevant starter files, specs, and plans before
  editing; do not rewrite working code without cause.
- **Minimal diffs**: Change only what the current task requires; no drive-by
  refactors, unrelated formatting, or new top-level dependencies without
  justification in the plan.
- **No scope creep**: Out-of-scope items (see Principle II and README) MUST NOT
  appear in implementation even if suggested by the assistant.
- **Spec is source of truth**: If code and spec disagree, fix code or update the
  spec through the Spec Kit workflow — not silent drift.

**Rationale**: AI output must remain auditable and aligned with lab evaluation.

### VI. Review & Validation Discipline

Before marking work complete for a task or feature slice:

- **Two-tab validation**: Verify multi-player flows with **two browser tabs**
  (or windows) against the feature spec's acceptance criteria.
- **Build both apps**: Run `npm run build` in `backend/` and `frontend/` with
  no errors.
- **Commits tied to tasks**: Each meaningful commit SHOULD reference or map to
  a task ID from `tasks.md`; keep commits granular and explainable in the PR.

**Rationale**: Polling-based games only prove correct under concurrent clients;
builds catch type and bundling regressions early.

### VII. Testing Strategy

- **Automated**: Use **Vitest** for pure logic (scoring, validation, word
  selection, state transitions). Place tests beside or under each app's test
  conventions.
- **Manual**: Multi-client sync, polling cadence, and UI flows MUST be validated
  manually with two tabs; do not substitute WebSockets or E2E frameworks that
  violate Principle II unless already present in the starter.
- **When to test**: Add Vitest coverage for non-trivial logic introduced by a
  task; run manual sync checks for every user story that touches shared room
  state.

**Rationale**: Unit tests anchor determinism; polling UX requires real concurrent
clients.

## Technology Stack & Repository Layout

| Layer    | Path        | Key technologies                          |
|----------|-------------|-------------------------------------------|
| API      | `backend/`  | Express, TypeScript, Zod, in-memory store |
| Client   | `frontend/` | React, Vite, React Router, TypeScript      |
| Spec Kit | `specs/`    | Per-feature `spec.md`, `plan.md`, `tasks.md` |
| Governance | `.specify/memory/constitution.md` | This document |

**Dev commands**: `cd backend && npm run dev` (port 3001); `cd frontend &&
npm run dev` (port 5173). Optional: `VITE_API_URL` for backend URL override.

**Error handling**: Backend uses centralized error handling; frontend MUST NOT
crash on API failures — surface errors in UI.

## Out-of-Scope Boundaries

The following are explicitly excluded from specs, plans, tasks, and code (see
README for lab context): multiple rounds, drawer rotation, timers, custom word
packs, spectators, moderation (kick/mute), room passwords, new state-management
or routing libraries beyond the starter, and rewriting the scaffold from scratch.

## Development Workflow

1. **Discovery** — Read starter code; note gaps and assumptions.
2. **Constitution** — Follow principles in this document.
3. **Specify** — Update `specs/NNN-<feature>/spec.md` with acceptance criteria.
4. **Clarify** — Resolve ambiguity before planning.
5. **Plan** — File-level changes, state model, data flow in `plan.md`.
6. **Tasks** — Ordered, testable tasks in `tasks.md`.
7. **Implement** — One slice at a time; validate; commit.
8. **Analyze** — Cross-check spec, plan, tasks, and code for consistency.

Work through feature groups in priority order; do not start a later scenario
until the current spec's acceptance criteria pass two-tab validation.

## Governance

- This constitution supersedes ad-hoc assistant instructions when they conflict.
- **Amendments**: Update this file via `/speckit-constitution`, bump version per
  semver (MAJOR: principle removal/redefinition; MINOR: new principle or
  material expansion; PATCH: clarifications only), set `Last Amended` to the
  change date, and propagate updates to `.specify/templates/*` and `AGENTS.md`
  when principles affect them.
- **Compliance**: Every `plan.md` MUST include a Constitution Check that
  confirms no violations of Principles II–III and V–VII before implementation.
- **Runtime guidance**: `AGENTS.md` and `README.md` supplement this document for
  day-to-day commands and lab submission expectations.

**Version**: 1.0.0 | **Ratified**: 2026-05-29 | **Last Amended**: 2026-05-29
