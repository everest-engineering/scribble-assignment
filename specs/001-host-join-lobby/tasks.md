# Tasks: Host and Join Lobby Flow

**Input**: Design documents from `/specs/001-host-join-lobby/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included because the spec explicitly calls for edge-case coverage and the feature needs clear host, polling, and validation behavior.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Shared room model and typed client session primitives used by all stories

- [X] T001 [P] Add host-aware room lifecycle fields and status types in `backend/src/models/game.ts`
- [X] T002 [P] Align client room snapshot and session typing with the backend shape in `frontend/src/services/api.ts` and `frontend/src/state/roomStore.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core validation and store helpers that every user story depends on

**⚠️ CRITICAL**: No user story work should be merged until these shared rules are in place

- [X] T003 [P] Harden room-code and player-name validation boundaries in `backend/src/api/schemas.ts`
- [X] T004 [P] Normalize room cloning and snapshot helpers in `backend/src/services/roomStore.ts`

**Checkpoint**: Shared validation and snapshot handling are ready for story-specific work

---

## Phase 3: User Story 1 - Create or Join a Room (Priority: P1) 🎯 MVP

**Goal**: A player can create a room or join an existing room and become part of the same shared lobby state.

**Independent Test**: Create a room in one tab, join it from another tab, and confirm both sessions share the same room snapshot.

### Tests for User Story 1

- [X] T005 [P] [US1] Add backend coverage in `backend/src/services/roomStore.test.ts` for creator-as-host, join flow, and room isolation
- [X] T006 [P] [US1] Add client request/response coverage in `frontend/src/services/api.test.ts` for create-room and join-room session payloads

### Implementation for User Story 1

- [X] T007 [US1] Implement host assignment and room membership registration in `backend/src/services/roomStore.ts` and `backend/src/api/rooms.ts`
- [X] T008 [US1] Wire the create/join screens to persist the returned participant session and enter the lobby in `frontend/src/pages/CreateRoomPage.tsx`, `frontend/src/pages/JoinRoomPage.tsx`, and `frontend/src/state/roomStore.ts`

**Checkpoint**: User Story 1 should be fully functional and independently testable

---

## Phase 4: User Story 2 - Reject Invalid Room Access (Priority: P1)

**Goal**: Empty or invalid names and room codes are rejected with clear feedback before the player enters the lobby.

**Independent Test**: Submit blank or whitespace-only values in the create/join forms and confirm the flow stays on the form with an understandable error.

### Tests for User Story 2

- [X] T009 [P] [US2] Add schema and route coverage in `backend/src/api/schemas.test.ts` for whitespace-only names, invalid room codes, and rejected room lookups
- [X] T010 [P] [US2] Add frontend form validation coverage in `frontend/src/pages/CreateRoomPage.test.tsx` and `frontend/src/pages/JoinRoomPage.test.tsx`

### Implementation for User Story 2

- [X] T011 [P] [US2] Enforce trimmed-name and non-empty room-code rules in `backend/src/api/schemas.ts`
- [X] T012 [US2] Return clear HTTP errors from `backend/src/api/rooms.ts` and surface them in `frontend/src/pages/CreateRoomPage.tsx` and `frontend/src/pages/JoinRoomPage.tsx`

**Checkpoint**: Invalid input is blocked with clear feedback and no lobby entry

---

## Phase 5: User Story 3 - Keep Rooms Isolated and Fresh (Priority: P2)

**Goal**: Different rooms stay isolated, and the lobby refreshes automatically while the page is open.

**Independent Test**: Open two rooms in separate tabs, change membership in one, and confirm the other never shows those players while the lobby updates on its own.

### Tests for User Story 3

- [X] T013 [P] [US3] Add polling and multi-room isolation coverage in `frontend/src/state/roomStore.test.ts`

### Implementation for User Story 3

- [X] T014 [P] [US3] Implement automatic lobby polling in `frontend/src/state/roomStore.ts`
- [X] T015 [P] [US3] Keep `GET /rooms/:code` snapshot responses isolated to the requested room in `backend/src/api/rooms.ts`
- [X] T016 [US3] Update `frontend/src/pages/LobbyPage.tsx` so automatic refresh and manual refresh stay consistent

**Checkpoint**: Lobby freshness and room isolation should work independently of game start

---

## Phase 6: User Story 4 - Host Can Start the Game (Priority: P2)

**Goal**: Only the host can start the game, and only after at least two players are present.

**Independent Test**: Try to start with one player and then with two players; only the host should be able to start once the room has enough participants.

### Tests for User Story 4

- [X] T017 [P] [US4] Add room-state coverage in `backend/src/services/roomStore.test.ts` and `frontend/src/state/roomStore.test.ts` for host-only local start gating and the two-player minimum
- [X] T018 [P] [US4] Add frontend coverage in `frontend/src/pages/LobbyPage.test.tsx` and `frontend/src/pages/GamePage.test.tsx` for host-only start messaging and start-state UI

### Implementation for User Story 4

- [X] T019 [P] [US4] Implement host-only local start gating and room status transitions in `frontend/src/state/roomStore.ts`
- [X] T020 [US4] Update `frontend/src/pages/LobbyPage.tsx` and `frontend/src/pages/GamePage.tsx` to show the host start affordance and game-status messaging

**Checkpoint**: The lobby should only advance when the host starts a room with at least two players

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and contract cleanup after the implementation slices are complete

- [X] T021 [P] Update `specs/001-host-join-lobby/quickstart.md` with the final manual validation steps after implementation
- [X] T022 [P] Reconcile `specs/001-host-join-lobby/contracts/rooms.md` with the final request/response payloads

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion and blocks all user stories
- **User Stories (Phase 3+)**: Depend on Foundational completion
  - User stories can then proceed in priority order or in parallel where files do not overlap
- **Polish (Final Phase)**: Depends on the implementation slices being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational; no dependency on other stories
- **User Story 2 (P1)**: Can start after Foundational; should stay independent of US1
- **User Story 3 (P2)**: Can start after Foundational; may use the lobby work from US1 but should remain testable alone
- **User Story 4 (P2)**: Can start after Foundational; depends on the shared room state established by earlier stories

### Within Each User Story

- Tests are written before implementation tasks in each story phase
- Backend rules and state updates come before frontend UI refinements
- Core behavior is completed before polish or cross-cutting updates

### Parallel Opportunities

- Setup tasks T001 and T002 can run in parallel
- Foundational tasks T003 and T004 can run in parallel
- In US1, T005 and T006 can run in parallel
- In US2, T009 and T010 can run in parallel
- In US3, T014 and T015 can run in parallel
- In US4, T017 and T018 can run in parallel
- Polish tasks T021 and T022 can run in parallel

---

## Parallel Example: User Story 1

```text
Task: "Add backend coverage in backend/src/services/roomStore.test.ts for creator-as-host, join flow, and room isolation"
Task: "Add client request/response coverage in frontend/src/services/api.test.ts for create-room and join-room session payloads"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate the create/join flow with two tabs
5. Stop and review before moving to validation and polling refinements

### Incremental Delivery

1. Add room creation and join behavior
2. Harden input validation and error feedback
3. Add automatic lobby polling and room isolation
4. Add host-only start gating and minimum-player checks
5. Finish with quickstart and contract cleanup

### Parallel Team Strategy

With multiple developers:

1. One developer can handle backend room store changes
2. Another can handle frontend store and page wiring
3. Another can add tests and validation coverage
4. Story slices can be merged independently once each checkpoint passes

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing each story slice
- Commit after each task or logical group
- Avoid vague tasks, same-file conflicts, and cross-story dependencies that break independence
