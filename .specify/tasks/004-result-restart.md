# Tasks: Result, Restart & Final Validation

**Feature Group**: 004 — Result, Restart & Final Validation
**Input**: `.specify/specs/004-result-restart.md`, `.specify/plans/004-result-restart.md`
**Tests**: Required (specified in plan)

## Format

`[ID] [P?] Description (Spec Ref)`

- **`[P]`**: Can run in parallel with other `[P]` tasks at the same phase level
- **Checkpoints**: Tasks within the same box can be done together; sequential
  arrows show hard dependencies

---

## Phase 1: Backend Model

**Dependency**: None — can start immediately

### 1a — RoomStatus Extension

- **T001** Add `"result"` to `RoomStatus` union in `backend/src/models/game.ts`:
  - Change: `export type RoomStatus = "lobby" | "playing" | "result";`
  - No other model changes — all required fields exist from FG3
  - Spec: FR-001 | AC-001

---

## Phase 2: Backend Service

**Dependencies**: Phase 1 complete

- **T002** Add `endRound` function to `backend/src/services/roomStore.ts`:
  - Signature: `endRound(code: string, requesterId: string)`
  - Return type: discriminated union `{ ok: true, room } | { ok: false, status, message }`
  - Validation chain (in order):
    1. Room exists? → 404 if not
    2. Room status is `"playing"`? → 400 if not
    3. Requester is the host? → 403 if not
  - Transition room status to `"result"` via `updateRoomStatus`
  - Leave all fields in place (secretWord, guesses, scores) — result snapshot must contain full round data
  - Return `{ ok: true, room: cloneRoom(room) }`
  - Spec: FR-001, FR-002, FR-003, FR-004 | AC-001, AC-002, AC-003, AC-004, AC-005

- **T003** Add `restartGame` function to `backend/src/services/roomStore.ts`:
  - Signature: `restartGame(code: string, requesterId: string)`
  - Return type: discriminated union `{ ok: true, room } | { ok: false, status, message }`
  - Validation chain (in order):
    1. Room exists? → 404 if not
    2. Room status is `"result"`? → 400 if not
    3. Requester is the host? → 403 if not
  - Clear round-specific state:
    - `room.secretWord = ""`
    - `room.guesses = []`
    - `room.drawerId = ""`
    - Reset every participant's `score` to 0
  - Transition room status to `"lobby"` via `updateRoomStatus`
  - Participants array is untouched — preserves all players and IDs
  - Return `{ ok: true, room: cloneRoom(room) }`
  - Spec: FR-005, FR-006, FR-007 | AC-006, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013

- **T004** Update `toRoomSnapshot` in `backend/src/services/roomStore.ts`:
  - Current behavior: secret word included only if viewer is the drawer (`isDrawer` check)
  - New logic: if `room.status === "result"`, ALWAYS include `secretWord: room.secretWord` regardless of viewer identity
  - For `"lobby"` and `"playing"` statuses, behavior is unchanged
  - Score and guesses fields are already included from FG3 — no changes needed there
  - Spec: FR-002 | AC-002, AC-003

---

## Phase 3: Backend Routes

**Dependencies**: Phase 2 complete

- **T005** Add `POST /:code/end-round` and `POST /:code/restart` routes in `backend/src/api/rooms.ts`:
  - Import `endRound` and `restartGame` from roomStore (import already includes `toRoomSnapshot` and `startGame`)
  - Route `POST /:code/end-round`:
    - Validate params with `roomCodeParamsSchema`
    - Validate body with `startGameBodySchema` (reuse — has `participantId: string`)
    - Call `endRound(code.toUpperCase(), participantId)`
    - On `!result.ok`: throw `HttpError(result.status, result.message)`
    - On success: `response.json({ room: toRoomSnapshot(result.room, participantId) })`
  - Route `POST /:code/restart`:
    - Validate params with `roomCodeParamsSchema`
    - Validate body with `startGameBodySchema` (reuse)
    - Call `restartGame(code.toUpperCase(), participantId)`
    - On `!result.ok`: throw `HttpError(result.status, result.message)`
    - On success: `response.json({ room: toRoomSnapshot(result.room, participantId) })`
  - No new schemas needed — both routes reuse `startGameBodySchema`
  - Spec: FR-001, FR-005 | AC-001, AC-006, AC-007

