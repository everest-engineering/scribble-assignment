# Tasks: Room Setup & Lobby

**Input**: Design documents from `/specs/001-room-setup-lobby/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure the existing code structure is in place and ready for feature work.

- [X] T001 [P] Create `specs/001-room-setup-lobby/tasks.md` and confirm the feature directory structure
- [X] T002 [P] Verify backend and frontend dev scripts in `backend/package.json` and `frontend/package.json`
- [X] T003 [P] Confirm that `backend/src/api/rooms.ts`, `backend/src/services/roomStore.ts`, and `frontend/src/state/roomStore.ts` are the correct integration points for the feature

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement the core room and lobby state model and backend contract.

- [X] T004 [US1] Add room code validation to `backend/src/api/rooms.ts` by canonicalizing room codes and rejecting invalid codes
- [X] T005 [US1] Update `backend/src/services/roomStore.ts` to preserve room isolation by code and support room lookup with `getRoom`
- [X] T006 [US1] Extend `backend/src/services/roomStore.ts` to return consistent `RoomSnapshot` values via `toRoomSnapshot`
- [X] T007 [US1] Confirm `frontend/src/services/api.ts` matches the contract in `specs/001-room-setup-lobby/contracts/backend-room-api.md`

---

## Phase 3: User Story 1 - Host a room (Priority: P1) 🎯 MVP

**Goal**: Create a new room and assign the creator as host.

**Independent Test**: Create a room in the frontend and verify the lobby shows the room code and participant list.

- [X] T008 [US1] Implement host-aware room creation flow in `frontend/src/state/roomStore.ts`
- [X] T009 [US1] Ensure `frontend/src/pages/CreateRoomPage.tsx` posts room creation requests and navigates to `/lobby`
- [X] T010 [US1] Add server-side room state creation in `backend/src/api/rooms.ts` with unique code generation
- [X] T011 [US1] Add a lobby room header in `frontend/src/pages/LobbyPage.tsx` that displays the room code
- [X] T012 [US1] Add a participant list display in `frontend/src/pages/LobbyPage.tsx`

---

## Phase 4: User Story 2 - Join an existing room (Priority: P1)

**Goal**: Allow a second player to join an active room with a valid code.

**Independent Test**: From another browser tab, join an existing lobby and confirm the participant list shows both players.

- [X] T013 [US2] Implement room join requests in `frontend/src/state/roomStore.ts`
- [X] T014 [US2] Add join-room form handling in `frontend/src/pages/JoinRoomPage.tsx`
- [X] T015 [US2] Ensure `frontend/src/services/api.ts` posts to `/rooms/:code/join`
- [X] T016 [US2] Ensure `backend/src/api/rooms.ts` returns 404 for non-existent rooms on join attempts

---

## Phase 5: User Story 3 - Reject invalid or empty room codes (Priority: P1)

**Goal**: Present clear validation feedback for empty or invalid room codes.

**Independent Test**: Submit no code or a wrong code from the join page and confirm a visible error is shown.

- [X] T017 [US3] Add empty-code validation to `frontend/src/pages/JoinRoomPage.tsx`
- [X] T018 [US3] Add uppercase canonicalization and invalid-code error handling in `frontend/src/pages/JoinRoomPage.tsx`
- [X] T019 [US3] Add `HttpError(404, "Unable to join room")` handling in `backend/src/api/rooms.ts`
- [X] T020 [US3] Update `frontend/src/state/roomStore.ts` to surface API error messages clearly

---

## Phase 6: User Story 4 - Only the host can start the game (Priority: P2)

**Goal**: Enable only the host to start the game when at least two players are present.

**Independent Test**: Verify non-host users do not see a start button and the host cannot start until a second player joins.

- [X] T021 [US4] Add host detection to `backend/src/services/roomStore.ts` by treating the first participant as host
- [X] T022 [US4] Expose host information in `RoomSnapshot` returned by `toRoomSnapshot`
- [X] T023 [US4] Update `frontend/src/pages/LobbyPage.tsx` to conditionally render a start button only for the host
- [X] T024 [US4] Add a minimum player count check to disable or hide the host start control when `room.participants.length < 2`
- [X] T025 [US4] Add UI text explaining start restrictions in `frontend/src/pages/LobbyPage.tsx`

---

## Phase 7: User Story 5 - Lobby refreshes via polling (Priority: P2)

**Goal**: Periodically refresh the lobby state so the new participant list appears within ~2 seconds.

**Independent Test**: Join a room from another tab and confirm lobby refresh updates the participant list automatically.

- [X] T026 [US5] Add a polling interval in `frontend/src/pages/LobbyPage.tsx` using `useEffect` and `setInterval`
- [X] T027 [US5] Ensure polling calls `roomStore.fetchRoom()` at approximately 2-second intervals
- [X] T028 [US5] Add cleanup for the polling interval in `frontend/src/pages/LobbyPage.tsx`
- [X] T029 [US5] Ensure the lobby page still navigates away if `room` becomes null or invalid

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, error handling, and user-facing polish.

- [X] T030 [P] Add error display for backend failures in `frontend/src/pages/LobbyPage.tsx`
- [X] T031 [P] Ensure polling does not continue after navigating away from `/lobby`
- [X] T032 [P] Confirm room isolation by verifying one room code cannot be used to access another room's state
- [X] T033 [P] Update `specs/001-room-setup-lobby/quickstart.md` with any final validation notes
- [X] T034 [P] Run backend tests with `cd backend && npm test` and frontend tests with `cd frontend && npm test`

---

## Dependencies & Execution Order

- Setup tasks can start immediately.
- Foundational tasks must complete before work on user stories begins.
- User Story tasks should be executed in priority order, with P1 stories first.
- P2 stories may follow once P1 coverage is validated.
- Polish tasks wrap up once all stories are complete.

## Parallel Opportunities

- `T001`, `T002`, and `T003` are parallelizable.
- `T030` through `T034` are cross-cutting polish tasks and can run in parallel after implementation.
- User story tasks are grouped by story to support independent delivery.
