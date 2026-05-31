## Scenario 1 — Room Setup & Lobby

### Dependencies
- None (starter is the base)

### Task List

| # | Task | File(s) | Depends On | Status |
|---|------|---------|------------|--------|
| 1.1 | Add `hostId` to `Room` and `RoomSnapshot` models; expand `RoomStatus` union | `backend/src/models/game.ts` | — | ✅ |
| 1.2 | Update `createRoom()` to store `hostId` = creator's participantId; trim and validate player name | `backend/src/services/roomStore.ts` | 1.1 | ✅ |
| 1.3 | Update request schemas to validate non-empty playerName | `backend/src/api/schemas.ts` | — | ✅ |
| 1.4 | Add `POST /rooms/:code/start` endpoint with host-only + min-2 validation | `backend/src/api/rooms.ts` | 1.1, 1.2 | ✅ |
| 1.5 | Update `toRoomSnapshot()` to include `hostId` | `backend/src/services/roomStore.ts` | 1.1 | ✅ |
| 1.6 | Update frontend `api.ts` types to include `hostId`, expanded `status`, and `startGame()` method | `frontend/src/services/api.ts` | 1.1 | ✅ |
| 1.7 | Add `startGame()` and polling methods to `RoomStore` | `frontend/src/state/roomStore.ts` | 1.6 | ✅ |
| 1.8 | Add auto-polling (2s interval) to LobbyPage | `frontend/src/pages/LobbyPage.tsx` | 1.7 | ✅ |
| 1.9 | Gate "Start Game" button to host only; disable until 2+ players; show host badge in participant list | `frontend/src/pages/LobbyPage.tsx` | 1.8 | ✅ |
| 1.10 | Add name validation to CreateRoomPage (trim, reject empty) | `frontend/src/pages/CreateRoomPage.tsx` | — | ✅ |
| 1.11 | Add name and code validation to JoinRoomPage | `frontend/src/pages/JoinRoomPage.tsx` | — | ✅ |
| 1.12 | Verify builds pass (`npm run build` in both directories) | — | 1.1–1.11 | ✅ |
