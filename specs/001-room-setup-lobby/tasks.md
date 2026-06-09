# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not requested in spec — test tasks excluded unless explicitly needed for validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Paths below use the existing web app structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

No setup tasks needed — the project is already initialized with all
dependencies installed. Skip to Foundational phase.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 [P] Add `hostId` field and expand `RoomStatus` type (add `"in-progress" | "finished"`) in `backend/src/models/game.ts`
- [x] T002 [P] Add `hostId` field to `RoomSnapshot` interface in `backend/src/models/game.ts`
- [x] T003 [P] Update Zod schemas in `backend/src/api/schemas.ts` — make `playerName` required (min 1, max 50, trimmed) on `createRoomSchema` and `joinRoomSchema`
- [x] T004 [P] Add `startGameSchema` and `playerIdParamSchema` to `backend/src/api/schemas.ts` for start-game endpoint

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create a Room and Become Host (Priority: P1) 🎯 MVP

**Goal**: A player enters their name, creates a room, receives a unique code, and is automatically designated as host.

**Independent Test**: Open the app, enter a name, click Create Room, verify the lobby shows the room code and a "Host" badge.

### Implementation for User Story 1

- [x] T005 [US1] Update `roomStore.createRoom()` in `backend/src/services/roomStore.ts` to assign the creator's participant ID as `hostId`
- [x] T006 [P] [US1] Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` to include `hostId` in the response
- [x] T007 [US1] Update POST `/rooms` handler in `backend/src/api/rooms.ts` — add try/catch for Zod validation errors and pass through `hostId` in response
- [x] T008 [US1] Update `RoomSnapshot` type in `frontend/src/services/api.ts` to include `hostId`
- [x] T009 [US1] Update `LobbyPage.tsx` in `frontend/src/pages/LobbyPage.tsx` to show a "Host" badge next to the host participant's name

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently — a single player can create a room, see the code, and see themselves marked as host.

---

## Phase 4: User Story 2 - Join a Room by Code (Priority: P1)

**Goal**: A second player enters their name and a valid room code to join an existing room and see both participants in the lobby.

**Independent Test**: Create a room (US1), then open a second tab, enter a name and the room code, click Join Lobby, verify both players appear.

### Implementation for User Story 2

- [ ] T010 [US2] Update `roomStore.joinRoom()` in `backend/src/services/roomStore.ts` — trim whitespace from `code`, validate code exists, check room status is `"lobby"`, return 400 if game in progress
- [ ] T011 [P] [US2] Add room code format validation (4 chars, alphanumeric) to `joinRoomSchema` in `backend/src/api/schemas.ts`
- [ ] T012 [US2] Update POST `/rooms/:code/join` handler in `backend/src/api/rooms.ts` — return descriptive error messages for empty code, invalid code, room not found, and game in progress
- [ ] T013 [US2] Update `frontend/src/pages/JoinRoomPage.tsx` to display backend validation error messages inline

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently — two players can create and join rooms and see each other in the lobby.

---

## Phase 5: User Story 4 - Lobby Auto-Refreshes via Polling (Priority: P2)

**Goal**: Players in the lobby see the participant list update automatically every ~2 seconds without manual refresh.

**Independent Test**: Create a room in Tab A, open Tab B and join with the room code. Tab A's lobby should show Tab B's player appear within ~2 seconds without clicking Refresh.

### Implementation for User Story 4

- [ ] T014 [US4] Add `useEffect` with `setInterval` (2000ms) in `frontend/src/pages/LobbyPage.tsx` to call `roomStore.fetchRoom()` on mount, clear interval on unmount
- [ ] T015 [US4] Handle polling errors in `frontend/src/pages/LobbyPage.tsx` — silently retry on next interval (no error toast), display stale data temporarily

**Checkpoint**: At this point, User Stories 1, 2, AND 4 should work — players can see the lobby update automatically.

---

## Phase 6: User Story 5 - Host Starts Game with Minimum 2 Players (Priority: P2)

**Goal**: Only the host can start the game, and only when at least 2 players are present. Non-hosts see an error. Host with <2 players sees an error.

**Independent Test**: Create a room as host, click Start Game with only 1 player → see error. Join with a second player as non-host, try to start → see error. Host clicks Start Game with 2+ players → game starts.

### Implementation for User Story 5

- [ ] T016 [US5] Add `startGame(code, participantId)` function in `backend/src/services/roomStore.ts` — validate caller is host (403), validate ≥2 players (400), set room status to `"in-progress"`, return updated room snapshot
- [ ] T017 [US5] Add POST `/rooms/:code/start` route handler in `backend/src/api/rooms.ts` — parse `participantId` from body, call `startGame`, return room snapshot with status `"in-progress"`
- [ ] T018 [P] [US5] Add `startGame(code, participantId)` to `frontend/src/services/api.ts`
- [ ] T019 [P] [US5] Add `startGame` method to `RoomStore` class in `frontend/src/state/roomStore.ts`
- [ ] T020 [US5] Update `LobbyPage.tsx` in `frontend/src/pages/LobbyPage.tsx` — show Start Game button only for host, disable with tooltip for non-host, show error messages for insufficient players

**Checkpoint**: All user stories should now be independently functional — full room setup and lobby flow working.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T021 [P] Run `npm run build` in `backend/` and fix any TypeScript errors
- [ ] T022 [P] Run `npm run build` in `frontend/` and fix any TypeScript errors
- [ ] T023 Run through `specs/001-room-setup-lobby/quickstart.md` verification steps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — project already initialized
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (Phase 3) and US2 (Phase 4) can be done in parallel
  - US4 (Phase 5) depends on US1 + US2 (needs lobby with participants to poll)
  - US5 (Phase 6) depends on US1 + US2 (needs host and ≥2 participants)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational — No dependencies on other stories
- **User Story 4 (P2)**: Depends on US1 and US2 being complete
- **User Story 5 (P2)**: Depends on US1 and US2 being complete (needs host + 2 players)

### Within Each User Story

- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T001 and T002 and T003 can run in parallel (different files, Phase 2)
- US1 (Phase 3) and US2 (Phase 4) can run in parallel (different files, no cross-dependencies)
- T016 and T018/T019 can run in parallel (backend/frontend split)

---

## Parallel Example: User Story 1 + User Story 2

```bash
# Run Foundational tasks in parallel:
Task: "T001 Update game.ts models in backend/src/models/game.ts"
Task: "T002 Update RoomSnapshot interface in backend/src/models/game.ts"
Task: "T003 Update Zod schemas in backend/src/api/schemas.ts"
Task: "T004 Add startGame schema in backend/src/api/schemas.ts"

# Run US1 and US2 tasks in parallel (backend and frontend can overlap):
Task: "T005 Update createRoom in backend/src/services/roomStore.ts"
Task: "T006 Update toRoomSnapshot in backend/src/services/roomStore.ts"
Task: "T010 Update joinRoom in backend/src/services/roomStore.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (models, schemas)
2. Complete Phase 3: User Story 1 (create room, become host)
3. **STOP and VALIDATE**: Test US1 independently — create a room, see code, see host badge
4. Demo if ready (single-player flow works)

### Incremental Delivery

1. Complete Foundational → Foundation ready
2. Add User Story 1 (Create + Host) → Test → Demo (MVP!)
3. Add User Story 2 (Join Room) → Test → Demo
4. Add User Story 4 (Lobby Polling) → Test → Demo
5. Add User Story 5 (Host Start Game) → Test → Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:
1. Complete Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Create Room)
   - Developer B: User Story 2 (Join Room)
3. Both done: Developer A + B on US4 (Polling) and US5 (Start Game)
4. Polish handled by anyone

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
