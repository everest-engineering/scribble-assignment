---

description: "Task list for Room Setup & Lobby feature implementation"

---

# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`

**Prerequisites**: plan.md (required), spec.md (required for user stories),
research.md, data-model.md, contracts/api.md

**Tests**: Test tasks are included per Constitution Principle IV (Test-First).

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`, `backend/tests/`
- **Frontend**: `frontend/src/`, `frontend/tests/`
- Paths shown below assume web app structure confirmed in plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project is already initialized — no setup tasks needed.

The backend and frontend projects are already bootstrapped with all
dependencies installed. Verify both build without errors before starting.

- [ ] T001 Verify backend builds with `cd backend && npm run build`
- [ ] T002 [P] Verify frontend builds with `cd frontend && npm run build`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types and service layer that MUST be complete before ANY
user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T003 Add `hostId`, `status`, and `createdAt` fields to Room type in
      `backend/src/models/types.ts`
- [ ] T004 [P] Add `hostId` to `RoomSnapshot` type in
      `frontend/src/services/api.ts`
- [ ] T005 Create `roomService` in `backend/src/services/roomService.ts` with
      `createRoom`, `joinRoom`, `getRoom`, and `startGame` method stubs

**Checkpoint**: Foundation ready — user story implementation can now begin in
parallel.

---

## Phase 3: User Story 1 — Room Creation and Host Assignment (Priority: P1) 🎯 MVP

**Goal**: A player can enter their name, create a room, and become the host.

**Independent Test**: A single player can open the app, enter a name, click
"Create Room", and see the lobby with their name and a unique room code.

### Tests for User Story 1

> **NOTE**: Write these tests FIRST, ensure they FAIL before implementation

- [ ] T006 [P] [US1] Write backend test for room creation returns 201 with
      host assigned in `backend/tests/rooms.test.ts`
- [ ] T007 [P] [US1] Write backend test for empty name returns 400 in
      `backend/tests/rooms.test.ts`

### Implementation for User Story 1

- [ ] T008 [P] [US1] Implement `createRoom` in
      `backend/src/services/roomService.ts` (generate unique 6-char code,
      assign host, store room)
- [ ] T009 [P] [US1] Implement POST /rooms handler in
      `backend/src/api/rooms.ts` with Zod validation for playerName
- [ ] T010 [US1] Update `createRoom` in `frontend/src/state/roomStore.ts` to
      handle new response shape with hostId
- [ ] T011 [US1] Add name validation (empty/whitespace rejection) and error
      display in `frontend/src/pages/CreateRoomPage.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional — a
single player can create a room and see the lobby.

---

## Phase 4: User Story 2 — Join Room with Validation (Priority: P1)

**Goal**: A player can join an existing room by code. Invalid/empty codes are
rejected with clear error messages.

**Independent Test**: A player can enter a valid room code and name, join the
room, and see themselves in the lobby participant list alongside the host.

### Tests for User Story 2

> **NOTE**: Write these tests FIRST, ensure they FAIL before implementation

- [ ] T012 [P] [US2] Write backend test for join room succeeds in
      `backend/tests/rooms.test.ts`
- [ ] T013 [P] [US2] Write backend test for invalid code returns 404 in
      `backend/tests/rooms.test.ts`
- [ ] T014 [P] [US2] Write backend test for empty name returns 400 in
      `backend/tests/rooms.test.ts`

### Implementation for User Story 2

- [ ] T015 [P] [US2] Implement `joinRoom` in
      `backend/src/services/roomService.ts` (validate code exists, add
      participant)
- [ ] T016 [P] [US2] Implement POST /rooms/:code/join handler in
      `backend/src/api/rooms.ts` with Zod validation
- [ ] T017 [US2] Add `joinRoom` to `frontend/src/services/api.ts`
- [ ] T018 [US2] Update `joinRoom` in `frontend/src/state/roomStore.ts`
- [ ] T019 [US2] Add code/name validation and error display in
      `frontend/src/pages/JoinRoomPage.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work — a
second player can join the host's room.

---

## Phase 5: User Story 3 — Lobby Polling and Game Start (Priority: P1)

**Goal**: The lobby auto-refreshes via polling (~2s). Only the host can start
the game once 2+ players are present.

**Independent Test**: Two players in the same lobby; host sees enabled "Start
Game" button; non-host sees no button; clicking Start transitions all players
to the game screen.

### Tests for User Story 3

> **NOTE**: Write these tests FIRST, ensure they FAIL before implementation

- [ ] T020 [P] [US3] Write backend test for start game succeeds (host, ≥2
      players) in `backend/tests/rooms.test.ts`
- [ ] T021 [P] [US3] Write backend test for non-host start returns 403 in
      `backend/tests/rooms.test.ts`
- [ ] T022 [P] [US3] Write backend test for start with <2 players returns 400
      in `backend/tests/rooms.test.ts`

### Implementation for User Story 3

- [ ] T023 [P] [US3] Implement `startGame` in
      `backend/src/services/roomService.ts` (check host, check player count)
- [ ] T024 [P] [US3] Implement POST /rooms/:code/start handler in
      `backend/src/api/rooms.ts`
- [ ] T025 [P] [US3] Create ParticipantList component in
      `frontend/src/components/ParticipantList.tsx`
- [ ] T026 [P] [US3] Add polling with setInterval (~2s) to
      `frontend/src/pages/LobbyPage.tsx` with cleanup on unmount
- [ ] T027 [US3] Implement host-only "Start Game" button (enabled at ≥2
      players, hidden for non-host) in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: All three user stories should now be independently functional
— full lobby flow end-to-end.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, edge case handling, and build verification.

- [ ] T028 [P] Handle re-join edge case (player already in room → return same
      room state) in `backend/src/services/roomService.ts`
- [ ] T029 [P] Add polling connection status indicator (retry on failure) in
      `frontend/src/pages/LobbyPage.tsx`
- [ ] T030 Run backend build and tests: `cd backend && npm run build && npm
      test`
- [ ] T031 [P] Run frontend build: `cd frontend && npm run build`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user
  stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 backend (T008-T009) can run in parallel with US1 test stubs (T006-T007)
  - US2 depends on US1 backend (room must exist to join)
  - US3 depends on US1 + US2 backend (room must have participants to start)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P1)**: Depends on US1 backend (T009 completes before T015)
- **User Story 3 (P1)**: Depends on US1 + US2 backend (T016 + T023)

### Within Each User Story

- Tests (TDD) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- Setup tasks T001-T002 can run in parallel
- Foundational tasks T003-T005 can run in parallel
- Within each story, test tasks marked [P] can run in parallel
- Backend and frontend tasks marked [P] within a story can run in parallel
- Within a user story, models/components marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Write backend test for room creation returns 201 with host assigned"
Task: "Write backend test for empty name returns 400"

# Launch all implementation for User Story 1 together:
Task: "Implement createRoom in roomService.ts"
Task: "Implement POST /rooms handler in rooms.ts"
Task: "Update createRoom in roomStore.ts"

# After tests pass and implementation is done:
Task: "Add name validation and error display in CreateRoomPage.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: A player can create a room and see the lobby

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Commit (MVP: single player can
   create room)
3. Add User Story 2 → Test independently → Commit (multiplayer join works)
4. Add User Story 3 → Test independently → Commit (full lobby flow complete)
5. Polish → Final build validation

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (room creation)
   - Developer B: User Story 2 (join room) — can start after US1 backend
3. Both complete, then:
   - Developer A: User Story 3 (lobby polling, start game)
4. Polish phase together

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break
  independence
- Acceptance criteria from spec.md serve as manual test cases for validation
