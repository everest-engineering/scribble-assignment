# Technical Implementation Plan - Room Creation & Joining (Slice 1)

## Overview
This document outlines the design and plan for implementing Room Creation, Joining, Lobby Polling, and Game Initiation constraints.

---

## Proposed Changes

### 1. Model Updates (Shared)
We will extend the `Participant` and `Room` structures to track room hosts.

#### [MODIFY] [backend/src/models/game.ts](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/backend/src/models/game.ts)
- Add `hostId: string` to the `Room` interface.
- Add `hostId: string` to the `RoomSnapshot` interface.
- Extend `RoomStatus` to support `"active"`:
  ```typescript
  export type RoomStatus = "lobby" | "active";
  ```

#### [MODIFY] [frontend/src/services/api.ts](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/frontend/src/services/api.ts)
- Align `RoomSnapshot` and status definitions with the backend:
  ```typescript
  export interface RoomSnapshot {
    code: string;
    status: "lobby" | "active";
    participants: Participant[];
    availableWords: string[];
    roles: ParticipantRole[];
    hostId: string; // Tracks host participant ID
  }
  ```

---

### 2. Backend Logic & Services

#### [MODIFY] [backend/src/services/roomStore.ts](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/backend/src/services/roomStore.ts)
- **`createRoom(playerName)`**:
  - Parse and trim `playerName`. If empty, throw a validation error.
  - Generate a new participant.
  - Create the `Room` object, setting `hostId: participant.id`.
- **`joinRoom(code, playerName)`**:
  - Trim `playerName`. If empty, throw a validation error.
  - Verify that the room code exists. If not, return `null` (routes will throw `404`).
- **`startGame(code, hostParticipantId)`**:
  - Fetch room by code. If missing, throw `404`.
  - Validate that `hostParticipantId === room.hostId`. If not, throw a forbidden error.
  - Validate that `room.participants.length >= 2`. If not, throw a validation error.
  - Validate that `room.status === "lobby"`.
  - Update `room.status = "active"` and save.
- **`toRoomSnapshot(room, viewerParticipantId)`**:
  - Return `hostId: room.hostId` in the snapshot.

---

### 3. API Routing & Zod Validation

#### [MODIFY] [backend/src/api/schemas.ts](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/backend/src/api/schemas.ts)
- Modify `createRoomSchema` and `joinRoomSchema` to enforce trimmed, non-empty player names:
  ```typescript
  export const createRoomSchema = z.object({
    playerName: z.string().trim().min(1, "Player name cannot be empty")
  });
  ```
- Define `startGameSchema` to validate host request payload:
  ```typescript
  export const startGameSchema = z.object({
    participantId: z.string().min(1, "Participant ID is required")
  });
  ```

#### [MODIFY] [backend/src/api/rooms.ts](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/backend/src/api/rooms.ts)
- Update `POST /` and `POST /:code/join` to use the updated validation schemas.
- Implement **`POST /rooms/:code/start`**:
  - Parse room code from parameters and `participantId` from the request body using `startGameSchema`.
  - Call `startGame(code, participantId)` from `roomStore`.
  - Return the updated room snapshot.

---

### 4. Frontend API & Store Integrations

#### [MODIFY] [frontend/src/services/api.ts](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/frontend/src/services/api.ts)
- Add `startGame(code, participantId)` endpoint helper:
  ```typescript
  startGame(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/start`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  }
  ```

#### [MODIFY] [frontend/src/state/roomStore.ts](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/frontend/src/state/roomStore.ts)
- Add `startGame()` method to trigger the API request and update the stored room session snapshot:
  ```typescript
  async startGame() {
    if (!this.state.room || !this.state.participantId) return;
    const response = await this.withLoading(() =>
      api.startGame(this.state.room!.code, this.state.participantId!)
    );
    this.setRoomSnapshot(response.room);
    return response.room;
  }
  ```

---

### 5. Lobby Page Polling & UI Restrictions

#### [MODIFY] [frontend/src/pages/LobbyPage.tsx](file:///Users/shivangijain/Projects/AI/SDD/scribble-assignment/frontend/src/pages/LobbyPage.tsx)
- **Polling Setup**:
  - Implement a `useEffect` hook that sets up an interval fetching the room state (`roomStore.fetchRoom()`) every `2000ms`.
  - Clear the interval on component unmount to prevent leaks.
- **Auto-Navigate on Start**:
  - Inside the polling check, if `room.status === "active"`, automatically call `navigate("/game")`.
- **UI Authorizations**:
  - Check if current player is the host (`participantId === room.hostId`).
  - If the player is **the host**:
    - Display the "Start Game" button.
    - Enable it only when `room.participants.length >= 2`.
    - If disabled, show a warning text: *"Need at least 2 players to start."*
  - If the player is **not the host**:
    - Hide or disable the "Start Game" button.
    - Display status text: *"Waiting for host to start the game..."*

---

## Verification Plan

### Automated Tests
- Run `npm test` inside both backend and frontend directories to check for lint errors and ensure that existing specs run successfully.
- Write a test suite for schema validations ensuring empty names are blocked.

### Manual Verification Flow (2 Browser Tabs)
1. **Host Setup**:
   - Open Browser Tab A at `http://localhost:5173`.
   - Click "Create Room" with name "HostPlayer".
   - Land on Lobby and note the generated 4-char Room Code.
   - Verify only the "Start Game" button is visible to you, but is disabled because only 1 player is present.
2. **Guesser Joins**:
   - Open Browser Tab B (Incognito/Independent session) at `http://localhost:5173`.
   - Click "Join Room", enter the Room Code from Tab A and name "GuestPlayer".
   - Submit and verify GuestPlayer enters the Lobby.
   - Verify that Tab B does NOT show an enabled "Start Game" button (it shows "Waiting for host").
3. **Synchronized Update**:
   - Within 2 seconds, verify Tab A automatically updates the participant list showing "GuestPlayer" without manual refreshing.
4. **Game Start**:
   - Verify the "Start Game" button on Tab A is now enabled.
   - Click "Start Game" in Tab A.
   - Verify that both Tab A and Tab B automatically navigate to the `/game` route within 2 seconds.
