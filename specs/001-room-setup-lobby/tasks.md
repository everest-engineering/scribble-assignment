---
description: "Task list for Scenario 001 — Room Setup and Lobby"
---

# Tasks: Room Setup and Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/api.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story. Backend foundational changes (types, schemas, store) are in Phase 2
because every user story depends on them.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)

---

## Phase 1: Setup

**Purpose**: Pre-conditions and orientation — no code changes, confirms the environment is ready.

- [x] T001 Verify `npm test` passes in both `backend/` and `frontend/` before any changes (baseline green)
- [x] T002 Confirm both dev servers start: `cd backend && npm run dev`, `cd frontend && npm run dev`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type system, schema, and service-layer changes that every user story depends on.
No user story work can begin until this phase is complete.

**⚠️ CRITICAL**: Complete and verify `npm test` passes after EACH task in this phase.

- [x] T003 Expand `RoomStatus` type alias and add `hostId` to `Room` and `RoomSnapshot` interfaces in `backend/src/models/game.ts`
- [x] T004 [P] Harden `createRoomSchema` — change `playerName` to `z.string().trim().min(1, "Name is required").max(20)` in `backend/src/api/schemas.ts`
- [x] T005 [P] Harden `joinRoomSchema` — same validation as T004 in `backend/src/api/schemas.ts`
- [x] T006 [P] Add `startGameSchema = z.object({ participantId: z.string().uuid() })` to `backend/src/api/schemas.ts`
- [x] T007 Update `createRoom` in `backend/src/services/roomStore.ts` — make `playerName` a required `string` parameter, remove the `displayName` fallback helper, store the first participant's `id` as `room.hostId`
- [x] T008 Update `toRoomSnapshot` in `backend/src/services/roomStore.ts` — include `room.hostId` in the returned `RoomSnapshot`
- [x] T009 [P] Fix API base URL typo in `frontend/src/services/api.ts` — change `"http://localhost:3001/bug"` to `"http://localhost:3001"`
- [x] T010 [P] Update `RoomSnapshot` and `RoomSessionResponse` types in `frontend/src/services/api.ts` — add `hostId: string` and expand `status` to `"lobby" | "active" | "ended"`

**Checkpoint**: Run `npm test` in `backend/` and `frontend/`. All existing tests must pass before proceeding.

---

## Phase 3: User Story 1 — Create a Room and Become Host (Priority: P1)

**Goal**: A player creates a room, is assigned as host (explicit `hostId`), and lands in the lobby.

**Independent Test**: Open one browser tab → click Create Room → enter "Alice" → submit.
Confirm: room code shown, Alice listed as participant, Start Game button visible, lobby renders without errors.

### Implementation for User Story 1

- [x] T011 [US1] Update `POST /rooms` handler in `backend/src/api/rooms.ts` — use the now-required `playerName` from validated schema (remove optional chaining/fallback); pass it directly to `createRoom`
- [x] T012 [P] [US1] Add unit tests in `backend/src/services/roomStore.test.ts` for `createRoom`: verify `hostId` equals the returned `participantId`; verify empty string input is rejected (Zod should prevent this at route layer, but test the schema path)
- [x] T013 [P] [US1] Add unit test in `backend/src/api/schemas.test.ts`: `createRoomSchema` rejects missing `playerName`; rejects whitespace-only string; accepts valid name
- [x] T014 [US1] Update `CreateRoomPage.tsx` in `frontend/src/pages/CreateRoomPage.tsx` — add client-side validation: trim name, show inline error message if empty before calling `store.createRoom`

**Checkpoint**: US1 fully functional. Test in one browser tab. `npm test` green in both projects.

---

## Phase 4: User Story 2 — Join an Existing Room (Priority: P1)

**Goal**: A second player joins via room code with full validation (empty / malformed / unknown / case-insensitive).

**Independent Test**: Open two tabs. Tab A creates room (from US1). Tab B visits Join Room,
enters the code (try lowercase), enters "Bob", submits. Confirm Bob appears in the lobby on Tab B.
Test rejection cases: empty code, code with `!`, code `ZZZZ`.

### Implementation for User Story 2