---

## Phase 4: Backend Tests

**Dependencies**: Phase 2 and 3 complete

- **T006** Add `endRound` tests in `backend/src/services/roomStore.test.ts`:
  - Test valid transition: playing room + host → status becomes "result", secretWord preserved,
    guesses preserved, scores preserved
  - Test non-host cannot end round: returns 403
  - Test room not in playing state: returns 400
  - Test unknown room code: returns 404
  - Spec: FR-001, FR-002, FR-003, FR-004 | AC-001, AC-002, AC-003, AC-004, AC-005

- **T007** Add `restartGame` and `toRoomSnapshot` tests in `backend/src/services/roomStore.test.ts`:
  - Test valid restart: result room + host → status becomes "lobby", secretWord empty,
    guesses empty, drawerId empty, all scores 0
  - Test participants preserved: same count, same IDs, same names after restart
  - Test non-host cannot restart: returns 403
  - Test room not in result state: returns 400
  - Test unknown room code: returns 404
  - Test toRoomSnapshot reveals secretWord when status is "result" (for both drawer and non-drawer viewers)
  - Test toRoomSnapshot still hides secretWord from non-drawer when status is "playing" (regression)
  - Test toRoomSnapshot hides secretWord from all when status is "lobby" (regression)
  - Spec: FR-002, FR-005, FR-006, FR-007 | AC-002, AC-003, AC-006, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013

- **T008** Run backend test suite: `cd backend && npx vitest run`
  - All existing (FG1 + FG2 + FG3) + new (FG4) tests pass
  - Spec: SC-007

---

## Phase 5: Frontend API + Store

**Dependency**: Phase 1 complete (RoomStatus type defined) — can start in parallel with Phase 2

### 5a — Frontend API Types and Methods

- **T009** Update `frontend/src/services/api.ts`:
  - Add `"result"` to `RoomSnapshot.status` type union:
    `"lobby" | "playing"` → `"lobby" | "playing" | "result"`
  - Run `npx tsc --noEmit` to verify no stale references
  - Spec: FR-001 | AC-001

- **T010** Add `endRound` and `restartGame` methods to API client in `frontend/src/services/api.ts`:
  - `endRound(code, participantId)`:
    - `POST /rooms/{code}/end-round` with `{ participantId }` body
    - Return `{ room: RoomSnapshot }`
  - `restartGame(code, participantId)`:
    - `POST /rooms/{code}/restart` with `{ participantId }` body
    - Return `{ room: RoomSnapshot }`
  - Spec: FR-001, FR-005 | AC-001, AC-006

### 5b — Frontend Store Actions

- **T011** Add `endRound` and `restartGame` actions in `frontend/src/state/roomStore.ts`:
  - `endRound()`:
    - Guard: return null if no room or no participantId
    - Call `api.endRound(room.code, participantId)` via `withLoading`
    - On success: call `setRoomSnapshot(response.room)` to update state
  - `restartGame()`:
    - Guard: return null if no room or no participantId
    - Call `api.restartGame(room.code, participantId)` via `withLoading`
    - On success: call `setRoomSnapshot(response.room)` to update state
    - Return the response so GamePage can navigate to lobby
  - Spec: FR-001, FR-005 | AC-001, AC-006

---

## Phase 6: Frontend GamePage

**Dependencies**: Phase 5 complete (needs store actions and updated types)

- **T012** Add result state view, end-round button, restart button, and lobby auto-navigation in `frontend/src/pages/GamePage.tsx`:
  - Add `useEffect` to navigate to `"/lobby"` when `room?.status === "lobby"` (catches restart via polling)
  - When `room.status === "result"`, render result layout:
    - Show the revealed secret word prominently to all participants (not just drawer)
    - Show the Scoreboard with participants and drawerId (final scores already rendered)
    - Show the ResultPanel with guesses (full history already rendered)
    - Show "Restart Game" button if `isHost` with `onClick` calling `roomStore.restartGame()`
      then navigating to `"/lobby"` on success
    - Show "Waiting for host to restart..." message for non-hosts
    - Hide canvas area, GuessForm, and "Your Secret Word" card (no gameplay in result state)
  - When `room.status === "playing"`, add "End Round" button for host:
    - Render only when `isHost` is true
    - `onClick` calls `roomStore.endRound()`
  - Clear canvas drawing when transitioning to result state (call `clearCanvas` on status change to result)
  - Spec: FR-002, FR-003, FR-004, FR-005, FR-006, FR-007 | AC-002, AC-003, AC-004, AC-005, AC-006, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013, AC-014

