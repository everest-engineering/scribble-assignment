<!--
Sync Impact Report:
- Version change: N/A → 1.0.0
- List of modified principles: Placeholder Principles → TypeScript Excellence, Testing Discipline, Accessibility, Performance & Bundle Constraints, Architectural Simplicity & Scope Adherence.
- Added sections: Explicitly Out of Scope, Development Workflow.
- Removed sections: None.
- Templates requiring updates: ✅ .specify/templates/plan-template.md, ✅ .specify/templates/spec-template.md, ✅ .specify/templates/tasks-template.md (Checked and aligned).
- Follow-up TODOs: None.
-->

# Scribble Starter Constitution

## Core Principles

### I. TypeScript Excellence
TypeScript strict mode must be enabled and enforced across both frontend and backend. The use of `any` or loose typing is strictly prohibited unless justified by external library constraints. React components must be functional and utilize hooks for state management.

### II. Testing Discipline
Vitest is the mandatory testing framework for both frontend and backend. A minimum of 80% code coverage is required for all new logic. Every feature must be accompanied by unit tests that verify behavioral correctness.

### III. Accessibility (WCAG 2.1 AA)
The application MUST adhere to WCAG 2.1 AA standards. This includes ensuring proper color contrast, keyboard navigability for all interactive elements, and appropriate ARIA labels where semantic HTML is insufficient. Accessibility is a non-negotiable quality gate.

### IV. Performance & Bundle Constraints
Maintain a lightweight application with a target frontend bundle size of ~150KB. Avoid introducing heavy top-level dependencies without explicit justification. Optimization should prioritize initial load time and responsiveness.

### V. Architectural Simplicity & Scope Adherence
Adhere strictly to the "No real-time/persistent storage" constraint. Use polling (~2s) for state synchronization instead of WebSockets. Do not introduce new state-management or routing libraries beyond what the starter provides. Avoid "just-in-case" features or unrelated refactors.

## Explicitly Out of Scope

The following items are strictly out of scope and must NOT be implemented or planned:
- WebSockets or real-time sync.
- Databases or persistent storage.
- Authentication, accounts, or sessions.
- Deployment, hosting, CI, or Docker work.
- Multiple rounds, drawer rotation, timers, countdowns, speed bonuses, or drawer bonuses.
- Custom or random word packs.
- Spectator mode or moderation features (kick/mute).
- Room passwords or invite links.
- Rewriting the starter from scratch.

## Development Workflow

Follow the **Research -> Strategy -> Execution** lifecycle for every feature.
1. **Research**: Document gaps, assumptions, and relevant files.
2. **Strategy**: Update spec with acceptance criteria and resolve ambiguity.
3. **Execution**: Implement incrementally (Plan -> Act -> Validate) and commit granularly.
Validation MUST include testing against acceptance criteria using at least two browser tabs to simulate multi-player interaction.

## Governance

This Constitution supersedes all other development practices within the Scribble Starter project. Any deviations or amendments must be documented, justified, and result in a version bump. All Pull Requests and reviews must verify compliance with these core principles.

**Version**: 1.0.0 | **Ratified**: 2026-05-28 | **Last Amended**: 2026-05-28
