# Quickstart: Gameplay Interaction

**Phase 1 output** | **Date**: 2026-05-30

## How to Test This Feature

### Prerequisites

- Backend and frontend running (`npm run dev` in both `backend/` and `frontend/`)
- Two browser tabs open to the app
- A room created and game started (use the lobby start flow)

### Test: Drawer draws on canvas

1. Tab A (host/create room → start game): Use the drawing canvas to draw (click and drag)
2. Tab B (joiner): Observe the canvas
3. **Expected**: Tab B sees the same drawing appear within 2 seconds (polling interval).

### Test: Drawer clears canvas

1. Tab A: Draw something on the canvas
2. Tab B: Confirm the drawing is visible
3. Tab A: Click the "Clear Canvas" button
4. **Expected**: Both tabs see a blank canvas within 2 seconds.

### Test: Guesser submits correct guess

1. Tab A (drawer): Note the secret word displayed (e.g., "rocket")
2. Tab B (guesser): Type the secret word into the guess input and submit
3. **Expected**: Tab B's score increases to 100. The guess appears in the history marked as correct. Tab A sees the guess in history too.

### Test: Guesser submits incorrect guess

1. Tab B (guesser): Type a wrong word and submit
2. **Expected**: Tab B's score stays the same. The guess appears in history marked as incorrect. No additional feedback.

### Test: Empty guess rejected

1. Tab B (guesser): Submit an empty or whitespace-only guess
2. **Expected**: The guess is rejected. No entry appears in guess history. Score unchanged.

### Test: Case-insensitive matching

1. Tab B (guesser): Submit the secret word in ALL CAPS (e.g., "ROCKET")
2. **Expected**: The guess is treated as correct. Score increases by 100.

### Test: Leading/trailing whitespace trimmed

1. Tab B (guesser): Submit `"  rocket  "` (with spaces)
2. **Expected**: The guess is treated as correct after trimming. Score increases by 100.

### Test: Guess history visible to all

1. Tab B: Submit several guesses (correct and incorrect)
2. Tab A: Observe the guess history panel
3. **Expected**: Both tabs see the same guess history in chronological order with guesser names, text, and correct/incorrect markers.

### Test: Drawer cannot guess

1. Tab A (drawer): Try to submit a guess (no input should be shown for drawers)
2. **Expected**: The guess input is not visible for the drawer.

### Test: Duplicate text accepted

1. Tab B (guesser): Submit the same incorrect guess twice
2. **Expected**: Both entries appear in the guess history. Score unchanged.

### Test: Multiple correct guessers

1. Tab A (drawer): Start a game with 3+ players
2. Tab B and Tab C (guessers): Both submit the correct word
3. **Expected**: Both guessers receive 100 points. Both correct guesses appear in history.

## Running Tests

```bash
# Backend
cd backend && npx vitest run

# Frontend
cd frontend && npx vitest run
```

## Key Files

| File | Purpose |
|------|---------|
| `backend/src/models/game.ts` | Guess and Stroke types; Round extensions (strokes, guesses, scores) |
| `backend/src/services/roomStore.ts` | submitGuess, updateCanvas, clearCanvas, processGuess; extended toRoomSnapshot |
| `backend/src/api/rooms.ts` | New POST /:code/guess, POST /:code/canvas, POST /:code/canvas/clear routes |
| `backend/src/api/schemas.ts` | Zod schemas for guess, canvas, and canvas-clear payloads |
| `frontend/src/pages/GamePage.tsx` | Wire drawing canvas for drawer, guess input + history for guessers |
| `frontend/src/state/roomStore.ts` | Guess history, canvas strokes, scores state; submitGuess/updateCanvas/clearCanvas actions |
| `frontend/src/services/api.ts` | submitGuess, updateCanvas, clearCanvas API methods; extended RoomSnapshot type |
| `frontend/src/components/Canvas.tsx` | NEW: HTML5 Canvas drawing component (drawer only) |
| `frontend/src/components/GuessInput.tsx` | NEW: guess text input with submit |
| `frontend/src/components/GuessHistory.tsx` | NEW: scrollable guess history with names and markers |
