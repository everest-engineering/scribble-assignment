# Tasks: Room Setup and Lobby

**Input**: Design documents from `/specs/001-room-setup-lobby/`

**Prerequisites**: [plan.md](plan.md) (required), [spec.md](spec.md) (required for user stories), [research.md](research.md), [data-model.md](data-model.md), [contracts/api-v1.md](contracts/api-v1.md)

**Tests**: Not included — not requested in spec.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- `backend/src/` — Express API, models, services
- `frontend/src/` — React pages, components, state, services

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Fix existing bugs and prepare shared infrastructure

- [ ] T001 Fix API_BASE_URL default (remove `/bug` suffix) in frontend/src/services/api.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Model and schema changes that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 [P] Extend RoomStatus to include "playing" and "finished" in backend/src/models/game.ts
- [ ] T003 [P] Add hostId, secretWord to Room model; add role (optional) to Participant model in backend/src/models/game.ts
- [ ] T004 Add playerName validation (required, non-empty, non-whitespace) to Zod schemas in backend/src/api/schemas.ts

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create a Room and Enter Lobby (Priority: P1) 🎯 MVP

**Goal**: A player can create a room, be designated as host, see their name in the lobby with a host indicator and the room code.

**Independent Test**: Open the app, navigate to Create Room, enter "Alice", submit. Verify the lobby shows "Alice" labeled as host, the room code is displayed, and a loading spinner appeared during creation.

- [ ] T005 [US1] Mark first participant as host on room creation in backend/src/services/roomStore.ts
- [ ] T006 [US1] Add display name validation (non-empty, non-whitespace) on CreateRoomPage form submit in frontend/src/pages/CreateRoomPage.tsx
- [ ] T007 [US1] Add loading spinner with "Creating room..." text during room creation in frontend/src/pages/CreateRoomPage.tsx

**Checkpoint**: User Story 1 complete — a single player can create a room, see host status, and view the room code.

---

## Phase 4: User Story 2 - Join a Room and See Lobby (Priority: P1)

**Goal**: A player can join an existing room using a valid room code, see the participant list update for all players, and get clear errors for invalid codes, full rooms, or in-progress games.

**Independent Test**: Open two browser tabs. In Tab 1, create a room (Alice). In Tab 2, join using the room code as "Bob". Verify both tabs show Alice (host) and Bob in the participant list. Try joining with wrong code → error. Try joining a full room → error.

- [ ] T008 [US2] Add room code validation (non-empty) and display name validation on JoinRoomPage form submit in frontend/src/pages/JoinRoomPage.tsx
- [ ] T009 [US2] Add loading spinner with "Joining..." text during room join in frontend/src/pages/JoinRoomPage.tsx
- [ ] T010 [US2] Add room code case-insensitive comparison on join/lookup in backend/src/services/roomStore.ts
- [ ] T011 [US2] Reject join attempts for rooms with status !== "lobby" in backend/src/services/roomStore.ts and backend/src/api/rooms.ts

**Checkpoint**: User Story 2 complete — a second player can join a room by code, and errors are shown for invalid/full/in-progress rooms.

---

## Phase 5: User Story 3 - Lobby Experience with Live Updates (Priority: P2)

**Goal**: Players in the lobby see automatic participant list updates via polling. The host sees a "Start Game" button; non-hosts do not. The host can start the game when ≥2 players are present, which transitions the room to "playing", assigns drawer/guesser roles, and selects a secret word.

**Independent Test**: Open two tabs in same room. In Tab 1 (host), verify "Start Game" is visible. In Tab 2 (non-host), verify it is not. Click "Start Game" as host → both tabs show game state (status "playing", roles assigned). Tab 1 sees the secret word; Tab 2 does not. Verify start is blocked with <2 players.

- [ ] T012 [US3] Implement automatic lobby polling (~2s setInterval) in frontend/src/pages/LobbyPage.tsx — replace manual "Refresh Room"
- [ ] T013 [US3] Show host indicator (badge/icon) next to host participant in lobby participant list in frontend/src/pages/LobbyPage.tsx
- [ ] T014 [P] [US3] Add startGame API method to api service in frontend/src/services/api.ts
- [ ] T015 [P] [US3] Add startGame method to RoomStore in frontend/src/state/roomStore.ts
- [ ] T016 [P] [US3] Add startRoom service function in backend/src/services/roomStore.ts — validates host, ≥2 players, status "lobby"; transitions to "playing"; assigns drawer (deterministic: first non-host by join order) and guessers; selects secret word (deterministic: STARTER_WORDS[0] for v1)
- [ ] T017 [US3] Add POST /rooms/:code/start request schema in backend/src/api/schemas.ts
- [ ] T018 [US3] Add POST /rooms/:code/start endpoint handler in backend/src/api/rooms.ts — calls startRoom, returns updated RoomSnapshot
- [ ] T019 [US3] Replace hardcoded "Start Game" navigation with API call via roomStore.startGame() in frontend/src/pages/LobbyPage.tsx — only render button for host participant
- [ ] T020 [US3] Fix toRoomSnapshot to include secretWord only for drawer participant (using viewerParticipantId) and exclude availableWords for guessers in backend/src/services/roomStore.ts

