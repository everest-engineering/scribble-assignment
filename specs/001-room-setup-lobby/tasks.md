---
description: "Task list for Room Setup & Lobby feature implementation"
---

# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not included — the feature specification does not explicitly request automated tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`
- **Frontend**: `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: The project scaffolding already exists. No setup tasks needed — backend and frontend are initialized with dependencies installed, Express/Router/Vite/React configured, and existing routes/pages in place.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Model changes and shared services needed by ALL user stories before any can be implemented.

**Critical**: No user story work can begin until this phase is complete.

- [x] T001 Add `hostId` field to `Room` and `RoomSnapshot` interfaces in `backend/src/models/game.ts`

- [x] T002 [P] Create room cleanup service in `backend/src/services/cleanup.ts` — periodic interval (every 60s) that removes rooms idle for 5+ minutes based on `updatedAt`

**Checkpoint**: Foundation ready — `hostId` is available on the Room model and stale rooms are cleaned.

---

## Phase 3: User Story 1 — Host Creates a Room and Starts Game (P1)

**Goal**: A player can create a room, receive a unique code, see themselves as host in the lobby with a "Host" indicator, and start the game once at least 2 players are present. Non-hosts cannot start.

**Independent Test**: Create a room (note the code), join from a second browser tab with a different name, verify both players appear in the lobby with the creator marked "Host", and verify only the host can click "Start Game". Verify a non-host does not see the start button.

### Implementation for User Story 1

- [x] T003 [P] [US1] Modify `createRoom` in `backend/src/services/roomStore.ts` to set the creating participant as host (`room.hostId = participant.id`)

- [x] T004 [P] [US1] Add `startGame(code, participantId)` function in `backend/src/services/roomStore.ts` — validates `participantId === room.hostId` (403), `participants.length >= 2` (400), sets `room.status` to `"playing"`, returns updated room snapshot

- [x] T005 [P] [US1] Add `startGameSchema` in `backend/src/api/schemas.ts` with `{ participantId: z.string() }`

- [x] T006 [P] [US1] Add `POST /rooms/:code/start` route in `backend/src/api/rooms.ts` — parse body, call `startGame`, return room snapshot (with `status: "playing"`) and 200; forward 403/400 via `HttpError`

- [x] T007 [P] [US1] Add `startGame(code, participantId)` method to frontend `frontend/src/services/api.ts`

- [x] T008 [US1] Add `startGame(code)` method to `RoomStore` class in `frontend/src/state/roomStore.ts`

- [x] T009 [US1] Add auto-polling (`setInterval` ~2000ms) to `LobbyPage.tsx` — call `roomStore.fetchRoom()` on mount, clean up on unmount, navigate to `/game` when room status is no longer `"lobby"`, display refresh errors

- [x] T010 [US1] Update `LobbyPage.tsx` rendering:
  - Show "Host" badge next to the host participant
  - Show "Start Game" button only when `participantId === room.hostId`
  - Disable "Start Game" button when `room.participants.length < 2`, show message "At least 2 players required"
  - Wire "Start Game" button to `roomStore.startGame()`, navigate to `/game` on success, show error on failure

- [x] T011 [US1] Show a loading spinner on the create button and disable it during the create room API request in `CreateRoomPage.tsx` to prevent double-submission

**Checkpoint**: A host can create a room, see the host badge, wait for players, and start the game. Non-hosts cannot start.

---

## Phase 4: User Story 2 — Player Joins a Room via Code (P1)

**Goal**: A player can join by entering a valid room code and see the lobby with the host and all participants. Duplicate display names are rejected.

**Independent Test**: Create a room as host. Open a second tab, join with a valid code and unique name — both tabs show both players. Attempt to join the same room with a name already taken — receive a clear error.

### Implementation for User Story 2

- [x] T012 [P] [US2] Add duplicate display name validation in `joinRoom` in `backend/src/services/roomStore.ts` — check `participants.some(p => p.name === displayName)`, return typed error for 409

- [x] T013 [US2] Handle 409 conflict in `POST /rooms/:code/join` in `backend/src/api/rooms.ts` — throw `HttpError(409, "Display name is already taken in this room")`

- [x] T014 [US2] Handle 409 error in `JoinRoomPage.tsx` — display a user-friendly message ("That name is taken, please choose another")

- [x] T015 [US2] Show a loading spinner on the join button and disable it during the join room API request in `JoinRoomPage.tsx` to prevent double-submission

**Checkpoint**: Players can join with valid codes. Duplicate names are rejected with a clear message.

---

## Phase 5: User Story 3 — Player Enters an Invalid or Empty Code (P1)

**Goal**: Invalid, empty, or non-existent room codes are rejected with clear feedback.

**Independent Test**: Attempt to join with an empty code, a non-4-character code, a code with special characters, and a valid-format code that doesn't match any room — each produces an appropriate error message.

### Implementation for User Story 3

- [x] T016 [P] [US3] Add frontend form validation in `JoinRoomPage.tsx` — reject empty room code before submitting, display inline error "Room code is required"

- [x] T017 [P] [US3] Add room code format validation in `JoinRoomPage.tsx` — reject codes that are not exactly 4 alphanumeric characters, display inline error "Room code must be 4 characters"

- [x] T018 [US3] Update `roomCodeParamsSchema` in `backend/src/api/schemas.ts` — change from `z.string()` to `z.string().length(4).regex(/^[A-Z0-9]+$/)` for backend-side format validation

- [x] T019 [US3] Handle 404 from join in `JoinRoomPage.tsx` — display "Room not found — check the code and try again"

**Checkpoint**: All invalid/empty code cases produce clear, specific error messages both client-side and server-side.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, error refinement, and end-to-end verification.

- [x] T020 Update `toRoomSnapshot` in `backend/src/services/roomStore.ts` to include `hostId` in the returned snapshot

- [x] T021 Wire cleanup service in `backend/src/server.ts` — import and call cleanup starter on app boot

- [x] T022 Handle duplicate join edge case in `joinRoom` (backend) — if a participant with the same `id` is already in the room, return the room state instead of creating a duplicate entry

- [x] T023 Verify quickstart.md manual test flow end-to-end works

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — already complete
- **Foundational (Phase 2)**: Must complete before any user story
- **User Stories (Phase 3–5)**: All depend on Phase 2; stories are independently implementable
- **Polish (Phase 6)**: Depends on all user stories

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependency on US2/US3
- **US2 (P1)**: Can start after Phase 2 — independently testable from US1
- **US3 (P1)**: Can start after Phase 2 — independently testable from US1/US2

### Within Each User Story

- Models before services
- Services before endpoints
- Backend before frontend
- Story complete before moving to next

### Parallel Opportunities

- All [P] tasks within the same phase can run in parallel
- T001 and T002 can run in parallel (Phase 2)
- T003, T004, T005, T006, T007 can all run in parallel (US1 backend changes)
- T009 and T010 must run sequentially (T010 depends on T009)
- T012 and T013 can run in parallel (US2)
- T016, T017, T018 can run in parallel (US3)
- All three user stories can be worked on in parallel by different developers

---

## Parallel Example: User Story 1

```bash
# Launch all backend model/service changes together:
Task: "T003 Modify createRoom to set hostId in backend/src/services/roomStore.ts"
Task: "T004 Add startGame function in backend/src/services/roomStore.ts"

