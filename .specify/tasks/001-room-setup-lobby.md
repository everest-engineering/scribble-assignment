# Tasks: Room Setup & Lobby

**Feature Group**: 001 — Room Setup & Lobby
**Input**: `.specify/specs/001-room-setup-lobby.md`, `.specify/plans/001-room-setup-lobby.md`
**Tests**: Required (specified in plan)

## Format

`[ID] [P?] Description (Spec Ref)`

- **`[P]`**: Can run in parallel with other `[P]` tasks at the same phase level
- **Checkpoints**: Tasks within the same box can be done together; sequential
  arrows show hard dependencies

---

## Phase 1: Backend Foundation

**Dependency**: None — can start immediately

### 1a — Backend Model

- **T001** `[P]` Add `hostId` to `Room` interface in `backend/src/models/game.ts`
  - Spec: FR-001, FR-009 | AC-001, AC-023
- **T002** `[P]` Add `hostId` to `RoomSnapshot` interface in
  `backend/src/models/game.ts`
  - Spec: FR-009 | AC-023
- **T003** `[P]` Extend `RoomStatus` type to include `"playing"` in
  `backend/src/models/game.ts`
  - Spec: FR-007, FR-008 | AC-020

### 1b — Backend Schemas

- **T004** `[P]` Make `playerName` required (non-empty after trim) in
  `createRoomSchema` in `backend/src/api/schemas.ts`
  - Spec: FR-004 | AC-004, AC-010, AC-011, AC-012
- **T005** `[P]` Make `playerName` required (non-empty after trim) in
  `joinRoomSchema` in `backend/src/api/schemas.ts`
  - Spec: FR-004 | AC-004, AC-010, AC-011, AC-012
- **T006** `[P]` Add `startGameBodySchema` (`{ participantId: string }`) in
  `backend/src/api/schemas.ts`
  - Spec: FR-007
- **T007** `[P]` Add `startGameParamsSchema` (validates `code` param) in
  `backend/src/api/schemas.ts` (can reuse `roomCodeParamsSchema`)
  - Spec: FR-007

### 1c — Backend Service

- **T008** Update `createRoom` in `backend/src/services/roomStore.ts`:
  - Accept required `playerName`
  - Set `hostId` to created participant's ID
  - Spec: FR-001 | AC-001
- **T009** Update `createParticipant` in `backend/src/services/roomStore.ts`:
  - Accept required `name` parameter, remove `displayName` fallback
  - Spec: FR-004 | AC-010
- **T010** Update `joinRoom` in `backend/src/services/roomStore.ts`:
  - Accept required `playerName`
  - Validate against empty/whitespace
  - Trim room code before lookup
  - Spec: FR-002, FR-003, FR-004 | AC-005, AC-006, AC-007, AC-010, AC-011, AC-012
- **T011** Update `toRoomSnapshot` in `backend/src/services/roomStore.ts`:
  - Include `hostId` from room in snapshot
  - Spec: FR-009 | AC-023
- **T012** Add `updateRoomStatus` internal helper in
  `backend/src/services/roomStore.ts`
  - Spec: FR-007 | AC-020
- **T013** Add `startGame` function in `backend/src/services/roomStore.ts`:
  - Validate room exists (404)
  - Validate requester is host (403)
  - Validate 2+ participants (400)
  - Transition status to `"playing"`, update `updatedAt`
  - Return room snapshot
  - Spec: FR-007, FR-008 | AC-020, AC-021, AC-022

---

## Phase 2: Backend Routes

**Dependencies**: Phase 1 complete

- **T014** Update `POST /` route in `backend/src/api/rooms.ts`:
  - `playerName` now required by schema — no handler changes needed beyond
    what schema validation already enforces
  - Spec: FR-001, FR-004 | AC-001, AC-004
- **T015** Update `POST /:code/join` route in `backend/src/api/rooms.ts`:
  - `playerName` now required
  - Error messages distinguish "room not found" vs "invalid code"
  - Spec: FR-002, FR-003, FR-004 | AC-005, AC-006, AC-007, AC-009
- **T016** Add `POST /:code/start` route in `backend/src/api/rooms.ts`:
  - Validate body with `startGameBodySchema`
  - Call `startGame` from roomStore
  - Return `200 { room: RoomSnapshot }` on success
  - Return `404`/`403`/`400` with message on failure
  - Spec: FR-007, FR-008 | AC-020, AC-021, AC-022

---

