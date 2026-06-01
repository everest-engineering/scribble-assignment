# Implementation Plan — Feature Group 3

## State Model Changes

**Backend (`game.ts`):**
- Add `Guess` interface: `participantId, participantName, text, isCorrect, timestamp`
- Add `guesses: Guess[]` to `GameRound`
- Add `scores: Record<string, number>` to `Room`
- Add `drawingData: string | null` to `GameRound`

**Backend (`roomStore.ts`):**
- `submitGuess(code, participantId, text)` — validate guess, compare case-insensitively, award points
- `updateDrawing(code, participantId, data)` — store canvas data
- `clearDrawing(code, participantId)` — clear canvas data

**Frontend (`api.ts`):**
- Add `submitGuess(code, participantId, text)` method
- Add `updateDrawing(code, participantId, data)` method
- Add `clearDrawing(code, participantId)` method

**Frontend (`roomStore.ts`):**
- Add `submitGuess`, drawing interaction methods

## API Changes

- `POST /rooms/:code/guess` — new endpoint
- `POST /rooms/:code/drawing` — new endpoint
- `DELETE /rooms/:code/drawing` — new endpoint
- `GET /rooms/:code` — returns guesses, drawingData, scores

## Data Flow

1. Drawer draws on canvas -> sends drawing data to backend via POST/drawing
2. All players poll -> receive updated drawingData
3. Guesser submits guess -> POST /guess -> backend validates -> returns result
4. All players poll -> receive updated guess history and scores
5. When word is correctly guessed -> backend sets round status to "results"

## File-Level Changes

| File | Change |
|------|--------|
| `backend/src/models/game.ts` | Add Guess, scores, drawingData |
| `backend/src/services/roomStore.ts` | submitGuess, updateDrawing, clearDrawing, endRound logic |
| `backend/src/api/schemas.ts` | Add guess schema, drawing schema |
| `backend/src/api/rooms.ts` | Add guess, drawing endpoints |
| `frontend/src/services/api.ts` | Add new API methods |
| `frontend/src/state/roomStore.ts` | Add game interaction methods |
| `frontend/src/components/GuessForm.tsx` | Wire up actual submit |
| `frontend/src/components/Scoreboard.tsx` | Show real scores |
| `frontend/src/components/ResultPanel.tsx` | Show real guess history |
| `frontend/src/pages/GamePage.tsx` | Add canvas, wire everything together |

## Polling Strategy

- GamePage polls every 2s for game state (drawingData, guesses, scores)

## Validation Strategy

- Test guess validation (empty, whitespace, case-insensitive)
- Test scoring (100 for correct, 0 for incorrect)
- Test drawing updates visible to all
- Test guess history consistency
