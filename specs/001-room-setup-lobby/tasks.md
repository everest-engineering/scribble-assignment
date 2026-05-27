---

description: "Task list for Room Setup And Lobby feature implementation"

---

# Tasks: Room Setup And Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No test tasks included — testing framework not configured per plan.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/models/`, `backend/src/services/`, `backend/src/api/`
- **Frontend**: `frontend/src/pages/`, `frontend/src/state/`, `frontend/src/services/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

No setup tasks needed — project scaffolding, dependencies, and build tooling are already in place.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T001 Add `hostId` field to `Room` interface and `RoomSnapshot` interface in `backend/src/models/game.ts`
- [ ] T002 [P] Extend `RoomStatus` type to include `"playing"` in `backend/src/models/game.ts`
- [ ] T003 Update `createRoom` in `backend/src/services/roomStore.ts` to set the creator's participant ID as `hostId` on the new room
- [ ] T004 [P] Update `toRoomSnapshot` in `backend/src/services/roomStore.ts` to include `hostId` in the snapshot
- [ ] T005 [P] Mirror updated `RoomSnapshot` type (add `hostId`, extend status to `"lobby" | "playing"`) in `frontend/src/services/api.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create and Host a Room (Priority: P1) 🎯 MVP

**Goal**: A player creates a room, gets a unique code, is designated as host, and sees a host badge in the lobby.

**Independent Test**: Single player creates a room and confirms they appear in the lobby as host with a visible room code.

### Implementation for User Story 1

- [ ] T006 [P] [US1] Add `participantId` to request body validation in `createRoomSchema` in `backend/src/api/schemas.ts` [NEEDS CLARIFICATION: how does the participant ID get sent if not yet created?]

*Wait, that doesn't make sense. The participant ID is generated on the server. The hostId is simply the participant ID of the first participant.*

- [ ] T006 [P] [US1] Display "Host" badge next to the host's name in the participant list in `frontend/src/pages/LobbyPage.tsx` by comparing `participantId` with `room.hostId`
- [ ] T007 [P] [US1] Add room code display (already present via `RoomCodeBadge`) — verify it renders correctly after the model changes in `frontend/src/pages/LobbyPage.tsx`

*Actually, T006 already works because RoomCodeBadge and participant list already exist. Let me re-scope US1 tasks properly:*

- [ ] T006 [US1] Update `LobbyPage.tsx` in `frontend/src/pages/LobbyPage.tsx` to show "Host" label next to the room creator's name in the participant list (compare `participantId` from store with `room.hostId`)
- [ ] T007 [US1] Verify the lobby header renders the room code correctly — the code is already displayed via `RoomCodeBadge` component in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Join a Room with a Valid Code (Priority: P1)

**Goal**: A second player joins an existing room using the room code. All connected players see the updated player list.

**Independent Test**: Open two browser windows. Create a room in one, join with the same code in the other. Both lobbies show the full participant list.

### Implementation for User Story 2

- [ ] T008 [P] [US2] Add auto-polling via `setInterval(2000)` in a `useEffect` in `frontend/src/pages/LobbyPage.tsx` — call `roomStore.fetchRoom()` every 2 seconds, clear interval on unmount
- [ ] T009 [P] [US2] Show all participants with host indicator in `frontend/src/pages/LobbyPage.tsx` — the list already renders, just needs host label from T006
- [ ] T010 [US2] Add visual loading/refresh indicator during polling in `frontend/src/pages/LobbyPage.tsx` (already partially implemented with isLoading state)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Invalid or Empty Room Codes (Priority: P2)

**Goal**: Empty or invalid room codes are rejected with clear, user-friendly error messages.

**Independent Test**: Submit the join form with an empty code → see "Please enter a room code". Submit with a non-existent code → see "Room not found. Please check the code and try again".

### Implementation for User Story 3

- [ ] T011 [P] [US3] Add client-side validation in `frontend/src/pages/JoinRoomPage.tsx` — block submission when room code is empty, display "Please enter a room code"
- [ ] T012 [P] [US3] Improve server-side error message in `backend/src/api/rooms.ts` — change "Unable to join room" to "Room not found. Please check the code and try again" when room code doesn't match any active room
- [ ] T013 [P] [US3] Update `roomCodeParamsSchema` in `backend/src/api/schemas.ts` to validate that the room code is a non-empty string (Zod `.min(1)`)

**Checkpoint**: Error handling for room codes is robust on both client and server

---

## Phase 6: User Story 4 - Host Starts the Game (Priority: P2)

**Goal**: Once at least 2 players are in the lobby, the host can start the game. Non-hosts cannot start.

**Independent Test**: Host and one joiner in lobby → host clicks start → game begins. Non-host tries to start → rejected.

