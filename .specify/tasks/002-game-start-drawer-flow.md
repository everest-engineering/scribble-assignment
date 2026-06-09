# Tasks: Game Start & Drawer Flow

**Feature Group**: 002 — Game Start & Drawer Flow
**Input**: `.specify/specs/002-game-start-drawer-flow.md`, `.specify/plans/002-game-start-drawer-flow.md`
**Tests**: Required (specified in plan)

## Format

`[ID] [P?] Description (Spec Ref)`

- **`[P]`**: Can run in parallel with other `[P]` tasks at the same phase level
- **Checkpoints**: Tasks within the same box can be done together; sequential
  arrows show hard dependencies

---

## Phase 1: Backend Model

**Dependency**: None — can start immediately

### 1a — Backend Model Types

- **T001** `[P]` Add `drawerId: string` and `secretWord: string` to `Room`
  interface in `backend/src/models/game.ts`
  - Spec: FR-001, FR-002 | AC-001, AC-002
- **T002** `[P]` Update `RoomSnapshot` interface in
  `backend/src/models/game.ts`:
  - Add `drawerId: string`
  - Add `secretWord?: string`
  - Remove `availableWords: string[]`
  - Remove `roles: ParticipantRole[]`
  - Spec: FR-001, FR-002, FR-003, FR-004 | AC-001, AC-002, AC-003, AC-004, AC-005

---

## Phase 2: Backend Service

**Dependencies**: Phase 1 complete

- **T003** Update `startGame` in `backend/src/services/roomStore.ts`:
  - Set `room.drawerId = room.hostId` after status transition
  - Set `room.secretWord = STARTER_WORDS[0]` (deterministic: first word,
    single round)
  - Preserve existing validation (404/403/400) and status transition
  - Import `STARTER_WORDS` from `starterData.js` at top of file
  - Spec: FR-001, FR-002 | AC-001, AC-002
- **T004** Rework `toRoomSnapshot` in `backend/src/services/roomStore.ts`:
  - Use `viewerParticipantId` parameter (currently voided) for conditional
    word hiding
  - Include `drawerId: room.drawerId` in snapshot unconditionally
  - If `viewerParticipantId === room.drawerId`, include `secretWord: room.secretWord`
  - If `viewerParticipantId !== room.drawerId` or undefined, omit `secretWord`
  - Remove `availableWords` and `roles` from returned object
  - Preserve existing `code`, `status`, `participants`, `hostId` fields
  - Spec: FR-003, FR-004 | AC-003, AC-004, AC-005, AC-006
- **T005** Clean up unused references in `backend/src/services/roomStore.ts`:
  - Remove `listWords` function (no longer called — `toRoomSnapshot` reads
    from `room.secretWord`)
  - Remove `STARTER_ROLES` import (no longer referenced in snapshot)
  - Spec: (cleanup, no direct spec reference)

---

## Phase 3: Backend Routes

**Dependencies**: Phase 2 complete

- **T006** Fix `POST /:code/start` route in `backend/src/api/rooms.ts`:
  - Change `toRoomSnapshot` call: pass `participantId` (the requester from
    parsed body) instead of `result.room.participants[0].id`
  - This ensures the start-game response is correctly tailored to the
    requester's role (drawer sees secret word immediately)
  - Spec: FR-003 | AC-003

---

## Phase 4: Backend Tests

**Dependencies**: Phase 2 and 3 complete

- **T007** Add drawer assignment test in
  `backend/src/services/roomStore.test.ts`:
  - Test that `startGame` sets `drawerId` equal to `hostId`
  - Spec: FR-001 | AC-001
- **T008** Add word selection test in
  `backend/src/services/roomStore.test.ts`:
  - Test that `startGame` sets `secretWord` to `STARTER_WORDS[0]`
  - Import `STARTER_WORDS` in test for assertion
  - Spec: FR-002 | AC-002
- **T009** Add viewer-identity word hiding tests in
  `backend/src/services/roomStore.test.ts`:
  - Test that `toRoomSnapshot` includes `secretWord` when
    `viewerParticipantId` matches `drawerId`
  - Test that `toRoomSnapshot` omits `secretWord` when
    `viewerParticipantId` does NOT match `drawerId`
  - Test that `toRoomSnapshot` omits `secretWord` when
    `viewerParticipantId` is undefined
  - Spec: FR-003 | AC-003, AC-004
- **T010** Add removed-fields test in
  `backend/src/services/roomStore.test.ts`:
  - Test that `toRoomSnapshot` does NOT contain `availableWords` or `roles`
  - Spec: FR-003, FR-004 | AC-003, AC-004, AC-005
- **T011** Run backend test suite: `cd backend && npx vitest run`
  - All existing (FG1) + new (FG2) tests pass

---

