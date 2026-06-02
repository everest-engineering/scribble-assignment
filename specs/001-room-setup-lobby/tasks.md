---
description: "Task list for Room Setup & Lobby Navigation"
---

# Tasks: Room Setup & Lobby Navigation

**Input**: Design documents from `/specs/001-room-setup-lobby/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contracts.md

**Tests**: Test tasks are MANDATORY per constitution Principle III (TDD — write failing test first, then implement). All tests use Vitest. Backend tests run in node environment; frontend tests run in jsdom environment. Target: ≥ 80% line/branch coverage.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete-task dependencies)
- **[Story]**: Which user story this task belongs to ([US1], [US2], [US3])

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the `shared/schemas/` package and configure path aliases so both `backend/` and `frontend/` can import shared Zod contracts.

- [ ] T001 Create `shared/schemas/index.ts` as an empty re-export placeholder (repo root)
- [ ] T002 [P] Add `paths` alias `"shared/*": ["../shared/*"]` to `backend/tsconfig.json` compilerOptions
- [ ] T003 [P] Add `paths` alias `"shared/*": ["../shared/*"]` to `frontend/tsconfig.json` compilerOptions and add `resolve.alias: { shared: path.resolve(__dirname, '../shared') }` to `frontend/vite.config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core changes that MUST be complete before any user story can be implemented or tested.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 Fix `API_BASE_URL` default in `frontend/src/services/api.ts`: remove the `/bug` path suffix so the default resolves to `http://localhost:3001`
- [ ] T005 Create `shared/schemas/room.ts` with Zod schemas (`participantRoleSchema`, `participantSnapshotSchema`, `roomStatusSchema` (`"lobby" | "in-progress"`), `roomSnapshotSchema` (includes `hostId: z.string()`), `roomSessionResponseSchema`, `roomResponseSchema`, `errorResponseSchema`) and derived TypeScript types via `z.infer<>`
- [ ] T006 Update `shared/schemas/index.ts` to re-export all schemas and types from `shared/schemas/room.ts` (depends on T005)
- [ ] T007 Extend `backend/src/models/game.ts`: add `hostId: string` to `Room` interface; extend `RoomStatus` to `"lobby" | "in-progress"`; add `hostId: string` to `RoomSnapshot` interface
- [ ] T008 [P] Create `frontend/src/components/PageErrorBoundary.tsx` as a React class component with a human-readable fallback UI (`"Something went wrong. Please refresh and try again."`) and no raw stack traces exposed

**Checkpoint**: Shared schemas, corrected base URL, extended data model, and error boundary component are all in place. User story phases can now begin.

---

## Phase 3: User Story 1 — Create a Room and Reach the Lobby (Priority: P1) 🎯 MVP

**Goal**: A player enters their name, creates a room, is recognised as host, and lands in the lobby showing the room code and participant list.

**Independent Test**: Navigate to `/create-room`, enter a valid name, press "Create and Continue", verify the lobby shows the room code and the player's name in the participant list. Verify entering no name blocks form submission with an inline message.

### Tests for User Story 1 (MANDATORY — write and confirm FAIL before implementing)

- [ ] T009 [P] [US1] Write failing test in `backend/src/services/roomStore.test.ts`: `createRoom("Alice")` sets `room.hostId === result.participantId`
- [ ] T010 [P] [US1] Write failing test in `backend/src/api/schemas.test.ts`: `createRoomSchema.safeParse({ playerName: "" })` fails; `createRoomSchema.safeParse({ playerName: "  " })` fails; `createRoomSchema.safeParse({ playerName: "Alice" })` succeeds
- [ ] T011 [P] [US1] Write failing test in `frontend/src/services/api.test.ts`: `api.createRoom("Alice")` response is parsed with `roomSessionResponseSchema` — add assertion that a malformed response (missing `hostId`) throws a Zod error

### Implementation for User Story 1

