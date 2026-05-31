# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project-level foundation — no code changes, just conventions

- [X] T001 Add `hostId` and `score` fields to shared type definitions in `backend/src/models/game.ts`
- [X] T002 [P] Expand `RoomStatus` type to include `"playing"`, `"round_end"`, `"game_over"` in `backend/src/models/game.ts`
- [X] T003 [P] Update frontend types in `frontend/src/services/api.ts` to match new backend model (hostId, score, expanded RoomStatus)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared validation and store infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Make `playerName` required with `.min(1).trim()` validation in `backend/src/api/schemas.ts`
- [X] T005 [P] Add `startGameSchema` (participantId required) in `backend/src/api/schemas.ts`
- [X] T006 [P] Update `getRoom()` in `backend/src/services/roomStore.ts` to support case-insensitive code lookup
- [X] T007 [P] Add `isHost` field to `RoomSnapshot` and update `toRoomSnapshot()` in `backend/src/services/roomStore.ts`
- [X] T008 Add `startGame()` method to `roomStore` in `backend/src/services/roomStore.ts` with host + player-count validation

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Host Creates a Room (Priority: P1) 🎯 MVP

**Goal**: A player can create a room, receive a unique code, be marked as host, and land in the lobby

**Independent Test**: Navigate to /create-room, enter name, submit → verify response includes room code, participantId, and host flag

### Implementation for User Story 1

- [X] T009 [US1] Update `createRoom()` in `backend/src/services/roomStore.ts` to set `hostId` to the creator's participant ID
- [X] T010 [P] [US1] Add empty/whitespace name rejection in `createRoom` route handler in `backend/src/api/rooms.ts` using updated Zod schema
- [X] T011 [US1] Add name validation error display in `CreateRoomPage.tsx` in `frontend/src/pages/CreateRoomPage.tsx`
- [X] T012 [US1] Update `RoomSessionResponse` to include `hostId` in the create response in `backend/src/api/rooms.ts`

**Checkpoint**: User Story 1 complete — a player can create a room and see the lobby as host

---

## Phase 4: User Story 2 — Player Joins a Room (Priority: P1)

**Goal**: A player can join an existing room by a valid code; invalid or malformed codes are rejected with clear feedback

**Independent Test**: Open two browser windows, create a room in one, join with the code from the other → verify both see the participant list

### Implementation for User Story 2

- [X] T013 [US2] Implement case-insensitive code lookup in `joinRoom()` in `backend/src/services/roomStore.ts`
- [X] T014 [US2] Add "Room not found" error for non-existent codes in `joinRoom` route in `backend/src/api/rooms.ts`
- [X] T015 [P] [US2] Add code validation (empty, wrong length) error handling in `joinRoom` route in `backend/src/api/rooms.ts`
- [X] T016 [US2] Add validation error display for invalid/empty codes in `JoinRoomPage.tsx` in `frontend/src/pages/JoinRoomPage.tsx`
- [X] T017 [US2] Add "game in progress" guard in `joinRoom()` — reject join if room status is not "lobby" in `backend/src/services/roomStore.ts`
- [X] T018 [US2] Update frontend `JoinRoomPage.tsx` to show "Game already in progress" when joining fails due to status

**Checkpoint**: User Story 2 complete — players can join rooms with proper validation and error feedback

---

## Phase 5: User Story 3 — Lobby Refreshes via Polling (Priority: P2)

**Goal**: Lobby automatically polls the server every ~2s to show up-to-date participant list

**Independent Test**: Create a room in browser A, join from browser B → browser A's lobby auto-updates within ~3s without manual refresh

### Implementation for User Story 3

- [X] T019 [US3] Add auto-polling with `setInterval` (2s) to `LobbyPage.tsx` in `frontend/src/pages/LobbyPage.tsx`
- [X] T020 [US3] Clear polling interval on component unmount in `LobbyPage.tsx` in `frontend/src/pages/LobbyPage.tsx`
- [X] T021 [US3] Use `fetchRoom()` with `participantId` query param for polling in `LobbyPage.tsx` in `frontend/src/pages/LobbyPage.tsx`
- [X] T022 [US3] Update room store `fetchRoom()` in `frontend/src/state/roomStore.ts` to support being called repeatedly without side effects

