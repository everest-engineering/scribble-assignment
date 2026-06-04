# Tasks: Room Setup & Lobby

**Input**: Design documents from `/specs/001-room-setup-lobby/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Update backend models and types to include `hostId` in `backend/src/models/game.ts`
- [ ] T002 [P] Update frontend models and types to include `hostId` in `frontend/src/services/api.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [ ] T003 Update backend room service functions `createRoom`, `joinRoom`, `toRoomSnapshot` to support host identity tracking and duplicate name validation in `backend/src/services/roomStore.ts`
- [ ] T004 Setup schema validations for checking room codes and joins in `backend/src/api/schemas.ts`

---

## Phase 3: User Story 1 - Create Room & Become Host (Priority: P1) 🎯 MVP

**Goal**: Allow a user to create a room, become the host, and see a unique room code.

**Independent Test**: Create a room from the landing page. Verify transition to `/lobby`, check that a unique code is displayed, and check that the creator has the host badge.

### Implementation for User Story 1

- [ ] T005 [P] [US1] Add unit test verifying host assignment during room creation in `backend/src/services/roomStore.test.ts`
- [ ] T006 [US1] Update room creation route handler to return host details and snapshots in `backend/src/api/rooms.ts`
- [ ] T007 [US1] Update room creation page components to handle submission and store user details in `frontend/src/pages/CreateRoomPage.tsx`

---

## Phase 4: User Story 2 - Join Room & Lobby Polling (Priority: P2)

**Goal**: Allow other players to join the lobby via a room code, handle validations/errors, and sync list using 2s polling.

**Independent Test**: Have player A create a room, player B join using the code. Verify that B joins, and within 2s, both players see each other without manual refresh. Verify invalid codes show errors on the join page.

### Implementation for User Story 2

- [ ] T008 [P] [US2] Add unit test checking duplicate name validation and invalid code rejection in `backend/src/api/schemas.test.ts`
- [ ] T009 [US2] Update room join route handler to handle error scenarios and return correct participant details in `backend/src/api/rooms.ts`
- [ ] T010 [US2] Implement lobby page automatic polling at a 2-second interval in `frontend/src/pages/LobbyPage.tsx`
- [ ] T011 [US2] Update join room form to submit codes and render errors in `frontend/src/pages/JoinRoomPage.tsx`

---

## Phase 5: User Story 3 - Host Controls & Game Start Constraint (Priority: P3)

**Goal**: Enable start button for host only when >= 2 players are present; hide/disable for non-hosts and poll for transition to active game screen.

**Independent Test**: Host starts game when 2 players join. Verify both host and guest are automatically redirected to the game page.

### Implementation for User Story 3

- [ ] T012 [P] [US3] Add unit test verifying start game restrictions (host validation and min players check) in `backend/src/services/roomStore.test.ts`
- [ ] T013 [US3] Implement start game POST endpoint with host validation and min player checks in `backend/src/api/rooms.ts`
- [ ] T014 [US3] Render Start Game button only for host, enabled only when participants >= 2, and handle redirection upon status changes in `frontend/src/pages/LobbyPage.tsx`

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T015 Run validation scenarios defined in `specs/001-room-setup-lobby/quickstart.md`
- [ ] T016 Run vitest unit/integration suites across both backend and frontend to verify zero regressions
- [ ] T017 Validate backend (`npm run build`) and frontend (`npm run build`) builds run successfully

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion.
- **User Stories (Phases 3 to 5)**: Depend on Foundational phase completion. Must run in priority order (P1 -> P2 -> P3) for logical dependency mapping.
- **Polish (Phase 6)**: Depends on all user story implementations.

### Parallel Opportunities

- T001 and T002 (defining models/types) can run in parallel.
- Once Foundation is complete, test writing tasks (e.g., T005, T008, T012) can run in parallel with planning.
- Different page components (e.g., CreateRoomPage vs. JoinRoomPage) can be developed in parallel once their respective foundational backend routes are ready.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001, T002)
2. Complete Phase 2: Foundational (T003, T004)
3. Complete Phase 3: User Story 1 (T005, T006, T007)
4. **STOP and VALIDATE**: Verify a single host player can create and be in a lobby.

---

## Notes

- Check items off as completed: `[x]`.
- Commit changes after completing each user story phase.