- [ ] T012 [US1] Update `createRoom()` in `backend/src/services/roomStore.ts` to set `room.hostId = participant.id` on the newly created room (depends on T007, T009)
- [ ] T013 [US1] Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` to include `hostId: room.hostId` in the returned snapshot (depends on T012)
- [ ] T014 [US1] Tighten `createRoomSchema` in `backend/src/api/schemas.ts`: change `playerName` to `z.string().trim().min(1, "Player name is required")` (depends on T010)
- [ ] T015 [P] [US1] Update `frontend/src/services/api.ts` to import `RoomSnapshot`, `RoomSessionResponse`, and `roomSessionResponseSchema` from `shared/schemas/`; parse `createRoom` response with `roomSessionResponseSchema.parse()` (depends on T006, T011)
- [ ] T016 [US1] Add loading state to `frontend/src/pages/CreateRoomPage.tsx`: read `isLoading` from `useRoomState()`, disable submit button and render `<span className="spinner" aria-label="Creating room…" />` while in-flight; add client-side `trim().length === 0` validation with inline `<p className="form__error">` (depends on T015)
- [ ] T017 [US1] Wrap `CreateRoomPage` route in `PageErrorBoundary` in `frontend/src/routes/index.tsx` (depends on T008)

**Checkpoint**: User Story 1 is fully functional. Room creation works end-to-end, hostId is set, form validation fires, loading state shows, lobby displays participant and room code.

---

## Phase 4: User Story 2 — Join an Existing Room via Room Code (Priority: P1)

**Goal**: A second player enters an existing room code and their name, lands in the lobby, and appears in the participant list alongside the host.

**Independent Test**: With a known room code, open `/join-room`, enter the code and a different name, submit — verify the lobby lists both participants. Submit empty code/name — verify inline error messages appear. Submit an unknown code — verify error message and player stays on join screen. Attempt to join a full room (4 participants) — verify a "Room is full" error.

### Tests for User Story 2 (MANDATORY — write and confirm FAIL before implementing)

- [ ] T018 [P] [US2] Write failing test in `backend/src/services/roomStore.test.ts`: after 4 participants join, `joinRoom(code, "Fifth")` returns a result indicating the room is full (not null)
- [ ] T019 [P] [US2] Write failing test in `backend/src/api/schemas.test.ts`: `joinRoomSchema.safeParse({ playerName: "" })` fails; `joinRoomSchema.safeParse({ playerName: "  " })` fails
- [ ] T020 [P] [US2] Write failing test in `frontend/src/services/api.test.ts`: `api.joinRoom()` response is parsed with `roomSessionResponseSchema` — malformed response (missing `hostId`) throws Zod error; 409 response rejects with message "Room is full"

### Implementation for User Story 2

- [ ] T021 [US2] Update `joinRoom()` in `backend/src/services/roomStore.ts` to return a typed discriminated result `{ ok: true; room; participantId } | { ok: false; reason: 'not_found' | 'full' }` — enforce `participants.length >= 4` check (depends on T018)
- [ ] T022 [US2] Update `POST /rooms/:code/join` handler in `backend/src/api/rooms.ts` to handle the new typed result: `reason === 'not_found'` → 404; `reason === 'full'` → 409 `{ message: "Room is full" }` (depends on T021)
- [ ] T023 [US2] Tighten `joinRoomSchema` in `backend/src/api/schemas.ts`: change `playerName` to `z.string().trim().min(1, "Player name is required")` (depends on T019)
- [ ] T024 [P] [US2] Update `frontend/src/services/api.ts` to parse `joinRoom` response with `roomSessionResponseSchema.parse()` from `shared/schemas/` (depends on T006, T020)
- [ ] T025 [US2] Add loading state to `frontend/src/pages/JoinRoomPage.tsx`: read `isLoading` from `useRoomState()`, disable submit button and render spinner while in-flight; add client-side trim validation for both `playerName` and `roomCode` with inline `<p className="form__error">` per field (depends on T024)
- [ ] T026 [US2] Wrap `JoinRoomPage` route in `PageErrorBoundary` in `frontend/src/routes/index.tsx` (depends on T008)

**Checkpoint**: User Stories 1 and 2 are fully functional. Both creation and joining work end-to-end with correct error handling, validation, and loading states.

---

## Phase 5: User Story 3 — Lobby Polling and Host Start Game (Priority: P2)

**Goal**: The lobby auto-refreshes every ~2 seconds; the host sees "Start Game" enabled once ≥ 2 players are present; pressing it navigates all players to the game screen via the `"in-progress"` status signal.

**Independent Test**: Open two browser tabs — Tab A creates a room (host), Tab B joins. Without pressing any button, confirm Tab A's participant list updates within ~2 seconds. Confirm "Start Game" is enabled only in Tab A. Press "Start Game" in Tab A — both tabs navigate to `/game`.

### Tests for User Story 3 (MANDATORY — write and confirm FAIL before implementing)

- [ ] T027 [P] [US3] Write failing tests in `backend/src/services/roomStore.test.ts`: `startRoom(code, hostId)` transitions `room.status` to `"in-progress"`; returns `{ ok: false, reason: 'not_host' }` when participantId ≠ hostId; returns `{ ok: false, reason: 'too_few_players' }` when participants < 2; returns `{ ok: false, reason: 'not_found' }` for unknown code
- [ ] T028 [P] [US3] Write failing test in `backend/src/api/schemas.test.ts`: `startRoomRequestSchema.safeParse({ participantId: "" })` fails; `startRoomRequestSchema.safeParse({ participantId: "uuid" })` succeeds
- [ ] T029 [P] [US3] Write failing test in `frontend/src/services/api.test.ts`: `api.startGame(code, participantId)` sends `POST /rooms/:code/start` with correct body and parses response with `roomResponseSchema`

### Implementation for User Story 3

- [ ] T030 [US3] Add `startRoom(code, participantId)` function to `backend/src/services/roomStore.ts` returning a typed discriminated result `{ ok: true; room } | { ok: false; reason: 'not_found' | 'not_host' | 'too_few_players' }` — transition `room.status` to `"in-progress"` on success (depends on T027)
- [ ] T031 [US3] Add `startRoomRequestSchema` (`z.object({ participantId: z.string().min(1) })`) to `backend/src/api/schemas.ts` (depends on T028)
- [ ] T032 [US3] Add `POST /rooms/:code/start` route handler in `backend/src/api/rooms.ts`: parse body with `startRoomRequestSchema`; call `startRoom()`; map reason → 403/400/404 errors; return `{ room: toRoomSnapshot(room) }` on success (depends on T030, T031)
- [ ] T033 [P] [US3] Add `api.startGame(code: string, participantId: string)` to `frontend/src/services/api.ts`: `POST /rooms/:code/start`, body `{ participantId }`, parse response with `roomResponseSchema` from `shared/schemas/` (depends on T006, T029)
- [ ] T034 [US3] Add `startGame()` async method to `frontend/src/state/roomStore.ts`: calls `api.startGame(room.code, participantId)` using `withLoading()`; updates room snapshot on success (depends on T033)
- [ ] T035 [US3] Rewrite `frontend/src/pages/LobbyPage.tsx` polling loop: replace manual Refresh button with `useEffect` + `setInterval` at 2000ms calling `roomStore.fetchRoom()`; clear interval on unmount; retain participant list on poll error and show non-blocking inline error that clears on next successful poll (depends on T034)
- [ ] T036 [US3] Add host-only "Start Game" button logic to `frontend/src/pages/LobbyPage.tsx`: button enabled only when `participantId === room.hostId` AND `room.participants.length >= 2`; calls `roomStore.startGame()` on click; non-host players see button disabled with `aria-disabled="true"` (depends on T035)
- [ ] T037 [US3] Add auto-navigate logic to `frontend/src/pages/LobbyPage.tsx`: in polling callback, if polled `room.status === "in-progress"`, call `navigate("/game", { replace: true })` (depends on T035)
- [ ] T038 [US3] Wrap `LobbyPage` route in `PageErrorBoundary` in `frontend/src/routes/index.tsx` (depends on T008)

**Checkpoint**: All three user stories are fully functional. Lobby polls automatically, host-only gate works, all players navigate to game on start.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, Zod response parsing for the remaining fetch endpoint, and final validation.

- [ ] T039 [P] Add `aria-live="polite"` to the participant list `<ul>` in `frontend/src/pages/LobbyPage.tsx` so screen readers announce updates
- [ ] T040 [P] Update `frontend/src/services/api.ts` `fetchRoom()` to parse the response body with `roomResponseSchema.parse()` from `shared/schemas/` (ensures all fetch calls are Zod-validated per Principle VI)
- [ ] T041 [P] Update `frontend/src/state/roomStore.ts` `fetchRoom()` to be silent during polling (do not call `withLoading()` which sets `isLoading: true` and triggers a re-render flash; use a direct `api.fetchRoom()` call and update snapshot only on success)
- [ ] T042 [P] Verify both `frontend/` and `backend/` TypeScript compilation pass with `tsc --noEmit` after all changes
- [ ] T043 Run `npm test` in both `backend/` and `frontend/`; confirm all tests pass and coverage is ≥ 80% line/branch; fix any coverage gaps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately; T002 and T003 are parallel
- **Phase 2 (Foundational)**: Depends on Phase 1 completion — T004/T005/T007/T008 are parallel; T006 depends on T005
- **Phase 3 (US1)**: Depends on Phase 2 completion — T009/T010/T011 are parallel; then T012→T013→T014/T015/T016→T017
- **Phase 4 (US2)**: Depends on Phase 2 completion — starts after Phase 2 (can overlap with Phase 3 on different files)
- **Phase 5 (US3)**: Depends on Phases 3 and 4 completion — requires working create/join flow
- **Phase 6 (Polish)**: Depends on Phase 5 completion

### User Story Dependencies

- **US1 (P1)**: Depends only on Foundational phase
- **US2 (P1)**: Depends only on Foundational phase — can proceed in parallel with US1 (different files)
- **US3 (P2)**: Depends on US1 and US2 being complete (polling and start game build on working lobby)

### Within Each User Story

1. Write ALL failing tests first — commit before any production code
2. Extend models/schemas before services
3. Services before route handlers
4. Backend route before frontend API client
5. Frontend API client before page/state changes

### Parallel Opportunities

- **Phase 1**: T002 ‖ T003
- **Phase 2**: T004 ‖ T005 ‖ T007 ‖ T008 (T006 after T005)
- **US1 tests**: T009 ‖ T010 ‖ T011
- **US2 tests**: T018 ‖ T019 ‖ T020
- **US3 tests**: T027 ‖ T028 ‖ T029
- **US1 impl**: T014 ‖ T015 after T012/T013
- **Phase 6**: T039 ‖ T040 ‖ T041 ‖ T042

---

## Parallel Example: User Story 1

```bash
# Step 1 — Run all US1 test tasks together (all write to different files):
Task T009: "Write failing test: createRoom sets hostId in backend/src/services/roomStore.test.ts"
Task T010: "Write failing test: createRoomSchema rejects empty playerName in backend/src/api/schemas.test.ts"
Task T011: "Write failing test: createRoom response Zod parse in frontend/src/services/api.test.ts"