## Phase 3: Backend Tests

**Dependencies**: Phase 1 and 2 complete

- **T017** Extend `backend/src/api/schemas.test.ts`:
  - Test that empty `playerName` is rejected for create and join schemas
  - Test that whitespace-only `playerName` is rejected
  - Test that valid `playerName` passes
  - Spec: FR-004 | AC-004, AC-010, AC-011, AC-012
- **T018** Extend `backend/src/services/roomStore.test.ts`:
  - Test that `createRoom` sets correct `hostId`
  - Test that `joinRoom` returns null for unknown code
  - Test that `joinRoom` accepts valid names
  - Spec: FR-001, FR-002 | AC-001, AC-002, AC-006
- **T019** Add `startGame` tests in `backend/src/services/roomStore.test.ts`:
  - Test start succeeds for host with 2+ participants
  - Test start fails for non-host participant (403)
  - Test start fails with fewer than 2 participants (400)
  - Test start fails for unknown room code (404)
  - Test start transitions room status to `"playing"`
  - Spec: FR-007, FR-008 | AC-020, AC-021, AC-022
- **T020** Run backend test suite: `cd backend && npx vitest run`
  - All existing + new tests pass

---

## Phase 4: Frontend API Layer

**Dependency**: Backend routes merged (Phase 2)

- **T021** Update `RoomSnapshot` type in `frontend/src/services/api.ts`:
  - Add `hostId: string`
  - Spec: FR-009 | AC-023
- **T022** Update `RoomStatus` type in `frontend/src/services/api.ts`:
  - Add `"playing"` to the union
  - Spec: FR-007
- **T023** Add `startGame` method to API client in
  `frontend/src/services/api.ts`:
  - `POST /rooms/{code}/start` with `{ participantId }` body
  - Return `{ room: RoomSnapshot }`
  - Spec: FR-007 | AC-020, AC-021, AC-022

---

## Phase 5: Frontend Store

**Dependency**: Phase 4 complete

- **T024** Add `startGame` action in `frontend/src/state/roomStore.ts`:
  - Call `api.startGame(room.code, participantId)`
  - On success: update room snapshot, return room
  - On error: set error state with server message
  - Spec: FR-007, FR-008 | AC-020, AC-021, AC-022
- **T025** Add polling lifecycle in `frontend/src/state/roomStore.ts`:
  - `startPolling(intervalMs: number)` — sets `setInterval` calling
    `fetchRoom` on each tick
  - `stopPolling()` — clears the interval
  - Internal `isPollingInFlight` flag: skip tick if a request is outstanding
  - Polling errors: set error state but do not stop the interval
  - Spec: FR-006 | AC-016, AC-017, AC-018, AC-019

---

## Phase 6: Frontend UI

**Dependencies**: Phase 5 complete

### 6a — Lobby Page

- **T026** Add polling lifecycle to `frontend/src/pages/LobbyPage.tsx`:
  - `useEffect` on mount: call `roomStore.startPolling(2000)`
  - Cleanup on unmount: call `roomStore.stopPolling()`
  - Spec: FR-006 | AC-016
- **T027** Add host badge display in `frontend/src/pages/LobbyPage.tsx`:
  - Compare each participant's ID to `room.hostId`
  - Show "(Host)" badge next to the host participant
  - Spec: FR-009 | AC-023
- **T028** Replace unconditional start navigation in
  `frontend/src/pages/LobbyPage.tsx`:
  - Remove `navigate("/game")` from the "Start Game" button
  - Call `roomStore.startGame()` on click
  - Only navigate to `/game` on success
  - Spec: FR-007 | AC-020
- **T029** Gate "Start Game" visibility in
  `frontend/src/pages/LobbyPage.tsx`:
  - Hide or disable "Start Game" for non-host participants
  - Show "Start Game" as disabled for host when < 2 players, with a
    message indicating minimum requirement
  - Spec: FR-007, FR-008 | AC-021, AC-022
- **T030** Display start-game errors in
  `frontend/src/pages/LobbyPage.tsx`:
  - Show error message inline when start fails (not host, too few players)
  - Spec: FR-007, FR-008 | AC-021, AC-022
- **T031** Remove manual "Refresh Room" button from
  `frontend/src/pages/LobbyPage.tsx`
  - Spec: FR-006 (manual refresh no longer needed)

### 6b — Create Room Page

