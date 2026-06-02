# Tasks

> Ordered by phase. Each phase must be validated before moving to the next.

---

## Phase 1 — Room Setup & Lobby (Scenario 1)

| # | Task | File(s) | Depends On | Spec ID |
|---|---|---|---|---|
| 1.1 | Fix API base URL: remove `/bug` suffix | `frontend/src/services/api.ts` | — | bug |
| 1.2 | Add `hostId` to `Room` and `RoomSnapshot` types | `backend/src/models/game.ts` | — | 1.1 |
| 1.3 | Expand `RoomStatus` to `"lobby" \| "playing" \| "finished"` | `backend/src/models/game.ts` | — | 1.6 |
| 1.4 | Add name validation: trim, reject empty/whitespace | `backend/src/api/schemas.ts` | — | 1.2 |
| 1.5 | Set `hostId` on room creation in `createRoom()` | `backend/src/services/roomStore.ts` | 1.2 | 1.1 |
| 1.6 | Validate and trim names in `joinRoom()`. Return error for empty names | `backend/src/services/roomStore.ts` | 1.4 | 1.2 |
| 1.7 | Include `hostId` and `status` in `toRoomSnapshot()` | `backend/src/services/roomStore.ts` | 1.2, 1.3 | 1.1, 1.6 |
| 1.8 | Update frontend `RoomSnapshot` type to match backend | `frontend/src/services/api.ts` | 1.2 | 1.1 |
| 1.9 | Update frontend `roomStore.ts` types | `frontend/src/state/roomStore.ts` | 1.8 | 1.1 |
| 1.10 | Add auto-polling to LobbyPage (setInterval ~2s) | `frontend/src/pages/LobbyPage.tsx` | 1.9 | 1.5 |
| 1.11 | Show host indicator next to host's name in participant list | `frontend/src/pages/LobbyPage.tsx` | 1.9 | 1.8 |
| 1.12 | Gate "Start Game" button: visible only to host, disabled if <2 players | `frontend/src/pages/LobbyPage.tsx` | 1.9 | 1.6 |
| 1.13 | **Validate Scenario 1** with 2 browser tabs | — | 1.1–1.12 | 1.1–1.8 |
