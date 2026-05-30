# Task Checklist: Room Setup & Lobby

This document tracks the tasks required to implement and verify the Room Setup & Lobby feature.

## Tasks

### Backend Tasks
- [x] **Task 1.1**: Update backend state models (`backend/src/models/game.ts`) to support `hostId` on the `Room` and `RoomSnapshot` and `score` on `Participant`.
- [x] **Task 1.2**: Update `createRoom()` in `backend/src/services/roomStore.ts` to assign `hostId` to the creator's participant ID.
- [x] **Task 1.3**: Update `joinRoom()` to validate that the room exists and is in `"lobby"` status.
- [x] **Task 1.4**: Add Zod validations in `backend/src/api/schemas.ts` to trim player names and reject empty/whitespace-only strings.

### Frontend Tasks
- [x] **Task 1.5**: Update frontend API models (`frontend/src/services/api.ts`) and store fields (`frontend/src/state/roomStore.ts`).
- [x] **Task 1.6**: Implement automated polling (~2 seconds interval) in `LobbyPage.tsx` using React hooks.
- [x] **Task 1.7**: Enable host-only visual components and button enablement controls based on participant counts.

### Verification Tasks
- [x] **Task 1.8**: Test with two browsers to verify that list sync is functioning and that validation errors are thrown for empty names.
