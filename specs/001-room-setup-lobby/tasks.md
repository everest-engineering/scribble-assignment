# Tasks: Room Setup & Lobby

**Input**: Design documents from `/specs/001-room-setup-lobby/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Include focused Vitest coverage for changed backend services, schemas, and
frontend API/state behavior, plus manual two-browser validation from quickstart.md.

**Organization**: Tasks are grouped by user story so each story can be implemented and
tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and has no dependency on
  incomplete tasks
- **[Story]**: User story label from spec.md
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the active feature artifacts and existing code touchpoints before
changing behavior.

- [ ] T001 Review Feature 1 requirements in specs/001-room-setup-lobby/spec.md
- [ ] T002 Review implementation constraints and source-code map in specs/001-room-setup-lobby/plan.md
- [ ] T003 [P] Review API contract examples in specs/001-room-setup-lobby/contracts/room-setup-lobby.md
- [ ] T004 [P] Review current discovery gaps in docs/discovery-notes.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared room/status contracts used by all user stories.

**CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T005 Extend room status, host identity, and snapshot types in backend/src/models/game.ts
- [ ] T006 Mirror room status and host identity response types in frontend/src/services/api.ts
- [ ] T007 Add non-empty room-code and participant-id validation schemas in backend/src/api/schemas.ts

# Added for response validation
- [ ] T007A Add room snapshot and error response schemas in backend/src/api/schemas.ts
- [ ] T007B [P] Add response schema tests for room snapshots and errors in backend/src/api/schemas.test.ts
- [ ] T007C Apply room snapshot response validation in backend/src/api/rooms.ts

- [ ] T008 [P] Add schema tests for empty room-code and participant-id validation in backend/src/api/schemas.test.ts

**Checkpoint**: Shared backend/frontend types and validation schemas are ready.

---

## Phase 3: User Story 1 - Create and Identify Host (Priority: P1) MVP

**Goal**: The room creator is assigned as host and lobby participants can see who the host
is.

**Independent Test**: Create a room, join it from a second tab, and verify only the
creator is identified as host.

### Tests for User Story 1

- [ ] T009 [P] [US1] Add room-store test for host assignment on createRoom in backend/src/services/roomStore.test.ts
- [ ] T010 [P] [US1] Add frontend API test expecting hostParticipantId in createRoom response handling in frontend/src/services/api.test.ts

### Implementation for User Story 1

- [ ] T011 [US1] Store hostParticipantId when creating rooms in backend/src/services/roomStore.ts
- [ ] T012 [US1] Include hostParticipantId in room snapshots from backend/src/services/roomStore.ts
- [ ] T013 [US1] Render host identity in the participant list in frontend/src/pages/LobbyPage.tsx
- [ ] T014 [US1] Add any required host badge/list styling in frontend/src/styles/app.css

**Checkpoint**: User Story 1 is functional and testable independently.

---

## Phase 4: User Story 2 - Join Lobby With Clear Errors (Priority: P1)

**Goal**: Empty and unknown room codes keep the user on the join screen with clear
feedback, while valid codes join the correct room.

**Independent Test**: Try empty, unknown, and valid room-code joins and verify the correct
message or lobby entry for each attempt.

### Tests for User Story 2

- [ ] T015 [P] [US2] Add schema tests for whitespace room codes in backend/src/api/schemas.test.ts
- [ ] T016 [P] [US2] Add API client error handling tests for failed join attempts in frontend/src/services/api.test.ts

### Implementation for User Story 2

- [ ] T017 [US2] Normalize and validate room codes before lookup in backend/src/api/rooms.ts
- [ ] T018 [US2] Return distinct clear error response codes and messages for empty and unknown room codes in backend/src/api/rooms.ts
- [ ] T019 [US2] Trim and validate room code before submit in frontend/src/pages/JoinRoomPage.tsx
- [ ] T020 [US2] Preserve join-screen state and display backend/client join error messages in frontend/src/pages/JoinRoomPage.tsx

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Keep Rooms Isolated and Fresh (Priority: P2)

**Goal**: Rooms remain isolated by code and an open lobby refreshes automatically about
every two seconds.

**Independent Test**: Create two rooms in separate sessions, join each room separately,
and verify each lobby only shows its own participants while updating automatically.

### Tests for User Story 3

- [ ] T021 [P] [US3] Add room-store test for multi-room participant isolation in backend/src/services/roomStore.test.ts
- [ ] T022 [P] [US3] Add room store test coverage for fetchRoom snapshot updates in frontend/src/state/roomStore.test.ts

### Implementation for User Story 3

- [ ] T023 [US3] Confirm room lookup and snapshot cloning preserve room isolation in backend/src/services/roomStore.ts
- [ ] T024 [US3] Add lobby polling interval and cleanup lifecycle in frontend/src/pages/LobbyPage.tsx
- [ ] T025 [US3] Preserve latest room snapshot and expose recoverable polling error state in frontend/src/state/roomStore.ts
- [ ] T025A [US3] Render recoverable polling error feedback while keeping the participant list visible in frontend/src/pages/LobbyPage.tsx
- [ ] T026 [US3] Keep manual refresh compatible with automatic polling in frontend/src/pages/LobbyPage.tsx

**Checkpoint**: User Stories 1, 2, and 3 all work independently.

---

## Phase 6: User Story 4 - Host Starts Game When Ready (Priority: P2)

**Goal**: Only the host can start, start requires at least two players, and successful
start moves all players out of lobby state.

**Independent Test**: Verify host with one player cannot start, non-host with two players
cannot start, and host with two players can start.

### Tests for User Story 4

- [ ] T027 [P] [US4] Add room-store tests for startGame host, non-host, minimum-player, and status outcomes in backend/src/services/roomStore.test.ts
- [ ] T028 [P] [US4] Add API client test for POST /rooms/:code/start in frontend/src/services/api.test.ts

### Implementation for User Story 4

- [ ] T029 [US4] Implement startGame service transition and error outcomes in backend/src/services/roomStore.ts
- [ ] T030 [US4] Add start-game request schema in backend/src/api/schemas.ts
- [ ] T031 [US4] Add POST /rooms/:code/start route handling in backend/src/api/rooms.ts
- [ ] T032 [US4] Add startRoom API method and response typing in frontend/src/services/api.ts
- [ ] T033 [US4] Add startRoom action to the client room store in frontend/src/state/roomStore.ts
- [ ] T034 [US4] Disable or hide start controls for non-hosts and show minimum-player errors in frontend/src/pages/LobbyPage.tsx
- [ ] T035 [US4] Navigate players out of the lobby when room status becomes in-game in frontend/src/pages/LobbyPage.tsx
- [ ] T035A [US4] Ensure started room state remains in-memory only and no persistence or background cleanup is introduced in backend/src/services/roomStore.ts

**Checkpoint**: All feature user stories are independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete feature and clean up documentation or UI details.

- [ ] T036 [P] Run backend tests for Feature 1 in backend/package.json
- [ ] T037 [P] Run frontend tests for Feature 1 in frontend/package.json
- [ ] T038 [P] Run backend build validation in backend/package.json
- [ ] T039 [P] Run frontend build validation in frontend/package.json
- [ ] T040 Execute manual two-browser validation steps in specs/001-room-setup-lobby/quickstart.md
- [ ] T041 Update implementation notes or deviations in specs/001-room-setup-lobby/quickstart.md
- [ ] T042 Review final scope for banned WebSocket, persistence, and authentication changes in specs/001-room-setup-lobby/plan.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion and blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational.
- **User Story 2 (Phase 4)**: Depends on Foundational; can be implemented after or in
  parallel with US1, but final lobby display benefits from US1.
- **User Story 3 (Phase 5)**: Depends on Foundational; most useful after US1 and US2.
- **User Story 4 (Phase 6)**: Depends on Foundational and uses host identity from US1.
- **Polish (Phase 7)**: Depends on all selected user stories.

### User Story Dependencies

- **US1 Create and Identify Host**: MVP slice; required for host-only start behavior.
- **US2 Join Lobby With Clear Errors**: Independent join validation slice.
- **US3 Keep Rooms Isolated and Fresh**: Depends on the room snapshot contract and is best
  verified after join/create flows work.
- **US4 Host Starts Game When Ready**: Depends on host identity and participant count.

### Within Each User Story

- Write tests before implementation where practical.
- Update types before services.
- Update services before routes.
- Update API client before UI integration.
- Complete each story checkpoint before moving to the next priority.

### Parallel Opportunities

- T003 and T004 can run in parallel after T001/T002 start.
- T008 can run alongside T005-T007 after expected schema behavior is known.
- T009 and T010 can run in parallel for US1.
- T015 and T016 can run in parallel for US2.
- T021 and T022 can run in parallel for US3.
- T027 and T028 can run in parallel for US4.
- T036, T037, T038, and T039 can run in parallel during final validation.

---

## Parallel Example: User Story 1

```bash
# Work in parallel on tests for host identity:
Task: "T009 [P] [US1] Add room-store test for host assignment on createRoom in backend/src/services/roomStore.test.ts"
Task: "T010 [P] [US1] Add frontend API test expecting hostParticipantId in createRoom response handling in frontend/src/services/api.test.ts"
```

## Parallel Example: User Story 4

```bash
# Work in parallel on backend service rules and frontend API contract tests:
Task: "T027 [P] [US4] Add room-store tests for startGame host, non-host, minimum-player, and status outcomes in backend/src/services/roomStore.test.ts"
Task: "T028 [P] [US4] Add API client test for POST /rooms/:code/start in frontend/src/services/api.test.ts"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 for US1.
3. Validate that room creation assigns and displays the host.

### Incremental Delivery

1. Add US1 host identity.
2. Add US2 join validation and clear errors.
3. Add US3 polling and room isolation verification.
4. Add US4 host-only start with two-player minimum.
5. Run full automated and manual validation from quickstart.md.

### Team Parallel Strategy

After Phase 2, one developer can handle backend service/schema tasks while another handles
frontend API/store/UI tasks for the same story. Avoid editing the same file concurrently
inside a story unless the changes are sequenced by task ID.

## Notes

- [P] tasks are parallelizable only when assigned to different files or after their
  prerequisites are complete.
- Do not add WebSockets, databases, persistence, authentication, sessions, JWT, OAuth, or
  new routing/state-management libraries.
- Keep implementation scoped to Feature 1; drawing, drawer assignment, scoring, results,
  and restart are later feature groups.
