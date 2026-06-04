# Plan: Gameplay Interaction

## Files to Create

- `frontend/src/components/DrawingCanvas.tsx` — Canvas component with drawing, clear, and replay

## Files to Modify

- `backend/src/models/game.ts` — Add DrawCommand, Guess, Point types
- `backend/src/services/roomStore.ts` — submitGuess(), addDrawCommands(), clearDrawCommands()
- `backend/src/api/schemas.ts` — Add submitGuess and drawAction schemas
- `backend/src/api/rooms.ts` — Add guess, draw, clear endpoints
- `frontend/src/services/api.ts` — Add submitGuess, draw, clearCanvas methods
- `frontend/src/state/roomStore.ts` — Add submitGuess, draw, clearCanvas actions
- `frontend/src/pages/GamePage.tsx` — Canvas integration, guess submission wiring, polling
- `frontend/src/components/GuessForm.tsx` — Wire onSubmit prop
- `frontend/src/components/Scoreboard.tsx` — Real scores from props
- `frontend/src/components/ResultPanel.tsx` — Real guesses from props

## Implementation Order

1. Add DrawCommand and Guess types to models
2. Implement submitGuess() with case-insensitive comparison
3. Implement addDrawCommands() and clearDrawCommands()
4. Create DrawingCanvas component
5. Update GamePage with canvas and guess form integration
6. Update Scoreboard and ResultPanel with real data
7. Add game flow tests
8. Run tests and verify
