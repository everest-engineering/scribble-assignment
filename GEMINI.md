# Scribble Project Instructions

This document provides foundational mandates and workflows for the Scribble project. It integrates the Spec Kit constitution and codebase-specific guidelines.

## Core Mandates (Constitution)

- **Minimal & Justifiable:** Changes must be minimal, focused, and explicitly justifiable.
- **Readability & Maintainability:** Prioritize clean, readable code and long-term maintainability.
- **Best Practices:** Adhere to language-specific (TypeScript, React, Express) best practices and coding standards.
- **Architectural Integrity:** Strictly follow existing architectural patterns and separation of concerns.
- **Simplicity:** Favor simple and optimal solutions over unnecessary complexity.
- **AI Usage:** All AI-generated code requires human validation.
- **Review Discipline:** Ensure peer review and constructive feedback before merging.
- **Quality:** Maintain consistency, correctness, security, and maintainability across the codebase.

## Project Context & Tech Stack

- **Nature:** Brownfield enhancement for a multiplayer drawing game.
- **Backend:** Node.js, Express, TypeScript, Zod (Validation), Vitest (Testing). In-memory storage only.
- **Frontend:** React (v18), React Router (v6), Vite, TypeScript, Vitest (Testing).
- **Communication:** HTTP Polling ONLY (No WebSockets).

## Architectural Patterns

### Backend (`/backend`)
- **API Layer (`src/api`)**: Routes and request handling. Use Zod for schema validation.
- **Service Layer (`src/services`)**: Core business logic and state management (e.g., `roomStore.ts`).
- **Models (`src/models`)**: TypeScript types and data structures.

### Frontend (`/frontend`)
- **Components (`src/components`)**: Reusable UI components.
- **Pages (`src/pages`)**: Top-level page components.
- **State (`src/state`)**: Centralized state management (e.g., `roomStore.ts`).
- **Services (`src/services`)**: Centralized API calls (`api.ts`).

## Workflow Expectations

1. **Research & Discovery**: Analyze existing files and document gaps.
2. **Specify**: Update `speckit.specify` with acceptance criteria.
3. **Plan**: Update `speckit.plan` with state model, data flow, and file changes.
4. **Tasks**: Update `speckit.tasks` with ordered, testable steps.
5. **Execution (Plan-Act-Validate)**:
   - For each task, implement minimal changes.
   - Run tests (`npm run test`) and verify behavior with two browser tabs.
   - Commit incrementally with meaningful messages.

## Strictly Forbidden
- No WebSockets or real-time sync.
- No databases or persistent storage.
- No authentication or sessions.
- No new state-management or routing libraries.
- No unjustified top-level dependencies.
- No unrelated refactors.

## References
- See `README.md` for business scenarios and learning objectives.
- See `AGENTS.md` for supplementary agent-specific hints.
