# Scenario 1 Tasks

- [ ] Add `hostId` to `Room` in `backend/src/models/game.ts`.
- [ ] Persist `hostId` on room creation in `backend/src/services/roomStore.ts`.
- [ ] Implement `GET /api/rooms/:code` in `backend/src/api/rooms.ts`.
- [ ] Implement `POST /api/rooms/:code/join` in `backend/src/api/rooms.ts`.
- [ ] Add `roomViewerQuerySchema` and join request validation in `backend/src/api/schemas.ts`.
- [ ] Add `RoomSnapshot` support for hostId in `frontend/src/services/api.ts`.
- [ ] Create `fetchRoom()` in `frontend/src/state/roomStore.ts`.
- [ ] Add polling in `frontend/src/pages/LobbyPage.tsx` at a 2s interval.
- [ ] Display current participant list and host-specific start controls in `frontend/src/pages/LobbyPage.tsx`.
- [ ] Ensure refresh errors are surfaced as lobby messages.
