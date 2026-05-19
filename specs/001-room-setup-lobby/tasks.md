---

description: "Task list for Room Setup and Lobby feature"
---

# Tasks: Room Setup and Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/ (all available)

**Tests**: Not requested in the feature specification. Manual two-tab validation per constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Code Audit — Pre-Existing Scaffold State

The following already exist in the starter scaffold and do NOT need tasks:

| Feature | File | Status |
|---------|------|--------|
| Room code generation (4-char, unique, collision-safe) | `backend/src/services/roomStore.ts` | ✅ Exists (`generateUniqueCode`) |
| Room isolation (Map-based, no cross-room visibility) | `backend/src/services/roomStore.ts` | ✅ Inherent |
| Case-insensitive code matching on join/get routes | `backend/src/api/rooms.ts` | ✅ Exists (`code.toUpperCase()`) |
| Basic create/join/fetch room endpoints | `backend/src/api/rooms.ts` | ✅ Scaffold |
| Frontend store with createRoom/joinRoom/fetchRoom | `frontend/src/state/roomStore.ts` | ✅ Scaffold |
| Lobby page with participant list display | `frontend/src/pages/LobbyPage.tsx` | ✅ Skeleton |
| Create/Join room page forms | `frontend/src/pages/CreateRoomPage.tsx`, `JoinRoomPage.tsx` | ✅ Skeleton |