## Phase 5: Frontend API Layer

**Dependency**: Phase 1 complete (model types defined) — can start in parallel
with Phase 2

- **T012** Update `RoomSnapshot` type in `frontend/src/services/api.ts`:
  - Add `drawerId: string`
  - Add `secretWord?: string`
  - Remove `availableWords: string[]`
  - Remove `roles: ParticipantRole[]`
  - Remove `ParticipantRole` type export if no other code imports it
  - Run `npx tsc --noEmit` to verify no stale references
  - Spec: FR-001, FR-002, FR-003, FR-004 | AC-001, AC-003, AC-005

---

## Phase 6: Frontend UI

**Dependencies**: Phase 5 complete

### 6a — Lobby Page

- **T013** Add auto-navigation to `/game` in
  `frontend/src/pages/LobbyPage.tsx`:
  - Add `useEffect` that watches `room.status`
  - When `room.status === "playing"`, navigate to `/game`
  - Use a ref or guard to prevent re-navigation if already on `/game`
  - Host already navigates via `startGame()` return; this handles
    non-host participants who detect the transition via polling
  - All participants (including host) navigate to the game view
  - Spec: AC-007

### 6b — Game Page

- **T014** Rework `frontend/src/pages/GamePage.tsx`:
  - Add polling lifecycle:
    - `useEffect` on mount: call `roomStore.startPolling(2000)`
    - Cleanup on unmount: call `roomStore.stopPolling()`
  - Add redirect: if `!room` on mount, navigate to `"/"` (existing behavior)
  - Add drawer identification display:
    - Read `room.drawerId` and compare to `participantId`
    - If drawer: show "You are the drawer!" with the secret word in a
      prominent card; update title to "Draw this word"
    - If not drawer: show "[Drawer name] is drawing"; update title to
      "Guess the Word!" (preserve existing behavior)
  - Preserve existing 3-column layout structure (canvas placeholder,
    sidebar components, exit button)
  - Canvas, GuessForm, Scoreboard, ResultPanel remain as stubs for FG3/FG4
  - Spec: FR-001, FR-003, FR-004 | AC-003, AC-004, AC-005, AC-007

---

## Phase 7: Validation Gate

**Dependencies**: All phases complete

### Automated Validation

- **T015** Run full backend test suite: `cd backend && npx vitest run`
  - All FG1 + FG2 tests pass (21 existing + new)
- **T016** Run full frontend test suite: `cd frontend && npx vitest run`
  - All FG1 + FG2 tests pass
- **T017** Run TypeScript compilation check:
  - `cd backend && npx tsc --noEmit`
  - `cd frontend && npx tsc --noEmit`

### Manual Validation

- **T018** Run manual validation scenarios with two browser tabs:

  | # | Scenario | AC |
  |---|----------|----|
  | 1 | Host starts game with 2+ players — both tabs navigate to `/game` within ~3s | AC-001, AC-007 |
  | 2 | Host tab shows "You are the drawer!" and displays the secret word | AC-003 |
  | 3 | Guesser tab shows the drawer's name and does NOT display the secret word | AC-004, AC-005 |
  | 4 | Both tabs report the same `drawerId` value | AC-005 |
  | 5 | Polling continues in the game view (no console errors, periodic fetches) | AC-007 |
  | 6 | Two separate rooms both in playing state — no cross-room data leakage | AC-013 (FG1) |
  | 7 | Host-only start game with 1 participant (no second tab) — error displayed | AC-022 (FG1) |

---

## Dependency Graph

```
Phase 1 (T001-T002)
    │
    ├─────────────────────┐
    ▼                     ▼
Phase 2 (T003-T005)      Phase 5 (T012)
    ▼
Phase 3 (T006)
    ▼
Phase 4 (T007-T011)
    │                     │
    └──────────┬──────────┘
               ▼
        Phase 6 (T013-T014)
               ▼
        Phase 7 (T015-T018)
```

**Total tasks**: 18
**Parallel opportunities**: T001-T002 (both `[P]`)

---

## Implementation Sequence

1. **Phase 1** (backend model): 2 tasks — Foundation; everything depends on them.
2. **Phase 2** (backend service): 3 tasks — Core logic for drawer assignment and
   word hiding.
3. **Phase 3** (backend routes): 1 task — Fix viewer identity bug in start route.
4. **Phase 4** (backend tests): 5 tasks — Validate backend behavior.
5. **Phase 5** (frontend API): 1 task — Update types to match new model.
   Can start as soon as Phase 1 is done (parallel with Phases 2-4).
6. **Phase 6** (frontend UI): 2 tasks — Lobby auto-navigation and GamePage rework.
7. **Phase 7** (validation gate): 4 tasks — Final verification before declaring
   Feature Group 2 complete.
