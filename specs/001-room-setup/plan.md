# Group 1 — Room Setup & Lobby Plan

## State Model Additions
- Room: add `hostId: string`
- Participant: add `score: number`

## Data Flow (Lobby Polling)
1. Frontend polls `GET /rooms/:code?participantId=X` every ~2000ms via `setInterval`.
2. Backend returns full room snapshot (participants, hostId, status).
3. Frontend updates room state on each poll response.

## File-Level Changes

### Backend
1. `src/models/game.ts` — Add `hostId` to Room, `score` to Participant
2. `src/api/schemas.ts` — Add name validation (trim, reject empty)
3. `src/services/roomStore.ts` — Set hostId on createRoom, add start game validation
4. `src/api/rooms.ts` — Add POST /:code/start endpoint (host-only, min 2 players)
5. Update `toRoomSnapshot`: include hostId in snapshot

### Frontend
1. `src/services/api.ts` — Add startGame method, update RoomSnapshot type
2. `src/state/roomStore.ts` — Add startGame action, auto-polling logic
3. `src/pages/LobbyPage.tsx` — Auto-poll, host badge, start game button
