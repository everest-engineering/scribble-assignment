# Plan — Gameplay Interaction

## State Model
- Add `drawingData: string | null` (base64 data URL) to Room
- Add `guesses: Guess[]` to Room/RoomSnapshot
- Add `score: number` to Participant
- New type: `Guess { participantId, participantName, text, correct, timestamp }`

## File Changes
| File | Change |
|------|--------|
| `backend/src/models/game.ts` | Add `Guess` interface, `score`, `drawingData`, `guesses` |
| `backend/src/api/schemas.ts` | Add `saveDrawingSchema`, `submitGuessSchema` |
| `backend/src/api/rooms.ts` | Add `POST /:code/drawing`, `POST /:code/guess` |
| `backend/src/services/roomStore.ts` | Add `saveDrawing()` (drawer-only), `submitGuess()` (trim, case-insensitive, +100 scoring, set finished) |
| `frontend/src/services/api.ts` | Update types, add `saveDrawing()`, `submitGuess()` |
| `frontend/src/state/roomStore.ts` | Add `saveDrawing()`, `submitGuess()` methods |
| `frontend/src/components/DrawingCanvas.tsx` | New: HTML5 Canvas with mouse drawing, clear, auto-sync |
| `frontend/src/components/GuessForm.tsx` | Wire to API, trim validation |
| `frontend/src/components/Scoreboard.tsx` | Display live scores |
| `frontend/src/components/ResultPanel.tsx` | Display guess history |
| `frontend/src/pages/GamePage.tsx` | Wire canvas + polling + all components |

## Data Flow
- Drawer draws → on mouseup, canvas.toDataURL() → POST /rooms/:code/drawing → server stores → all players GET /rooms/:code see drawingData
- Guesser submits guess → POST /rooms/:code/guess → server trims, compares case-insensitively → if correct: +100 score, status="finished" → all players see updated guesses + scores via polling
