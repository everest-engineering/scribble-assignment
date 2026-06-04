# Reflection — Scribble Lab

## What the starter app already had
The starter provided a scaffold with Express + React + TypeScript setup, page routing (Start, Create Room, Join Room, Lobby, Game), in-memory room storage, starter words/roles, and placeholder UI components. It had `POST /rooms`, `POST /rooms/:code/join`, and `GET /rooms/:code` endpoints but no game logic — no host tracking, no drawer assignment, no word selection, no drawing, no guessing, no scoring, no result state.

## What I added

### Backend
- Host tracking (`hostId` on room creation), player name validation, and a full game engine: `startGame` (drawer assignment, deterministic word selection), `submitGuess` (case-insensitive comparison, 100pt scoring, auto-result), `updateCanvas`/`clearCanvas`, and `restartGame` (preserves participants, clears round state). All endpoints have Zod validation and proper error responses.

### Frontend
- Auto-polling lobby (~2s) with host-only start button (disabled until 2+ players), interactive drawing canvas (mouse/touch), connected GuessForm with validation, live Scoreboard and Guess History, result view with scores/history, and restart flow. State management uses a custom `RoomStore` class with `useSyncExternalStore`.

### Spec Kit artifacts
- Constitution, discovery notes, per-scenario specs/plans/tasks, and this reflection.

## Key decisions
- **Host=drawer**: Keeps the first round simple; avoids drawer rotation (out of scope).
- **Polling over WebSockets**: Required by the constraints; works fine for this scope.
- **Deterministic word selection**: Uses char-code sum of room code — reproducible, no extra state.
- **Canvas as base64 data URL**: Simple to transmit over REST; no binary encoding needed.

## AI usage
The implementation was AI-assisted. The AI generated backend models, store functions, routes, and frontend components based on the spec. I reviewed each change before committing, ran builds and tests, and verified edge cases with curl. The main issues were:
- Initial TypeScript type errors from the `"error" in result` pattern — fixed by switching to a discriminated `{ ok, error/room }` union.
- React hooks order violation from placing `useCallback` inside JSX — moved to top level.
- Spec Kit artifacts initially in wrong file paths — restructured to match mandated paths.

## Tradeoffs
- Single-round only (per out-of-scope rules); no drawer rotation.
- Scores reset to 0 on restart (clearer than accumulating across rounds).
- No canvas throttling — each `mouseUp` sends the full base64; adequate for a lab but would need optimization for frequent drawing.
