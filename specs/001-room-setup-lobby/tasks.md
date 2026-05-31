# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths are included in every task description

---

## Phase 1: Setup (Prerequisite Fix)

**Purpose**: Unblock all end-to-end browser testing by correcting the intentional starter bug

- [x] T001 Fix `API_BASE_URL` in `frontend/src/services/api.ts`: change `"http://localhost:3001/bug"` to `"http://localhost:3001"`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Data model and type changes required by all four user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Add `hostId: string` field to the `Room` interface in `backend/src/models/game.ts`
- [x] T003 Extend `RoomStatus` type from `"lobby"` to `"lobby" | "in-progress"` in `backend/src/models/game.ts`
- [x] T004 Add `hostId: string` field to the `RoomSnapshot` interface in `backend/src/models/game.ts`

**Checkpoint**: Model types updated — all user story phases may now begin

---

## Phase 3: User Story 1 — Create a Room as Host (Priority: P1) 🎯 MVP

**Goal**: Room creator is automatically designated host; host indicator visible in lobby; empty-name submission blocked before any API call

**Independent Test**: Single player opens Create Room, submits a name, lands in the lobby with their name shown with a host indicator — no other player required

### Implementation for User Story 1

- [x] T005 [US1] Update `createRoom()` to set `hostId` to the first participant's `id` in `backend/src/services/roomStore.ts`
- [x] T006 [P] [US1] Strengthen `playerName` to `z.string().min(1)` in `createRoomSchema` in `backend/src/api/schemas.ts`
- [x] T007 [P] [US1] Add `hostId: string` to the `RoomSnapshot` type in `frontend/src/services/api.ts`
- [x] T008 [P] [US1] Add `hostId: string` to the `RoomSnapshot` type in `frontend/src/state/roomStore.ts`
- [x] T009 [P] [US1] Add empty-name `trim()` check with inline error message (no API call on failure) in `frontend/src/pages/CreateRoomPage.tsx`
- [x] T010 [US1] Add host indicator label next to the matching participant (compare `participant.id === room.hostId`) in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: US1 fully functional — create a room, land in lobby with host indicator, empty name blocked

---

## Phase 4: User Story 2 — Join a Room by Code (Priority: P2)

**Goal**: Players can join by room code; empty-code and empty-name blocked client-side; invalid code and in-progress room surface clear error messages

**Independent Test**: With a room already created (US1), a second player opens Join Room, enters the code and a name, and lands in the lobby alongside the host

### Implementation for User Story 2

- [x] T011 [US2] Reject join attempts when `room.status === "in-progress"` (return HTTP 409) in `backend/src/services/roomStore.ts`
- [x] T012 [P] [US2] Strengthen `playerName` to `z.string().min(1)` in `joinRoomSchema` in `backend/src/api/schemas.ts`
- [x] T013 [US2] Add empty-name and empty-code `trim()` validation with inline errors (no API call on failure) in `frontend/src/pages/JoinRoomPage.tsx`
- [x] T014 [US2] Surface 404 "room not found" and 409 "game is already in progress" error messages in `frontend/src/pages/JoinRoomPage.tsx`

**Checkpoint**: US1 + US2 both work — create a room and join it from a second browser tab

---

## Phase 5: User Story 3 — Live Lobby via Polling (Priority: P3)

**Goal**: Participant list refreshes automatically every ~2 seconds; new joiners appear in all existing lobby tabs without any manual page action

**Independent Test**: Three browser windows in the same room — a third player joining appears in the first two windows within ~3 seconds, no refresh needed, no flicker

### Implementation for User Story 3

- [x] T015 [US3] Replace manual refresh button with `useEffect` / `setInterval(fetchRoom, 2000)` with `clearInterval` on component unmount in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: US3 functional — lobby auto-updates silently every ~2 s; no refresh button visible

---

## Phase 6: User Story 4 — Host Starts the Game (Priority: P4)

**Goal**: Host sees an enabled Start Game button when ≥2 players are present; clicking it transitions all participants to the game screen; non-hosts never see the button

**Independent Test**: With host (Alice) and one other player (Bob) in the lobby, host clicks Start Game and both tabs transition to the game screen

### Implementation for User Story 4

- [x] T016 [US4] Add `startGame(code, participantId)` function (validates host identity, ≥2 participants, sets `status` to `"in-progress"`) in `backend/src/services/roomStore.ts`
- [x] T017 [P] [US4] Add `startGameSchema` validating `{ participantId: z.string() }` in `backend/src/api/schemas.ts`
- [x] T018 [US4] Add `POST /rooms/:code/start` route calling `roomStore.startGame()` in `backend/src/api/rooms.ts`
- [x] T019 [P] [US4] Add `startGame(code, participantId)` API call function in `frontend/src/services/api.ts`
- [x] T020 [US4] Add `startGame()` method to `RoomStore` class in `frontend/src/state/roomStore.ts`
- [x] T021 [US4] Add host-only Start Game button (disabled when `participants.length < 2`, hidden for non-hosts based on `participantId === room.hostId`) in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: All four user stories functional — complete flow: create → join → live lobby → start game

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Regression verification and final smoke testing