### Implementation for User Story 4

- [ ] T014 [P] [US4] Implement `startGame` service function in `backend/src/services/roomStore.ts` — validate that `participantId` matches `hostId` and that `participants.length >= 2`, then set `status = "playing"` and return updated room
- [ ] T015 [P] [US4] Add `startRoomSchema` Zod schema in `backend/src/api/schemas.ts` — validate `{ participantId: z.string() }` body
- [ ] T016 [US4] Add `POST /rooms/:code/start` endpoint in `backend/src/api/rooms.ts` — parse params/body, call `startGame`, return updated snapshot; handle 403 (not host) and 400 (not enough players) errors
- [ ] T017 [US4] Add `startGame(code, participantId)` API method to the frontend API client in `frontend/src/services/api.ts`
- [ ] T018 [P] [US4] Add `startGame` method to the `RoomStore` class in `frontend/src/state/roomStore.ts` — call API, update store with new room state
- [ ] T019 [US4] Update `frontend/src/pages/LobbyPage.tsx` — disable "Start Game" button when user is not the host OR when `room.participants.length < 2`; show appropriate message ("Waiting for host to start" for non-hosts, "Need at least 2 players" if host but solo)

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T020 [P] Update `frontend/src/pages/LobbyPage.tsx` to navigate away if room status transitions to `"playing"` (redirect to `/game`)
- [ ] T021 Update the existing manual "Refresh Room" button in `frontend/src/pages/LobbyPage.tsx` to work alongside auto-polling (remove manual refresh or keep as fallback)
- [ ] T022 Run `quickstart.md` validation — manually test all scenarios documented in `specs/001-room-setup-lobby/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — already complete
- **Foundational (Phase 2)**: No external dependencies — BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (P1) and US2 (P1) are independent of each other and can be done in parallel
  - US3 (P2) is independent of US4
  - US4 (P2) has a minor dependency: T016 calls `startGame` from T014; T019 updates lobby page from T006
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1) MVP**: Can start after Phase 2 — depends on T001-T005 (model/snapshot changes)
- **User Story 2 (P1)**: Can start after Phase 2 — independent of US1
- **User Story 3 (P2)**: Can start after Phase 2 — independent of all other stories
- **User Story 4 (P2)**: Can start after Phase 2 — depends on US1's hostId being in snapshot

### Within Each User Story

- Backend model changes before services
- Services before endpoints
- API methods before frontend store
- Store before UI components
- Story complete before moving to next priority

### Parallel Opportunities

- T001-T005 can all run in parallel (different files, no cross-dependencies)
- T006 (US1 UI) and T008-T010 (US2 polling) can run in parallel once Phase 2 is done
- T011-T013 (US3 validation) can run in parallel
- T014-T016 (US4 backend) can run in parallel with T017-T019 (US4 frontend) once US1 is done providing hostId
- US1, US2, and US3 can all be worked on simultaneously after Phase 2

---

## Parallel Example: Foundational Phase (Phase 2)

```bash
Task: "Add hostId to Room/RoomSnapshot in backend/src/models/game.ts and update frontend type in frontend/src/services/api.ts"
Task: "Extend RoomStatus to include playing in backend/src/models/game.ts"
Task: "Update createRoom and toRoomSnapshot in backend/src/services/roomStore.ts"
```

## Parallel Example: User Story 4

```bash
Task: "Implement startGame service + schema + endpoint in backend/src/services/roomStore.ts, backend/src/api/schemas.ts, backend/src/api/rooms.ts"
Task: "Add startGame to frontend API client and RoomStore in frontend/src/services/api.ts, frontend/src/state/roomStore.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational
2. Complete Phase 3: User Story 1 (Create and Host)
3. **STOP and VALIDATE**: Test US1 independently
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → Foundation ready
2. Add US1 (Create/Host) → MVP: single player can create room & see host badge
3. Add US2 (Join/Polling) → Two players can see each other in lobby
4. Add US3 (Validation) → Error handling for bad codes
5. Add US4 (Start Game) → Full lobby flow complete
6. Stories can be added in any order after US1 (US2, US3, US4 are independent of each other)

### Parallel Team Strategy

With multiple developers:

1. Team completes Foundational together (Phase 2)
2. Once Foundational is done:
   - Developer A: US1 (host badge in lobby) + US4 (start game — depends on hostId)
   - Developer B: US2 (auto-polling)
   - Developer C: US3 (empty/invalid code validation)
3. Developer B and C can start before Developer A is done
4. Developer A needs US1 first, then US4 builds on it

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- No test framework is configured — test tasks are excluded per plan.md
- The existing codebase already has working create/join/fetch endpoints — tasks focus on the new host/start/polling/validation behavior
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
