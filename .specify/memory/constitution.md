# Scribble Lab Constitution

## Core Principles

### I. TypeScript First

All frontend and backend source code MUST compile under TypeScript strict mode with no silent `any` types. Type safety is a non-negotiable quality gate: use explicit types, `unknown` for dynamic input, and fix all `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`, and related strict-mode failures before merging.

### II. Functional React Only

React components MUST be implemented as functional components using hooks where needed. Class components are prohibited. UI behavior should use composable hooks, local component state, and explicit props contracts.

### III. Test and Coverage Discipline

Vitest is the required test runner. All new or changed behavior MUST include automated tests. The project-wide target for maintained features is at least 80% coverage for the affected module surface, with tests exercising positive, negative, and edge-case paths.

### IV. Accessibility and Performance

Frontend features MUST meet WCAG 2.1 AA accessibility expectations for the user flows under development. Performance is also a first-class consideration: frontend bundle size SHOULD remain near a 150KB budget for the production client payload, and any budget exceedance MUST be justified in code review.

### V. Spec Alignment and Commit Discipline

Every feature MUST be driven by a written specification and implemented only after the spec is approved. Features are considered complete when the implementation matches the spec, acceptance criteria pass, and the change is validated in a reviewable state. Auto-commit hooks or workflow checkpoints SHOULD be used to preserve progress after a feature is implemented successfully and aligned with its spec.

## Constraints and Scope

- The existing stack is authoritative: use the starter React, Vite, Node, Express, and in-memory backend patterns already present in the repository.
- Any authentication work is allowed only if the feature spec explicitly requires it and the project scope still permits it. If current project boundaries forbid authentication, preserve the no-auth lab constraint and document scope decisions clearly.
- Do not introduce new major frameworks, runtime platforms, or persistence mechanisms beyond the starter scaffolding.

## Development Workflow

- Code review MUST verify TypeScript strictness, functional component usage, Vitest coverage, WCAG 2.1 AA accessibility, and bundle budget reasoning for significant frontend changes.
- Testing gates MUST include unit and integration checks for feature behavior. Work that changes UI or game rules MUST include coverage for the corresponding user flows and edge cases.
- Documentation and spec artifacts MUST be updated alongside implementation. Feature decisions that alter scope, authentication, or bundle expectations require an explicit note in the spec.
- Commits for completed features SHOULD reference the corresponding spec artifact and include clear, incremental descriptions of the implemented behavior.

## Governance

This constitution is the authoritative workflow and quality guard for the Scribble lab. Any amendment MUST be documented in `/specify/memory/constitution.md`, reviewed before merge, and accompanied by a rationale for the change.

**Version**: 0.1.0 | **Ratified**: 2026-06-05 | **Last Amended**: 2026-06-05