# Step 2 — Implement backend (sequential — same file dependencies):
Task T012: "Update createRoom() to set hostId in backend/src/services/roomStore.ts"
Task T013: "Update toRoomSnapshot() to include hostId in backend/src/services/roomStore.ts"
Task T014: "Tighten createRoomSchema in backend/src/api/schemas.ts"

# Step 3 — Frontend (T015 and T016/T017 can overlap once T006 is ready):
Task T015: "Update api.ts createRoom response Zod parse in frontend/src/services/api.ts"
Task T016: "Add loading state + validation to CreateRoomPage in frontend/src/pages/CreateRoomPage.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004–T008)
3. Complete Phase 3: US1 (T009–T017)
4. **STOP and VALIDATE**: Create a room, reach lobby, verify room code and participant shown
5. Complete Phase 4: US2 (T018–T026)
6. **STOP and VALIDATE**: Join existing room, verify two participants in lobby, verify validation errors
7. Deploy/demo if ready — lobby works without polling or start button

### Incremental Delivery

1. Setup + Foundational → Shared contracts and models ready
2. US1 complete → Room creation works end-to-end (MVP)
3. US2 complete → Multi-player session setup works
4. US3 complete → Live lobby with start-game flow works
5. Polish → Accessibility and coverage confirmed

### Parallel Team Strategy (if 2+ developers)

1. Both complete Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (backend roomStore + api schemas + CreateRoomPage)
   - Developer B: US2 (joinRoom max-players + JoinRoomPage) using shared foundational types
3. US3 begins after both US1 and US2 pass their checkpoints

---

## Notes

- `[P]` tasks touch different files — safe to assign to parallel agents or run concurrently
- TDD is non-negotiable: each test task must produce a failing test before the matching implementation task runs
- After T038 (PageErrorBoundary on all routes), all three pages are wrapped — constitution gate 7 is satisfied
- The `shared/schemas/` directory has no `package.json`; both `backend/` and `frontend/` resolve it via TypeScript `paths` alias and Vite `resolve.alias` — no npm workspace setup required
- `fetchRoom()` polling should NOT set `isLoading: true` (T041) — the loading flag is for user-initiated actions; silent background polls should not flash the UI
- After T022, the `joinRoom()` return type change breaks the existing route handler — T022 must be done immediately after T021
