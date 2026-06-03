<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- Template principle 1 -> I. Spec Artifacts Govern Implementation
- Template principle 2 -> II. Brownfield Extension Over Rewrite
- Template principle 3 -> III. Polling-Only Multiplayer State
- Template principle 4 -> IV. Type-Safe, Validated Boundaries
- Template principle 5 -> V. Testable, Traceable Delivery
Added sections:
- Assignment Constraints
- Development Workflow
Removed sections:
- None
Templates requiring updates:
- Updated: .specify/templates/plan-template.md
- Updated: .specify/templates/spec-template.md
- Updated: .specify/templates/tasks-template.md
Follow-up TODOs:
- None
-->

# Scribble Assignment Constitution

## Core Principles

### I. Spec Artifacts Govern Implementation

Every user-facing behavior MUST be described in the active feature spec before
implementation. The plan and tasks MUST trace to that spec, and code MUST trace
to the corresponding task and acceptance criteria. If implementation behavior
changes, the source spec and downstream artifacts MUST be updated before the
change is considered complete.

Rationale: the assignment is graded on Spec Kit discipline and alignment, not
only on whether the game appears to work.

### II. Brownfield Extension Over Rewrite

The starter architecture MUST be extended in place. Existing Express routes,
room-store service boundaries, React pages, routing, and room-state patterns
SHOULD be reused unless a spec-backed requirement cannot be met otherwise.
Unrelated refactors and full rewrites are prohibited.

Rationale: the lab measures discovery and controlled enhancement of an existing
codebase, not greenfield replacement.

### III. Polling-Only Multiplayer State

All multiplayer synchronization MUST use REST endpoints and HTTP polling.
WebSockets, Socket.io, server-sent events, databases, persistent storage,
authentication, sessions, deployment, CI, Docker, and new state-management or
routing libraries are out of scope unless the assignment explicitly changes.

Rationale: the course requires a focused, in-memory, polling-based multiplayer
implementation.

### IV. Type-Safe, Validated Boundaries

Backend and frontend code MUST remain TypeScript strict and fully typed.
Request payloads and route parameters MUST be validated at API boundaries.
User inputs, including player names, room codes, guesses, and game actions,
MUST be trimmed or rejected according to the spec. Viewer-specific snapshots
MUST prevent non-drawers from seeing the secret word.

Rationale: clear typed contracts reduce AI drift and make multiplayer state
changes reviewable.

### V. Testable, Traceable Delivery

Each feature group MUST define acceptance criteria before implementation.
Tasks MUST be small, ordered, and mapped to user-story labels. Automated tests
SHOULD cover backend game rules, validation, and state transitions. Manual
two-browser validation MUST cover the full multiplayer path before final
submission. Commits SHOULD be granular and meaningful.

Rationale: the final PR must be easy to assess for reasoning, behavior, and
traceability.

## Assignment Constraints

- The implementation MUST cover all four required scenarios in one PR.
- A minimum of four specification iterations MUST be represented, one for each
  feature group.
- The room creator MUST be treated as host unless a later approved spec update
  says otherwise.
- The game MUST remain single-round for this assignment. Multiple rounds,
  drawer rotation, timers, bonuses, custom word packs, spectator mode,
  moderation, room passwords, and invite links are out of scope.
- In-memory state reset on backend restart is acceptable and MUST be documented
  in the plan and validation notes.
- Important AI-assisted decisions MUST be recorded in project files, not only
  in chat.

## Development Workflow

1. Inspect the existing code before changing behavior.
2. Record discovery notes with gaps, assumptions, and relevant files.
3. Maintain the constitution, feature spec, plan, tasks, and reflection report.
4. Define or update the spec for the next feature group.
5. Clarify ambiguity before planning.
6. Update the plan and task list from the active spec.
7. Analyze alignment before implementation.
8. Implement only the next planned slice.
9. Validate with tests and manual acceptance checks.
10. Commit a coherent checkpoint before moving to the next slice.

## Governance

This constitution supersedes ad hoc prompting and implementation convenience.
Any violation MUST be fixed or explicitly documented in the plan's Complexity
Tracking section with a concrete assignment-based justification.

Amendments require:

- written rationale for the change;
- review against the assignment rubric and out-of-scope list;
- updates to affected spec, plan, tasks, and templates;
- a semantic version update.

Versioning follows semantic versioning:

- MAJOR for backward-incompatible governance or principle changes;
- MINOR for new principles or materially expanded guidance;
- PATCH for clarifications that do not change project obligations.

Compliance is reviewed during planning, task generation, implementation,
validation, reflection, and PR preparation.

**Version**: 1.0.0 | **Ratified**: 2026-06-03 | **Last Amended**: 2026-06-03
