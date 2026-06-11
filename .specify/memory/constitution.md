<!--
╔══════════════════════════════════════════════════════════════════════════════╗
║  SYNC IMPACT REPORT                                                        ║
║  Version change: 0.0.0 (template) → 1.0.0                                  ║
║                                                                             ║
║  Modified Principles:                                                       ║
║    - [PRINCIPLE_1_NAME] → I. TypeScript First                               ║
║    - [PRINCIPLE_2_NAME] → II. Immutability & Purity                         ║
║    - [PRINCIPLE_3_NAME] → III. Test-First (NON-NEGOTIABLE)                  ║
║    - [PRINCIPLE_4_NAME] → IV. Validated REST API                            ║
║    - [PRINCIPLE_5_NAME] → V. Strict Boundaries                              ║
║                                                                             ║
║  Added Sections:                                                            ║
║    - Technology Stack & Constraints                                         ║
║    - Development Workflow                                                   ║
║    - Governance rules                                                       ║
║                                                                             ║
║  Removed Sections: None                                                     ║
║                                                                             ║
║  Templates Requiring Updates:                                               ║
║    - .specify/templates/plan-template.md ✅ already aligned                  ║
║    - .specify/templates/spec-template.md ✅ already aligned                  ║
║    - .specify/templates/tasks-template.md ✅ already aligned                 ║
║    - .specify/templates/checklist-template.md ✅ already aligned             ║
║    - .specify/templates/constitution-template.md ✅ updated from template    ║
║                                                                             ║
║  Follow-up TODOs: None                                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝
-->

# Scribble Constitution

## Core Principles

### I. TypeScript First

All code MUST be fully typed with TypeScript. Avoid `any`; use `unknown` for
truly dynamic types. ES modules MUST be used throughout both backend and
frontend. File extensions in backend imports follow the `.js` convention where
required.

### II. Immutability & Purity

State mutations MUST be explicit. Prefer immutable data structures and pure
functions. Side effects MUST be confined to dedicated service or handler
layers. Business logic SHOULD be side-effect-free and testable without mocking
I/O.

### III. Test-First (NON-NEGOTIABLE)

Tests MUST be written before implementation code. The Red-Green-Refactor
cycle MUST be followed: write a failing test, implement the minimum code to
pass, then refactor. Acceptance criteria from the spec drive test scenarios.
No feature is complete without passing tests.

### IV. Validated REST API

All API request payloads MUST be validated with Zod schemas at the boundary.
Every endpoint MUST enforce strict input contracts. Invalid input MUST produce
structured error responses. Responses MUST also be typed for predictable
client consumption.

### V. Strict Boundaries

The following are strictly FORBIDDEN:
- WebSockets or any real-time push protocol (HTTP polling only)
- Databases or persistent storage (all data in-memory only)
- Authentication, sessions, JWT, or OAuth
- Scope creep beyond explicitly specified features
- Unjustified top-level dependencies
- Rewriting existing code without explicit spec justification

## Technology Stack & Constraints

- **Backend**: Node.js, Express, TypeScript, Zod, `tsx` for execution
- **Frontend**: React 18, React Router v6, Vite, TypeScript
- **State Management**: Zustand or Context API (follow existing pattern in
  `roomStore.ts`)
- **Styling**: CSS via `app.css` or CSS modules
- **Backend structure**: `src/api` (routes), `src/services` (business logic),
  `src/models` (types/entities)
- **Memory**: Active game rooms MUST be explicitly removed when inactive; no
  stateful bloat

## Development Workflow

- **Backend dev**: `cd backend && npm run dev`
- **Frontend dev**: `cd frontend && npm run dev`
- Commits MUST be granular, meaningful, and traceable to spec artifacts
- Implement incrementally: one feature slice at a time, validate against
  acceptance criteria
- Before committing: inspect `git status`, `git diff`, `git log --oneline -10`
- Stage only intended files; never commit secrets

## Governance

This constitution supersedes all other development practices. Amendments MUST
be documented with rationale, approved, and include a migration plan.

- **Amendment process**: Propose change → document rationale → review against
  existing principles → record in constitution version history
- **Versioning**: MAJOR for incompatible principle changes/removals; MINOR for
  new principles or materially expanded guidance; PATCH for clarifications and
  typo fixes
- **Compliance**: All PRs and reviews MUST verify constitution compliance.
  Complexity MUST be justified when it violates strict boundaries.
- **Review gate**: Every plan output MUST include a Constitution Check that
  passes before implementation proceeds. Use `AGENTS.md` for runtime
  development guidance.

**Version**: 1.0.0 | **Ratified**: 2026-06-11 | **Last Amended**: 2026-06-11
