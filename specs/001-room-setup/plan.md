# Implementation Plan: Room Setup & Lobby

## Overview
This plan details the technical changes required to implement the room creation, joining, and lobby synchronization logic. We will leverage an in-memory `Map` on the backend to store room state and use HTTP polling on the frontend to provide a pseudo-real-time experience.

## Proposed Changes

### Backend: State Model & Service Layer
- **Room Interface**: Update the `Room` interface in `backend/src/models/game.ts` to include a `hostId: string` field. This ID will match the `id` of the participant who created the room.
- **Room Storage**: Continue using the `rooms` Map in `backend/src/services/roomStore.ts`.
- **Create Room Logic**: Update `createRoom(playerName)` to:
  1. Generate a unique 4-character code.
  2. Create the first participant.
  3. Initialize the room with the participant as the `hostId`.
  4. Store the room in the map.
- **Join Room Logic**: Update `joinRoom(code, playerName)` to:
  1. Lookup the room by code.
  2. If found, add the new participant to the `participants` array.
  3. Update the `updatedAt` timestamp to trigger polling updates.
  4. Return the updated room snapshot.

### Backend: API Layer
- **Validation**: Update `backend/src/api/schemas.ts` using Zod to enforce:
  - `code`: Exactly 4 alphanumeric characters.
  - `playerName`: Trimmed string with at least 1 character.
- **Error Handling**: Refactor the global error handler in `backend/src/api/router.ts` to extract and return specific error messages from Zod validation failures.

### Frontend: State & UI Layer
- **Polling Mechanism**: In `frontend/src/pages/LobbyPage.tsx`, implement a `useEffect` hook that starts a `setInterval` (2000ms) to call `roomStore.fetchRoom()`.
- **Cleanup**: Ensure the interval is cleared when the component unmounts to prevent memory leaks and unnecessary network traffic.
- **Host Permissions**: 
  - Compare the stored `participantId` with the room's `hostId`.
  - Conditionally render the "Start Game" button only if `isHost` is true.
  - Disable the button if `room.participants.length < 2`.

## Verification Strategy
- **Unit Testing**: Add tests to `backend/src/services/roomStore.test.ts` to verify host assignment and room isolation.
- **Manual Testing**: Open two browser tabs. Create a room in one, join in the other. Verify the host sees the second player automatically and the "Start Game" button becomes enabled.
