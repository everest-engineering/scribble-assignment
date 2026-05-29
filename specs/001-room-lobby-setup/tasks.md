---

description: "Task list for Scenario 1 room setup and lobby implementation"

---

# Tasks: Scenario 1 Room Setup & Lobby

**Input**: Design documents from `/specs/001-room-lobby-setup/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Include automated backend and frontend API coverage plus manual two-tab validation for each user story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Paths below follow this repository's monorepo layout

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the active Scenario 1 artifacts and validation targets before editing code

- [ ] T001 Review implementation inputs in `specs/001-room-lobby-setup/spec.md`, `specs/001-room-lobby-setup/plan.md`, and `specs/001-room-lobby-setup/contracts/rooms-scenario1.openapi.yaml`
- [ ] T002 Confirm manual and automated validation steps in `specs/001-room-lobby-setup/quickstart.md`, `backend/src/api/rooms.ts`, and `frontend/src/pages/LobbyPage.tsx`
- [ ] T003 [P] Capture shared room-state expectations from `specs/001-room-lobby-setup/data-model.md` and `specs/001-room-lobby-setup/research.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared room, snapshot, and request-contract changes that all Scenario 1 stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Update shared room and snapshot types in `backend/src/models/game.ts`
- [ ] T005 [P] Extend shared room API types and fix the default backend base URL in `frontend/src/services/api.ts`
- [ ] T006 [P] Add reusable room-code normalization and start-request validation in `backend/src/api/schemas.ts`
- [ ] T007 [P] Add shared room session and snapshot update support in `frontend/src/state/roomStore.ts`
- [ ] T008 Implement shared room snapshot derivation helpers and status transitions in `backend/src/services/roomStore.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in priority order

---

## Phase 3: User Story 1 - Host Creates a Room (Priority: P1) 🎯 MVP

**Goal**: The room creator is identified as host and can start the room only when at least two players are present

**Independent Test**: Create a room in one tab, confirm the creator is marked as host, verify start is blocked while alone, then join with a second tab and confirm only the host can start the room

### Verification for User Story 1 ⚠️

- [ ] T009 [P] [US1] Add host assignment and minimum-player start tests in `backend/src/services/roomStore.test.ts`
- [ ] T010 [P] [US1] Add create-room and start-room request coverage in `frontend/src/services/api.test.ts`
- [ ] T011 [US1] Validate host creation and two-player start gating with `specs/001-room-lobby-setup/quickstart.md`

### Implementation for User Story 1

- [ ] T012 [P] [US1] Add `hostParticipantId`, `viewerIsHost`, `canStartGame`, and `minimumPlayersToStart` fields in `backend/src/models/game.ts`
- [ ] T013 [US1] Implement creator host assignment and `startRoom()` enforcement in `backend/src/services/roomStore.ts`
- [ ] T014 [US1] Add `POST /rooms/:code/start` handling and status/error mapping in `backend/src/api/rooms.ts`
- [ ] T015 [P] [US1] Add `startGame()` request handling in `frontend/src/services/api.ts` and `frontend/src/state/roomStore.ts`
- [ ] T016 [US1] Update host labeling, start gating, and started-room navigation in `frontend/src/pages/LobbyPage.tsx` and `frontend/src/pages/GamePage.tsx`

**Checkpoint**: At this point, room creation, host designation, and host-only start should be functional and testable independently

---

## Phase 4: User Story 2 - Player Joins by Room Code (Priority: P2)

**Goal**: Players can join valid rooms and receive clear feedback for empty or invalid room codes

**Independent Test**: Attempt to join with empty, whitespace-only, unknown, and valid room codes from a second tab and confirm only the valid code enters the lobby

### Verification for User Story 2 ⚠️

- [ ] T017 [P] [US2] Add room-code validation and join failure coverage in `backend/src/api/schemas.test.ts` and `backend/src/services/roomStore.test.ts`
- [ ] T018 [P] [US2] Add join-room and fetch-room request coverage in `frontend/src/services/api.test.ts`
- [ ] T019 [US2] Validate empty, invalid, and valid join flows with `specs/001-room-lobby-setup/quickstart.md`

### Implementation for User Story 2

- [ ] T020 [US2] Tighten room-code parsing and malformed-request rejection in `backend/src/api/schemas.ts`
- [ ] T021 [US2] Return clear join and room-load error messages in `backend/src/api/rooms.ts`
- [ ] T022 [US2] Trim, uppercase, and block empty room-code submission in `frontend/src/pages/JoinRoomPage.tsx`
- [ ] T023 [US2] Preserve join failure feedback and successful room-session updates in `frontend/src/state/roomStore.ts`

**Checkpoint**: At this point, users can join valid rooms and receive clear feedback for invalid room-code attempts without breaking User Story 1

---

## Phase 5: User Story 3 - Lobbies Stay Synced and Isolated (Priority: P3)

**Goal**: Lobby state refreshes automatically every 2 seconds and remains isolated per room

**Independent Test**: Run at least two rooms in parallel across multiple tabs and confirm each lobby refreshes automatically while showing only its own participants and state

### Verification for User Story 3 ⚠️

- [ ] T024 [P] [US3] Add room-isolation and lobby-snapshot transition coverage in `backend/src/services/roomStore.test.ts`
- [ ] T025 [P] [US3] Add polling fetch and started-room transition coverage in `frontend/src/services/api.test.ts`
- [ ] T026 [US3] Validate two-room isolation and 2-second lobby refresh with `specs/001-room-lobby-setup/quickstart.md`

### Implementation for User Story 3

- [ ] T027 [US3] Ensure room-specific fetch and snapshot isolation in `backend/src/services/roomStore.ts` and `backend/src/api/rooms.ts`
- [ ] T028 [US3] Implement 2-second lobby polling and refresh-state handling in `frontend/src/pages/LobbyPage.tsx` and `frontend/src/state/roomStore.ts`
- [ ] T029 [US3] Add host markers and synced lobby status messaging in `frontend/src/styles/app.css` and `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: All Scenario 1 lobby synchronization and room isolation behavior should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and artifact alignment across the completed Scenario 1 slice

