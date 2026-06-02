# Tasks

> Ordered by phase. Each phase must be validated before moving to the next.
> Dependencies: Phase N depends on Phase N-1 being complete.

---

## Phase 3 — Gameplay Interaction (Scenario 3)

| # | Task | File(s) | Depends On | Spec ID |
|---|---|---|---|---|
| 3.1 | Create `DrawingCanvas.tsx` component with HTML5 Canvas + mouse event handlers | `frontend/src/components/DrawingCanvas.tsx` | 2.9 | 3.1 |
| 3.2 | Implement `addStroke()` and `clearDrawing()` in backend roomStore | `backend/src/services/roomStore.ts` | 2.1 | 3.2, 3.4 |
| 3.3 | Add `POST /rooms/:code/draw` and `POST /rooms/:code/clear-drawing` routes | `backend/src/api/rooms.ts`, `schemas.ts` | 3.2 | 3.2, 3.4 |
| 3.4 | Add draw/clear methods to frontend API service | `frontend/src/services/api.ts` | 2.9, 3.3 | 3.2, 3.4 |
| 3.5 | Add draw/clear methods to frontend RoomStore | `frontend/src/state/roomStore.ts` | 3.4 | 3.2, 3.4 |
| 3.6 | Implement `addGuess()` in backend roomStore: validate, case-insensitive compare, score, end round if correct | `backend/src/services/roomStore.ts` | 2.1, 2.3 | 3.5–3.8, 3.11 |
| 3.7 | Add `POST /rooms/:code/guess` route and schema | `backend/src/api/rooms.ts`, `schemas.ts` | 3.6 | 3.5 |
| 3.8 | Add guess method to frontend API service | `frontend/src/services/api.ts` | 2.9, 3.7 | 3.5 |
| 3.9 | Add guess method to frontend RoomStore | `frontend/src/state/roomStore.ts` | 3.8 | 3.5 |
| 3.10 | Update `GuessForm.tsx`: accept onSubmit prop, display error, disable for drawer | `frontend/src/components/GuessForm.tsx` | 3.9 | 3.5, 3.6, 3.11 |
| 3.11 | Update `Scoreboard.tsx`: accept scores+participants as props, render live scores | `frontend/src/components/Scoreboard.tsx` | 2.9 | 3.8 |
| 3.12 | Update `ResultPanel.tsx`: accept guesses as props, render guess history | `frontend/src/components/ResultPanel.tsx` | 2.9 | 3.9, 3.10 |
| 3.13 | Wire `GamePage.tsx`: render DrawingCanvas, show drawer UI vs guesser UI, add auto-polling, show scoreboard/history with real data | `frontend/src/pages/GamePage.tsx` | 3.1, 3.5, 3.10, 3.11, 3.12 | 3.1–3.11 |
| 3.14 | **Validate Scenario 3** with 2 browser tabs | — | 3.1–3.13 | 3.1–3.11 |
