# Plan — Scenario 3: Gameplay Interaction

## State Changes
- Room model: add `guesses[]`, `scores{}`, `canvasData` fields
- New `Guess` type: `participantId`, `participantName`, `text`, `correct`

## File-Level Changes

### Backend
| File | Changes |
|------|---------|
| `backend/src/models/game.ts` | Add `Guess` interface, `guesses`, `scores`, `canvasData` to Room |
| `backend/src/services/roomStore.ts` | Add `submitGuess` (validate, score), `updateCanvas`, `clearCanvas` |
| `backend/src/api/schemas.ts` | Add guess, canvas schemas |
| `backend/src/api/rooms.ts` | Add `POST /:code/guess`, `PUT /:code/draw`, `POST /:code/clear-canvas` |

### Frontend
| File | Changes |
|------|---------|
| `frontend/src/services/api.ts` | Add `submitGuess`, `updateCanvas`, `clearCanvas` methods |
| `frontend/src/state/roomStore.ts` | Add corresponding actions; polling for game updates |
| `frontend/src/pages/GamePage.tsx` | Interactive canvas; drawer/guesser split views |
| `frontend/src/components/GuessForm.tsx` | Connect to API; client-side empty validation |
| `frontend/src/components/Scoreboard.tsx` | Display live scores from room state |
| `frontend/src/components/ResultPanel.tsx` | Display guess history from room state |

## Data Flow
```
Draw:     Drawer draws → onMouseUp → PUT /rooms/:code/draw → Backend stores canvasData → Polling syncs to guessers
Guess:    Guesser submits → POST /rooms/:code/guess → Backend validates → scores → adds to history → Polling syncs to all
```
