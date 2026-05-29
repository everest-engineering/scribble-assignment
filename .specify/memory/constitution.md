<!--
SYNC IMPACT REPORT
- Version change: 1.0.0 → 1.1.0
- List of modified principles:
    - Replaced initial 5 principles with 14 comprehensive rules (I-XIV).
- Added sections: None
- Removed sections: None
- Templates requiring updates:
    - ✅ updated: .specify/memory/constitution.md
    - ✅ updated: .specify/templates/plan-template.md
    - ⚠ pending: .specify/templates/spec-template.md
    - ⚠ pending: .specify/templates/tasks-template.md
- Follow-up TODOs: None
-->

# Scribble Starter Constitution

## Core Principles

### I. TypeScript Strict Mode
All code must pass strict TypeScript checks, and usage of `any` types is not allowed without explicit justification.

### II. Testing Discipline
Every new feature and significant bug fix must include appropriate unit or integration tests to ensure reliability and maintainability.

### III. Extend the Starter Application
The existing starter application must be extended incrementally without rewriting the provided architecture, routing, or room flow.

### IV. Deterministic Gameplay
Game behavior such as word selection, scoring, and state transitions must remain deterministic and predictable.

### V. Simplicity First
Implementation should prioritize clarity, maintainability, and minimal complexity over advanced architectural patterns.

### VII. Polling-Based Synchronization
Application synchronization must use polling-based updates instead of WebSockets or real-time communication systems.

### VIII. Validation Consistency
All user inputs must be trimmed, validated, and rejected gracefully if empty or invalid.

### IX. Explicit Game States
The application must maintain clear and traceable game states such as lobby, playing, and results.

### X. Specification-Driven Development
All implementation work must follow the sequence of discovery, specification, planning, task breakdown, implementation, and validation.

### XI. Incremental Feature Delivery
Development must proceed feature-group by feature-group instead of implementing the entire game at once.

### XII. AI-Assisted but Human-Reviewed Development
All AI-generated specifications, plans, tasks, and code must be manually reviewed before acceptance or commit.

### XIII. Scope Discipline
Out-of-scope features such as WebSockets, authentication, databases, timers, and multi-round gameplay must not be introduced.

### XIV. Traceable Implementation
Every implemented feature must map back to a business scenario, specification item, plan entry, and task definition.

## Technology & Scope Constraints

- **Frontend**: Vite + React + TypeScript. Use existing styles and components; no new state-management or routing libraries.
- **Backend**: Node.js + Express + TypeScript. All state is in-memory; restarting the backend clears all data.
- **Sync Protocol**: HTTP Polling (~2s cadence) for state sync. WebSockets, real-time sync, and persistent databases are explicitly OUT OF SCOPE.
- **Validation**: Vitest for unit and integration tests. Manual validation of scenarios in multiple browser tabs is mandatory.

## Recommended Build Order

1. **Discovery**: Read relevant starter files; document gaps, assumptions, and relevant files.
2. **Specify**: Update the feature specification with detailed acceptance criteria and edge cases.
3. **Clarify**: Resolve any ambiguity with the user or through research before moving to planning.
4. **Plan**: Update the state model, file-level changes, and data flow in the implementation plan.
5. **Tasks**: Decompose the plan into granular, ordered, and testable work items.
6. **Implement & Validate**: Complete one slice at a time, commit it, and verify against acceptance criteria.

## Governance

- The Constitution is the foundational mandate for all development and supersedes other practices.
- Amendments require a version bump (Major/Minor/Patch) and a Sync Impact Report at the top of this file.
- Every Pull Request and review must verify compliance with the Core Principles and relevant Specifications.
- Complexity must be explicitly justified if it deviates from the simple REST/Polling architecture.

**Version**: 1.1.0 | **Ratified**: 2026-05-28 | **Last Amended**: 2026-05-28
