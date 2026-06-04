<!-- 
Sync Impact Report:
- Version change: 0.1.0 -> 0.2.0
- Modified principles: Added VI. High-Quality Testing Standard
- Added sections: None
- Removed sections: None
- Templates requiring updates (✅ updated / ⚠ pending):
  - ✅ .specify/templates/plan-template.md
  - ✅ .specify/templates/spec-template.md
  - ⚠ .specify/templates/tasks-template.md
- Follow-up TODOs: None
-->
# Scribble Assignment Constitution

## Core Principles

### I. TypeScript-First (Strict Mode)
All code MUST be written in TypeScript with strict mode enabled. Type safety is non-negotiable and provides the foundation for system reliability.

### II. Stack Integrity & Protocol
The application MUST strictly adhere to the defined stack: React (v18), Vite, TypeScript for frontend; Node.js, Express, TypeScript, Zod, `tsx` for backend. Inter-service communication MUST use HTTP polling exclusively. No WebSockets, no Socket.io, no database/persistent storage, no authentication.

### III. Architectural Standards
The codebase MUST enforce clean separation: `src/api` for routes/handling, `src/services` for business logic, `src/models` for data entities, `src/state` for complex state. Use functional components, immutable structures, pure functions, and centralized error handling (backend). Frontend MUST NOT crash on API exceptions.

### IV. Functional Minimalism
Memory footprint for active game rooms MUST be minimized; inactive rooms MUST be explicitly removed. No custom word packs; only starter seed data. No extra features (rounds, timers, bonuses, etc.) unless explicitly added to scope. No unjustified top-level dependencies.

### V. Simplicity & Scope Discipline
Strict adherence to project boundaries. No unrelated refactors, no spectator mode, no moderation/kick features, no room passwords, no deployment work. Start simple; if it is not explicitly required by the user, it is out of scope.

### VI. High-Quality Testing Standard
Maintain a minimum of 90% code coverage. Use Vitest for all unit and integration testing. Automated testing MUST be verified as passing for all features before any code is merged.

## Technical Stack & Architectural Constraints

### Implementation Requirements
- **Backend**: Express, Zod for all request/response validation. Centralized error handling.
- **Frontend**: React Functional components, React Router (v6), Vite.
- **State**: Complex state in `src/state` (Zustand/Context API).
- **Styling**: Vanilla CSS or CSS modules. No external styling libraries like Tailwind unless requested.
- **Testing**: Vitest for all unit/integration tests.

## Workflow Standards

### Code Quality & Maintenance
- All PRs and code changes must be reviewed against these core principles.
- Maintain a clean structural component hierarchy.
- No hacking around strict type definitions or disabling linting.
- Every feature must have associated automated tests verified before merging.

## Governance

This constitution serves as the foundational authority for all development decisions within this project.

1. **Compliance**: Every change must verify compliance with these principles.
2. **Amendments**: Changes to principles require a documented proposal, impact analysis, and validation plan.
3. **Versioning**:
   - MAJOR: Backward-incompatible governance or principle changes.
   - MINOR: New principle additions or material expanded guidance.
   - PATCH: Clarifications, typo fixes.
4. **Compliance Review**: All PRs must include a check against this constitution in the review process.

**Version**: 0.2.0 | **Ratified**: 2026-06-01 | **Last Amended**: 2026-06-01