**Checkpoint**: User Story 3 complete — real-time lobby updates, host-only start control, and game start with role/word assignment work end-to-end.

---

## Phase 6: User Story 4 - Leave a Room (Priority: P3)

**Goal**: Any participant can leave a room. If the host leaves, host status passes to the next earliest-joined participant. When the last participant leaves, the room is cleaned up.

**Independent Test**: Create a room with 3 players (Alice host, Bob, Charlie). Have Charlie leave → Charlie returns to home, Alice and Bob see Charlie removed within 3 seconds. Have Alice leave → Bob becomes host (sees start button). Have Bob leave → room is gone, cannot be joined.

- [ ] T021 [P] [US4] Add leaveRoom service function in backend/src/services/roomStore.ts — removes participant, handles host transfer (earliest joinedAt remaining), cleans up if zero participants
- [ ] T022 [P] [US4] Add POST /rooms/:code/leave endpoint handler in backend/src/api/rooms.ts
- [ ] T023 [P] [US4] Add leaveRoom API method in frontend/src/services/api.ts
- [ ] T024 [P] [US4] Add leaveRoom method to RoomStore in frontend/src/state/roomStore.ts
- [ ] T025 [US4] Add "Leave Room" button in lobby UI and wire to roomStore.leaveRoom() in frontend/src/pages/LobbyPage.tsx — navigates to "/" on success

**Checkpoint**: User Story 4 complete — all leave scenarios work including host transfer and room cleanup.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and edge case hardening

- [ ] T026 Add room code max-length validation in backend/src/api/schemas.ts (reject codes longer than 4 characters)
- [ ] T027 Add max-participants (8) check on join in backend/src/services/roomStore.ts — return error if room.participants.length >= 8
- [ ] T028 Run quickstart.md validation scenarios end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can proceed sequentially in priority order (US1 → US2 → US3 → US4)
  - US3 has no dependency on US2 completion (different API endpoints/pages)
  - US4 has no dependency on US3 completion (self-contained leave flow)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1) — Create Room**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **US2 (P1) — Join Room**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **US3 (P2) — Lobby & Start**: Can start after Foundational (Phase 2) — No dependencies on US1/US2 for backend work; frontend LobbyPage integrates all stories
- **US4 (P3) — Leave Room**: Can start after Foundational (Phase 2) — Self-contained

### Within Each User Story

- Models before services (but Phase 2 already handles models)
- Services before endpoints
- API methods before store methods
- Store methods before UI integration
- Story complete before moving to next priority

### Parallel Opportunities

- T002 and T003 can run in parallel (different fields in same model file — low conflict risk)
- T014 and T015 can run in parallel (different files: api.ts vs roomStore.ts)
- T016 and T017 can run in parallel (service + schema, independent)
- T021, T022, T023, T024 can all run in parallel (service, endpoint, api.ts, roomStore.ts)
- US2 tasks could theoretically start alongside US1 as long as Phase 2 is done
- US3 and US4 are fully independent of each other and could be done in any order

---

## Parallel Example: User Story 3 (Lobby & Start)

```bash
# Launch API method + store method together:
Task: "Add startGame API method in frontend/src/services/api.ts"
Task: "Add startGame to RoomStore in frontend/src/state/roomStore.ts"

# Launch service + schema together:
Task: "Add startRoom service in backend/src/services/roomStore.ts"
Task: "Add start game schema in backend/src/api/schemas.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (fix API base URL)
2. Complete Phase 2: Foundational (models + schemas)
3. Complete Phase 3: User Story 1 (create room, see lobby with host indicator)
4. **STOP and VALIDATE**: Open app, create a room, verify host indicator
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 (Create Room) → Test independently → Deploy/Demo (MVP!)
3. Add US2 (Join Room) → Test independently → Deploy/Demo
4. Add US3 (Lobby & Start) → Test independently → Deploy/Demo
5. Add US4 (Leave Room) → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Complete Phase 1 + 2 together (Setup + Foundational)
2. Once Foundational is done:
   - Developer A: US1 (Create Room)
   - Developer B: US2 (Join Room)
   - Developer C: US3 backend (service + endpoint) + US4 backend
3. Developers merge and verify integration
4. Polish: common frontend integration and end-to-end validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
