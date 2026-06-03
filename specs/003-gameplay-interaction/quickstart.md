# Quickstart: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-03

## Prerequisites

- Node.js 24+ installed
- Dependencies installed: run `npm install` inside both `backend/` and `frontend/`

## Running the project

```bash
# Terminal 1 — backend (port 3001)
cd backend && npm run dev

# Terminal 2 — frontend (port 5173)
cd frontend && npm run dev
```

## Running tests

```bash
# Backend tests (Vitest, node environment)
cd backend && npm test

# Backend tests with coverage
cd backend && npm run test:coverage

# Frontend tests (Vitest, jsdom environment)
cd frontend && npm test
```

## Key files for this feature

| File | Purpose |
|------|---------|
| `shared/schemas/room.ts` | Add `guessSnapshotSchema`, `"finished"` status, 5 new `RoomSnapshot` fields |
| `backend/src/seed/starterData.ts` | Add `ROUND_DURATION_SECONDS = 90` |
| `backend/src/models/game.ts` | Add `Guess` interface; extend `Room` with `canvasDataUrl`, `guesses`, `scores`, `correctGuessers`, `roundStartedAt` |
| `backend/src/services/roomStore.ts` | Add `updateCanvas()`, `clearCanvas()`, `submitGuess()`, `checkRoundExpiry()`; extend `startRoom()`, `toRoomSnapshot()` |
| `backend/src/services/roomStore.test.ts` | TDD tests for all new gameplay operations |
| `backend/src/api/rooms.ts` | Add `PUT /:code/canvas`, `DELETE /:code/canvas`, `POST /:code/guesses` routes |
| `backend/src/api/schemas.ts` | Add `updateCanvasSchema`, `clearCanvasSchema`, `submitGuessSchema` |
| `frontend/src/services/api.ts` | Add `updateCanvas()`, `clearCanvas()`, `submitGuess()` |
| `frontend/src/state/roomStore.ts` | Add `updateCanvas()`, `clearCanvas()`, `submitGuess()` actions |
| `frontend/src/pages/GamePage.tsx` | Mount `DrawingCanvas` (drawer/read-only); pass `hasGuessedCorrectly` to `GuessForm` |
| `frontend/src/components/DrawingCanvas.tsx` | **New** — freehand drawing (pointer events), clear button, read-only polling view |
| `frontend/src/components/GuessForm.tsx` | Wire submit to store; disable on correct/drawer/finished |
| `frontend/src/components/Scoreboard.tsx` | Render `room.scores` per participant |
| `frontend/src/components/ResultPanel.tsx` | Render `room.guesses`; correct entries in green |

## TDD cycle for this feature

Follow Red-Green-Refactor strictly:

1. **Contracts first**: Update `shared/schemas/room.ts` with new Zod schemas.
2. **Backend model**: Update `backend/src/models/game.ts` types.
3. **Backend service (TDD)**:
   - Write failing test in `roomStore.test.ts` for each new operation.
   - Implement `checkRoundExpiry()`, `updateCanvas()`, `clearCanvas()`, `submitGuess()`.
   - Extend `startRoom()` and `toRoomSnapshot()`.
4. **Backend routes**: Add `PUT/DELETE /canvas` and `POST /guesses` in `rooms.ts` + `schemas.ts`.
5. **Frontend service**: Add `updateCanvas()`, `clearCanvas()`, `submitGuess()` to `api.ts`.
6. **Frontend store**: Add actions to `roomStore.ts`.
7. **Frontend components (TDD)**:
   - Write failing tests for `DrawingCanvas`, `GuessForm`, `Scoreboard`, `ResultPanel`.
   - Implement each component.
8. **GamePage**: Wire canvas + guess form together.

## Verifying gameplay manually

1. Open two browser tabs.
2. Tab 1: Create room as "Alice" → note room code.
3. Tab 2: Join room as "Bob" using that code.
4. Tab 1 (Alice/host): Click "Start Game".
5. **Drawer flow** (Tab 1 — Alice):
   - Canvas should be interactive (draw on it with pointer).
   - "Clear" button should wipe the canvas.
   - Guess input should be absent or disabled.
   - Secret word "rocket" should be visible.
6. **Guesser flow** (Tab 2 — Bob):
   - Canvas should update as Alice draws (within ~3 seconds).
   - Canvas should be read-only (no pointer interaction).
   - Guess input should be enabled.
   - Type "Rocket" and submit → should score 100 points (case-insensitive match).
   - Guess input should become disabled after correct guess.
   - Guess history should show "Bob — Rocket ✓" in green in both tabs.
   - Score "Bob: 100" should appear in scoreboard in both tabs.
7. **Round end** (via timer or all correct):
   - Both canvases and guess inputs become inactive.
   - Final scores and history remain visible.

## Polling behaviour

- The frontend `roomStore.fetchRoom()` already polls automatically on `GamePage`.
- Canvas state, guesses, and scores are all delivered via the enriched `GET /rooms/:code` response.
- No additional polling loops are needed.