- **T032** Add client-side name validation in
  `frontend/src/pages/CreateRoomPage.tsx`:
  - Trim input before submission
  - Reject empty/whitespace-only names with inline error message
  - Spec: FR-004 | AC-010, AC-012

### 6c — Join Room Page

- **T033** Add client-side name validation in
  `frontend/src/pages/JoinRoomPage.tsx`:
  - Trim input before submission
  - Reject empty/whitespace-only names with inline error message
  - Spec: FR-004 | AC-010, AC-012
- **T034** Add client-side room code validation in
  `frontend/src/pages/JoinRoomPage.tsx`:
  - Reject empty room code with inline error message
  - Trim whitespace from code before submission
  - Spec: FR-003 | AC-007

---

## Phase 7: Frontend Tests

**Dependencies**: Phase 4 and 5 complete

- **T035** Extend `frontend/src/services/api.test.ts`:
  - Test that `startGame` sends POST to `/rooms/{code}/start` with
    `participantId` in body
  - Spec: FR-007
- **T036** Add `frontend/src/state/roomStore.test.ts`:
  - Test `startGame` calls API and updates snapshot on success
  - Test `startGame` sets error state on failure
  - Test `startPolling` and `stopPolling` lifecycle
  - Spec: FR-006, FR-007 | AC-016, AC-018, AC-020
- **T037** Run frontend test suite: `cd frontend && npx vitest run`
  - All existing + new tests pass

---

## Phase 8: Validation Gate

**Dependencies**: All tasks complete

### Automated Validation

- **T038** Run full backend test suite: `cd backend && npx vitest run`
- **T039** Run full frontend test suite: `cd frontend && npx vitest run`
- **T040** Run TypeScript compilation check:
  - `cd backend && npx tsc --noEmit`
  - `cd frontend && npx tsc --noEmit`

### Manual Validation

- **T041** Run manual validation scenarios with two browser tabs:

  | # | Scenario | AC |
  |---|----------|----|
  | 1 | Tab A creates room — sees host badge next to name | AC-001, AC-023 |
  | 2 | Tab B joins with valid code — Tab A sees new player within ~3s | AC-005, AC-016, AC-017 |
  | 3 | Tab B clicks Start Game — sees error (only host can start) | AC-021 |
  | 4 | Tab A clicks Start Game with only self — sees error (need 2+) | AC-022 |
  | 5 | Enter invalid room code — clear error message | AC-006 |
  | 6 | Enter empty room code — clear error message | AC-007 |
  | 7 | Enter empty name on create — clear error message | AC-004 |
  | 8 | Enter empty name on join — clear error message | AC-012 |
  | 9 | Create Room A and Room B — no cross-room data leakage | AC-013 |
  | 10 | Disconnect network during polling — error shown, polling recovers | AC-018 |

---

## Dependency Graph

```
Phase 1a (T001-T003) ──┐
Phase 1b (T004-T007) ──┤
Phase 1c (T008-T013) ──┘
                        │
                        ▼
                 Phase 2 (T014-T016)
                        │
                        ▼
                 Phase 3 (T017-T020)
                        │
                        ▼
                 Phase 4 (T021-T023)
                        │
                        ▼
                 Phase 5 (T024-T025)
                        │
                        ├─────────────────┐
                        ▼                 ▼
                Phase 6a (T026-T031)   Phase 7 (T035-T037)
                Phase 6b (T032)
                Phase 6c (T033-T034)
                        │                 │
                        └────────┬────────┘
                                 ▼
                        Phase 8 (T038-T041)
```

**Total tasks**: 41
**Parallel opportunities**: T001-T003 (all `[P]`), T004-T007 (all `[P]`)

---

## Implementation Sequence

1. **Phase 1a–1c** (backend model + schemas + service): 13 tasks
   — These are the foundation; everything depends on them.
2. **Phase 2** (backend routes): 3 tasks — Wire endpoints after service
   logic is ready.
3. **Phase 3** (backend tests): 4 tasks — Validate backend before
   touching frontend.
4. **Phase 4** (frontend API): 3 tasks — Client must match new endpoint
   shape.
5. **Phase 5** (frontend store): 2 tasks — Polling and startGame actions
   are the core frontend logic.
6. **Phase 6a–6c** (frontend UI): 9 tasks — All UI changes across three
   pages.
7. **Phase 7** (frontend tests): 3 tasks — Validate frontend changes.
8. **Phase 8** (validation gate): 4 tasks — Final verification before
   declaring Feature Group 1 complete.