**Checkpoint**: User Story 3 complete — lobby auto-refreshes without manual intervention

---

## Phase 6: User Story 4 — Host Starts the Game (Priority: P2)

**Goal**: Only the host can start the game, and only when 2+ players are present. On start, all players transition to the game screen.

**Independent Test**: Create room as host, join from another browser as non-host → host sees enabled start button, non-host does not

### Implementation for User Story 4

- [X] T023 [P] [US4] Add `POST /rooms/:code/start` route handler in `backend/src/api/rooms.ts`
- [X] T024 [US4] Validate host identity in start-game handler in `backend/src/api/rooms.ts` (403 if not host)
- [X] T025 [US4] Validate minimum 2 players in start-game handler in `backend/src/api/rooms.ts` (400 if <2 players)
- [X] T026 [US4] Update room status to "playing" on successful start in `backend/src/services/roomStore.ts`
- [X] T027 [P] [US4] Add `startGame()` method to `roomStore` on frontend in `frontend/src/state/roomStore.ts`
- [X] T028 [P] [US4] Add `startGame()` API call in `frontend/src/services/api.ts`
- [X] T029 [US4] Show "Start Game" button only for host in `LobbyPage.tsx` in `frontend/src/pages/LobbyPage.tsx`
- [X] T030 [US4] Disable/hide "Start Game" when <2 players present in `LobbyPage.tsx` in `frontend/src/pages/LobbyPage.tsx`
- [X] T031 [US4] On start-game success, navigate all clients to `/game` when polling detects status="playing" in `LobbyPage.tsx` in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: User Story 4 complete — host can start game, non-hosts cannot, 2+ player minimum enforced

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Testing, edge cases, and cleanup

- [X] T032 [P] Add backend test for `createRoom()` host assignment in `backend/src/services/roomStore.test.ts`
- [X] T033 [P] Add backend test for `joinRoom()` validation (invalid code, playing status) in `backend/src/services/roomStore.test.ts`
- [X] T034 [P] Add backend test for `startGame()` (host check, player count) in `backend/src/services/roomStore.test.ts`
- [X] T035 [P] Update schema validation tests in `backend/src/api/schemas.test.ts`
- [X] T036 [P] Update frontend API test for `startGame()` in `frontend/src/services/api.test.ts`
- [X] T037 Verify all room operations return `structuredClone` copies to prevent mutation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — no dependency on other stories
- **US2 (Phase 4)**: Depends on Phase 2 — independent of US1 (can run in parallel)
- **US3 (Phase 5)**: Depends on Phase 2 + Phase 4 (needs working join to demonstrate cross-client polling)
- **US4 (Phase 6)**: Depends on Phase 3 + Phase 4 (needs host + multiple participants)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: MVP — can start alone after foundation
- **US2 (P1)**: MVP — independent of US1
- **US3 (P2)**: Depends on US1 + US2 being functional (need multiple players to demonstrate polling)
- **US4 (P2)**: Depends on US1 + US2 being functional (needs host ID + multiple participants)

### Parallel Opportunities

- T001-T003 (Phase 1) can run in parallel
- T004-T008 (Phase 2) foundational tasks can run in parallel
- US1 and US2 can be implemented in parallel (independent stories)
- Within each US, [P]-marked tasks can run in parallel

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete US1 (Phase 3): Host creates room
4. Complete US2 (Phase 4): Player joins room
5. **STOP and VALIDATE**: Create room in one browser, join from another, see both in lobby
6. Deploy/demo if ready

### Full Feature

1. Complete Setup + Foundational → Foundation ready
2. Add US1 + US2 → Core room flow works (MVP!)
3. Add US3 → Lobby auto-refreshes
4. Add US4 → Host can start the game
5. Polish → Tests and edge cases
