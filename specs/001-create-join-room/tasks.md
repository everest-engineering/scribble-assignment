# Tasks: Room Creation and Join

**Input**: Design documents from `/specs/001-create-join-room/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing starter is ready for feature extension.

- [ ] T001 Verify backend and frontend dev servers start and existing tests pass

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend shared types, schemas, services, and state that all user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 [P] Extend `backend/src/models/game.ts` with `"playing"` RoomStatus, `hostParticipantId` on Room, and `hostId` on RoomSnapshot
- [ ] T003 [P] Update Zod schemas in `backend/src/api/schemas.ts` to require non-empty trimmed `playerName` and add `startGameSchema`
- [ ] T004 Extend `backend/src/services/roomStore.ts` with host assignment on `createRoom`, empty-name rejection on both `createRoom` and `joinRoom`, `hostId` in `toRoomSnapshot`, and host-transfer-on-leave (FIFO)
- [ ] T005 Add stub `POST /rooms/:code/start` route in `backend/src/api/rooms.ts` returning 501 Not Implemented
- [ ] T006 [P] Add `startGame` API function to `frontend/src/services/api.ts`
- [ ] T007 Extend `frontend/src/state/roomStore.ts` with `startGame` method and polling support

**Checkpoint**: Foundation ready — types, schemas, services, and frontend API support all four user stories.

---

## Phase 3: User Story 1 - Create a Room and Become Host (Priority: P1) 🎯 MVP

**Goal**: A player creates a room, receives a unique code, and is automatically designated as the host in the lobby.

**Independent Test**: Create a room from one browser tab; verify the lobby shows the room code, the player name, and a host badge.

### Implementation for User Story 1

- [ ] T009 Verify `backend/src/api/rooms.ts` POST `/rooms` returns 400 for empty/whitespace names via the updated Zod schema (T003)
- [ ] T010 [P] Add name trimming and validation feedback to `frontend/src/pages/CreateRoomPage.tsx`
- [ ] T011 [P] Update `frontend/src/pages/LobbyPage.tsx` to show host badge next to the host participant

**Checkpoint**: User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Join a Room via Unique Code (Priority: P2)

**Goal**: A player joins an existing room by code and appears in the lobby alongside other players.

**Independent Test**: Create a room in Tab 1; join it from Tab 2 using the code; both tabs show both players in the lobby.

### Implementation for User Story 2

- [ ] T012 Implement playing-status rejection in `backend/src/services/roomStore.ts` `joinRoom`
- [ ] T013 Update `backend/src/api/rooms.ts` POST `/:code/join` to return 409 for in-progress games
- [ ] T014 [P] Add name trimming and validation feedback to `frontend/src/pages/JoinRoomPage.tsx`
- [ ] T015 Update `frontend/src/pages/LobbyPage.tsx` to show all joined participants with join timestamps

**Checkpoint**: User Stories 1 and 2 should both work independently.

---

## Phase 5: User Story 3 - Host Starts the Game (Priority: P2)

**Goal**: Only the host can start the game once at least two players are present; all players transition to the game screen.

**Independent Test**: With two players in a lobby, verify only the host sees the start control and can trigger the transition to the game page.

### Implementation for User Story 3

- [ ] T016 Implement `startGame` in `backend/src/services/roomStore.ts` with host verification and min-players validation
- [ ] T017 Implement POST `/rooms/:code/start` in `backend/src/api/rooms.ts` with 403 and 409 error responses
- [ ] T018 Add host-only start game button with min-players guard to `frontend/src/pages/LobbyPage.tsx`
- [ ] T019 Update `frontend/src/pages/GamePage.tsx` to handle game state transition on start

**Checkpoint**: User Stories 1, 2, and 3 should all work independently.

---

## Phase 6: User Story 4 - Lobby Auto-Refresh (Priority: P3)

**Goal**: The lobby player list automatically updates approximately every 2 seconds via HTTP polling.

**Independent Test**: Join a room from Tab 2 while Tab 1 is in the lobby; verify Tab 1 shows the new player within ~2 seconds without manual refresh.

### Implementation for User Story 4

- [ ] T020 Add ~2s automatic polling to `frontend/src/pages/LobbyPage.tsx`
- [ ] T021 Add silent retry on poll failure to `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, tests, and validation.

- [ ] T022 [P] Add unit tests for roomStore host and start logic in `backend/src/services/roomStore.test.ts`
- [ ] T023 [P] Add unit tests for schema validation in `backend/src/api/schemas.test.ts`
- [ ] T024 Add room cleanup logic (0-player immediate deletion, 10-minute idle timeout) to `backend/src/services/roomStore.ts`
- [ ] T025 Add frontend API tests for startGame in `frontend/src/services/api.test.ts`
- [ ] T026 Run quickstart validation scenarios
- [ ] T027 Run `npm run build` in backend and frontend
- [ ] T028 Add `leaveRoom` / `removeParticipant` logic to `backend/src/services/roomStore.ts` with automatic host transfer to next-joined participant (FIFO) and immediate room deletion when empty

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
  - User stories can then proceed in parallel (if staffed).
  - Or sequentially in priority order (P1 → P2 → P3).
- **Polish (Final Phase)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — no dependencies on other stories.
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) — integrates with US1 but is independently testable.
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) — depends on US1 and US2 for multi-player testing, but endpoints are independently implementable.
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) — depends on US2 for observable join events, but polling is independently implementable.

### Within Each User Story

- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel.
- All Foundational tasks marked [P] can run in parallel (within Phase 2).
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows).
- All tests for a user story marked [P] can run in parallel.
- Models within a story marked [P] can run in parallel.
- Different user stories can be worked on in parallel by different team members.

---

## Parallel Example: User Story 1

```bash
# Launch all foundational tasks together:
Task: "Extend backend/src/models/game.ts with RoomStatus, hostParticipantId, hostId"
Task: "Update backend/src/api/schemas.ts to require non-empty trimmed playerName"

# Launch all US1 implementation tasks together:
Task: "Implement host assignment in backend/src/services/roomStore.ts createRoom"
Task: "Add name trimming to frontend/src/pages/CreateRoomPage.tsx"
Task: "Update frontend/src/pages/LobbyPage.tsx to show host badge"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently (create room, see host badge)
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
   - Developer D: User Story 4
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Bug fix: Corrected `API_BASE_URL` typo (`/bug` suffix) in `frontend/src/services/api.ts` that caused 404 "Route not found" on all API calls including create-room.
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
