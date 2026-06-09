<!--
  Sync Impact Report
  Version change: N/A (template) → 1.0.0 (initial adoption)
  Modified principles: All 5 principles newly defined
  Added sections: Core Principles I-V, Technology Stack & Constraints, Development Workflow, Governance
  Removed sections: None
  Templates requiring updates:
    - .specify/templates/constitution-template.md: ✅ Source template (no change needed)
    - .specify/templates/plan-template.md: ✅ No principle-driven changes needed
    - .specify/templates/spec-template.md: ✅ No principle-driven changes needed
    - .specify/templates/tasks-template.md: ✅ No principle-driven changes needed
  Follow-up TODOs: None
-->

# Scribble Constitution

## Core Principles

### I. TypeScript Strict Mode

All source code MUST be written in TypeScript with `strict: true` enabled in tsconfig.
The `any` type is FORBIDDEN; use `unknown` when types are truly dynamic.
Every function, variable, and component MUST have explicit type annotations where
they cannot be inferred.

Rationale: Strict typing catches category errors at compile time and serves as
living documentation for future maintainers.

### II. Functional Components & Hooks

All React components MUST be functional components using hooks (`useState`,
`useEffect`, etc.). Class components are FORBIDDEN. State MUST be managed via
hooks, Zustand, or Context API following the patterns established in
`roomStore.ts`.

Rationale: Functional components promote composability, testability, and align
with React 18's recommended patterns.

### III. Short-Polling Sync (2-Second Maximum)

All client-server synchronization MUST use HTTP short-polling with a maximum
interval of 2 seconds (2000ms). WebSockets, Socket.io, or any real-time push
protocol are FORBIDDEN. Clients MUST poll at intervals ≤2000ms; servers MUST
respond to poll requests without initiating server-side pushes.

Rationale: HTTP polling keeps the architecture simple, observable, and avoids
the complexity of persistent connections.

### IV. Strict Input & Name Validation

All user-supplied input MUST be validated on the backend using Zod schemas
before processing. Player names MUST be trimmed of whitespace; empty or
whitespace-only names MUST be rejected with a clear error message. Room codes,
guesses, and all other user input MUST be validated for format, length, and
content constraints.

Rationale: Defensive validation prevents inconsistent game state and provides
clear, immediate user feedback on invalid input.

### V. Testable Game Logic (NON-NEGOTIABLE)

Game rules MUST be deterministic and independently testable. Drawing state,
scoring, word selection, and round transitions MUST be implemented as pure
functions where possible. All business logic MUST reside in the backend
`src/services/` layer, not embedded in route handlers or frontend code.

Rationale: Deterministic game logic ensures all players observe identical state
and simplifies debugging and testing.

## Technology Stack & Constraints

### Backend

- **Runtime**: Node.js 18+
- **Framework**: Express
- **Language**: TypeScript (`strict: true`)
- **Validation**: Zod for all request payloads and responses
- **Execution**: `tsx` for development

### Frontend

- **Framework**: React 18 with functional components and hooks
- **Routing**: React Router v6
- **Build Tool**: Vite
- **Language**: TypeScript (`strict: true`)
- **State Pattern**: Zustand or Context API (as established in `roomStore.ts`)

### Hard Constraints

- No databases of any kind; all state MUST be stored in-memory only.
- No authentication, sessions, JWT, or OAuth.
- No WebSockets, Socket.io, or any real-time push protocol.
- No new state-management or routing libraries beyond what the starter ships.

## Development Workflow

### Commit Discipline

- Changes MUST be committed incrementally with meaningful, descriptive commit
  messages.
- Frontend (`npm run build`) and backend (`npm run build`) MUST both build
  successfully before committing.
- Constitution compliance MUST be verified for each feature or modification.

### Review Process

- All changes MUST be reviewed for constitution compliance.
- Complexity beyond project conventions MUST be justified and documented.
- Runtime development guidance in `AGENTS.md` supplements this constitution.

## Governance

This constitution supersedes all other development practices. Amendments
require:

1. **Documentation**: Update this file with the proposed change.
2. **Versioning**: Follow SemVer rules:
   - MAJOR: Backward-incompatible principle removals or redefinitions.
   - MINOR: New principles, sections, or materially expanded guidance.
   - PATCH: Clarifications, wording fixes, non-semantic refinements.
3. **Compliance**: All PRs and reviews MUST verify constitution compliance.

**Version**: 1.0.0 | **Ratified**: 2026-05-18 | **Last Amended**: 2026-06-09