- [x] T022 [P] Run backend regression suite: `npm test` in `backend/` (covers `schemas.test.ts`, `roomStore.test.ts`)
- [x] T023 [P] Run frontend regression suite: `npm test` in `frontend/` (covers `api.test.ts`)
- [x] T024 Run manual smoke test checklist from `specs/001-room-setup-lobby/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — fix API_BASE_URL first; all E2E verification fails without it
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all user story phases**
- **Phase 3 (US1, P1)**: Depends on Phase 2 — first MVP increment
- **Phase 4 (US2, P2)**: Depends on Phase 2 — independently testable; may follow US1 in priority order
- **Phase 5 (US3, P3)**: Depends on Phase 2 — single-file change; safe to implement after US1
- **Phase 6 (US4, P4)**: Depends on Phase 3 (host in lobby) + Phase 5 (polling surfaces game-start status to all tabs)
- **Phase 7 (Polish)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories — pure create flow
- **US2 (P2)**: No code dependency on US1; requires a live room for manual testing
- **US3 (P3)**: No code dependency on US1/US2 — single `LobbyPage.tsx` change
- **US4 (P4)**: Depends on US1 (host identity in lobby) and US3 (polling makes game-start visible to non-host tabs)

### Within Each User Story

- Backend model/schema changes before service logic
- Service logic before route handlers
- Route handlers before frontend API calls
- Frontend API calls before state store methods
- State store methods before UI components
- Commit after each completed task (constitution principle V)

### Parallel Opportunities

- **Phase 3 (US1)**: T006, T007, T008, T009 can all start in parallel after T005 completes
- **Phase 4 (US2)**: T011 and T012 can run in parallel (different files); T013 must precede T014 (same file)
- **Phase 6 (US4)**: T016 and T017 can run in parallel; T019 can run in parallel with T016+T017; T018 waits for T016+T017; T020 waits for T019; T021 waits for T020
- **Phase 7**: T022 and T023 can run in parallel

---

## Parallel Example: User Story 1

```bash
# T005 first (sets up backend service):
Task T005: "Update createRoom() in backend/src/services/roomStore.ts"

# Then launch T006-T009 in parallel (all different files):
Task T006: "Strengthen createRoomSchema in backend/src/api/schemas.ts"
Task T007: "Add hostId to RoomSnapshot in frontend/src/services/api.ts"
Task T008: "Add hostId to RoomSnapshot in frontend/src/state/roomStore.ts"
Task T009: "Add empty-name validation in frontend/src/pages/CreateRoomPage.tsx"

# Then T010 (depends on T007 + T008 for frontend types):
Task T010: "Add host indicator in frontend/src/pages/LobbyPage.tsx"
```

## Parallel Example: User Story 4

```bash
# Launch T016 and T017 together, and T019 simultaneously:
Task T016: "Add startGame() in backend/src/services/roomStore.ts"
Task T017: "Add startGameSchema in backend/src/api/schemas.ts"
Task T019: "Add startGame() API call in frontend/src/services/api.ts"

# Then T018 (waits for T016 + T017):
Task T018: "Add POST /rooms/:code/start route in backend/src/api/rooms.ts"

# Then T020 (waits for T019):
Task T020: "Add startGame() method in frontend/src/state/roomStore.ts"

# Then T021 (waits for T020):
Task T021: "Add host-only Start Game button in frontend/src/pages/LobbyPage.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Fix `API_BASE_URL` bug in `frontend/src/services/api.ts`
2. Complete Phase 2: Update data model in `backend/src/models/game.ts`
3. Complete Phase 3: User Story 1 — create room, host designation, host indicator
4. **STOP and VALIDATE**: Open browser, create a room, verify host indicator, test empty-name block
5. Demo / checkpoint before proceeding to US2

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready (types correct, API reachable)
2. Phase 3 (US1) → MVP: create a room and see yourself as host ✅
3. Phase 4 (US2) → Join flow complete; two-player lobby works ✅
4. Phase 5 (US3) → Live lobby: new joiners appear automatically ✅
5. Phase 6 (US4) → Start Game: full end-to-end game flow ✅
6. Phase 7 → Regression tests pass; smoke tests complete ✅

### Parallel Team Strategy

With multiple developers (after Phase 1 + 2 complete):
- Developer A: US1 — `roomStore.ts` (createRoom), `schemas.ts`, `api.ts` types, `CreateRoomPage.tsx`, `LobbyPage.tsx` host indicator
- Developer B: US2 — `roomStore.ts` (joinRoom guard), `schemas.ts` join, `JoinRoomPage.tsx` validation + errors
- Developer C: US3 + US4 backend — `LobbyPage.tsx` polling, `roomStore.ts` (startGame), `schemas.ts` start, `rooms.ts` route

---

## Notes

- [P] tasks = different files with no dependencies on incomplete tasks; safe to run concurrently
- [Story] label maps each task to its user story for traceability
- T001 is a hard prerequisite: all browser E2E verification fails without the API_BASE_URL fix
- No new npm packages — all changes are modifications to existing files
- Automated tests are optional per the constitution; existing Vitest suites verify regression only
- Stop at each **Checkpoint** to validate the story slice before starting the next
