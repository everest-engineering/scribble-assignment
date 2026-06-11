<!--
Sync Impact Report
Version change: unversioned template -> 1.0.0
Modified principles:
- PRINCIPLE_1_NAME -> I. TypeScript and ES Modules Only
- PRINCIPLE_2_NAME -> II. REST Polling and In-Memory State
- PRINCIPLE_3_NAME -> III. Deterministic Scribble Game Rules
- PRINCIPLE_4_NAME -> IV. Frontend State and UX Resilience
- PRINCIPLE_5_NAME -> V. Spec Kit Traceability and Review Discipline
Added sections:
- Technology Constraints
- Development Workflow
Removed sections:
- Template placeholder comments and example-only guidance
Templates requiring updates:
- ✅ updated: .specify/templates/plan-template.md
- ✅ updated: .specify/templates/spec-template.md
- ✅ updated: .specify/templates/tasks-template.md
- ✅ verified: .specify/templates/commands/*.md not present in this workspace
Runtime guidance:
- ✅ verified: README.md
- ✅ verified: AGENTS.md
- ✅ verified: docs/discovery-notes.md
Follow-up TODOs: None
-->

# Scribble Constitution

## Core Principles

### I. TypeScript and ES Modules Only

All frontend and backend source changes MUST use TypeScript and ES Modules. The
frontend MUST remain a Vite + React + TypeScript client. The backend MUST remain
a Node.js + Express + TypeScript service. New code MUST avoid `any`; use
specific types or `unknown` with validation when data is dynamic. Backend request
and response boundaries MUST use Zod validation.

Rationale: Shared TypeScript discipline keeps the brownfield codebase readable,
safe to refactor, and consistent across the client and service.

### II. REST Polling and In-Memory State

All multiplayer synchronization MUST use HTTP REST requests and polling. The
project MUST NOT use WebSockets, Socket.io, server-sent events, or any push-based
real-time protocol. The backend MUST NOT use a database, file persistence,
SQLite, SQL, NoSQL, or external durable storage. Room and game state MUST remain
in memory, and inactive rooms MUST be explicitly removable when lifecycle rules
require cleanup.

Rationale: The assignment is scoped around a minimal REST backend and in-memory
room model; adding persistence or push protocols would invalidate the intended
constraints.

### III. Deterministic Scribble Game Rules

Game behavior MUST be deterministic, explicit, and traceable to the specification.
Room creation and joining MUST validate trimmed input, rooms MUST remain isolated,
host and player roles MUST be visible where relevant, words MUST come from the
starter word list unless the spec is amended, guesses MUST be compared
case-insensitively after trimming, and scoring/restart behavior MUST be documented
before implementation.

Rationale: Deterministic rules make multiplayer behavior testable in two browser
tabs and prevent accidental drift between spec, plan, tasks, and implementation.

### IV. Frontend State and UX Resilience

Frontend behavior MUST use functional React components, React Router v6 patterns,
and the established room state pattern in `frontend/src/state/roomStore.ts` for
shared room/session state. API failures, empty inputs, invalid room codes, page
refreshes, and missing room data MUST result in clear UI feedback or safe
navigation instead of runtime crashes.

Rationale: The app is tested through user-facing flows; resilient state handling
keeps incomplete or failing backend responses from breaking the experience.

### V. Spec Kit Traceability and Review Discipline

Every feature increment MUST keep discovery notes, specification, plan, tasks,
implementation, and validation evidence aligned. AI-generated changes MUST be
reviewed against the constitution before commit. Behavior changes MUST include
focused tests or documented manual validation, and both frontend and backend
builds MUST pass before handoff unless a blocker is documented.

Rationale: The lab evaluates reasoning and traceability as much as code; each
change must remain explainable from artifact to implementation.

## Technology Constraints

- `frontend/` is the Vite + React + TypeScript client.
- `backend/` is the Node.js + Express + TypeScript service.
- All backend API payloads MUST be validated with Zod.
- All room and game data MUST remain in memory only.
- HTTP polling is the only allowed synchronization mechanism.
- Authentication, accounts, sessions, JWT, OAuth, room passwords, and invite-link
  authorization are out of scope.
- Databases, persistent storage, deployment, hosting, CI, Docker, and unrelated
  top-level dependencies are out of scope.
- New dependencies MUST be justified in the plan and MUST fit the existing
  frontend or backend ownership boundary.

## Development Workflow

1. Discovery MUST list incomplete behaviors, assumptions, and relevant files.
2. Specifications MUST define acceptance criteria, edge cases, and assumptions
   before implementation begins.
3. Plans MUST describe the real frontend/backend files, state model, data flow,
   API changes, polling behavior, and validation strategy.
4. Tasks MUST be ordered by independently testable user story and include backend,
   frontend, validation, and documentation work where applicable.
5. Implementation MUST proceed incrementally, preserving existing structure and
   avoiding unrelated refactors.
6. Validation MUST include the relevant Vitest suites, build commands, or manual
   two-browser checks needed for the changed behavior.

## Governance

This constitution supersedes conflicting practices in feature specs, plans, task
lists, and AI-generated suggestions. Amendments MUST update this file, the Sync
Impact Report, and any affected Spec Kit templates or runtime guidance. Changes
MUST explain their version bump using semantic versioning:

- MAJOR for backward-incompatible governance changes or removed principles.
- MINOR for new principles, new required sections, or materially expanded rules.
- PATCH for clarifications, wording changes, and non-semantic refinements.

Every plan MUST perform a Constitution Check before implementation planning
continues. Any intentional violation MUST be documented in Complexity Tracking
with the reason, the simpler alternative, and the reviewer-visible risk.

**Version**: 1.0.0 | **Ratified**: 2026-06-09 | **Last Amended**: 2026-06-09
