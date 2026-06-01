# Constitution

## Engineering Principles

### Extend, Don't Replace
- All new code extends existing structures. Do not rewrite the starter from scratch.
- Add fields to existing types rather than creating parallel type hierarchies.
- Leverage the existing in-memory store pattern and RoomSnapshot response format.

### Server-Authoritative State
- All game logic (validation, scoring, state transitions) lives on the backend.
- The frontend is a thin display layer: it renders snapshots and sends user actions.
- The `RoomSnapshot` returned by the server is the single source of truth.

### REST + Polling
- All client-server communication uses HTTP request-response. No WebSockets.
- Frontend polls `GET /rooms/:code` at ~2s intervals for state updates.
- Mutations (start, draw, guess, restart) are POST requests that return the updated snapshot.

### Deterministic Game Rules
- Secret word selection is deterministic (derived from participant count).
- Scoring is +100 for correct guess, +0 for incorrect.
- One round only. Drawer rotation, timers, and bonuses are out of scope.

### Immutability
- Backend store returns cloned/structuredClone copies of room data.
- Frontend state is replaced, never mutated in place.

## AI Usage Rules

### Traceability
- Every AI-generated code change must be traceable to a specific spec criterion (e.g., "1.4 Lobby polling").
- Before committing, verify which spec IDs are addressed by the change.

### Human Review Required
- All AI-generated code is reviewed by the human before staging.
- No AI-generated code is committed without being run (dev server or test).
- The human makes the final decision on all design choices.

### Library Constraint
- No new dependencies beyond what the starter already ships:
  - Backend: Express, Zod, cors, tsx, TypeScript, vitest
  - Frontend: React 18, react-router-dom 6, Vite, TypeScript, vitest
- No WebSockets, databases, authentication, or state-management libraries.

### AI as Assistant, Not Author
- The AI proposes implementation details; the human validates correctness.
- The AI does not file commits, open PRs, or push to remotes.

## Review Discipline

### Pre-Commit Checks
1. `cd backend && npm run build` — must pass with zero errors.
2. `cd frontend && npm run build` — must pass with zero errors.
3. Run the app and verify the changed scenario with 2 browser tabs.

### Commit Conventions
- Each commit addresses one logical change (e.g., "Add host tracking to Room model").
- Commit messages reference the spec ID where applicable (e.g., "feat: add lobby auto-polling (spec 1.4)").
- The PR diff should be easy to review: granular commits with clear boundaries.

### Validation Before Moving On
- Complete all acceptance criteria for a scenario before starting the next one.
- If a bug is found in an earlier scenario after moving on, fix it immediately and note it.

### Edge Cases
- Always test: empty names, whitespace-only names, non-existent room codes, role violations (drawer guessing, guesser drawing).
- Multi-room isolation: verify that rooms A and B do not interfere.
- Restart: verify all round state is cleared but participants remain.
