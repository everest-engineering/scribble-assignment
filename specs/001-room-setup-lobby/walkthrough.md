# Walkthrough: Room Setup & Lobby Feature Implementation

This document summarizes the changes made, tests executed, and validation results for the Room Setup & Lobby feature.

## Changes Made

### 1. Backend (`/backend`)
- **Models**: Added the `hostId` field to the `Room` and `RoomSnapshot` interfaces in [game.ts](file:///Users/psushir/Documents/coding_workspace/everest_ai/scribble-assignment/backend/src/models/game.ts).
- **Service**: Updated [roomStore.ts](file:///Users/psushir/Documents/coding_workspace/everest_ai/scribble-assignment/backend/src/services/roomStore.ts) to:
  - Assign `hostId` to the room creator.
  - Implement duplicate username check preventing join collisions.
  - Return `hostId` inside `toRoomSnapshot`.
  - Add the `startGame` service method to update status to `"active"` with validations (caller must be host, room must have >= 2 players).
- **API Router**: In [rooms.ts](file:///Users/psushir/Documents/coding_workspace/everest_ai/scribble-assignment/backend/src/api/rooms.ts):
  - Handle exceptions and map duplicate name validation to a 400 Bad Request status.
  - Add a POST route handler `/rooms/:code/start` for game activation.

### 2. Frontend (`/frontend`)
- **API Client**: Updated [api.ts](file:///Users/psushir/Documents/coding_workspace/everest_ai/scribble-assignment/frontend/src/services/api.ts) to support the `hostId` parameter and declare the `startGame` endpoint call.
- **State Store**: Extended [roomStore.ts](file:///Users/psushir/Documents/coding_workspace/everest_ai/scribble-assignment/frontend/src/state/roomStore.ts) to expose the `startGame` action.
- **Lobby View**: Rewrote [LobbyPage.tsx](file:///Users/psushir/Documents/coding_workspace/everest_ai/scribble-assignment/frontend/src/pages/LobbyPage.tsx) to:
  - Implement continuous automatic state polling every 2 seconds.
  - Render the Host designation badge next to the host's name.
  - Enable and show the **Start Game** button only to the Host player once >= 2 players are present.
  - Listen for game state transition to `"active"` and automatically redirect players to `/game`.

---

## Validation and Testing

### 1. Automated Unit/Integration Tests
Both backend and frontend test suites run and pass:
- **Backend Tests** (`npm --prefix backend run test`):
  - `✓ src/services/roomStore.test.ts (6 tests)` (verifies host selection, duplicate user validation, and start constraints)
  - `✓ src/api/schemas.test.ts (2 tests)`
- **Frontend Tests** (`npm --prefix frontend run test`):
  - `✓ src/services/api.test.ts (2 tests)`

### 2. Production Build Check
- Backend compiled successfully: `tsc -p tsconfig.json`
- Frontend bundled successfully for production using Vite: `tsc -b && vite build`
