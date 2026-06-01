# Plan: Gameplay Interaction

## State Model Changes
- Room: add `guesses: Guess[]`, `scores: Record<string, number>`, `canvasData: string | null`.
- RoomSnapshot: add `guesses`, `scores`, `canvasData`.
- New `Guess` interface: `{ participantId, participantName, word, isCorrect, timestamp }`.

## Data Flow
1. Drawer draws on HTML5 Canvas — mousedown/mousemove/mouseup events draw on a 2D context.
2. Drawer clicks "Clear" — canvas context reset to white.
3. Guesser submits guess → POST /rooms/:code/guess { participantId, word }
4. Backend trims word, validates non-empty, compares lowercase to secret word.
5. If correct: score += 100, room status = round_end, guess marked isCorrect=true.
6. All players poll GET /rooms/:code?participantId=X to see updated guesses and scores.
7. Canvas data synced via PUT /rooms/:code/canvas { participantId, dataUrl } — drawer uploads on mouseup.
8. Guessers see canvas data in the snapshot.

## File Changes

### Backend
| File | Changes |
|------|---------|
| `src/models/game.ts` | Add Guess interface; add `guesses`, `scores`, `canvasData` to Room and RoomSnapshot |
| `src/api/schemas.ts` | Add guessSchema, canvasSchema |
| `src/api/rooms.ts` | Add POST /rooms/:code/guess, PUT /rooms/:code/canvas |
| `src/services/roomStore.ts` | Add `submitGuess()` (validate, compare, score, transition), `updateCanvas()` |
| `src/services/roomStore.test.ts` | Test guess logic and scoring |
| `src/api/schemas.test.ts` | Test new schemas |

### Frontend
| File | Changes |
|------|---------|
| `src/services/api.ts` | Add `submitGuess()`, `updateCanvas()` |
| `src/state/roomStore.ts` | Add guesses, scores, canvasData to state; add submitGuess action |
| `src/components/Canvas.tsx` | NEW — HTML5 Canvas with brush drawing + clear button |
| `src/pages/GamePage.tsx` | Show interactive Canvas for drawer, rendered canvas image for guessers (via snapshot canvasData); show guess history; show scores |
| `src/components/GuessForm.tsx` | Wire submit to API; validate non-empty; disable for drawer |
| `src/components/Scoreboard.tsx` | Display real scores from snapshot |
| `src/components/ResultPanel.tsx` | Show guess history |
