# Tasks

> Ordered by phase. Each phase must be validated before moving to the next.
> Dependencies: Phase N depends on Phase N-1 being complete.

---

## Phase 2 — Game Start & Drawer Flow (Scenario 2)

| # | Task | File(s) | Depends On | Spec ID |
|---|---|---|---|---|
| 2.1 | Add `secretWord`, `drawerId`, `scores`, `canvasStrokes`, `guesses` to `Room` type | `backend/src/models/game.ts` | 1.3 | 2.2, 2.3 |
| 2.2 | Add `myRole` and viewer-filtered `secretWord` to `RoomSnapshot` type | `backend/src/models/game.ts` | 2.1 | 2.4, 2.5 |
| 2.3 | Implement `startGame()` in roomStore: validate host+min players, assign drawer, select word, init scores | `backend/src/services/roomStore.ts` | 2.1, 1.5 | 2.2, 2.3, 2.6 |
| 2.4 | Update `toRoomSnapshot()` for viewer-specific filtering (myRole, hidden word) | `backend/src/services/roomStore.ts` | 2.2 | 2.4, 2.5 |
| 2.5 | Add `POST /rooms/:code/start` route and schema | `backend/src/api/rooms.ts`, `schemas.ts` | 2.3 | 2.6, 2.7 |
| 2.6 | Add `startGame()` to frontend API service | `frontend/src/services/api.ts` | 1.8, 2.2 | 2.6 |
| 2.7 | Add `startGame()` to frontend RoomStore | `frontend/src/state/roomStore.ts` | 2.6 | 2.6 |
| 2.8 | Wire LobbyPage "Start Game" button to call API, then navigate to /game | `frontend/src/pages/LobbyPage.tsx` | 2.7 | 1.7 |
| 2.9 | Update frontend types for new snapshot fields | `frontend/src/services/api.ts` | 2.2 | 2.4, 2.5 |
| 2.10 | **Validate Scenario 2** with 2 browser tabs | — | 2.1–2.9 | 2.1–2.7 |
