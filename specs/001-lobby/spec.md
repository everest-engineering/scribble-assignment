# Scenario 1: Lobby and Host Tracking

## Objective
Provide isolated rooms with host tracking and live participant refresh via 2-second polling.

## Acceptance Criteria
- Each room is isolated by its unique 4-character code.
- The first participant who creates the room is assigned as the host.
- The host ID is persisted in backend room state and returned in room snapshots.
- Participants can refresh the lobby by polling the room endpoint every 2 seconds.
- The UI reflects the current participant list and host-specific controls.

## Contracts
- Backend contract: `GET /api/rooms/:code?participantId=...` returns
  - `room.code`
  - `room.hostId`
  - `room.participants[]`
  - `room.status`
- Backend contract: `POST /api/rooms/:code/join` accepts `{ playerName }` and returns `participantId` and room snapshot.
- Frontend contract: `frontend/src/state/roomStore.ts` must support `fetchRoom()` to refresh polls.
- Timing contract: polling interval is exactly 2000ms.

## Files
- `frontend/src/pages/LobbyPage.tsx`
- `frontend/src/state/roomStore.ts`
- `frontend/src/services/api.ts`
- `backend/src/services/roomStore.ts`
- `backend/src/api/rooms.ts`
- `backend/src/api/schemas.ts`