All tasks below are fully PENDING — none are pre-implemented.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`
- **Frontend**: `frontend/src/`
- Paths reflect the actual project structure (Option 2: Web application)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project already scaffolded — no setup tasks required.

The backend and frontend projects are fully initialized with dependencies
installed. This phase is intentionally empty.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core model and schema updates that all user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T001 Update Room model in `backend/src/models/game.ts` — add `hostId:
      string` field to `Room`, `RoomSnapshot`, and expand `RoomStatus` to
      `"lobby" | "active"`
- [x] T002 [P] Add start-game Zod schema in `backend/src/api/schemas.ts` —
      `startGameSchema` with required `participantId` field (string)
- [x] T003 [P] Update RoomSnapshot export type in
      `frontend/src/services/api.ts` — add `hostId: string` and expand
      `status` to `"lobby" | "active"`

**Checkpoint**: Foundation ready — user story implementation can now begin in
sequence.

---

## Phase 3: User Story 1 - Create Room (Priority: P1) 🎯 MVP

**Goal**: A player can create a room, receive a unique code, and be
automatically designated as the host. Name validation prevents invalid inputs.
Capacity enforcement prevents exceeding 100 rooms.

**Independent Test**: A player enters a valid name, creates a room, sees their
room code and a host indicator in the lobby. Creating a 101st room is rejected.

### Implementation for User Story 1

- [x] T004 [US1] Add host tracking and capacity enforcement to `createRoom` in
      `backend/src/services/roomStore.ts` — set `hostId` to first
      participant's ID; reject if 100 rooms already exist
- [x] T005 [P] [US1] Update `toRoomSnapshot` in
      `backend/src/services/roomStore.ts` — include `hostId` in the returned
      snapshot
- [x] T006 [P] [US1] Add player name Zod validation in
      `backend/src/api/schemas.ts` — 1-16 alphanumeric chars, trimmed
- [x] T007 [US1] Add max-rooms error handling in
      `backend/src/api/rooms.ts` — return 503 with message when room
      creation hits the 100-room limit
- [ ] T008 [US1] Update `CreateRoomPage.tsx` in
      `frontend/src/pages/CreateRoomPage.tsx` — add client-side name
      validation (1-16 alphanumeric) before API call; show inline error
      message for invalid names
- [ ] T009 [US1] Update `LobbyPage.tsx` in
      `frontend/src/pages/LobbyPage.tsx` — show a host indicator (e.g.,
      "👑 Host" badge) next to the participant whose ID matches the room's
      `hostId`

**Checkpoint**: At this point, User Story 1 should be fully functional and
testable independently. A player can create a room, see their host status in
the lobby, and the room code is displayed.

---

## Phase 4: User Story 2 - Join Room (Priority: P1)

**Goal**: A player can join an existing room using a valid code. Invalid,
empty, or full-room codes are rejected with specific error messages.

**Independent Test**: A player joins a room with a valid code and appears in
the lobby. Joining with an invalid code, empty code, or a full room shows
distinct error messages.

### Implementation for User Story 2

- [x] T010 [P] [US2] Update `joinRoom` in
      `backend/src/services/roomStore.ts` — add capacity check (max 8
      participants); add room-active check (reject if status is "active");
      return specific error types instead of generic null
- [x] T011 [US2] Update join endpoint in
      `backend/src/api/rooms.ts` — map specific join errors to distinct HTTP
      status codes and messages (404 for not found, 403 for full/active)
- [ ] T012 [US2] Update `JoinRoomPage.tsx` in
      `frontend/src/pages/JoinRoomPage.tsx` — add client-side validation:
      code required, name 1-16 alphanumeric; display server error messages
      from API responses
- [x] T013 [US2] Handle empty-code error on join route in
      `backend/src/api/rooms.ts` — validate code param is non-empty and
      return 400 with "Room code is required". Note: `code.toUpperCase()`
      already exists for case-insensitivity; add `.trim()` before lookup

- [x] T014 [US2] Add whitespace trimming to code lookup in
      `backend/src/api/rooms.ts` — apply `.trim()` to code param before
      `.toUpperCase()` on both join and fetch routes (FR-014)
- [x] T015 [US2] Update `roomCodeParamsSchema` in
      `backend/src/api/schemas.ts` — apply `z.string().trim().min(1)` to
      reject empty codes at the schema level

**Checkpoint**: At this point, User Stories 1 AND 2 should both work
independently. Room creation and joining with proper validation are complete.

---

## Phase 5: User Story 3 - Lobby and Game Start (Priority: P2)

**Goal**: The lobby auto-refreshes to show new participants. The host can
start the game once 2+ players are present. Non-host players cannot start.
Rooms are cleaned up when all players leave.

**Independent Test**: Two players in the lobby see each other appear within
~2 seconds. The host can start with 2+ players; the non-host sees no start
button. Starting with 1 player is rejected. Room disappears when all leave.

### Implementation for User Story 3

- [x] T016 [US3] Implement `startGame` in
      `backend/src/services/roomStore.ts` — validate participant is host
      (match `hostId`), validate 2+ participants exist, transition status to
      "active", save and return snapshot
- [x] T017 [US3] Add start-game endpoint in
      `backend/src/api/rooms.ts` — `POST /rooms/:code/start` with
      `startGameSchema`, call `startGame`, return updated room snapshot
- [ ] T018 [US3] Add `startGame` method to frontend API client in
      `frontend/src/services/api.ts` — `POST /rooms/:code/start` with
      `participantId` in body, return `{ room: RoomSnapshot }`
- [ ] T019 [US3] Add auto-polling to `RoomStore` in
      `frontend/src/state/roomStore.ts` — add `startPolling()` /
      `stopPolling()` methods using `setInterval` at ~2s; call
      `fetchRoom()` on each tick; start polling on `setRoomSession` and
      stop on cleanup
- [ ] T020 [US3] Update `LobbyPage.tsx` in
      `frontend/src/pages/LobbyPage.tsx` — integrate polling lifecycle
      (start on mount, stop on unmount); show "Start Game" button only when
      current participant is host; disable button and show message when
      fewer than 2 players; call `startGame` on click
- [ ] T021 [US3] Handle game-start navigation in `LobbyPage.tsx` in
      `frontend/src/pages/LobbyPage.tsx` — after successful start, navigate
      to `/game`; show error messages for failures (non-host attempt,
      insufficient players)
- [x] T022 [US3] Implement room cleanup in
      `backend/src/services/roomStore.ts` — after removing a participant
      from the room, delete from rooms Map if participant list is empty

**Checkpoint**: All user stories should now be independently functional. Room
setup, joining, lobby polling, host-gated start, room cleanup, and
case-insensitive code matching are complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories.

- [ ] T023 [P] Verify both builds pass — run `npm run build` in `backend/`
      and `frontend/`
- [ ] T024 Run through quickstart.md test scenarios in
      `specs/001-room-setup-lobby/quickstart.md` — validate all 7 test
      flows pass with two browser tabs
- [ ] T025 Commit all changes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — complete (project already scaffolded)
- **Foundational (Phase 2)**: No dependencies — BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 (Phase 3) → US2 (Phase 4) → US3 (Phase 5) — sequential in priority order
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 - Create Room (P1)**: Starts after Foundational. No
  dependencies on other stories.
- **User Story 2 - Join Room (P1)**: Starts after Foundational. No
  dependencies on US1 (independent test: join an existing room).
- **User Story 3 - Lobby and Game Start (P2)**: Starts after Foundational.
  Requires rooms to exist (US1) and players to join (US2) for full testing,
  but start endpoint logic is independently implementable.

### Within Each User Story

- Models before services
- Services before endpoints
- Backend before frontend
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T002 and T003 can run in parallel (different files, no dependencies)
- T004, T005, T006 can run in parallel (different files within same story)
- T010, T014, T015 can run in parallel within US2 (different files, no inter-dependencies)
- T016, T017, T018, T022 can run in parallel within US3

---

## Parallel Example: User Story 1

```bash
# Launch all independent tasks for User Story 1 together:
Task: "T004 Add host tracking and capacity to createRoom in backend/src/services/roomStore.ts"
Task: "T005 Update toRoomSnapshot in backend/src/services/roomStore.ts"
Task: "T006 Add name validation schema in backend/src/api/schemas.ts"

# After T004-T006 merge:
Task: "T007 Add max-rooms error handling in backend/src/api/rooms.ts"

# After backend tasks complete:
Task: "T008 Update CreateRoomPage in frontend/src/pages/CreateRoomPage.tsx"
Task: "T009 Show host indicator in frontend/src/pages/LobbyPage.tsx"

# User Story 2 parallel batch:
Task: "T010 Update joinRoom with capacity/active checks in backend/src/services/roomStore.ts"
Task: "T014 Add whitespace trimming to code lookup in backend/src/api/rooms.ts"
Task: "T015 Update roomCodeParamsSchema in backend/src/api/schemas.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
2. Complete Phase 3: User Story 1 (Create Room with host tracking)
3. **STOP and VALIDATE**: Test User Story 1 independently
   - Create a room, verify host indicator, verify room code
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → Foundation ready
2. Add User Story 1 (Create Room) → Test independently → MVP
3. Add User Story 2 (Join Room) → Test independently
4. Add User Story 3 (Lobby & Game Start) → Test independently
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- No test tasks — spec does not request automated tests; validation via
  manual two-tab testing per constitution
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break
  independence
