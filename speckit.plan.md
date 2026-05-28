# Technical Plan: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-05-28

**Status**: Draft

## State Model Changes

### Backend Changes

1.  **Room Model (`Room` in [game.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/models/game.ts)):**
    - Add `hostId: string` to designate the ID of the participant who is the host.
2.  **Room Snapshot (`RoomSnapshot` in [game.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/models/game.ts)):**
    - Add `hostId: string` to expose the host's ID to the client.

### Frontend Changes

- None to the state representation, but `RoomState` inside `roomStore.ts` will automatically receive the updated `RoomSnapshot` from the API.

---

## API Design & Data Flow

### 1. Create Room (`POST /rooms`)
- Request body: `{ playerName: string }`
- Backend maps creator as the host:
  - Generates `participantId` (UUID).
  - Creates `Room` object where `hostId` is set to `participantId`.
- Response:
  ```json
  {
    "participantId": "creator-uuid",
    "room": {
      "code": "ABCD",
      "status": "lobby",
      "participants": [...],
      "hostId": "creator-uuid",
      ...
    }
  }
  ```

### 2. Join Room (`POST /rooms/:code/join`)
- Backend validates the `:code` parameter (4-character uppercase letters/numbers).
- Response returns the room snapshot, including `hostId`.

### 3. Fetch Room (`GET /rooms/:code?participantId=...`)
- Frontend polls this endpoint every 2 seconds.
- Backend returns the latest room snapshot including the current `hostId`.

---

## File-by-File Changes

### Backend

#### 1. [models/game.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/models/game.ts)
- Update `Room` and `RoomSnapshot` interfaces to include `hostId: string`.

#### 2. [services/roomStore.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/services/roomStore.ts)
- Update `createRoom()` to set `hostId: participant.id`.
- Update `toRoomSnapshot()` to include `hostId: room.hostId`.

#### 3. [api/schemas.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/schemas.ts)
- Update `roomCodeParamsSchema` to validate that the code is exactly 4 characters and matches our uppercase alphanumeric alphabet format (or basic alphanumeric string: `/^[A-Z0-9]{4}$/`).

#### 4. [api/rooms.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/backend/src/api/rooms.ts)
- In the `POST /rooms/:code/join` and `GET /rooms/:code` route handlers, ensure code parameters are properly parsed, trimmed, and upper-cased.

### Frontend

#### 1. [state/roomStore.ts](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/state/roomStore.ts)
- Keep state sync logic intact. Ensure the types for `RoomSnapshot` match the backend.

#### 2. [pages/LobbyPage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/LobbyPage.tsx)
- Add a polling mechanism inside `useEffect` that calls `roomStore.fetchRoom()` every 2000ms when the player is in the lobby status.
- Add checks: `const isHost = room.hostId === participantId;`
- Add checks: `const canStart = isHost && room.participants.length >= 2;`
- Conditionally render/style or disable the "Start Game" button based on `isHost` and `canStart`. If not the host, disable the button and show a message "Waiting for host to start...".

#### 3. [pages/JoinRoomPage.tsx](file:///Users/manojprabhakarm/projects/work/scribble-assignment/frontend/src/pages/JoinRoomPage.tsx)
- Perform client-side check that code is not empty before sending API request. Reject with clear feedback.

---

## Verification & Testing Plan

### Automated Tests
- Run backend schema tests: `npm run test` (in `backend`).
- Add tests in `backend/src/api/schemas.test.ts` to verify code format validation.

### Manual Verification
- Start frontend and backend.
- Open Tab A: Create room with name "Alice". Verify Alice's screen shows the "Start Game" button, but it is disabled.
- Open Tab B: Join room code from Tab A with name "Bob".
- Verify Tab A (Alice) automatically updates to show Bob in the list within 2 seconds without clicking manual refresh.
- Verify Alice's "Start Game" button becomes enabled.
- Verify Bob's screen shows a disabled "Start Game" button or hides it, with message "Waiting for host to start...".
