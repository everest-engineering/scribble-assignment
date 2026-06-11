---
description: "Task list for Room Setup & Lobby feature"
---

# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/001-room-lobby-setup/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks are included per constitution requirement (Test-First, NON-NEGOTIABLE).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Read and document existing Room data model in `backend/src/models/game.ts`
- [x] T002 Read and document existing frontend room store pattern in `frontend/src/state/roomStore.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data model changes that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Add `hostId: string` and extend `RoomStatus` with `"playing"` in `backend/src/models/game.ts`
- [x] T004 Add `hostId` field to `RoomSnapshot` and propagate through `toRoomSnapshot()` in `backend/src/services/roomStore.ts`
- [x] T005 [P] Add `hostId: string` to frontend `RoomSnapshot` type in `frontend/src/services/api.ts`
- [x] T006 [P] Add `startGame()` method stub to frontend `api.ts` in `frontend/src/services/api.ts`
- [x] T007 Update backend `roomStore.test.ts` with tests for hostId in createRoom and joinRoom responses

**Checkpoint**: Foundation ready — all stories now have the hostId and RoomStatus infrastructure

---

## Phase 3: User Story 1 - Create Room as Host (Priority: P1) 🎯 MVP

**Goal**: A player creates a room and is automatically designated the host. The room
code is displayed and the player sees themselves as host in the lobby.

**Independent Test**: Open the app, enter a name, click "Create Room". Verify the
room code is displayed and the player's name is marked as host.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T008 [P] [US1] Unit test: createRoom returns hostId matching the creator's participantId in `backend/src/services/roomStore.test.ts`
- [x] T009 [P] [US1] Unit test: toRoomSnapshot includes hostId in `backend/src/services/roomStore.test.ts`

### Implementation for User Story 1

- [x] T010 [US1] Wire `hostId` into `createRoom()` in `backend/src/services/roomStore.ts`
- [x] T011 [US1] Display room code and host marker ("You are the host") on `LobbyPage.tsx`
- [x] T012 [US1] Pass `hostId` through createRoom API response to `frontend/src/services/api.ts` and `frontend/src/state/roomStore.ts`

**Checkpoint**: User Story 1 is functional — a player can create a room and see
themselves as host.

---

## Phase 4: User Story 2 - Join Room with Code Validation (Priority: P1)

**Goal**: A player enters a room code to join an existing room. Invalid/empty codes
are rejected with clear feedback.

**Independent Test**: Enter an empty code — see error. Enter a non-existent code —
see "Room not found" error. Enter a valid code — join the room successfully.

### Tests for User Story 2 ⚠️

- [x] T013 [P] [US2] Zod schema test: joinRoomSchema rejects empty string in `backend/src/api/schemas.test.ts`
- [x] T014 [P] [US2] Unit test: joinRoom returns null for non-existent or "playing" room in `backend/src/services/roomStore.test.ts`

### Implementation for User Story 2

- [x] T015 [P] [US2] Add client-side validation (empty/whitespace rejection) in `frontend/src/pages/JoinRoomPage.tsx`
- [x] T016 [P] [US2] Update `joinRoomSchema` to reject empty/whitespace-only playerName in `backend/src/api/schemas.ts`
- [x] T017 [US2] Reject join attempts for non-existent codes and rooms in "playing" status in `backend/src/services/roomStore.ts`
- [x] T018 [US2] Display server-side error messages from failed join on `frontend/src/pages/JoinRoomPage.tsx`

**Checkpoint**: User Stories 1 AND 2 work independently — rooms can be created and
joined with proper validation.

---

## Phase 5: User Story 3 - Lobby Auto-Polling (Priority: P2)

**Goal**: The lobby automatically refreshes the participant list at ~2s intervals
so players see updates without manual refresh. Polling failures silently retry.

**Independent Test**: Open two browser tabs in the same room. Tab B joins — Tab A
shows Tab B's participant within ~3 seconds without any manual refresh.

### Tests for User Story 3 ⚠️

- [x] T019 [P] [US3] Unit test: fetchRoom returns updated participant list after join in `backend/src/services/roomStore.test.ts`

### Implementation for User Story 3

- [x] T020 [P] [US3] Add `startPolling()` and `stopPolling()` methods to `frontend/src/state/roomStore.ts`
- [x] T021 [P] [US3] Add silent retry on poll failure (keep last known state) in `frontend/src/state/roomStore.ts`
- [x] T022 [US3] Wire auto-polling (`setInterval` ~2000ms) into `LobbyPage.tsx` with cleanup on unmount
- [ ] T023 [US3] Remove manual "Refresh Room" button from `LobbyPage.tsx` (polling replaces it) — decided to keep as fallback per Q1 clarification

**Checkpoint**: User Stories 1–3 work — room creation, join with validation, and
auto-updating lobby.

---

## Phase 6: User Story 4 - Host Starts Game (Priority: P2)

**Goal**: Only the host can start the game once ≥2 players are present. Non-host
players see a waiting state.

**Independent Test**: Host sees "Start Game" button with 2+ players. Non-host sees
"Waiting for host..." message. Host clicks start — both navigate to game screen.

### Tests for User Story 4 ⚠️

- [x] T024 [P] [US4] Unit test: startGame rejects non-host caller in `backend/src/services/roomStore.test.ts`
- [x] T025 [P] [US4] Unit test: startGame rejects <2 players in `backend/src/services/roomStore.test.ts`
- [x] T026 [P] [US4] Unit test: startGame transitions status to "playing" in `backend/src/services/roomStore.test.ts`
- [x] T027 [P] [US4] Zod schema test: startGame endpoint validates participantId in `backend/src/api/schemas.test.ts`

### Implementation for User Story 4

- [x] T028 [P] [US4] Add `startGame()` Zod schema to `backend/src/api/schemas.ts`
- [x] T029 [P] [US4] Add `POST /:code/start` route handler in `backend/src/api/rooms.ts`
- [x] T030 [US4] Implement `startGame()` service in `backend/src/services/roomStore.ts` (host check, 2-player min, status transition)
- [x] T031 [US4] Wire `startGame()` into frontend `api.ts` in `frontend/src/services/api.ts`
- [x] T032 [US4] Add `startGame()` action to `frontend/src/state/roomStore.ts`
- [x] T033 [US4] Show "Start Game" button (host only, ≥2 players) or "Waiting for host..." (non-host) on `LobbyPage.tsx`
- [x] T034 [US4] Navigate all participants to `/game` when room status transitions to "playing" on `LobbyPage.tsx`

**Checkpoint**: All user stories complete — full room setup and lobby flow functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T035 [P] Add edge case: empty display name defaults to "Player" in `backend/src/services/roomStore.ts` — already implemented in existing code (`displayName` function)
- [ ] T036 Run quickstart.md validation scenarios in two browser tabs — manual test
- [ ] T037 Final review: verify all acceptance scenarios from spec.md pass — manual test

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational completion
  - US1 and US2 can proceed in parallel (different endpoints, no file conflicts)
  - US3 depends on US1+US2 working for full testing
  - US4 depends on US1 (host concept) and US2 (2+ players)
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no story dependencies
- **US2 (P1)**: Can start after Phase 2 — no story dependencies
- **US3 (P2)**: Can start after Phase 2 — benefits from US1+US2 for validation
- **US4 (P2)**: Depends on US1 (hostId in room) and US2 (2+ participants)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Models before services
- Services before endpoints/UI
- Story complete before moving to next priority

### Parallel Opportunities

- T004 and T005 can run in parallel (backend vs frontend model changes)
- T006 and T007 can run in parallel
- US1 and US2 can run in parallel (different endpoints, different files)
- All [P]-marked tests for a story can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "T008 [P] [US1] Unit test: createRoom returns hostId..."
Task: "T009 [P] [US1] Unit test: toRoomSnapshot includes hostId..."

# Launch all implementations for User Story 1 together:
Task: "T010 [US1] Wire hostId into createRoom()..."
Task: "T011 [US1] Display room code and host marker..."
```

## Parallel Example: User Story 4

```bash
# Launch all tests for User Story 4 together:
Task: "T024 [P] [US4] Unit test: startGame rejects non-host..."
Task: "T025 [P] [US4] Unit test: startGame rejects <2 players..."
Task: "T026 [P] [US4] Unit test: startGame transitions status..."
Task: "T027 [P] [US4] Zod schema test: startGame validates..."

# Launch backend schema + route together:
Task: "T028 [P] [US4] Add startGame() Zod schema..."
Task: "T029 [P] [US4] Add POST /:code/start route handler..."
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Create Room as Host)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Continue with US2 → US3 → US4

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 (Create Room) → Test independently → Deploy/Demo (MVP!)
3. Add US2 (Join Room) → Test independently → Deploy/Demo
4. Add US3 (Auto-Polling) → Test independently → Deploy/Demo
5. Add US4 (Host Starts Game) → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
