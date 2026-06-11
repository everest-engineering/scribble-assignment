# Tasks: Room Setup and Lobby

**Input**: Design documents from `/specs/001-room-lobby-flow/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/rooms.openapi.yaml`, `quickstart.md`

**Tests**: Focused test tasks are included because `plan.md` and `research.md` require backend/frontend validation for deterministic room, role, polling, and start-game behavior.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and has no dependency on incomplete tasks.
- **[Story]**: Maps a task to a user story from `spec.md`.
- Every task includes an exact file path.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm active artifacts, source layout, and validation commands before implementation.

- [ ] T001 Review active feature scope in `specs/001-room-lobby-flow/spec.md` and `specs/001-room-lobby-flow/plan.md`
- [ ] T002 [P] Review backend test/build scripts in `backend/package.json`
- [ ] T003 [P] Review frontend test/build scripts in `frontend/package.json`
- [ ] T004 [P] Review REST contract before implementation in `specs/001-room-lobby-flow/contracts/rooms.openapi.yaml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared room, snapshot, validation, and frontend contract types required by all user stories.

**Critical**: Complete this phase before starting user story implementation.

- [ ] T005 Update backend game model types for `lobby | playing`, `hostParticipantId`, participant snapshots, and `canStartGame` in `backend/src/models/game.ts`
- [ ] T006 Update backend validation schemas for trimmed player names, normalized room codes, viewer participant ids, and start-game requests in `backend/src/api/schemas.ts`
- [ ] T007 Update frontend API types for host fields, participant `isHost`, `canStartGame`, `lobby | playing` status, and start-game responses in `frontend/src/services/api.ts`
- [ ] T008 Update shared room state handling for fetched `playing` status and retained `participantId` in `frontend/src/state/roomStore.ts`

**Checkpoint**: Shared contracts are ready for story-specific implementation.

---

## Phase 3: User Story 1 - Create a Room as Host (Priority: P1)

**Goal**: A player can create a room, enter the lobby, see a unique room code, appear in the player list, and be identified as Host.

**Independent Test**: Create a room from a fresh session and confirm the creator lands in the lobby as Host with Start Game unavailable while alone.

### Tests for User Story 1

- [ ] T009 [P] [US1] Add create-room host assignment and single-player `canStartGame` tests in `backend/src/services/roomStore.test.ts`
- [ ] T010 [P] [US1] Add create-room player-name validation tests in `backend/src/api/schemas.test.ts`

### Implementation for User Story 1

- [ ] T011 [US1] Implement trimmed creator names, `hostParticipantId` assignment, and host-aware snapshots in `backend/src/services/roomStore.ts`
- [ ] T012 [US1] Return host-aware create-room snapshots from the create route in `backend/src/api/rooms.ts`
- [ ] T013 [US1] Trim player names before create-room submission and preserve create errors in `frontend/src/pages/CreateRoomPage.tsx`
- [ ] T014 [US1] Render Host labels and disabled single-player Start Game state in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: User Story 1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - Join an Existing Room (Priority: P1)

**Goal**: A player can join an existing room by code, invalid room-code attempts show clear feedback, and joined players are non-host participants.

**Independent Test**: Create one room, join it from a second session, and verify empty, invalid, and non-existent room codes show distinct clear errors.

### Tests for User Story 2

- [ ] T015 [P] [US2] Add join-room valid, non-existent, and non-host role tests in `backend/src/services/roomStore.test.ts`
- [ ] T016 [P] [US2] Add room-code validation tests for empty, invalid, lowercase, and missing values in `backend/src/api/schemas.test.ts`
- [ ] T017 [P] [US2] Add join-room request and error handling tests in `frontend/src/services/api.test.ts`

### Implementation for User Story 2

- [ ] T018 [US2] Implement room-code normalization and join-room lookup behavior in `backend/src/services/roomStore.ts`
- [ ] T019 [US2] Implement distinct join error responses for empty, invalid, and non-existent room codes in `backend/src/api/rooms.ts`
- [ ] T020 [US2] Trim room code and player name input while preserving clear join errors in `frontend/src/pages/JoinRoomPage.tsx`
- [ ] T021 [US2] Display non-host participant role labels from room snapshots in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: User Stories 1 and 2 work together as the P1 room setup MVP.

---

## Phase 5: User Story 3 - Keep Rooms Isolated and Synced (Priority: P2)

**Goal**: Lobby state refreshes automatically about every 2 seconds, and separate rooms remain isolated.

**Independent Test**: Open two rooms in separate sessions, add players, and confirm each lobby updates only its own room state without manual refresh.

### Tests for User Story 3

- [ ] T022 [P] [US3] Add cross-room isolation and fetch snapshot tests in `backend/src/services/roomStore.test.ts`
- [ ] T023 [P] [US3] Add fetch-room query and refresh error handling tests in `frontend/src/services/api.test.ts`

### Implementation for User Story 3

- [ ] T024 [US3] Ensure `getRoom` and `toRoomSnapshot` return only the normalized room-code state in `backend/src/services/roomStore.ts`
- [ ] T025 [US3] Normalize GET room-code handling and refresh error responses in `backend/src/api/rooms.ts`
- [ ] T026 [US3] Add polling-friendly fetch-room error handling in `frontend/src/state/roomStore.ts`
- [ ] T027 [US3] Replace manual-only refresh with 2-second lobby polling and interval cleanup in `frontend/src/pages/LobbyPage.tsx`
- [ ] T028 [US3] Add or adjust lobby polling and status styles in `frontend/src/styles/app.css`

**Checkpoint**: Room state remains isolated and lobby clients refresh without manual action.

---

## Phase 6: User Story 4 - Start Game as Host (Priority: P2)

**Goal**: Only the Host can start a room with at least two players, and all players in that room transition to the game state.

**Independent Test**: With one Host and one non-host in a lobby, verify only the Host can start the game and both players reach the game screen after start.

### Tests for User Story 4

- [ ] T029 [P] [US4] Add start-game authorization, minimum-player, status transition, and isolation tests in `backend/src/services/roomStore.test.ts`
- [ ] T030 [P] [US4] Add start-game API request tests in `frontend/src/services/api.test.ts`

### Implementation for User Story 4

- [ ] T031 [US4] Implement `startGame` service transition and guard errors in `backend/src/services/roomStore.ts`
- [ ] T032 [US4] Implement `POST /rooms/:code/start` route and response handling in `backend/src/api/rooms.ts`
- [ ] T033 [US4] Add `startGame` client method in `frontend/src/services/api.ts`
- [ ] T034 [US4] Add `startGame` store action and playing-status navigation support in `frontend/src/state/roomStore.ts`
- [ ] T035 [US4] Wire the Start Game button to host-only start behavior and game navigation in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: Host-only start works and all players in the room transition to the game state.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete feature and document any deviations.

- [ ] T036 Run backend tests and build commands documented in `backend/package.json`
- [ ] T037 Run frontend tests and build commands documented in `frontend/package.json`
- [ ] T038 Perform the two-browser manual validation flow and record any deviations in `specs/001-room-lobby-flow/quickstart.md`
- [ ] T039 Verify no forbidden protocols, persistence, authentication, or unrelated dependencies were added by checking `backend/package.json` and `frontend/package.json`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: No dependencies.
- **Phase 2 Foundational**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 US1**: Depends on Phase 2.
- **Phase 4 US2**: Depends on US1 because an existing room is required to join.
- **Phase 5 US3**: Depends on US1 and US2 for realistic multi-room and multi-player validation.
- **Phase 6 US4**: Depends on US1 and US2; final all-player transition validation benefits from US3 polling.
- **Phase 7 Polish**: Depends on all selected user stories.

### User Story Dependencies

- **US1 Create a Room as Host**: First MVP slice; can be validated independently.
- **US2 Join an Existing Room**: Builds on US1 to complete the P1 multiplayer lobby MVP.
- **US3 Keep Rooms Isolated and Synced**: Builds on room creation/joining to validate polling and isolation.
- **US4 Start Game as Host**: Builds on room creation/joining and uses polling to synchronize player navigation.

### Dependency Graph

```text
Setup -> Foundational -> US1 -> US2 -> US3 -> Polish
                              \-> US4 -/
