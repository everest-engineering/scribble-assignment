---

description: "Task list for Room Setup & Lobby feature"

---

# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`

**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/api.md, research.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

No setup tasks required — the starter project is already initialized with all
necessary dependencies (Express, Zod, React, React Router, Vite, Vitest).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T001 Add `hostId` field to `Room` type in `backend/src/models/game.ts`
- [ ] T001b [P] Add `"playing"` to `RoomStatus` type in `backend/src/models/game.ts` and `frontend/src/services/api.ts`
- [ ] T002 [P] Update `createRoomSchema` and `joinRoomSchema` in `backend/src/api/schemas.ts` to require non-empty, non-whitespace `playerName` (trimmed, min length 1 after trim)
- [ ] T003 [P] Add `startGameSchema` (playerId required) and `startRoomParamsSchema` (code required) in `backend/src/api/schemas.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Create a Room (Priority: P1) 🎯 MVP

**Goal**: A player can create a room with a valid name and is automatically designated as the host.

**Independent Test**: Open the app, click "Create Room", enter a name, submit.
Verify the lobby shows the room code and the player is marked as host.

- [ ] T004 [P] [US1] Update `createRoom` in `backend/src/services/roomStore.ts` to set creator as host (`room.hostId = participant.id`)
- [ ] T005 [P] [US1] Update `toRoomSnapshot` in `backend/src/services/roomStore.ts` to include `hostId` in snapshot
- [ ] T006 [P] [US1] Add `hostId` field to `RoomSnapshot` interface in `backend/src/models/game.ts`
- [ ] T007 [P] [US1] Add `hostId` field to `RoomSnapshot` interface in `frontend/src/services/api.ts`
- [ ] T008 [US1] Add name trimming (before submit) and local validation in `frontend/src/pages/CreateRoomPage.tsx` — disable submit for empty/whitespace-only name and show inline error

**Checkpoint**: US1 complete — a single player can create a room and see the host badge in lobby.

---

## Phase 4: User Story 2 - Join a Room by Code (Priority: P1)

**Goal**: A second player can join an existing room by entering its code and a valid name.

**Independent Test**: Open a second tab, click "Join Room", enter the room code
and a name. Verify both tabs show both participants in the lobby.

- [ ] T009 [P] [US2] Add name trimming and local validation in `frontend/src/pages/JoinRoomPage.tsx` — disable submit for empty/whitespace-only name and show inline error
- [ ] T010 [US2] Update join error handling in `backend/src/api/rooms.ts` to return distinct messages: "Room not found" for unknown codes vs validation errors

**Checkpoint**: US2 complete — two players can be in the same lobby together.

---

## Phase 5: User Story 3 - Lobby Auto-Refresh (Priority: P2)

**Goal**: The lobby participant list refreshes automatically via polling at ~2s intervals.

**Independent Test**: Create room in tab A, join in tab B. Wait up to 3s and
confirm tab A shows the new participant without manual refresh.

- [ ] T011 [P] [US3] Add `pollRoom` method with exponential back-off logic to `frontend/src/state/roomStore.ts` (retry at 2s → 4s → 8s on error, surface error after 3 consecutive failures)
- [ ] T012 [US3] Wire `pollRoom` into `frontend/src/pages/LobbyPage.tsx` using `useEffect` with `setInterval` — start polling on mount, stop on unmount or when navigating away
- [ ] T013 [US3] Add error notification UI in `frontend/src/pages/LobbyPage.tsx` for polling failures (after 3 consecutive failures)

**Checkpoint**: US3 complete — lobby refreshes automatically without manual intervention.

---

## Phase 6: User Story 4 - Host Starts Game (Priority: P2)

**Goal**: Only the host can start the game, and only when at least 2 players are present.

**Independent Test**: With 2 players in lobby, confirm host sees active start
button and non-host does not. Click start on host tab — verify both tabs
navigate to the game screen.

- [ ] T014 [US4] Add `startGame` function in `backend/src/services/roomStore.ts` — validate caller is host (`participants[?].id === room.hostId`), validate ≥ 2 participants, set room status to `"playing"`, return updated room
- [ ] T015 [US4] Add `POST /rooms/:code/start` endpoint in `backend/src/api/rooms.ts` — parse body with `startGameSchema`, call `startGame`, return snapshot
- [ ] T016 [P] [US4] Add `startRoom` method to `frontend/src/services/api.ts` — `POST /rooms/:code/start` with `{ playerId }`
- [ ] T017 [US4] Update `frontend/src/pages/LobbyPage.tsx` — show "Start Game" button only for host, disable with <2 players tooltip, call `startRoom` on click
- [ ] T018 [US4] Detect game start in polling response in `frontend/src/pages/LobbyPage.tsx` — when room status transitions to `"playing"`, navigate all players to `/game`

**Checkpoint**: US4 complete — host can start the game and all players navigate to game screen.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T019 [P] Write test for host assignment in `backend/src/services/roomStore.test.ts`
- [ ] T020 [P] Write test for join with invalid name in `backend/src/services/roomStore.test.ts`
- [ ] T021 [P] Write test for start game validation (non-host, <2 players) in `backend/src/services/roomStore.test.ts`
- [ ] T022 [P] Update schema tests in `backend/src/api/schemas.test.ts` — empty name rejection, valid name acceptance
- [ ] T023 [P] Run `npm run build` in `backend/` — fix any type/build errors
- [ ] T024 [P] Run `npm run build` in `frontend/` — fix any type/build errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — already complete
- **Foundational (Phase 2)**: Blocks all user stories
- **User Stories (Phase 3-6)**:
  - **US1 (Phase 3)**: Can start after Phase 2 — no dependency on other stories
  - **US2 (Phase 4)**: Depends on US1 (needs a room to join)
  - **US3 (Phase 5)**: Depends on US1 + US2 (needs multi-player to test refresh)
  - **US4 (Phase 6)**: Depends on US1 + US2 + US3 (needs 2 players + polling)
- **Polish (Phase 7)**: Depends on all user stories being complete

### Within Each User Story

- Models before services
- Services before endpoints
- Backend before frontend for new endpoints
- Core implementation before integration

### Parallel Opportunities

- All Phase 2 [P] tasks can run in parallel
- All [P] tasks within a user story can run in parallel

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational
2. Complete Phase 3: US1 (Create Room)
3. **STOP and VALIDATE**: Single player can create room, see host badge, lobby renders

### Incremental Delivery

1. Add US1 → Test independently → Commit
2. Add US2 → Test with two tabs → Commit
3. Add US3 → Test auto-refresh → Commit
4. Add US4 → Test start game flow → Commit
5. Polish and build validation → Commit