- [x] T015 [US2] Add status gate to `joinRoom` in `backend/src/services/roomStore.ts` — after the `if (!room)` null check, throw `HttpError(409, "Game already in progress")` when `room.status !== "lobby"`
- [x] T016 [US2] Improve error message in `POST /rooms/:code/join` handler in `backend/src/api/rooms.ts` — change `"Unable to join room"` to `"Room not found"`; let the 409 `HttpError` from `joinRoom` propagate naturally
- [x] T017 [P] [US2] Add unit tests in `backend/src/services/roomStore.test.ts` for `joinRoom`: joining a non-existent room returns `null`; joining an active room throws `HttpError(409)`; joining a lobby room succeeds; returned snapshot includes `hostId`. Also add a multi-room isolation test: create two rooms, join a player to room A, assert room B's participant list is unchanged and the two codes differ.
- [x] T018 [US2] Add client-side room code validation to `frontend/src/pages/JoinRoomPage.tsx` — before calling `store.joinRoom`: trim code; show error "Room code is required" if empty; test `/^[a-zA-Z0-9]+$/` and show "Room code must contain only letters and numbers" if fails; only call the API when both checks pass
- [x] T019 [P] [US2] Add client-side name validation to `frontend/src/pages/JoinRoomPage.tsx` — trim name, show error "Name is required" if empty; mirror the same check done in CreateRoomPage (T014)

**Checkpoint**: US2 fully functional. Test all rejection cases and success case in two browser tabs. `npm test` green.

---

## Phase 5: User Story 3 — Live Lobby Updates via Polling (Priority: P2)

**Goal**: All participants in the lobby see new players appear automatically within ~4 seconds, without refreshing.

**Independent Test**: Tab A in lobby (Alice). Tab B joins (Bob). Within ~4 s Tab A shows Bob
without manual refresh. Tab C joins (Carol). Both A and B update within ~4 s.

### Implementation for User Story 3

- [x] T020 [US3] Implement lobby polling in `frontend/src/pages/LobbyPage.tsx` — add `useEffect` that starts `setInterval(() => { store.fetchRoom().catch(() => {}) }, 2000)` on mount and clears the interval (`clearInterval`) on unmount; read `room` and `error` from `useRoomState()`
- [x] T021 [P] [US3] Display participant list in `frontend/src/pages/LobbyPage.tsx` — render each participant's `name` from `room.participants`; show a `(host)` label or visual indicator next to the participant whose `id === room.hostId`
- [x] T022 [P] [US3] Show error/stale indicator in `frontend/src/pages/LobbyPage.tsx` — when `error` from store state is non-null, display a visible but non-crashing message (e.g., "Connection issue — retrying…") without unmounting the polling interval

**Checkpoint**: US3 fully functional. Three-tab test as described above. `npm test` green.

---

## Phase 6: User Story 4 — Host Starts the Game (Priority: P2)

**Goal**: The host (and only the host) can start the game once ≥2 players are present;
starting transitions the room to `active` for all participants.

**Independent Test**: Tab A (host, Alice) + Tab B (Bob) in lobby. Tab B has no Start Game button.
Tab A clicks Start Game → both tabs navigate away from lobby. Test: 1-player case shows button
disabled or blocked message. Non-host API call returns 403.

### Implementation for User Story 4

- [x] T023 [US4] Add `startRoom(code, participantId)` function to `backend/src/services/roomStore.ts` — look up room (throw `HttpError(404, "Room not found")` if missing); throw `HttpError(409, "Game already in progress")` if status ≠ `"lobby"`; throw `HttpError(403, "Only the host can start the game")` if `participantId !== room.hostId`; throw `HttpError(400, "At least 2 players are required to start")` if `participants.length < 2`; set `room.status = "active"`, call `saveRoom`, return cloned room
- [x] T024 [US4] Add `POST /rooms/:code/start` route to `backend/src/api/rooms.ts` — parse body with `startGameSchema`; call `startRoom(code.toUpperCase(), participantId)`; respond with `{ room: toRoomSnapshot(result, participantId) }`
- [x] T025 [P] [US4] Add unit tests in `backend/src/services/roomStore.test.ts` for `startRoom`: non-host throws 403; fewer than 2 participants throws 400; correct host + ≥2 participants sets status to `"active"` and returns updated snapshot; already-active room throws 409
- [x] T026 [P] [US4] Add `startGame(code: string, participantId: string)` API call to `frontend/src/services/api.ts` — `POST /rooms/:code/start` with body `{ participantId }`, returns `{ room: RoomSnapshot }`
- [x] T027 [US4] Add `startGame()` method to the `RoomStore` class in `frontend/src/state/roomStore.ts` — call `api.startGame(room.code, participantId)` inside `withLoading`; on success call `setRoomSnapshot` with the returned room
- [x] T028 [US4] Add Start Game button and transition logic to `frontend/src/pages/LobbyPage.tsx` — render the button only when `participantId === room.hostId`; disable it with helper text "Waiting for more players…" when `room.participants.length < 2`; on click call `store.startGame()` and handle errors via `error` state; in the polling `useEffect` (or a separate one), watch `room.status` and call `navigate("/game")` when it becomes `"active"`
- [x] T029 [P] [US4] Add test in `frontend/src/services/api.test.ts` for `startGame` — verify it makes a POST to `/rooms/:code/start` with the correct body

