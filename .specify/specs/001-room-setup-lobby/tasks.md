# Tasks: Room Setup & Lobby

**Feature**: Room Setup & Lobby
**Plan**: [.specify/specs/001-room-setup-lobby/plan.md](plan.md)
**Branch**: `001-room-setup-lobby`

## Implementation Strategy
We will implement the feature in vertical slices per user story, starting with the host flow and room creation, followed by joining logic with validation, then synchronization through polling, and finally the game transition logic. MVP focus is on US1 and US2.

## Phase 1: Setup
- [X] T001 Initialize implementation context and verify project structure in `backend/` and `frontend/`

## Phase 2: Foundational
- [X] T002 Update `Room` and `Participant` types in `backend/src/models/game.ts` and `frontend/src/services/api.ts` to include `hostId` and `status`
- [X] T003 Update `toRoomSnapshot` mapping in `backend/src/services/roomStore.ts` to include `hostId` and derive `isHost`

## Phase 3: [US1] Hosting a Game (Priority: P1)
**Goal**: Allow a player to create a room and be assigned as host.
**Independent Test**: Navigate to Start Page, click "Create Room", and verify redirection to Lobby with "Host" indicator.

- [X] T004 [P] [US1] Update `createRoom` service in `backend/src/services/roomStore.ts` to set `hostId` and initial status
- [X] T005 [US1] Update `POST /api/rooms` endpoint in `backend/src/api/rooms.ts` to return host information
- [X] T006 [P] [US1] Update `RoomStore.createRoom` in `frontend/src/state/roomStore.ts` to store `hostId` and `participantId`
- [X] T007 [US1] Modify `LobbyPage.tsx` to display "Host" badge for the current user if they are the host

## Phase 4: [US2] Joining a Game (Priority: P1)
**Goal**: Allow players to join via code with validation (capacity, uniqueness, existence).
**Independent Test**: Attempt to join with invalid code, taken name, or to a full room (8 players) and verify clear error feedback.

- [X] T008 [US2] Update `joinRoomSchema` and validation in `backend/src/api/schemas.ts` and `backend/src/api/rooms.ts`
- [X] T009 [US2] Implement capacity check (max 8) and name uniqueness check in `joinRoom` service in `backend/src/services/roomStore.ts`
- [X] T010 [P] [US2] Update `JoinRoomPage.tsx` to display specific API error messages (e.g., "Room is full", "Name already taken")
- [X] T011 [US2] Add client-side validation for room code format (4 chars) and name presence in `JoinRoomPage.tsx`

## Phase 5: [US3] Lobby Synchronization (Priority: P2)
**Goal**: Automatically update participant list every 2 seconds via polling.
**Independent Test**: Join room in two windows; verify Window A updates when Window B joins without manual refresh.

- [X] T012 [US3] Implement `startPolling` and `stopPolling` methods in `frontend/src/state/roomStore.ts` using `setInterval` (2000ms)
- [X] T013 [US3] Integrate polling lifecycle in `LobbyPage.tsx` (start on mount, stop on unmount)
- [X] T014 [P] [US3] Add defensive guard in `RoomStore.fetchRoom` to prevent overlapping requests if previous poll is pending

## Phase 6: [US4] Starting the Game (Priority: P1)
**Goal**: Restrict game start to host with at least 2 players; handle host disconnection.
**Independent Test**: As non-host, verify "Start Game" is hidden. As host, verify it's disabled until a second player joins. Verify room closes if host leaves.

- [X] T015 [US4] Create `POST /api/rooms/:code/start` endpoint in `backend/src/api/rooms.ts` with host-only and min-player (2) checks
- [X] T016 [P] [US4] Update `LobbyPage.tsx` to conditionally render and enable "Start Game" button based on `isHost` and participant count
- [X] T017 [US4] Implement `useEffect` in `LobbyPage.tsx` to navigate to `/game` when room status changes to `"game"` via polling
- [X] T018 [US4] Implement automatic room closure in `backend/src/services/roomStore.ts` when host is removed from participants

## Final Phase: Polish & Cross-Cutting Concerns
- [X] T019 [P] Add unit tests for room capacity and name uniqueness in `backend/src/services/roomStore.test.ts`
- [X] T020 [P] Add unit tests for polling state management in `frontend/src/state/roomStore.test.ts` (if exists or new)
- [X] T021 [P] Ensure error boundary or global error handling in `frontend/src/App.tsx` handles room not found (404) during polling

## Dependencies
- US3 depends on US1 & US2 completion
- US4 depends on US3 completion for state sync

## Parallel Execution Examples
- [T004, T006] - Backend service and frontend state for US1
- [T010, T014] - UI error feedback and polling optimization
- [T019, T020, T021] - Final testing and polish tasks
