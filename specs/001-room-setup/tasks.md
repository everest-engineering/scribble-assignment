# Tasks: Room Setup & Lobby

This document tracks the granular steps required to implement and verify the Room Setup & Lobby feature.

## Backend Development
- [x] **Model Update**: Add `hostId` to the `Room` and `RoomSnapshot` interfaces in `backend/src/models/game.ts`.
- [x] **Service Logic**: Update `createRoom` in `backend/src/services/roomStore.ts` to assign the creator as the host.
- [x] **Snapshot Update**: Ensure `toRoomSnapshot` includes the `hostId` so the frontend can identify the host.
- [x] **Validation**: Update `backend/src/api/schemas.ts` to implement strict Zod validation for room codes and player names.
- [x] **Error Handling**: Refactor the error handler in `backend/src/api/router.ts` to provide user-friendly validation messages.

## Frontend Development
- [x] **API Update**: Update the `RoomSnapshot` type in `frontend/src/services/api.ts` to include the `hostId` field.
- [x] **Lobby Polling**: Implement 2-second polling in `LobbyPage.tsx` using `setInterval` to keep the UI synchronized with the backend state.
- [x] **Host UI**: Update the participant list to label the host and conditionally render the "Start Game" button only for the host.
- [x] **Button Logic**: Implement the "Start Game" enablement logic based on the minimum player count (2 participants).

## Validation & Quality Assurance
- [x] **Unit Tests**: Verify host assignment, room isolation, and join logic via Vitest in `backend/src/services/roomStore.test.ts`.
- [x] **Manual Walkthrough**: Perform a side-by-side browser test to verify that polling correctly updates the lobby state for all participants.
- [x] **Build Verification**: Ensure the project builds successfully after these changes.
