# Implementation Plan: Game Start & Drawer Flow

## Overview
This plan outlines the steps to transition the game from the lobby to an active state. We will update the backend models to handle roles and word selection, and implement role-based UI logic on the frontend.

## Proposed Changes

### Backend: Models & Storage
- **Status Enum**: Update `RoomStatus` in `backend/src/models/game.ts` to include the `playing` state.
- **Room Interface**: Add `drawerId?: string` and `secretWord?: string` to the `Room` interface. These will store the round's active drawer and the target word.
- **Snapshot Interface**: Add `secretWord?: string` and `isDrawer: boolean` to the `RoomSnapshot`.

### Backend: Service Layer
- **Start Game Service**: Implement `startGame(code, participantId)` in `backend/src/services/roomStore.ts`.
  - Validate the requester is the host.
  - Set `status = 'playing'`.
  - Set `drawerId` to the first participant's ID.
  - Set `secretWord` from the starter word list.
- **Selective Serialization**: Update `toRoomSnapshot` to only populate the `secretWord` field if the `viewerParticipantId` matches the `room.drawerId`.

### Backend: API Layer
- **New Endpoint**: Add `POST /rooms/:code/start` to `backend/src/api/rooms.ts`. This route will invoke the `startGame` service and return the updated snapshot.

### Frontend: State & UI
- **Polling Redirection**: Update the polling logic in `LobbyPage.tsx` to detect the `playing` status and navigate to the `/game` route.
- **Game Page UI**: 
  - Use the `isDrawer` flag from the snapshot to display role-specific text.
  - Display the `secretWord` for the drawer.
  - Hide sensitive controls (like guess forms) from the drawer.

## Verification Strategy
- **Unit Tests**: Create `backend/src/services/roomStore.scenario2.test.ts` to verify that only the drawer sees the secret word and the game status transitions correctly.
- **Manual Verification**: Run two tabs. Start the game from the host tab and ensure both tabs move to the game screen with the correct roles displayed.
