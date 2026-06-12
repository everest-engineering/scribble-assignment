---
description: "Implementation tasks for Lobby & Host Management"
---

# Tasks: Lobby & Host Management

**Input**: Design documents from `/specs/001-lobby-host-management/`

**Prerequisites**: plan.md (required), spec.md (required), data-model.md, research.md, contracts/

**Tests**: Not requested — task list excludes test tasks. Tests can be added in a follow-up if needed.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify project state and ensure development tooling is ready

**Note**: Brownfield project — no scaffolding required. All changes are additive to existing files.

- [x] T001 Verify backend and frontend build without errors (`cd backend && npm run build && cd ../frontend && npm run build`)

**Checkpoint**: Project builds cleanly on both sides

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared type/model updates that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [P] Update `RoomStatus` to `"lobby" | "playing" | "finished"`, add `hostId` and `word` fields to `Room`, add `ParticipantSnapshot` type (with `isHost` and `role`) in `backend/src/models/game.ts`
- [x] T003 [P] Update `toRoomSnapshot` to accept `room` with `hostId`, derive `isHost` per participant (`participant.id === hostId`), include `role: null` for lobby, include `hostId` on snapshot in `backend/src/services/roomStore.ts`
- [x] T004 [P] Update `createRoomSchema` and `joinRoomSchema` to validate player name (trim before validation, `min(1)`, `max(30)`) using `z.preprocess` in `backend/src/api/schemas.ts`
- [x] T005 [P] Update frontend `RoomSnapshot` type to `"lobby" | "playing" | "finished"`, add `hostId`, update `Participant` to include `isHost` and `role` in `frontend/src/services/api.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel

---

## Phase 3: User Story 1 — Host Creates and Manages Room (Priority: P1) 🎯 MVP

**Goal**: Room creator is designated as host, host is visually identified in the lobby, host identity persists when others join

**Independent Test**: Create a room and verify the creator shows as host. Have another player join and confirm the host remains unchanged.

- [x] T006 [P] [US1] Update `createRoom` in `backend/src/services/roomStore.ts` to set `hostId` to the creator's participant ID
- [x] T007 [P] [US1] Update `GET /rooms/:code` response to include `hostId` and per-participant `isHost` via updated `toRoomSnapshot` in `backend/src/api/rooms.ts`
- [x] T008 [US1] Update `POST /rooms` response (via `toRoomSnapshot`) to include `hostId` and per-participant `isHost` in `backend/src/api/rooms.ts`
- [x] T009 [US1] Update `LobbyPage` in `frontend/src/pages/LobbyPage.tsx` to show a host indicator (e.g., "(Host)" label or crown icon) next to the host participant

**Checkpoint**: US1 complete — creator is host, host badge visible, host persists across joins

---

## Phase 4: User Story 2 — Players Join with Validated Names (Priority: P1)

**Goal**: Name validation on both frontend and backend, clear inline error messages, whitespace trimming, max 30 chars, game-in-progress rejection

**Independent Test**: Submit various invalid inputs (empty names, whitespace-only, 31+ chars, non-existent room code) and verify clear inline error messages on both create and join forms.

- [x] T010 [P] [US2] Update `joinRoom` in `backend/src/services/roomStore.ts` to reject join attempts when `room.status !== "lobby"` with an appropriate error
- [x] T011 [US2] Add inline field-level validation errors to `JoinRoomPage` in `frontend/src/pages/JoinRoomPage.tsx` (name empty/too-long, room code empty, non-existent room, game in progress)
- [x] T012 [US2] Add inline field-level validation errors to `CreateRoomPage` in `frontend/src/pages/CreateRoomPage.tsx` (name empty/too-long)

**Checkpoint**: US2 complete — all invalid inputs rejected with clear messages, valid names trimmed and accepted

---

## Phase 5: User Story 4 — Host Starts the Game (Priority: P1)

**Goal**: Only the host can start the game, minimum 2 players required, game state transitions to playing, non-hosts see no start control

**Independent Test**: Host with >=2 players sees enabled start button. Host with 1 player sees disabled button with reason. Non-host sees no start button. Clicking start transitions lobby to game view.

- [x] T013 [P] [US4] Create `startGame` function in `backend/src/services/roomStore.ts` — validate room exists, caller is host, >=2 participants; set `status = "playing"`, select random word from `STARTER_WORDS`, assign roles (first participant = drawer, rest = guessers), save room, return updated snapshot
- [x] T014 [P] [US4] Add `POST /rooms/:code/start` route in `backend/src/api/rooms.ts` with `startGame` Zod schema, delegate to `startGame`, return updated `RoomSnapshot`
- [x] T015 [P] [US4] Add `startGame(code, participantId)` method to frontend API client in `frontend/src/services/api.ts`
- [x] T016 [P] [US4] Add `startGame` action to `RoomStore` class in `frontend/src/state/roomStore.ts` that calls `api.startGame()` and updates room state
- [x] T017 [US4] Update `LobbyPage` in `frontend/src/pages/LobbyPage.tsx` — show start button only for host, disable with "At least 2 players required" when <2 players, navigate to `/game` on success

**Checkpoint**: US4 complete — host can start game, non-hosts see no start button, game transitions to playing state

---

## Phase 6: User Story 3 — Lobby Auto-Refreshes (Priority: P2)

**Goal**: Lobby auto-polls at 2s intervals, new joiners appear automatically, no visual flicker, graceful loading/error states

**Independent Test**: Open lobby in two windows, join from second window — new player appears within ~3s in first window. Toggle network offline — subtle loading indicator appears, last state preserved.

- [x] T018 [P] [US3] Add `fetchRoom` method to `RoomStore` (or verify existing one handles loading/error states correctly) and a `clearPolling` mechanism in `frontend/src/state/roomStore.ts`
- [x] T019 [US3] Implement auto-polling in `LobbyPage` in `frontend/src/pages/LobbyPage.tsx` using `useEffect` with `setInterval` (2s), cleanup on unmount, subtle loading indicator during fetch, skip navigation on poll errors

**Checkpoint**: US3 complete — lobby auto-refreshes, no flicker, graceful degradation on network issues

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup and verification

- [x] T020 Fix `API_BASE_URL` default in `frontend/src/services/api.ts` — change `http://localhost:3001/bug` to `http://localhost:3001` (the `/bug` suffix appears to be incorrect)
- [x] T021 Run complete validation per `specs/001-lobby-host-management/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — verify tooling is ready
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US3 (Host Starts Game) depends on US1 (host exists) and US2 (validated players)
  - US4 (Auto-Refresh) can proceed in parallel with US3
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (Host Creates Room, P1)**: Can start after Foundational — no dependencies on other stories 🎯 MVP
- **US2 (Join with Validation, P1)**: Can start after Foundational — independent of US1
- **US4 (Host Starts Game, P1)**: Depends on US1 (host exists) and US2 (validated players in room)
- **US3 (Auto-Refresh, P2)**: Can start after Foundational — independent of other stories

### Within Each User Story

- Models/types before services
- Services before endpoints
- Backend endpoints before frontend integration
- Frontend UI last (pipes through all backend changes)

### Parallel Opportunities

- All Foundational tasks marked [P] can run in parallel
- All [P] tasks within a user story phase can run in parallel
- US1 and US2 can run in parallel (different features, different files)
- US3 (auto-refresh) can run in parallel with US1/US2/US4

---

## Parallel Example: User Story 1

```bash
# Launch tasks that work on different files simultaneously:
Task: "Update createRoom in backend/src/services/roomStore.ts to set hostId"
Task: "Update GET /rooms/:code to include hostId and isHost in backend/src/api/rooms.ts"
```

```bash
# After both complete:
Task: "Update LobbyPage to show host indicator in frontend/src/pages/LobbyPage.tsx"
```

---

## Implementation Strategy

### MVP First (Phase 1 + 2 + US1)

1. Complete Phase 1: Setup (verify builds)
2. Complete Phase 2: Foundational (models, schemas, types)
3. Complete Phase 3: US1 — Host Creates Room
4. **STOP and VALIDATE**: Verify host creation, host persistence, host badge
5. Deploy/demo if ready — MVP delivers host functionality

### Incremental Delivery

1. Foundation → US1 (MVP: host tracking) → Deploy/Demo
2. Add US2 (name validation) → Test independently → Deploy/Demo
3. Add US4 (start game) → Test independently → Deploy/Demo
4. Add US3 (auto-refresh) → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Foundational together
2. Once Foundational is done:
   - Developer A: US1 (host tracking) + US4 (start game)
   - Developer B: US2 (name validation) + US3 (auto-refresh)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- All changes are additive / brownfield — no rewrites
- No new dependencies beyond existing stack (Express, Zod, React, Vite)
- State is in-memory only — no database
- All sync uses HTTP polling — no WebSockets
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
