<!--
  Sync Impact Report
  Version change: (template) → 1.0.0
  Modified principles: N/A (initial creation)
  Added sections: Core Principles (5 principles), Technical Constraints, Development Workflow, Governance
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ no update needed (no principle name references)
    - .specify/templates/spec-template.md ✅ no update needed (generic template)
    - .specify/templates/tasks-template.md ✅ no update needed (generic template)
    - .specify/templates/checklist-template.md ✅ no update needed (generic template)
  Follow-up TODOs: None
-->
# Scribble Constitution

## Core Principles

### I. Specification-First (NON-NEGOTIABLE)

Before any implementation, produce the required Spec Kit artifacts in order:
discovery notes, constitution, specification, plan, and tasks. Each artifact
MUST be internally consistent, traceable to the acceptance criteria, and
committed before the code it describes. No implementation may begin without
an approved spec and plan for that feature slice.

### II. Brownfield Enhancement

Work with the existing codebase as-is. Read and understand the starter before
writing new code. Do NOT rewrite, restructure, or refactor unrelated code.
Every change MUST be justified by a specific requirement in the current
feature group. Prefer minimal, targeted changes over broad "improvements."

### III. Deterministic Game Logic

All game rules MUST be deterministic and testable:
- Word selection MUST follow a fixed deterministic algorithm
- Scoring MUST be purely formulaic (no randomness)
- Drawer assignment MUST follow a repeatable rule
- Player names MUST be trimmed; empty/whitespace-only names MUST be rejected
- Guess comparison MUST be case-insensitive
- State transitions (lobby → playing → result → lobby) MUST be explicit and
  verifiable

Rationale: Deterministic rules make acceptance criteria testable in a
two-browser setup without mocking randomness.

### IV. HTTP Polling Architecture

All client-server synchronization MUST use HTTP polling. WebSockets,
Socket.io, or any real-time push protocol are STRICTLY FORBIDDEN. Polling
intervals MUST be configurable and set to reasonable defaults (~2s for lobby,
appropriate intervals for game state updates).

### V. In-Memory Only

All data MUST be stored in-memory only. No databases (SQL, NoSQL, SQLite,
etc.) are permitted. No authentication, sessions, JWT, or OAuth. Room state
MUST be cleaned up when rooms become inactive to keep memory footprint
minimal.

## Technical Constraints

- **Language**: TypeScript throughout, ES Modules, strict mode
- **Backend**: Node.js + Express + Zod for validation + tsx for execution
- **Frontend**: React 18 + React Router 6 + Vite + TypeScript
- **Backend structure**: `src/api` (routes), `src/services` (business logic),
  `src/models` (data types)
- **Frontend state**: Managed in `src/state` via existing patterns (roomStore.ts)
- **Styling**: Classes in `app.css` or CSS modules
- **Testing**: Vitest for both backend and frontend

## Development Workflow

Follow the recommended build order for each feature group:

1. **Discovery** — Read starter files, document gaps and assumptions
2. **Specify** — Update spec with acceptance criteria and edge cases
3. **Clarify** — Resolve ambiguity before planning
4. **Plan** — Update state model, file-level changes, and data flow
5. **Tasks** — Decompose plan into ordered, testable work items
6. **Implement** — Complete one meaningful slice at a time
7. **Validate** — Verify acceptance criteria with two browser tabs

Granular, meaningful commits are required. Each commit MUST be explainable
and traceable to the spec. Build validation (`npm run build` in both backend
and frontend) MUST pass before handoff.

## Governance

The Constitution supersedes all other development practices. Amendments
require:
- Documented rationale for the change
- Approval from the project lead or reviewer
- A migration plan if existing artifacts are affected

**Versioning policy**:
- **MAJOR**: Backward-incompatible principle removals or redefinitions
- **MINOR**: New principle or materially expanded guidance
- **PATCH**: Clarifications, wording fixes, non-semantic refinements

All PRs and reviews MUST verify compliance with this constitution.
Complexity introduced MUST be justified — simpler alternatives MUST be
considered and rejected with explicit reasoning before a complex approach
is adopted.

**Version**: 1.0.0 | **Ratified**: 2026-05-18 | **Last Amended**: 2026-06-11
