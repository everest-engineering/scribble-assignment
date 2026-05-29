# Feature Plan: Room Setup & Lobby

## Required Changes

### Backend
- Add `hostId` to room model and snapshot.
- Validate room codes as 4-character uppercase alphanumeric strings.
- Normalize incoming room codes in `POST /rooms/:code/join` and `GET /rooms/:code`.
- Add `POST /rooms/:code/start` route for host-only game start.
- Ensure `GET /rooms/:code` returns room snapshot with `hostId`.

### Frontend
- Extend `RoomSnapshot` to include `hostId`.
- Add client-side validation for join codes.
- Implement 2-second lobby polling in `LobbyPage.tsx`.
- Restrict `Start Game` on the lobby page to host only.
- Redirect clients to `/game` when room status becomes `game`.

## Data Flow
- Create room → backend returns room snapshot with `hostId`.
- Join room → backend validates code and returns snapshot.
- Lobby polling → frontend polls `GET /rooms/:code` every 2 seconds.
- Start game → frontend sends `POST /rooms/:code/start` with `participantId`.

## File-Level Plan
- `backend/src/models/game.ts`: add `hostId` to models.
- `backend/src/api/schemas.ts`: add room code and start request schemas.
- `backend/src/api/rooms.ts`: add start route, normalize codes.
- `backend/src/services/roomStore.ts`: initialize and expose `hostId`.
- `frontend/src/services/api.ts`: add `hostId` to `RoomSnapshot` and `startGame()`.
- `frontend/src/pages/JoinRoomPage.tsx`: add validation and error handling.
- `frontend/src/pages/LobbyPage.tsx`: add polling + host-only start logic.

## Verification
- Open two browser tabs and confirm lobby participant list updates automatically.
- Confirm non-hosts cannot start the game.
- Confirm host can start when `participants.length >= 2`.
- Confirm invalid room codes show clear UI messages.
