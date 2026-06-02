# Tasks

> Ordered by phase. Each phase must be validated before moving to the next.
> Dependencies: Phase N depends on Phase N-1 being complete.

---

## Phase 4 — Result, Restart & Final Validation (Scenario 4)

| # | Task | File(s) | Depends On | Spec ID |
|---|---|---|---|---|
| 4.1 | Update `addGuess()` to set status to `"finished"` on correct guess, reveal word | `backend/src/services/roomStore.ts` | 3.6 | 4.1 |
| 4.2 | Implement `restartGame()` in backend roomStore: reset round state, preserve participants | `backend/src/services/roomStore.ts` | 2.1 | 4.5, 4.6 |
| 4.3 | Add `POST /rooms/:code/restart` route and schema | `backend/src/api/rooms.ts`, `schemas.ts` | 4.2 | 4.5 |
| 4.4 | Add restart method to frontend API service | `frontend/src/services/api.ts` | 2.9, 4.3 | 4.5 |
| 4.5 | Add restart method to frontend RoomStore | `frontend/src/state/roomStore.ts` | 4.4 | 4.5 |
| 4.6 | Update `toRoomSnapshot()`: show `secretWord` to all when status is `"finished"` | `backend/src/services/roomStore.ts` | 2.4 | 4.2, 4.3 |
| 4.7 | Update GamePage: show result view (word, final scores, all guesses), show "Play Again" for host | `frontend/src/pages/GamePage.tsx` | 4.1, 4.5, 4.6 | 4.2, 4.4 |
| 4.8 | Auto-navigate from game to lobby when status changes from "finished" → "lobby" (via polling) | `frontend/src/pages/GamePage.tsx` | 4.7 | 4.7 |
| 4.9 | **Validate Scenario 4** end-to-end with 2 browser tabs | — | 4.1–4.8 | 4.1–4.8 |