---

## Phase 7: Frontend Tests

**Dependencies**: Phase 5 complete (API methods and store actions)

- **T013** Extend `frontend/src/services/api.test.ts`:
  - Test that `endRound` sends POST to `/rooms/{code}/end-round` with `{ participantId }` in body
  - Test that `restartGame` sends POST to `/rooms/{code}/restart` with `{ participantId }` in body
  - Spec: FR-001, FR-005

- **T014** Extend `frontend/src/state/roomStore.test.ts`:
  - Test `endRound` calls API and updates snapshot on success
  - Test `endRound` sets error state on failure
  - Test `restartGame` calls API and updates snapshot on success
  - Test `restartGame` sets error state on failure
  - Spec: FR-001, FR-005 | AC-001, AC-006

---

## Phase 8: Validation Gate

**Dependencies**: All phases complete

### Automated Validation

- **T015** Run full backend test suite: `cd backend && npx vitest run`
  - All FG1 + FG2 + FG3 + FG4 tests pass

- **T016** Run full frontend test suite: `cd frontend && npx vitest run`
  - All FG1 + FG2 + FG3 + FG4 tests pass

- **T017** Run TypeScript compilation check:
  - `cd backend && npx tsc --noEmit`
  - `cd frontend && npx tsc --noEmit`

### Manual Validation

- **T018** Run manual validation scenarios with two browser tabs:

  | # | Scenario | AC |
  |---|----------|----|
  | 1 | Host ends round — result state shown on both tabs within ~3s | AC-001, AC-014 |
  | 2 | Both tabs show the same secret word revealed after round end | AC-002, AC-003 |
  | 3 | Both tabs show same final scores and full guess history in result state | AC-004, AC-005 |
  | 4 | Host clicks "Restart Game" — both tabs navigate to lobby within ~3s | AC-006, AC-014 |
  | 5 | After restart: lobby shows same participants, no secret word, empty guesses, scores at 0, empty drawerId | AC-008, AC-009, AC-010, AC-011, AC-012, AC-013 |
  | 6 | Non-host attempts end round or restart — error message, no transition | AC-007 |
  | 7 | Host starts a new game from lobby after restart — game works normally | SC-005 |
  | 8 | Two separate rooms: result state from Room A not visible in Room B | SC-008 |

---

## Dependency Graph

```
Phase 1 (T001)
    │
    ├────────────────────────────────┐
    ▼                                ▼
Phase 2 (T002-T004)          Phase 5 (T009-T011)
    ▼                                ▼
Phase 3 (T005)                       │
    ▼                                ▼
Phase 4 (T006-T008)           Phase 6 (T012)
    │                                ▼
    │                         Phase 7 (T013-T014)
    └────────────────┬───────────────┘
                     ▼
              Phase 8 (T015-T018)
```

**Total tasks**: 18
**Parallel opportunities**: Phase 5 (frontend API + store) can start after Phase 1 (model type defined), in parallel with Phase 2 (backend service). Both merge into Phase 6 (frontend GamePage). Phases 4 and 7 (tests) depend on their respective implementation phases.

---

## Implementation Sequence

1. **Phase 1** (backend model): 1 task — Add `"result"` to `RoomStatus` union.
2. **Phase 2** (backend service): 3 tasks — `endRound`, `restartGame`, `toRoomSnapshot` update.
3. **Phase 3** (backend routes): 1 task — Two new routes: end-round and restart.
4. **Phase 4** (backend tests): 3 tasks — Tests for endRound, restartGame, toRoomSnapshot.
5. **Phase 5** (frontend API + store): 3 tasks — Update status type, add API methods, add store actions. Can start as soon as Phase 1 is done.
6. **Phase 6** (frontend GamePage): 1 task — Result view, end-round/restart buttons, lobby navigation.
7. **Phase 7** (frontend tests): 2 tasks — API + store tests.
8. **Phase 8** (validation gate): 4 tasks — Full test suites, TypeScript check, manual scenarios.
