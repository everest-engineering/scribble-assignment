# Technical Plan: Room Setup & Lobby

This document plans the backend model changes, endpoints, frontend component changes, and synchronization data flows required to implement the room setup and lobby polling functionality.

## 1. State Model Changes
We need to update the in-memory Room and Participant structures to support host tracking and lobby state.

### 1.1 Backend Models (`backend/src/models/game.ts`)
* Add `hostId: string` to the `Room` interface to track the room owner.
* Add `score: number` to the `Participant` interface, initialized to `0`.
* Add `hostId` to the `RoomSnapshot` sent to the clients.

## 2. API Endpoints
We modify and validate existing routes:
* `POST /rooms`: Creates a room, sets the host, adds the host to the participants list, and returns the room code.
* `POST /rooms/:code/join`: Validates that the room exists, the player name is non-empty after trimming, and the username is not a duplicate. Adds the participant.
* `GET /rooms/:code`: Returns the room snapshot. Must support a query parameter `participantId` to distinguish client views.

## 3. Frontend Implementation
* **State Store (`frontend/src/state/roomStore.ts`)**:
  * Track `hostId` and the active participant's `participantId`.
  * Expose an action `fetchRoom(code: string)` to refresh the store from `GET /rooms/:code`.
* **Lobby Page (`frontend/src/pages/LobbyPage.tsx`)**:
  * Implement an interval timer inside a `useEffect` hook that triggers `fetchRoom` every 2 seconds.
  * Clear the interval timer on component unmount to prevent memory leaks and zombie network requests.
  * Conditionally render the "Start Game" action button if the current user is the host.
  * Keep the button disabled if the player count is less than 2.

## 4. Verification and Risk Management
* **Risk**: High network traffic from frequent polling.
* **Mitigation**: Standard 2-second interval, sending small, optimized JSON payloads.
* **Manual Verification**: Run two browsers side-by-side, verify name trimming rejection, check that participant lists sync automatically, and check host-only start constraints.
