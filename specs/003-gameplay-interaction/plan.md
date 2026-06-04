# Plan: Gameplay Interaction

## Data Flow

```
Submit Guess:
  POST /rooms/:code/guess { participantId, text }
    -> Trim text, reject if empty
    -> Case-insensitive compare to room.secretWord
    -> Add Guess { participantId, text, isCorrect, timestamp }
    -> If correct, award 100 points to guesser
    -> Return updated room snapshot

Fetch State (polling):
  GET /rooms/:code?participantId=X
    -> Returns snapshot with guesses[], scores {}

Canvas Drawing:
  Client-side only in React canvas element
  Drawer can draw strokes and clear canvas
```

## File-Level Implementation Sequence

| Order | Files | Purpose |
|-------|-------|---------|
| 1 | `backend/src/models/game.ts` | Add Guess type, guesses[], scores{} |
| 2 | `backend/src/api/schemas.ts` | Add guessSchema |
| 3 | `backend/src/services/roomStore.ts` | submitGuess(), scoring logic |
| 4 | `backend/src/api/rooms.ts` | POST guess route |
| 5 | `frontend/src/services/api.ts` | submitGuess method, Guess type |
| 6 | `frontend/src/state/roomStore.ts` | submitGuess, fetch updates |
| 7 | `frontend/src/components/Canvas.tsx` | Drawing canvas component |
| 8 | `frontend/src/components/GuessForm.tsx` | Submit to API |
| 9 | `frontend/src/components/Scoreboard.tsx` | Live scores from snapshot |
| 10 | `frontend/src/components/GuessHistory.tsx` | Guess feed display |
| 11 | `frontend/src/pages/GamePage.tsx` | Wire canvas, form, scoreboard, history |
| 12 | `frontend/src/styles/app.css` | Canvas and guess history styles |
| 13 | Tests | S3 API tests |
