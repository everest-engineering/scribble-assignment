<!--
SYNC IMPACT REPORT
==================
Version change: (uninitialized template) → 1.0.0
Bump rationale: First ratification — template placeholders replaced with concrete
  governing principles for the Scribble brownfield enhancement lab. MAJOR baseline.

Modified principles (template slot → ratified principle):
  - [PRINCIPLE_1_NAME] → I. Specification Before Implementation
  - [PRINCIPLE_2_NAME] → II. Incremental Delivery by Feature Group
  - [PRINCIPLE_3_NAME] → III. Brownfield Enhancement (NON-NEGOTIABLE)
  - [PRINCIPLE_4_NAME] → IV. Simplicity Over Expansion
  - [PRINCIPLE_5_NAME] → V. Validation First
  - (added) VI. AI-Assisted Development Responsibility
  - (added) VII. Traceability
  - (added) VIII. Commit Discipline

Added sections:
  - Scope Boundaries (replaces [SECTION_2_NAME])
  - Development Workflow & Definition of Done (replaces [SECTION_3_NAME])

Removed sections: none

Templates requiring updates:
  - .specify/templates/plan-template.md ✅ reviewed — Constitution Check gate aligns
  - .specify/templates/spec-template.md ✅ reviewed — no mandatory-section conflict
  - .specify/templates/tasks-template.md ✅ reviewed — task categories compatible

Follow-up TODOs: none
-->

# Scribble Assignment Constitution

This constitution governs the brownfield enhancement of the Scribble-style guessing game.
It defines the engineering principles, AI-usage rules, and review discipline that keep
requirements, specifications, plans, tasks, and implementation traceable to one another.

## Core Principles

### I. Specification Before Implementation

Implementation MUST NOT begin until the related feature has a documented specification with
defined requirements, acceptance criteria, identified edge cases, an approved implementation
plan, and an ordered task breakdown. Every implemented behavior MUST trace back to a
documented requirement.

Rationale: This lab is graded on Spec Kit discipline, not feature count. Code written ahead
of its spec cannot be traced or reviewed and is treated as scope drift.

### II. Incremental Delivery by Feature Group

Development MUST follow the four assignment feature groups in order:
1. Room Setup & Lobby
2. Game Start & Drawer Flow
3. Gameplay Interaction
4. Result & Restart

Each group MUST complete the full Specify → Plan → Tasks → Implement → Validate loop before
the next group begins. Specify, plan, and tasks artifacts are updated incrementally per group.

Rationale: Phased checkpoints keep each slice small enough to validate and explain, and
prevent half-finished scenarios from blocking review.

### III. Brownfield Enhancement (NON-NEGOTIABLE)

The existing application MUST be extended, never rewritten. Contributors MUST:
- Reuse existing routes, room state, and project structure where practical.
- Preserve existing working functionality.
- Avoid unnecessary refactoring of unrelated code.
- Modify only files directly related to the feature being implemented.

Rationale: The starter is intentionally incomplete, not wrong. Rewrites destroy the diff
reviewers assess and reintroduce solved problems.

### IV. Simplicity Over Expansion

The implementation MUST remain within assignment scope. The following are out of scope and
MUST NOT be built, specified, planned, or tasked: WebSockets/real-time sync, authentication,
databases/persistence, multiple rounds, drawer rotation, timers, spectator mode, room
moderation, and any new top-level dependency the spec does not justify. Polling (~2s) is the
approved synchronization mechanism.

Rationale: Out-of-scope work rarely improves the outcome and creates drift between spec,
plan, tasks, and implementation.

### V. Validation First

Every feature MUST be manually validated against its acceptance criteria before being marked
complete. Validation MUST cover the happy path, invalid input, multi-player behavior, and
multi-room isolation, and MUST be confirmed through observable user flows rather than code
review alone. Code is not complete until behavior is verified.

Rationale: Polling-based multiplayer state has emergent behavior that only surfaces when two
browsers run side by side.

### VI. AI-Assisted Development Responsibility

AI MAY assist with discovery, specification drafting, planning, task decomposition, and code
suggestions. The developer remains responsible for reviewing generated output, validating
correctness, ensuring requirement alignment, and preventing scope creep. AI-generated code
MUST NOT be committed without review.

Rationale: The rubric explicitly credits critical review of AI output; unreviewed generation
is the primary source of spec/implementation divergence.

### VII. Traceability

Each task MUST map along the chain Requirement → Plan → Task → Implementation. Acceptance
criteria MUST be testable through observable behavior, and every completed task MUST be
explainable during review.

Rationale: Traceability is the core artifact-quality dimension reviewers assess.

### VIII. Commit Discipline

Commits MUST be small, focused, and meaningful, each mapping to a spec change, a plan/task
update, a focused implementation slice, or a verification step. Large mixed-purpose commits
are prohibited. Example messages:
- `feat: add host tracking to room creation`
- `feat: implement lobby polling`
- `fix: reject whitespace-only player names`

Rationale: The PR diff is what reviewers grade; granular commits make each change explainable.

## Scope Boundaries

The enhancement targets the existing frontend + minimal REST backend with an in-memory store.
Allowed technologies are limited to what the starter already ships (React, the existing client
store, the existing Node/REST backend). No new state-management or routing libraries, no
containerization, no deployment/CI work beyond what already exists. The seed word list
(`rocket, pizza, castle, guitar, sunflower`) and roles (`drawer`, `guesser`) are fixed inputs;
secret-word selection MUST be deterministic.

## Development Workflow & Definition of Done

Work proceeds one feature group at a time through Specify → Plan → Tasks → Implement →
Validate. A feature group is **Done** only when ALL of the following hold:
- Acceptance criteria pass.
- Edge cases are handled.
- Implementation matches the specification (documented deviations allowed and explained).
- Validation is documented via observable two-browser flows.
- Changes are committed with granular, meaningful messages.

No feature may be marked complete based solely on code generation or passing tests.

## Governance

This constitution supersedes ad-hoc development practices for this lab. Amendments MUST be
documented in this file with a Sync Impact Report, a version bump, and propagation to any
affected templates under `.specify/templates/`.

Versioning policy (semantic):
- MAJOR: backward-incompatible governance/principle removal or redefinition.
- MINOR: a new principle/section is added or guidance is materially expanded.
- PATCH: clarifications, wording, or non-semantic refinements.

Compliance review: every PR and self-review MUST verify the change traces to a documented
requirement, stays within scope (Principle IV), and was validated through observable behavior
(Principle V). Complexity that appears to exceed scope MUST be justified against the spec or
removed.

**Version**: 1.0.0 | **Ratified**: 2026-06-17 | **Last Amended**: 2026-06-17
