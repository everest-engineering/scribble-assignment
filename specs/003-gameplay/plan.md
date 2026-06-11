# Group 3 — Gameplay Interaction Plan

## State Model Additions
- `Guess` type: `{ participantId, participantName, text, isCorrect }`
- Room: add `guesses: Guess[]`, `drawingData: string | null`

## Data Flow (Drawing Sync)
1. Drawer draws on HTML5 canvas.
2. On each stroke (throttled to 500ms), drawer serializes canvas to base64 data URL.
3. `POST /rooms/:code/draw` sends `{ drawingData: "data:image/png;base64,..." }`.
4. All players poll `GET /rooms/:code` and receive `drawingData`.
5. Guessers render the data URL in an `<img>` tag.

## Data Flow (Guess Flow)
1. Guesser submits guess via `POST /rooms/:code/guess`.
2. Backend trims, case-insensitively compares to secret word.
3. If correct: score += 100, round status → "result".
4. Guess is added to room's guess history.
5. All players see updated guess history on next poll.

## File-Level Changes

### Backend
1. `src/models/game.ts` — Add Guess type, drawingData, guesses array
2. `src/api/schemas.ts` — Add guess schema (trim, reject empty), draw schema
3. `src/services/roomStore.ts` — submitGuess, saveDrawing, clearDrawing, endRound
4. `src/api/rooms.ts` — Add POST /:code/guess, POST /:code/draw, POST /:code/clear, POST /:code/end-round

### Frontend
1. `src/components/DrawingCanvas.tsx` — New: HTML5 canvas with mouse/touch, clear button; guessers see image
2. `src/components/GuessForm.tsx` — Wire to API, validation, disable for drawer
3. `src/components/Scoreboard.tsx` — Show real scores
4. `src/components/ResultPanel.tsx` — Show guess history
5. `src/pages/GamePage.tsx` — Integrate canvas, auto-poll, sync drawing & guesses
