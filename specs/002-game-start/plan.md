# Feature Plan: Scenario 2 — Game Start & Drawer Flow

## Required Changes

### Backend
- Add `drawerId` and `secretWord` to the room model and snapshot.
- Add `POST /rooms/:code/start`.
- On game start, set `status = game`, assign `drawerId` to the host, and select the secret word deterministically.
- Ensure non-drawers do not receive `secretWord` in snapshots while `status === "game"`.

### Frontend
- Extend `RoomSnapshot` to include `drawerId` and `secretWord`.
- Add `api.startGame()`.
- Add host-only start logic to `LobbyPage.tsx`.
- Add redirect from `/lobby` to `/game` when room status becomes `game`.
- Update `GamePage.tsx` to show drawer versus guesser views.

## Data Flow
- Host clicks Start Game → frontend sends `POST /rooms/:code/start`.
- Backend verifies host and participant count.
- Backend updates room state and returns a snapshot.
- Clients poll `GET /rooms/:code` and see `status === "game"`.
- Clients navigate to `/game`.

## File-Level Plan
- `backend/src/models/game.ts`: add drawer and secret word fields.
- `backend/src/services/roomStore.ts`: implement game start state change and snapshot masking.
- `backend/src/api/schemas.ts`: add start request schema.
- `backend/src/api/rooms.ts`: add `/start` handler.
- `frontend/src/services/api.ts`: add `startGame()`.
- `frontend/src/state/roomStore.ts`: add `startGame` action.
- `frontend/src/pages/LobbyPage.tsx`: add host-only start button.
- `frontend/src/pages/GamePage.tsx`: render drawer/guesser role states.

## Verification
- Start a room and verify the creator is marked as host.
- Add a second player and verify the Start button enables for the host only.
- Confirm `drawerId` is the host ID after starting the game.
- Confirm the drawer sees the secret word and guessers do not.