- [ ] T030 [P] Refresh Scenario 1 behavior notes in `specs/001-room-lobby-setup/quickstart.md` and `specs/001-room-lobby-setup/contracts/rooms-scenario1.openapi.yaml` if implementation wording changed
- [ ] T031 Run backend validation for `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`, and `backend/src/api/rooms.ts` with `cd backend && npm test && npm run build`
- [ ] T032 Run frontend validation for `frontend/src/services/api.ts`, `frontend/src/state/roomStore.ts`, `frontend/src/pages/JoinRoomPage.tsx`, and `frontend/src/pages/LobbyPage.tsx` with `cd frontend && npm test && npm run build`
- [ ] T033 Run the final end-to-end multi-tab Scenario 1 checks in `specs/001-room-lobby-setup/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion and defines the MVP slice
- **User Story 2 (Phase 4)**: Depends on Foundational completion and should be completed after User Story 1 because it extends the shared room flow already used by the host path
- **User Story 3 (Phase 5)**: Depends on Foundational completion and benefits from User Stories 1 and 2 being in place so polling and isolation can be validated end to end
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on other user stories; establishes host metadata and start enforcement
- **User Story 2 (P2)**: Uses the shared room/session contract and should preserve the host flow from User Story 1
- **User Story 3 (P3)**: Uses the room/session contract plus the join/start flow from User Stories 1 and 2 for full validation

### Within Each User Story

- Verification tasks MUST be completed before the story is treated as done
- Shared types before services
- Services before routes or client state integration
- Client state before page-level UI behavior
- Manual two-tab validation before moving to the next priority

### Parallel Opportunities

- `T003` can run in parallel with `T001-T002`
- `T005-T007` can run in parallel once `T004` is defined
- `T009-T010`, `T017-T018`, and `T024-T025` can run in parallel within their user stories
- `T015` can run in parallel with `T013-T014` once the backend contract is stable
- `T030` can run in parallel with final validation once implementation is complete

---

## Parallel Example: User Story 1

```bash
# Launch User Story 1 automated verification together:
Task: "Add host assignment and minimum-player start tests in backend/src/services/roomStore.test.ts"
Task: "Add create-room and start-room request coverage in frontend/src/services/api.test.ts"

# Launch independent User Story 1 implementation work together:
Task: "Add hostParticipantId, viewerIsHost, canStartGame, and minimumPlayersToStart fields in backend/src/models/game.ts"
Task: "Add startGame() request handling in frontend/src/services/api.ts and frontend/src/state/roomStore.ts"
```

## Parallel Example: User Story 2

```bash
# Launch User Story 2 automated verification together:
Task: "Add room-code validation and join failure coverage in backend/src/api/schemas.test.ts and backend/src/services/roomStore.test.ts"
Task: "Add join-room and fetch-room request coverage in frontend/src/services/api.test.ts"

# Launch independent User Story 2 implementation work together:
Task: "Return clear join and room-load error messages in backend/src/api/rooms.ts"
Task: "Trim, uppercase, and block empty room-code submission in frontend/src/pages/JoinRoomPage.tsx"
```

## Parallel Example: User Story 3

```bash
# Launch User Story 3 automated verification together:
Task: "Add room-isolation and lobby-snapshot transition coverage in backend/src/services/roomStore.test.ts"
Task: "Add polling fetch and started-room transition coverage in frontend/src/services/api.test.ts"

# Launch independent User Story 3 implementation work together:
Task: "Ensure room-specific fetch and snapshot isolation in backend/src/services/roomStore.ts and backend/src/api/rooms.ts"
Task: "Add host markers and synced lobby status messaging in frontend/src/styles/app.css and frontend/src/pages/LobbyPage.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Confirm host designation and host-only start with two tabs
5. Demo the host-controlled room start on the existing game placeholder

### Incremental Delivery

1. Complete Setup + Foundational → shared room contract ready
2. Add User Story 1 → validate host creation/start → MVP complete
3. Add User Story 2 → validate join feedback and valid-room entry
4. Add User Story 3 → validate polling and room isolation
5. Finish with Phase 6 validation and artifact cleanup

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. After foundation is stable:
   - Developer A: backend service and route changes for the active story
   - Developer B: frontend store and page changes for the active story
   - Developer C: automated verification updates in `backend/src/**/*.test.ts` and `frontend/src/services/api.test.ts`
3. Rejoin for manual two-tab validation at the end of each story

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] labels map tasks to specific user stories for traceability
- Every task includes an exact file path and can be executed without additional artifact discovery
- Suggested MVP scope: Phase 3 / User Story 1 only
