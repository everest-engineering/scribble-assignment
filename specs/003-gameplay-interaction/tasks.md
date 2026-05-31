## Scenario 3 — Gameplay Interaction

### Dependencies
- Scenario 2 complete (game can start, drawer assigned, word selected)

### Task List

| # | Task | File(s) | Depends On | Status |
|---|------|---------|------------|--------|
| 3.1 | Add `drawingData`, `guesses[]`, `scores` to Room model; add `Guess` interface | `backend/src/models/game.ts` | 2.1 | ✅ |
| 3.2 | Add `saveDrawing()`, `clearDrawing()`, `submitGuess()`, scoring logic to roomStore | `backend/src/services/roomStore.ts` | 3.1 | ✅ |
| 3.3 | Add Zod schemas for draw/guess/clear requests | `backend/src/api/schemas.ts` | — | ✅ |
| 3.4 | Add POST /rooms/:code/draw, POST /rooms/:code/guess, POST /rooms/:code/clear routes | `backend/src/api/rooms.ts` | 3.2, 3.3 | ✅ |
| 3.5 | Update `toRoomSnapshot()` to include drawingData, guesses, scores | `backend/src/services/roomStore.ts` | 3.1 | ✅ |
| 3.6 | Update frontend API types and add draw/guess/clear methods | `frontend/src/services/api.ts` | 3.1 | ✅ |
| 3.7 | Add draw/guess/clear actions to RoomStore | `frontend/src/state/roomStore.ts` | 3.6 | ✅ |
| 3.8 | Replace canvas placeholder with interactive `<canvas>`, wire drawing + clear | `frontend/src/pages/GamePage.tsx` | 3.7 | ✅ |
| 3.9 | Wire GuessForm to submit guesses via API, add validation | `frontend/src/components/GuessForm.tsx` | 3.7 | ✅ |
| 3.10 | Update Scoreboard to render real scores from snapshot | `frontend/src/components/Scoreboard.tsx` | 3.6 | ✅ |
| 3.11 | Update ResultPanel to render guess history | `frontend/src/components/ResultPanel.tsx` | 3.6 | ✅ |
| 3.12 | Add auto-polling to GamePage for drawing/guesses/scores sync | `frontend/src/pages/GamePage.tsx` | 3.7 | ✅ |
| 3.13 | Verify builds pass | — | 3.1–3.12 | ✅ |
