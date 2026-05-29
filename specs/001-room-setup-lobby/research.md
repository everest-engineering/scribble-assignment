# Research: Room Setup and Lobby

## Current State Analysis

### Backend
- **Storage**: In-memory `Map` in `backend/src/services/roomStore.ts`.
- **Room Model**: `backend/src/models/game.ts` defines `Room` and `RoomSnapshot`. Currently missing `hostId` and supports only `"lobby"` status.
- **API**: `backend/src/api/rooms.ts` has `POST /`, `POST /:code/join`, and `GET /:code`.
- **Validation**: `backend/src/api/schemas.ts` uses Zod but lacks strict name/code validation (e.g., trimming, minimum length).

### Frontend
- **State Management**: Custom `RoomStore` using `useSyncExternalStore` in `frontend/src/state/roomStore.ts`.
- **Lobby**: `frontend/src/pages/LobbyPage.tsx` has manual refresh only. "Start Game" button is always visible and just navigates locally.
- **Services**: `frontend/src/services/api.ts` defines basic fetch wrappers.

## Gaps Identified

1. **Host Tracking**: No concept of a room "host". The first player should be recorded as the host.
2. **Synchronization**: No automatic updates in the lobby. Manual refresh is required.
3. **Validation**: Player names can be empty or whitespace. Room codes aren't strictly validated on the frontend.
4. **Transition Control**: Any player can click "Start Game", and it doesn't synchronize the transition across all clients.
5. **Isolation**: While rooms use unique codes, there's no backend validation that a player belongs to the room they are fetching (though the `participantId` query param is present, it's ignored).

## Assumptions

1. **Polling Cadence**: 2 seconds is acceptable for non-realtime sync.
2. **Host Migration**: If the host leaves, the next player in the list becomes the host (Rule III of Constitution: Extend the starter).
3. **Session Persistence**: `participantId` is stored in the `RoomStore` and can be used to identify the host/player.