```

### Within Each User Story

- Tests first, then implementation.
- Backend models/schemas before services.
- Services before routes.
- Frontend API/state before page wiring.
- Story checkpoint before moving to the next story.

---

## Parallel Opportunities

- T002, T003, and T004 can run in parallel after T001.
- T009 and T010 can run in parallel for US1.
- T015, T016, and T017 can run in parallel for US2.
- T022 and T023 can run in parallel for US3.
- T029 and T030 can run in parallel for US4.
- Backend and frontend implementation tasks can be split by file after shared contracts are complete.

## Parallel Example: User Story 2

```bash
# Tests can be prepared in parallel:
Task: "T015 Add join-room valid, non-existent, and non-host role tests in backend/src/services/roomStore.test.ts"
Task: "T016 Add room-code validation tests for empty, invalid, lowercase, and missing values in backend/src/api/schemas.test.ts"
Task: "T017 Add join-room request and error handling tests in frontend/src/services/api.test.ts"
```

## Parallel Example: User Story 3

```bash
# Backend isolation tests and frontend fetch tests touch different files:
Task: "T022 Add cross-room isolation and fetch snapshot tests in backend/src/services/roomStore.test.ts"
Task: "T023 Add fetch-room query and refresh error handling tests in frontend/src/services/api.test.ts"
```

## Parallel Example: User Story 4

```bash
# Start-game backend rules and frontend request tests can be authored together:
Task: "T029 Add start-game authorization, minimum-player, status transition, and isolation tests in backend/src/services/roomStore.test.ts"
Task: "T030 Add start-game API request tests in frontend/src/services/api.test.ts"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete US1 to support Host room creation.
3. Complete US2 to support joining and validation.
4. Stop and validate the P1 room setup MVP with two browser sessions.

### Incremental Delivery

1. Deliver US1 for room creation and Host display.
2. Deliver US2 for join flow and validation.
3. Deliver US3 for automatic lobby sync and room isolation.
4. Deliver US4 for host-only game start and shared transition.
5. Run Phase 7 validation before handoff.

### Validation Commands

```bash
cd backend
npm run test
npm run build
```

```bash
cd frontend
npm run test
npm run build
```

## Notes

- All synchronization must remain HTTP polling only.
- Room and game state must remain in backend memory only.
- Do not add authentication, sessions, databases, WebSockets, Socket.io, server-sent events, or unrelated dependencies.
- `tasks.md` is ordered for incremental implementation; do not skip story checkpoints when validating user-facing behavior.
