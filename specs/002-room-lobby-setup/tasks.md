# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/002-room-lobby-setup/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No automated test tasks included — spec defines manual acceptance scenarios tested via two-browser-tab flow.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

Project already scaffolded. No setup tasks needed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 Add isHost to Participant interface and "playing" to RoomStatus type in backend/src/models/game.ts
- [x] T002 [P] Sync Participant and RoomSnapshot types in frontend/src/services/api.ts to include isHost and "playing" status
- [x] T003 Add rate limit tracking infrastructure (RateLimitEntry type, per-session Map) to backend/src/services/roomStore.ts

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Host creates a room and manages the lobby (Priority: P1) 🎯 MVP

**Goal**: Player creates a room, is designated host, sees themselves in lobby with host badge, and can start the game once 2+ players present.

**Independent Test**: Open app, enter name, click "Create Room", verify lobby shows player as both participant and host with host badge.

### Implementation for User Story 1

- [x] T004 [US1] Set isHost=true on room creator in createRoom() in backend/src/services/roomStore.ts
- [x] T005 [P] [US1] Add rate limit enforcement (5 creates/min) to createRoom route in backend/src/api/rooms.ts
- [x] T006 [P] [US1] Add inline name validation (reject empty/whitespace-only) to CreateRoomPage in frontend/src/pages/CreateRoomPage.tsx
- [x] T007 [US1] Display host badge next to host's name in participant list on LobbyPage in frontend/src/pages/LobbyPage.tsx
- [x] T008 [US1] Implement startGame() in backend/src/services/roomStore.ts with isHost check and 2+ player minimum
- [x] T009 [US1] Add POST /rooms/:code/start route in backend/src/api/rooms.ts with Zod validation and 403/400 error handling
- [x] T010 [P] [US1] Add startGame() method to frontend/src/services/api.ts for POST /rooms/:code/start
- [x] T011 [US1] Add startGame action to RoomStore and wire Start Game button (host-only visibility, disabled when <2 players) in frontend/src/pages/LobbyPage.tsx

**Checkpoint**: Host creates room, sees host badge. Start button visible (disabled until 2+ players).

---

## Phase 4: User Story 2 - Player joins a room via code (Priority: P1)

**Goal**: Player joins an existing room by entering a valid code; invalid/empty codes rejected with clear feedback; duplicate names get discriminator.

**Independent Test**: Create room in Tab 1, join same code in Tab 2 with a name, verify both players appear in Tab 1's lobby.

### Implementation for User Story 2

- [x] T012 [P] [US2] Implement duplicate display name handling (auto-append " (N)" suffix) in joinRoom() in backend/src/services/roomStore.ts
- [x] T013 [P] [US2] Add rate limit enforcement (10 joins/min) and "playing" room rejection (409) to joinRoom route in backend/src/api/rooms.ts
- [x] T014 [P] [US2] Add inline validation (reject empty/whitespace name and code) to JoinRoomPage in frontend/src/pages/JoinRoomPage.tsx
- [x] T015 [US2] Display server error messages (invalid code, room full, rate limited) on JoinRoomPage in frontend/src/pages/JoinRoomPage.tsx

**Checkpoint**: Both create and join fully working with validation. Both P1 stories complete.

---

## Phase 5: User Story 3 - Lobby refreshes with participant updates (Priority: P2)

**Goal**: Lobby auto-polls every ~2s to show updated participant list without manual refresh.

**Independent Test**: Open two tabs on same room, join second player, verify first tab auto-updates participant list within 3 seconds.

### Implementation for User Story 3

- [x] T016 [US3] Add auto-polling interval (setInterval, ~2s) to RoomStore in frontend/src/state/roomStore.ts that calls fetchRoom() and cancels on unmount
- [x] T017 [P] [US3] Show non-intrusive error indicator during poll failures (transient errors) without stopping the polling interval in frontend/src/pages/LobbyPage.tsx
- [x] T018 [US3] Add loading indicator during poll fetch in frontend/src/pages/LobbyPage.tsx (reuse existing isLoading from store)