# Launch all API/schema changes together:
Task: "T005 Add startGameSchema in backend/src/api/schemas.ts"
Task: "T006 Add POST /rooms/:code/start route in backend/src/api/rooms.ts"

# Launch all frontend service changes together:
Task: "T007 Add startGame to frontend/src/services/api.ts"

# Sequential (T010 depends on T009):
Task: "T009 Add auto-polling to LobbyPage.tsx"
Task: "T010 Update LobbyPage.tsx with host indicator and start controls"

# UI polish:
Task: "T011 Add loading indicator to CreateRoomPage.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (add hostId + cleanup)
2. Complete Phase 3: User Story 1 (host creates room and starts game)
3. **STOP and VALIDATE**: Test US1 independently — create room, join from second tab, verify host badge, start game
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Phase 2 → Foundation ready
2. Add US1 (host creates & starts) → MVP: lobby with start game!
3. Add US2 (joining via code) → Duplicate name handling added
4. Add US3 (invalid code feedback) → Full error handling
5. Add Phase 6 → Polish and edge cases

### Parallel Team Strategy

With multiple developers:

1. Developer completes Phase 2 alone (model + cleanup)
2. Once Phase 2 is done:
   - Developer A: US1 (host + start game)
   - Developer B: US2 (join + duplicate names)
   - Developer C: US3 (validation)
3. Stories integrate independently, then Phase 6 polishes everything

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
