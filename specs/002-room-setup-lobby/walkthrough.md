# Walkthrough: Room Setup & Lobby

This document details the implemented changes, test execution, and manual verification results for the Room Setup & Lobby feature.

## Changes Made

### 1. Backend Core & API Routing
- **Models ([game.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/models/game.ts))**: Extended the `Room` type to store `hostId: string` and the `Participant` type to include optional `isHost: boolean`. Updated `RoomStatus` to support `"game"` alongside `"lobby"`.
- **Validation ([schemas.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/api/schemas.ts))**: Enhanced Zod validation schemas:
  - `createRoomSchema` / `joinRoomSchema`: Limit names to 32 characters (`max(32)`).
  - `roomCodeParamsSchema`: Normalized to uppercase and added alphanumeric matching constraint.
  - `startGameSchema` / `leaveRoomSchema`: Validate `participantId` body field.
- **Service ([roomStore.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.ts))**:
  - `createRoom`: Designate the creator's participant ID as `hostId`.
  - `toRoomSnapshot`: Dynamically set `isHost: true` for the participant matching `hostId`.
  - `getRoom`: Normalize the input room code parameter (trimmed and uppercased) to ensure isolation and accurate lookup.
  - `startGame`: Gated transition: only the host can start, and the lobby must have at least 2 players.
  - `leaveRoom`: Deletes/terminates the room if the host leaves, or removes the guest if a guest leaves.
- **Endpoints ([rooms.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/api/rooms.ts))**:
  - Added `POST /rooms/:code/start` route for starting the game.
  - Added `POST /rooms/:code/leave` route for leaving the room.

### 2. Frontend State & Pages
- **API Client ([api.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/services/api.ts))**:
  - Extended `Participant` and `RoomSnapshot` interfaces to support `isHost` and `"game"` status.
  - Added `startGame` and `leaveRoom` POST request handlers.
- **State Store ([roomStore.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/state/roomStore.ts))**:
  - Added `clearSession()` method to reset store state.
  - Added `startGame()` and `leaveRoom()` store methods that fetch the latest status.
- **Validation ([CreateRoomPage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/CreateRoomPage.tsx) & [JoinRoomPage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/JoinRoomPage.tsx))**:
  - Wired client-side player name length validation (< 32 characters) and alphanumeric room code checks.
- **Lobby View ([LobbyPage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/LobbyPage.tsx))**:
  - Displayed a `Host` badge next to the host's name using the existing card badge styles.
  - Implemented auto-polling utilizing a regular 2-second `setInterval` hook.
  - Added a connection failure warning banner that displays when polling catches a network error and dismisses automatically on recovery.
  - Managed redirect: transitions hosts/guests to `/game` when the room status becomes `"game"`.
  - Conditional rendering: only show "Start Game" to the host. Gated the button to be disabled if player count < 2.
  - Added a "Leave Room" button that safely triggers room departure or host termination and redirects to `/`.

---

## Testing & Verification

### 1. Automated Unit Tests

All Vitest unit tests have been updated and run successfully.

- **Backend tests (`npm run test` in `/backend`)**:
  - Validated host tracking is set on room creation.
  - Validated `toRoomSnapshot` dynamically maps `isHost`.
  - Validated case-insensitivity and whitespace trimming for room codes.
  - Validated start game rules (host-only, minimum 2 players).
  - Validated leave room rules (guest removed, host destroys room).
  - Validated max name length and alphanumeric room code format schema errors.

```text
 ✓ src/api/schemas.test.ts (6 tests) 4ms
 ✓ src/services/roomStore.test.ts (11 tests) 4ms
 Test Files  2 passed (2)
      Tests  17 passed (17)
```

- **Frontend tests (`npm run test` in `/frontend`)**:
  - Validated fetch calls for both starting the game and leaving the room.

```text
 ✓ src/services/api.test.ts (5 tests) 3ms
 Test Files  1 passed (1)
      Tests  5 passed (5)
```

### 2. Manual Verification Results

Followed the [quickstart.md](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/specs/002-room-setup-lobby/quickstart.md) checklist to verify:
- **Lobby Polling**: Guest joining Bob's room shows in Alice's (host) lobby list within ~2 seconds.
- **Host Control**: Only Alice can see the **Start Game** button. It is disabled while Alice is alone. As soon as Bob joins, the button becomes active.
- **Leave Action**: Bob leaving removes him from the participant list. Alice leaving destroys the room and Bob is redirected back to `/` on the next poll cycle.
- **Network Resilience**: Setting connection to offline triggers the connection error banner. Setting it online recovers state cleanly.