**Checkpoint**: Lobby auto-refreshes. Poll failures show subtle error but continue.

---

## Phase 6: User Story 4 - Room isolation prevents cross-room interference (Priority: P3)

**Goal**: Rooms are fully isolated — operations in one room do not affect any other room's participants or state.

**Independent Test**: Create Room A and Room B in separate sessions, join players to Room A, verify Room B's participant list unaffected.

### Implementation for User Story 4

- [x] T019 [US4] Verify room isolation in backend/src/services/roomStore.ts — confirm createRoom and joinRoom only mutate the target room's Map entry (existing design is already correct; add guard asserts if needed)
- [x] T020 [US4] Verify GET /rooms/:code polling endpoint returns only the requested room's data without cross-room leakage in backend/src/api/rooms.ts
- [x] T021 [US4] Run manual cross-room isolation tests per quickstart.md scenarios and confirm no data leakage

**Checkpoint**: Room isolation verified. All user stories independently testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T022 Validate room cleanup on host disconnect (transfer host to next oldest participant) in backend/src/services/roomStore.ts
- [x] T023 [P] Run backend tests: cd backend && npm test — fix any regressions
- [x] T024 [P] Run frontend tests: cd frontend && npm test — fix any regressions
- [x] T025 Run quickstart.md manual validation (all test scenarios)
- [x] T026 Clean up console.log debugging statements from all changed files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — project already scaffolded
- **Foundational (Phase 2)**: No external dependencies — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational — startGame (T008–T011) is functionally testable only after US2 (need 2+ players)
- **User Story 2 (Phase 4)**: Depends on Foundational — can run in parallel with Phase 3 if staffed
- **User Story 3 (Phase 5)**: Depends on US1 + US2 (need a room with players to observe auto-refresh)
- **User Story 4 (Phase 6)**: Depends on US1 + US2 (need two rooms with players to test isolation)
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — backend tasks (T004–T006) are independent; start game (T008–T011) logically depends on US2 for functional testing but can be implemented in parallel
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) — fully independent of US1
- **User Story 3 (P2)**: Depends on US1 and US2 — needs functional rooms and participants to test
- **User Story 4 (P3)**: Depends on US1 and US2 — needs multiple active rooms to test isolation

### Within Each User Story

- Models before services (where applicable)
- Services before endpoints
- Core implementation before integration
- Story complete before advancing to next priority

### Parallel Opportunities

- T001 and T002 can run in parallel (backend vs frontend type updates)
- All Phase 3 [P] tasks (T005, T006, T010) can run in parallel
- All Phase 4 [P] tasks (T012, T013, T014) can run in parallel
- US1 and US2 tasks can run in parallel by different developers
- Phase 7 [P] tasks (T023, T024) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all [P] tasks for User Story 1 together:
Task: "T005 Add rate limit enforcement to createRoom route in backend/src/api/rooms.ts"
Task: "T006 Add inline name validation to CreateRoomPage in frontend/src/pages/CreateRoomPage.tsx"
Task: "T010 Add startGame() method to frontend/src/services/api.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. Complete Phase 2: Foundational
2. Complete Phase 3: User Story 1 (Create room + host designation)
3. Complete Phase 4: User Story 2 (Join room — needed to reach 2 players)
4. Complete the start game portion of US1 (T008–T011 — now testable with 2 players)
5. **STOP and VALIDATE**: Full create → join → start flow works
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → Foundation ready
2. Add US1 + US2 → MVP (host creates, player joins, host starts game)
3. Add US3 → Auto-refresh lobby (quality-of-life improvement)
4. Add US4 → Room isolation verified (correctness guarantee)
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Developer A: T001 + Phase 3 (US1)
2. Developer B: T002 + Phase 4 (US2)
3. After Phase 3+4 done: Developer A does Phase 5 (US3), Developer B does Phase 6 (US4)
4. Both collaborate on Phase 7 (Polish)
