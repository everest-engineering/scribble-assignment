<!--
Sync Impact Report

Version change: [CONSTITUTION_VERSION] -> 1.0.0

Modified principles:
- [PRINCIPLE_1_NAME] -> TypeScript First
- [PRINCIPLE_2_NAME] -> Test-First (TDD)
- [PRINCIPLE_3_NAME] -> HTTP Polling Only (No WebSockets)
- [PRINCIPLE_4_NAME] -> In-Memory Data Only (No Databases)
- [PRINCIPLE_5_NAME] -> Observability & Versioning

Added sections:
- Additional Constraints
- Development Workflow

Removed sections:
- none

Templates requiring updates:
- .specify/templates/plan-template.md ✅ updated
- .specify/templates/spec-template.md ⚠ pending
- .specify/templates/tasks-template.md ⚠ pending

Follow-up TODOs:
- Update spec & tasks templates to reference constitution constraints
- Add ratification signatories or maintainers list if required
-->

# Scribble Constitution

## Core Principles

### TypeScript First (NON-NEGOTIABLE)

All production and test code MUST be written in TypeScript with strict typing enabled.
Avoid `any`; prefer `unknown` where necessary. Backend request/response shapes MUST be
validated with Zod. Rationale: Type safety reduces runtime bugs and matches existing
repo patterns.

### Test-First (NON-NEGOTIABLE)

New features and bug fixes MUST be driven by tests. Unit and contract tests MUST be
added alongside implementation using `vitest`. Tests should fail before the
implementation step (red → green → refactor).

### HTTP Polling Only (ENFORCED)

Real-time push protocols are NOT PERMITTED. Do not add WebSockets, Socket.io, or any
server push technology. Design APIs and clients to use HTTP polling patterns only.
Rationale: Keeps server simple and aligns with existing constraints.

### In-Memory Data Only (ENFORCED)

This project MUST NOT introduce external databases or persistent stores. All runtime
state is in-memory; seed data MAY be used for local development. Add clear
disclaimers in docs about non-persistence and restart behavior.

### Observability & Versioning

All services MUST emit structured logs (concise + searchable). API changes follow
semantic versioning for public contracts: MAJOR for breaking changes, MINOR for
backward-compatible features, PATCH for non-semantic edits and docs. Breaking
changes require a migration plan and a MAJOR version bump.

## Additional Constraints

- Tech stack: TypeScript, Node.js (backend), Express, Zod, React + Vite (frontend)
- No authentication mechanisms are to be added (NO JWTs, sessions, or OAuth)
- No external databases, queues, or message buses
- Use `vitest` for tests; CI/CD is out of scope for the current phase — tests and linting should be run locally before merging.
- Document polling intervals and API contract examples in `docs/` or README

## Development Workflow

- Branching: Use per-feature branches for development. Branch names SHOULD follow the spec-tooling conventions using either a numeric prefix or timestamp prefix, for example `001-frontend-env-config` or `20260531-143022-feature-name`. Matching the branch prefix to the spec directory enables the spec tooling to automatically resolve `FEATURE_DIR` and related artifacts.
- Commit messages SHOULD be clear and reference issues when present.
- Pull Requests: must include a description, testing notes, and link to any relevant contracts. Two reviewers are recommended for major changes.
- Quality Gates: Tests and linting are required and should be executed locally before merge; CI/CD automation is out of scope for this phase.

## Governance

Amendments to this constitution require an authored PR that documents the change,
the rationale, and any migration steps. Versioning policy:

- PATCH: editorial clarifications, typos, non-semantic wording changes
- MINOR: addition of a principle or materially expanded guidance
- MAJOR: removal or redefinition of an existing principle (breaking governance)

Changes to the constitution SHOULD include a `Sync Impact Report` summarizing
templates or artifacts that need updates.

**Version**: 1.0.0 | **Ratified**: 2026-05-31 | **Last Amended**: 2026-05-31
