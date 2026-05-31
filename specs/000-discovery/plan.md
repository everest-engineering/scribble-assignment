# Plan — Discovery & Constitution

## Engineering Principles

### Brownfield, Not Greenfield
- Extend the existing codebase. Do not rewrite files from scratch.
- Preserve the existing architecture patterns (Express routes, RoomStore class, Zod schemas).
- Only add new files when a concern genuinely does not fit existing files.

### Deterministic Game Rules
- All game logic must be deterministic where possible:
  - Word selection: `hash(roomCode) % words.length`
  - Drawer assignment: always the host (first participant / creator)
- Randomness is only used for room code generation (already exists).

### Immutability & Pure Functions
- Server-side room mutations use `structuredClone` on read paths (already established).
- Prefer pure functions for game logic (scoring, word selection, validation).
- Avoid side effects in computed values.

### Fail Fast, Fail Gracefully
- Validation errors return 400 with a descriptive message.
- Not-found errors return 404 with a clear message.
- Unexpected errors return 500; the frontend must not crash.
- Frontend forms must show inline error messages, not console-only errors.

### Minimal Dependencies
- Do not add npm packages unless necessary.
- Current stack (Express, Zod, React, React Router) is sufficient.
- Drawing canvas uses the native HTML5 Canvas API — no drawing library.

## AI Usage Rules

- All AI-generated code must be reviewed before committing.
- AI must not invent endpoints, parameters, or behaviours not specified.
- AI must read the relevant existing files before suggesting changes.
- AI must respect the explicit out-of-scope list (no WebSockets, no databases, no auth, etc.).
- Every AI-suggested change must be validated against the spec.

## Review Discipline

- Run `npm test` in both `backend/` and `frontend/` after every implementation phase.
- One commit per logical change.
- Every backend endpoint and frontend component change must map to a spec acceptance criterion.

## Testing Expectations

- Backend: test store functions (room creation, join, host validation, scoring).
- Frontend: test API service methods for correct request construction.
- Manual integration tests across two browser tabs.

## Style & Conventions

- No `any` — use `unknown` for dynamic types, then narrow.
- Code should be self-documenting through naming and structure.
- Only add comments when the "why" is not obvious from the code.

## Scope Boundaries (Enforced)

### Do Not Build
- WebSockets or real-time sync
- Databases or persistent storage
- Authentication, accounts, or sessions
- Deployment, hosting, CI, or Docker
- New state-management or routing libraries
- Multiple rounds, drawer rotation, timers, bonuses
- Custom word packs, spectator mode, moderation
- Room passwords or invite links

### Do Not Refactor
- Existing components that are unrelated to the required changes.
- Styling or CSS that is not directly related to new functionality.
