---

description: "Task list for Room Setup & Lobby feature"

---

# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The spec defines manual validation with two browser tabs. No automated test tasks are generated unless explicitly requested.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`, `backend/src/api/rooms.ts`, `backend/src/api/schemas.ts`
- **Frontend**: `frontend/src/pages/LobbyPage.tsx`, `frontend/src/pages/CreateRoomPage.tsx`, `frontend/src/pages/JoinRoomPage.tsx`, `frontend/src/pages/GamePage.tsx`, `frontend/src/services/api.ts`, `frontend/src/state/roomStore.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

Project is already scaffolded and initialized. No setup tasks required.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T001 Add `hostId: string` to `Room` interface in `backend/src/models/game.ts
- [X] T002 Expose `hostId` in `RoomSnapshot` in `backend/src/models/game.ts
- [X] T003 [P] Add Zod schemas for required (non-empty) player name validation in `backend/src/api/schemas.ts

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create a Room and View the Lobby (Priority: P1) 🎯 MVP

**Goal**: A player can create a room, be designated as host, see the room code, and view the lobby with auto-polling

**Independent Test**: Open the app, enter a display name, click "Create Room." Confirm lobby appears with room code badge, host badge next to your name, and network tab shows polling requests every ~2s.

### Implementation for User Story 1

- [X] T004 [P] [US1] Store `hostId` as the creator's `participantId` on room creation in `backend/src/services/roomStore.ts
- [X] T005 [P] [US1] Add host role to room session response in `backend/src/api/rooms.ts`
- [X] T006 [US1] Replace manual "Refresh Room" button with automatic `setInterval` polling at ~2s in `frontend/src/pages/LobbyPage.tsx`
- [X] T007 [P] [US1] Show host indicator badge next to host participant in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Join a Room by Code (Priority: P1)

**Goal**: A second player can join a room with a valid code; invalid/empty codes show clear errors; both players see updated participant lists

**Independent Test**: Open a second browser tab, enter the room code from US1 and a display name. Confirm both tabs show two participants within 3 seconds.

### Implementation for User Story 2

- [X] T008 [P] [US2] Add duplicate display name disambiguation (suffix " (2)", " (3)" etc.) in `backend/src/services/roomStore.ts`
- [X] T009 [P] [US2] Add empty/whitespace player name validation (trim, reject) in join flow in `backend/src/api/schemas.ts` and `backend/src/api/router.ts`
- [X] T010 [P] [US2] Add empty/whitespace room code client-side validation in `frontend/src/pages/JoinRoomPage.tsx`
- [X] T011 [US2] Display backend join error messages in `frontend/src/pages/JoinRoomPage.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Host Starts the Game (Priority: P2)

**Goal**: Host can start the game once ≥2 players are present; non-host players cannot start

**Independent Test**: With two players in the lobby, confirm host sees "Start Game" button and can start. Confirm non-host player does not see the start button. Confirm button is disabled/absent with <2 players.

### Implementation for User Story 3

- [X] T012 [P] [US3] Add `startGame(code, participantId)` method with host validation and ≥2 player check in `backend/src/services/roomStore.ts`
- [X] T013 [P] [US3] Add `POST /rooms/:code/start` route handler with 403/400/404 error responses in `backend/src/api/rooms.ts`
- [X] T014 [P] [US3] Add `startGame(code, participantId)` API client method in `frontend/src/services/api.ts`
- [X] T015 [US3] Show "Start Game" button for host only; disable with "Need 2+ players" message when <2 players in `frontend/src/pages/LobbyPage.tsx`
- [X] T016 [US3] Handle post-start transition from lobby to game screen in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T017 Handle network failure during lobby polling (graceful retry with error status indicator) in `frontend/src/pages/LobbyPage.tsx`
- [X] T018 [P] Run build validation: `npm run build` in both `backend/` and `frontend/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — already complete
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 (Phase 3) → US2 (Phase 4) → US3 (Phase 5) [sequential story completion]
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational — US1 must create the room first, but join logic is independent
- **User Story 3 (P2)**: Depends on US1 and US2 — both room and 2 players needed

### Task Dependencies Within Each Story

- Models before services
- Services before endpoints/UI
- Core implementation before integration

### Parallel Opportunities

- All Foundational tasks marked [P] can run in parallel
- All tasks within a user story marked [P] can run in parallel
- T014 (API client) can run in parallel with T012 and T013
- T018 build validation can run in parallel across backend/ and frontend/

---

## Parallel Example: User Story 1

```bash
# Launch independent tasks together:
Task: "Store hostId on room creation in backend/src/services/roomStore.ts"
Task: "Add host role to session response in backend/src/api/rooms.ts"
Task: "Show host badge in frontend/src/pages/LobbyPage.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational
2. Complete Phase 3: User Story 1
3. **STOP and VALIDATE**: Test US1 independently (one browser tab)
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → Foundation ready
2. Add User Story 1 → Test independently → Demo (MVP!)
3. Add User Story 2 → Test independently → Demo
4. Add User Story 3 → Test independently → Demo

### Parallel Team Strategy

With multiple developers:
1. Team completes Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2 (waits for US1 to create a room)
   - Developer C: User Story 3 (waits for US1+US2)
3. Stories complete and integrate incrementally

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The starter already has `backend/src/services/roomStore.test.ts` and `backend/src/api/schemas.test.ts` — update these if adding tests
