# Group 3 — Gameplay Interaction Tasks

## Phase 6: Feature Group 3 — Gameplay Interaction (Backend)
- [x] 6.1 Update `models/game.ts`: add Guess type, drawingData, guesses array
- [x] 6.2 Update `schemas.ts`: add guess schema (trim, reject empty), draw schema
- [x] 6.3 Update `roomStore.ts`: submitGuess (case-insensitive compare, score 100), saveDrawing, clearDrawing, endRound
- [x] 6.4 Update `rooms.ts`: add POST /:code/guess, POST /:code/draw, POST /:code/clear, POST /:code/end-round

## Phase 7: Feature Group 3 — Gameplay Interaction (Frontend)
- [x] 7.1 Create `DrawingCanvas.tsx`: HTML5 canvas with drawing and clear; guessers see image
- [x] 7.2 Update `GuessForm.tsx`: wire to API, validation, disable for drawer
- [x] 7.3 Update `Scoreboard.tsx`: show real scores
- [x] 7.4 Update `ResultPanel.tsx`: show guess history
- [x] 7.5 Update `GamePage.tsx`: integrate canvas, auto-poll game state, sync drawing