**Checkpoint**: US4 fully functional. Two-tab test as described above. `npm test` green in both.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation sweep and final acceptance test.

- [x] T030 Run full acceptance test from `specs/001-room-setup-lobby/quickstart.md` — complete the two-tab walkthrough and all validation-check rows
- [x] T031 [P] Run `npm run build` in `backend/` and verify zero TypeScript errors
- [x] T032 [P] Run `npm run build` in `frontend/` and verify zero TypeScript errors
- [x] T033 [P] Run `npm test` in `backend/` and confirm all tests pass (including new ones from T012, T013, T017, T025)
- [x] T034 [P] Run `npm test` in `frontend/` and confirm all tests pass (including T029)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all user stories**
- **Phase 3 (US1)**: Depends on Phase 2
- **Phase 4 (US2)**: Depends on Phase 2; integrates with US1 room creation
- **Phase 5 (US3)**: Depends on Phase 2; requires a working lobby (US1 + US2)
- **Phase 6 (US4)**: Depends on Phase 2; requires lobby polling (US3) to detect status change
- **Phase 7 (Polish)**: Depends on all prior phases

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependency on other stories
- **US2 (P1)**: Can start after Phase 2 — shares backend from US1 but independently testable
- **US3 (P2)**: Can start after Phase 2 — needs US1+US2 for meaningful manual test only
- **US4 (P2)**: Needs US3 lobby polling (T020) before T028 navigation logic is testable

### Within Each User Story

- Backend service changes before route changes
- Route changes before frontend API type changes
- Frontend API before store method
- Store method before page component changes
- Tests can be written in parallel with implementation for same story

### Parallel Opportunities

- T004, T005, T006 run in parallel (all in `schemas.ts`, non-overlapping additions)
- T009, T010 run in parallel (different concerns in `api.ts`)
- T012, T013 run in parallel (different test files)
- T017 runs in parallel with T018, T019 (backend test vs. frontend UI)
- T021, T022 run in parallel (different parts of `LobbyPage.tsx`)
- T026, T027 can be written together (no DOM dependency)
- T031–T034 all run in parallel

---

## Parallel Example: Phase 2 Foundational

```bash
# Group A — backend schemas (all in schemas.ts, non-overlapping)
Task: T004 — harden createRoomSchema
Task: T005 — harden joinRoomSchema
Task: T006 — add startGameSchema

# Group B — frontend types (all in api.ts)
Task: T009 — fix URL bug
Task: T010 — update RoomSnapshot / RoomSessionResponse types
```

---

## Implementation Strategy

### MVP First (US1 + US2 only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US1 (create room, become host)
4. Complete Phase 4: US2 (join with full validation)
5. **STOP and VALIDATE**: Two-tab test — create + join works
6. Proceed to US3 + US4

### Incremental Delivery

1. Foundation → US1 → two-tab create test ✓
2. US2 → two-tab join + rejection tests ✓
3. US3 → polling live update three-tab test ✓
4. US4 → host start game, both tabs navigate ✓
5. Phase 7 → full quickstart acceptance + build/test green ✓

---

## Notes

- All `[P]` tasks operate on different files or non-overlapping sections — safe to parallelize
- `[Story]` label maps each task to its user story for traceability against spec.md
- After every phase checkpoint: run `npm test` in both `backend/` and `frontend/`
- Never commit if `npm test` or `npm run build` is red
- The `hostId` field is the single source of truth for host identity — never infer from position in participants array
