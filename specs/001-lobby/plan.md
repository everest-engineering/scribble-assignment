# Scenario 1 Plan

## Work Plan
1. Verify `backend/src/services/roomStore.ts` generates a unique room code and stores `hostId` on room creation.
2. Confirm `backend/src/api/rooms.ts` exposes `POST /api/rooms/:code/join` and `GET /api/rooms/:code`.
3. Add polling in `frontend/src/pages/LobbyPage.tsx` so `roomStore.fetchRoom()` runs every 2 seconds.
4. Ensure `frontend/src/services/api.ts` uses a base `/api` path and passes `participantId` to `fetchRoom`.
5. Update `frontend/src/state/roomStore.ts` so `fetchRoom` updates the store snapshot and error state.
6. Display current participant names and host-only `Start Game` control in `LobbyPage`.

## APIs
- `api.fetchRoom(code, participantId)` → `{ room: RoomSnapshot }`
- `api.joinRoom(code, playerName)` → `RoomSessionResponse`

## Verification
- Start a room, join from another browser session, then verify both sessions see the participant list update within 2s.
- Confirm host button only appears for `room.hostId === participantId`.
