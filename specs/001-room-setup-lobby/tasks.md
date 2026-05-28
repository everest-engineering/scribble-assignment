# Tasks: Room Setup and Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 0: Discovery & Artifacts

**Purpose**: Understanding existing code and aligning Spec Kit artifacts

- [x] T000 [P] Conduct discovery: document ≥3 gaps and ≥2 assumptions in specs/001-room-setup-lobby/research.md
- [x] T001 [P] Sync artifacts: verify Constitution, Spec, and Plan consistency in specs/001-room-setup-lobby/

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and validation helpers

- [x] T002 [P] Implement validation helpers for name/code trimming and checks in backend/src/api/schemas.ts
- [x] T003 [P] Add polling utility or hook for generic interval management in frontend/src/state/roomStore.ts

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure updates that block all user stories

- [x] T004 Update Participant and Room types in backend/src/models/game.ts to include hostId and RoomStatus
- [x] T005 Update RoomSnapshot and RoomSessionResponse in backend/src/models/game.ts to include hostId
- [x] T006 Update RoomSnapshot interface in frontend/src/services/api.ts to match backend
- [x] T007 [P] Create unit tests for roomStore logic in backend/tests/roomStore.test.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Host Room Creation (Priority: P1) 🎯 MVP

**Goal**: Creator of the room becomes the host with persisted hostId.

**Independent Test**: Create a room and verify Alice's ID is stored as hostId in backend state.

- [x] T008 [US1] Update createRoom logic in backend/src/services/roomStore.ts to assign creator as hostId
- [x] T009 [US1] Update createRoomsRouter in backend/src/api/rooms.ts to return hostId in snapshot
- [x] T010 [P] [US1] Update CreateRoomPage validation logic in frontend/src/pages/CreateRoomPage.tsx
- [x] T011 [US1] Verify Alice is host by checking hostId in frontend/src/state/roomStore.ts

**Checkpoint**: US1 complete - Creator is correctly tracked as host.

---

## Phase 4: User Story 2 - Joining a Room (Priority: P1)

**Goal**: Join room with name/code validation and isolation.

**Independent Test**: Join with whitespace name should fail; join Room A should not show in Room B.

- [x] T012 [US2] Update joinRoom logic in backend/src/services/roomStore.ts with name validation
- [x] T013 [US2] Update joinRoomSchema in backend/src/api/schemas.ts to trim names
- [x] T014 [P] [US2] Update JoinRoomPage validation logic in frontend/src/pages/JoinRoomPage.tsx
- [x] T015 [US2] Implement host migration logic in backend/src/services/roomStore.ts if host leaves

**Checkpoint**: US2 complete - Joining is validated and isolated.

---

## Phase 5: User Story 3 - Automatic Lobby Refresh (Priority: P2)

**Goal**: Lobby updates automatically via 2s polling.

**Independent Test**: Open two tabs; Tab B join should appear in Tab A within 2s without refresh.

- [x] T016 [US3] Implement polling loop in frontend/src/pages/LobbyPage.tsx using useEffect
- [x] T017 [US3] Implement polling cleanup on unmount in frontend/src/pages/LobbyPage.tsx
- [x] T018 [US3] Ensure fetchRoom in frontend/src/state/roomStore.ts handles status updates correctly

**Checkpoint**: US3 complete - Lobby syncs automatically.

---

## Phase 6: User Story 4 - Starting the Game (Priority: P2)

**Goal**: Only host can start game with ≥2 players.

**Independent Test**: Bob (guest) cannot see Start button; Alice (host) sees button enabled only with 2 players.

- [x] T019 [US4] Implement POST /rooms/:code/start endpoint in backend/src/api/rooms.ts
- [x] T020 [US4] Add host/player count validation in backend/src/services/roomStore.ts for start game
- [x] T021 [US4] Add startGame method to frontend/src/services/api.ts
- [x] T022 [US4] Update LobbyPage UI in frontend/src/pages/LobbyPage.tsx to conditionally show/enable Start button
- [x] T023 [US4] Implement auto-navigation to /game on status transition in frontend/src/pages/LobbyPage.tsx

**Checkpoint**: US4 complete - Host controls game start.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup

- [x] T024 [P] Run quickstart.md validation steps in two browser tabs
- [x] T025 [P] Verify no TypeScript errors (Rule I) in frontend and backend
- [x] T026 [P] Verify no memory leaks from polling intervals

---

## Dependencies & Execution Order

- **Phase 2 (Foundational)**: BLOCKS all US phases (T004-T007 are critical).
- **User Story 1**: Must be done before US2 (need a room to join).
- **User Story 3/4**: Can be worked on once US1/US2 are verified.

---

## Implementation Strategy

### MVP First (User Story 1 & 2)
1. Complete Foundational Phase (Types and basic store updates).
2. Complete US1 (Creation + Host assignment).
3. Complete US2 (Joining + Validation).
4. **STOP and VALIDATE**: Verify Alice can create and Bob can join.

### Full Feature
1. Add US3 (Polling sync).
2. Add US4 (Start game control).
3. Final multi-player validation.
