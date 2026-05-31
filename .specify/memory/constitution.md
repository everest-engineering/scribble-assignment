# Constitution

## 1. Engineering Principles

### 1.1 Brownfield, Not Greenfield
- Extend the existing codebase. Do not rewrite files from scratch.
- Preserve the existing architecture patterns (Express routes, RoomStore class, Zod schemas).
- Only add new files when a concern genuinely does not fit existing files.

### 1.2 Deterministic Game Rules
- All game logic must be deterministic where possible:
  - Word selection: `hash(roomCode) % words.length`
  - Drawer assignment: always the host (first participant / creator)
- Randomness is only used for room code generation (already exists).

### 1.3 Immutability & Pure Functions
- Server-side room mutations use `structuredClone` on read paths (already established).
- Prefer pure functions for game logic (scoring, word selection, validation).
- Avoid side effects in computed values.

### 1.4 Fail Fast, Fail Gracefully
- Validation errors return 400 with a descriptive message.
- Not-found errors return 404 with a clear message.
- Unexpected errors return 500; the frontend must not crash.
- Frontend forms must show inline error messages, not console-only errors.

### 1.5 Minimal Dependencies
- Do not add npm packages unless necessary.
- Current stack (Express, Zod, React, React Router) is sufficient.
- Drawing canvas uses the native HTML5 Canvas API — no drawing library.

## 2. AI Usage Rules

### 2.1 Transparency
- All AI-generated code must be reviewed before committing.
- The constitution, spec, plan, and tasks are human-authored (with AI assistance for drafting).

### 2.2 No Hallucinated APIs
- AI must not invent endpoints, parameters, or behaviours not specified.
- Every API addition must be traceable to a spec acceptance criterion.

### 2.3 Context Boundaries
- AI must read the relevant existing files before suggesting changes.
- AI must respect the explicit out-of-scope list (no WebSockets, no databases, no auth, etc.).

### 2.4 Peer Review of AI Output
- Every AI-suggested change must be validated against the spec.
- Suspect code must be flagged and reasoned about, not blindly accepted.

## 3. Review Discipline

### 3.1 Validate After Every Change
- Run `npm test` in both `backend/` and `frontend/` after every implementation phase.
- Manually verify acceptance criteria using two browser tabs.
- Do not proceed to the next scenario until the current scenario passes all acceptance criteria.

### 3.2 Commit Granularity
- One commit per logical change (e.g., "Add hostId to Room model", "Add lobby polling", "Add drawing canvas").
- Each commit message must reference the scenario and the change purpose.
- Spec Kit artifact updates are committed separately from implementation.

### 3.3 Spec–Implementation Traceability
- Every backend endpoint and frontend component change must map to a spec acceptance criterion.
- Deviations between spec and implementation must be documented in the commit message or a comment.

## 4. Testing Expectations

### 4.1 Unit Tests
- Backend: test store functions (room creation, join, host validation, scoring).
- Frontend: test API service methods for correct request construction.
- Use Vitest (already configured).

### 4.2 Manual Integration Tests
- Scenario 1: Two browser tabs create/join, verify host badge, verify polling, verify start-guest gate.
- Scenario 2: Verify drawer sees word, guesser does not; empty name rejected.
- Scenario 3: Drawer draws, guesser submits guess, verify scoring and history.
- Scenario 4: Correct guess → result shown; restart → lobby with players preserved.

## 5. Style & Conventions

### 5.1 TypeScript
- No `any` — use `unknown` for dynamic types, then narrow.
- All function parameters and return types must be explicitly typed.
- Use the existing type definitions in `game.ts` — extend, do not duplicate.

### 5.2 Imports
- Backend: use `.js` extension in relative imports (already established).
- Frontend: extensionless imports (already established).

### 5.3 No Comments in Code
- Code should be self-documenting through naming and structure.
- Only add comments when the "why" is not obvious from the code (e.g., a non-obvious business rule).

## 6. Scope Boundaries (Enforced)

### 6.1 Do Not Build
- WebSockets or real-time sync
- Databases or persistent storage
- Authentication, accounts, or sessions
- Deployment, hosting, CI, or Docker
- New state-management or routing libraries
- Multiple rounds, drawer rotation, timers, bonuses
- Custom word packs, spectator mode, moderation
- Room passwords or invite links

### 6.2 Do Not Refactor
- Existing components that are unrelated to the required changes.
- Styling or CSS that is not directly related to new functionality.
