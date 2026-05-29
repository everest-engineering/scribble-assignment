<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- Placeholder Principle 1 -> Brownfield Extension
- Placeholder Principle 2 -> Full-Stack Input Validation
- Placeholder Principle 3 -> Polling-Only Synchronization
- Placeholder Principle 4 -> Simple Implementation
- Placeholder Principle 5 -> Specification Traceability
- Added Principle 6 -> Human Review of AI Output
Added sections:
- Assignment Constraints
- Development Workflow
Removed sections:
- None
Templates requiring updates:
- updated: .specify/templates/plan-template.md
- updated: .specify/templates/spec-template.md
- updated: .specify/templates/tasks-template.md
- not present: .specify/templates/commands/*.md
- reviewed: README.md
- updated: AGENTS.md
Follow-up TODOs:
- None
-->
# Scribble Assignment Constitution

## Core Principles

### I. Brownfield Extension
All work MUST extend the existing Scribble starter rather than replacing it. New
behavior MUST preserve the repository's Express backend, React frontend, TypeScript
and ES module setup, existing routing model, and in-memory room service unless a
specification explicitly requires a narrow change. Rewrites, unrelated refactors, and
new top-level dependencies are prohibited without documented justification.

Rationale: the assignment evaluates the ability to inspect and evolve an existing
codebase, not to rebuild a different application.

### II. Full-Stack Input Validation
Every user-controlled value MUST be validated at the point of entry in the frontend
and again at the backend API boundary. Frontend validation MUST give clear feedback
for empty, malformed, or out-of-scope values. Backend validation MUST reject invalid
requests before mutating room state and return predictable errors. Shared behavior
such as trimming names, rejecting empty guesses, and handling room codes MUST be
covered by acceptance criteria or focused tests.

Rationale: frontend validation improves usability, while backend validation protects
the in-memory game state and keeps multi-tab behavior deterministic.

### III. Polling-Only Synchronization
Scribble synchronization MUST use HTTP request/response flows and polling only.
WebSockets, Socket.io, server-sent events, long polling, or other push-style realtime
protocols are prohibited. Polling intervals MUST match the specification for the
feature being implemented and MUST be scoped so they do not create duplicate timers
or unnecessary backend load.

Rationale: polling is an explicit assignment constraint and keeps the multiplayer
model simple enough to review.

### IV. Simple Implementation
Implementations MUST choose the simplest design that satisfies the current
specification and acceptance criteria. State MUST remain in memory on the backend.
Authentication, databases, deployment infrastructure, Docker, extra state libraries,
and broad abstractions are prohibited unless the assignment scope changes through an
approved specification amendment. Complexity introduced for a feature MUST be
recorded in the implementation plan with the simpler alternative that was rejected.

Rationale: constrained scope keeps the lab focused on traceable gameplay behavior
instead of infrastructure.

### V. Specification Traceability
Every feature, endpoint, UI state, game rule, and task MUST trace back to an approved
specification item or acceptance scenario. Plans and tasks MUST reference the relevant
user story, requirement, or scenario before implementation starts. Code changes that
do not map to the specification MUST be removed, deferred, or documented as a spec
amendment before acceptance.

Rationale: traceability keeps Spec Kit artifacts, implementation, and review criteria
aligned.

### VI. Human Review of AI Output
AI-generated specifications, plans, tasks, and code MUST be reviewed by a human before
they are accepted, committed, or used as the basis for further work. Review MUST check
for assignment scope, TypeScript correctness, validation, polling-only synchronization,
state isolation, and behavior matching the specification. AI output MUST NOT be
accepted solely because it builds or appears plausible.

Rationale: the assignment explicitly evaluates critical review of AI-assisted work.

## Assignment Constraints

The project is a brownfield multiplayer drawing game with a React/Vite frontend and
an Express/TypeScript backend. Backend state MUST remain in memory only, and inactive
room state SHOULD be removed when no longer needed. The implementation MUST NOT add
databases, authentication, sessions, JWTs, OAuth, WebSockets, server-sent events,
deployment tooling, Docker, or unrelated product features.

The supported game scope is one focused Scribble flow: room creation/joining, lobby
polling, host-only game start, deterministic drawer and word selection, drawing and
guessing interactions, scoring, result display, and restart to lobby. Any additional
behavior requires a specification update before implementation.

## Development Workflow

Before implementation, contributors MUST inspect the relevant existing files and keep
the specification, plan, and tasks aligned. Each task SHOULD be small enough to review
against a single user story or requirement. Validation changes MUST include both the
UI behavior and backend request handling. Polling changes MUST document lifecycle
cleanup and verification across at least two browser tabs.

Before accepting work, reviewers MUST compare the diff against the specification,
confirm no prohibited technology or scope was introduced, run the relevant validation
steps, and record any intentional deviations in the Spec Kit artifacts.

## Governance

This constitution supersedes conflicting project practices for the Scribble
assignment. Amendments MUST update this file, include a Sync Impact Report, and
propagate any changed rules to affected templates or runtime guidance.

Versioning follows semantic versioning:
- MAJOR for removing or redefining a core principle in a backward-incompatible way.
- MINOR for adding a principle, adding a required governance section, or materially
  expanding compliance requirements.
- PATCH for wording clarifications, typo fixes, or non-semantic refinements.

Compliance MUST be checked during planning, task generation, implementation review,
and final validation. Any violation MUST be documented with a justification, a simpler
alternative considered, and a follow-up action before the work is accepted.

**Version**: 1.0.0 | **Ratified**: 2026-05-29 | **Last Amended**: 2026-05-29
