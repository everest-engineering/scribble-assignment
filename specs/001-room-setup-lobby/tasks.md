# Tasks: Room Setup & Lobby

## Ordered Task List

1. **Fix API base URL** — Change default in `frontend/src/services/api.ts` from `/bug` to `http://localhost:3001`
   - Depends on: none

2. **Add hostId to models** — Extend `Room` and `RoomSnapshot` in `backend/src/models/game.ts` and mirror in frontend `api.ts`
   - Depends on: none

3. **Set hostId on createRoom** — Update `createRoom` in `roomStore.ts` and `toRoomSnapshot`
   - Depends on: task 2

4. **Validate room code format** — Add regex validation in `schemas.ts`; return 400 for invalid format in `rooms.ts`
   - Depends on: none

5. **Create useRoomPolling hook** — New file `frontend/src/hooks/useRoomPolling.ts`
   - Depends on: none

6. **Update LobbyPage** — Polling, host badge, host-only start button with 2-player minimum
   - Depends on: tasks 1, 3, 5

7. **Add unit tests** — Host assignment in `roomStore.test.ts`; code format in `schemas.test.ts`
   - Depends on: tasks 3, 4

8. **Validate with two browsers** — Create + join + verify polling + host gate
   - Depends on: tasks 6, 7
