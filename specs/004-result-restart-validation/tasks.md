# Tasks: Result, Restart & Final Validation

**Input**: Design documents from `specs/004-result-restart-validation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Tests**: Included — Test-First development is mandatory per project constitution (Principle III).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: User story this task belongs to (US1, US2, US3)
- Exact file paths included in every task description

## Path Conventions

Web application: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup

**Purpose**: Confirm test baseline before changes land

- [ ] T001 Run `cd backend && npm test && cd ../frontend && npm test` and confirm all existing tests pass — establish the green baseline before writing new failing tests

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type and snapshot changes that every user story depends on — must be complete before any story work begins

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 [P] Add `roundScores: Record<string, number>` field to `Room` and `RoomSnapshot` interfaces in `backend/src/models/game.ts`
- [ ] T003 [P] Add `roundScores: Record<string, number>` field to `RoomSnapshot` interface in `frontend/src/services/api.ts`
- [ ] T004 Write failing tests for `toRoomSnapshot()`: (a) includes `roundScores` in returned object; (b) returns non-null `secretWord` to non-drawer viewers when `status === "completed"` in `backend/src/services/roomStore.test.ts`
- [ ] T005 Update `toRoomSnapshot()` to spread `roundScores: { ...room.roundScores }` and change secret word condition to `isDrawer || room.status === "completed"` in `backend/src/services/roomStore.ts` — confirm T004 tests now pass

**Checkpoint**: Foundation ready — shared types updated, snapshot behaviour fixed, tests green. User story phases can now proceed.

---

## Phase 3: User Story 1 — View Round Results (Priority: P1) 🎯 MVP

**Goal**: When a correct guess is submitted, room transitions to `"completed"`, secret word is revealed, and all polling clients navigate to `/results` where they see the correct word, full guess history, and per-round scores.

**Independent Test**: Start a room with 2 players, submit the correct word, and within 3 s both browser windows are on `/results` showing the same correct word, guess list, and score of 100 for the guesser.

### Tests for User Story 1

> **Write these tests FIRST — confirm they FAIL before implementing**

- [ ] T006 [P] [US1] Write failing tests for `submitGuess()` behaviour on correct guess: room `status` becomes `"completed"` and `roundScores[participantId]` is incremented by 100 in `backend/src/services/roomStore.test.ts`
- [ ] T007 [P] [US1] Write failing tests for `ResultsPage`: renders correct word from `room.secretWord`, renders `GuessList` with all guesses, renders `RoundScoreboard` with scores in `frontend/src/pages/ResultsPage.test.tsx`
- [ ] T008 [P] [US1] Write failing test for `GamePage`: navigates to `/results` when `room.status === "completed"` in `frontend/src/pages/GamePage.test.tsx`

### Implementation for User Story 1

- [ ] T009 [US1] Update `submitGuess()`: when `isCorrect`, set `room.status = "completed"` and add `scoreAwarded` to `room.roundScores[participantId]` (initialising to 0 if absent) in `backend/src/services/roomStore.ts` — confirm T006 tests pass
- [ ] T010 [P] [US1] Create `GuessList` component rendering an ordered list of guesses with player name, guess text, and a "Correct!" badge when `isCorrect` is true in `frontend/src/components/GuessList.tsx`
- [ ] T011 [P] [US1] Create `RoundScoreboard` component rendering a table with each participant's name, round score (`roundScores`), and cumulative score (`scores`) in `frontend/src/components/RoundScoreboard.tsx`
- [ ] T012 [US1] Create `ResultsPage`: poll `GET /rooms/:code` every 2 s; display `room.secretWord`, `<GuessList guesses={room.guesses} participants={room.participants} />`, `<RoundScoreboard participants={room.participants} roundScores={room.roundScores} scores={room.scores} />`; navigate to `/` if no room in state in `frontend/src/pages/ResultsPage.tsx` — confirm T007 tests pass
- [ ] T013 [US1] Add `/results` route mapping to `ResultsPage` in `frontend/src/routes/index.tsx`
- [ ] T014 [P] [US1] Add `useEffect` to `GamePage`: navigate to `/results` when `room.status === "completed"` in `frontend/src/pages/GamePage.tsx` — confirm T008 test passes
- [ ] T015 [P] [US1] Add `useEffect` to `LobbyPage`: navigate to `/results` when `room.status === "completed"` in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: US1 fully functional. Both players see `/results` after a correct guess, with correct word, guesses, and scores. Verify with quickstart.md Scenario 1.

---

## Phase 4: User Story 2 — Host Restarts the Game (Priority: P2)

**Goal**: A host-only Restart button on the results screen calls `POST /rooms/:code/restart`, which resets the room to lobby state (preserving players) and all polling clients navigate back to `/lobby`.

**Independent Test**: After completing one round on `/results`, host clicks Restart — within 3 s both windows are on `/lobby` with the same player list and no residual round data.

### Tests for User Story 2

> **Write these tests FIRST — confirm they FAIL before implementing**

- [ ] T016 [P] [US2] Write failing tests for `restartGame()`: (a) returns `null` for non-host caller; (b) sets `status = "lobby"`, clears `drawerId`, `secretWord`, `guesses`, `roundScores`; (c) preserves `participants` and cumulative `scores` in `backend/src/services/roomStore.test.ts`
- [ ] T017 [P] [US2] Write failing test that `POST /rooms/:code/restart` returns HTTP 403 when `participantId` is not the host (use supertest or direct store call) in `backend/src/services/roomStore.test.ts`
- [ ] T018 [P] [US2] Write failing test for `RoomStore.restartGame()`: calls `api.restartGame()` and updates store state to lobby snapshot in `frontend/src/state/roomStore.test.ts`

### Implementation for User Story 2

- [ ] T019 [US2] Add `restartGameSchema = z.object({ participantId: z.string() })` to `backend/src/api/schemas.ts`
- [ ] T020 [US2] Implement `restartGame(code, participantId)`: validate host, set `status = "lobby"`, clear `drawerId/secretWord/guesses/roundScores`, preserve `participants` and `scores`, save and return snapshot in `backend/src/services/roomStore.ts` — confirm T016 tests pass
- [ ] T021 [US2] Add `POST /:code/restart` route: parse `restartGameSchema` from query, guard with 403 on null result, return `{ room: snapshot }` in `backend/src/api/rooms.ts` — confirm T017 test passes
- [ ] T022 [P] [US2] Add `api.restartGame(code, participantId)` method returning `{ room: RoomSnapshot }` in `frontend/src/services/api.ts`
- [ ] T023 [US2] Add `restartGame()` async action to `RoomStore` (calls `api.restartGame()`, calls `setRoomSnapshot()`) in `frontend/src/state/roomStore.ts` — confirm T018 test passes
- [ ] T024 [US2] Add host-only Restart button to `ResultsPage`: render button only when `participantId === room.hostId`; on click call `roomStore.restartGame()` in `frontend/src/pages/ResultsPage.tsx`
- [ ] T025 [US2] Add status-change navigation to `ResultsPage` polling: navigate to `/lobby` when `room.status === "lobby"` in `frontend/src/pages/ResultsPage.tsx`

**Checkpoint**: US2 fully functional. Host can restart from `/results`; all players land on `/lobby` with roster intact. Verify with quickstart.md Scenarios 3 and 5.

---

## Phase 5: User Story 3 — Score Persistence Across Rounds (Priority: P3)

**Goal**: Cumulative scores survive a restart so that after two rounds the results screen shows the sum of both rounds' scores.

**Independent Test**: Play two consecutive rounds (restart between them); results screen after round 2 shows each guesser's cumulative score as the sum of both rounds.

### Tests for User Story 3

> **Write these tests FIRST — confirm they FAIL before implementing**

- [ ] T026 [P] [US3] Write failing test for `startGame()` called on a room that already has non-zero `scores`: `roundScores` is reset to `{}` but `scores` retains its existing values in `backend/src/services/roomStore.test.ts`
- [ ] T027 [P] [US3] Write failing test for `RoundScoreboard` with separate `roundScores` and `scores` props: renders two distinct score columns (round and cumulative) in `frontend/src/components/RoundScoreboard.test.tsx`

### Implementation for User Story 3

- [ ] T028 [US3] Update `startGame()`: replace `room.scores = Object.fromEntries(...)` with conditional logic — only initialise entries that do not already exist; always reset `room.roundScores = Object.fromEntries(room.participants.map((p) => [p.id, 0]))` in `backend/src/services/roomStore.ts` — confirm T026 test passes
- [ ] T029 [US3] Update `RoundScoreboard` to render two labelled columns — "This Round" (from `roundScores`) and "Total" (from `scores`) — in `frontend/src/components/RoundScoreboard.tsx` — confirm T027 test passes

**Checkpoint**: All three user stories functional. Verify with quickstart.md Scenario 4 (cumulative scoring across two rounds).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, security audit, and manual validation

- [ ] T030 [P] Audit `ResultsPage`, `GuessList`, and `RoundScoreboard` for WCAG 2.1 AA compliance: guess list uses `<ul><li>`, scoreboard uses `<table>` with `<th scope>`, Restart button has visible focus ring and `aria-label` — fix any failures in `frontend/src/pages/ResultsPage.tsx`, `frontend/src/components/GuessList.tsx`, `frontend/src/components/RoundScoreboard.tsx`
- [ ] T031 [P] Run `npm audit` in `backend/` and `frontend/`; resolve any high/critical severity findings
- [ ] T032 Run full quickstart.md validation: execute all five scenarios manually, confirm each expected outcome, and confirm `npm test` passes with coverage ≥ 80% in both `backend/` and `frontend/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **blocks all user stories**
  - T002 and T003 are parallel (different files)
  - T004 depends on T002 + T003 (types must exist before writing tests)
  - T005 depends on T004 (TDD: test must fail first)
- **US1 (Phase 3)**: Depends on Phase 2 completion
- **US2 (Phase 4)**: Depends on US1 completion (Restart button lives in ResultsPage)
- **US3 (Phase 5)**: Depends on US2 completion (requires restart flow to test multi-round scoring)
- **Polish (Phase 6)**: Depends on all story phases

### Within Each User Story

| Within Phase | Order Rule |
|---|---|
| Tests T006/T007/T008 | All parallel; write before any implementation |
| T009 | After T006 test fails |
| T010 + T011 | Parallel (different component files); after T007 test fails |
| T012 | After T010 and T011 |
| T013 | After T012 |
| T014 + T015 | Parallel; independent of T012 — can run after T008 |

### Parallel Opportunities

- T002 + T003 (Phase 2 — different files)
- T006 + T007 + T008 (US1 tests — different files)
- T010 + T011 (US1 components — different files)
- T014 + T015 (US1 nav updates — different page files)
- T016 + T017 + T018 (US2 tests — different files)
- T022 (US2 API method — independent of backend impl)
- T026 + T027 (US3 tests — different files)
- T030 + T031 (Polish — accessibility and audit are independent)

---

## Parallel Execution Examples

### User Story 1 — Component phase

```bash
# After T009 completes and T010/T011 tests are failing:
Task A: "Create GuessList in frontend/src/components/GuessList.tsx"         # T010
Task B: "Create RoundScoreboard in frontend/src/components/RoundScoreboard.tsx"  # T011
# Both complete → then T012 ResultsPage
```

### User Story 1 — Navigation phase

```bash
# After T012 + T013 complete:
Task A: "Update GamePage navigation in frontend/src/pages/GamePage.tsx"   # T014
Task B: "Update LobbyPage navigation in frontend/src/pages/LobbyPage.tsx" # T015
```

### User Story 2 — Test phase

```bash
# All failing tests written before any US2 implementation:
Task A: "restartGame() unit tests in backend/src/services/roomStore.test.ts"   # T016
Task B: "HTTP 403 test in backend/src/services/roomStore.test.ts"              # T017
Task C: "RoomStore.restartGame() test in frontend/src/state/roomStore.test.ts" # T018
```

---

## Implementation Strategy

### MVP First (User Story 1 Only — Phases 1–3)

1. Complete Phase 1: baseline check
2. Complete Phase 2: foundational types and snapshot (blocks everything)
3. Complete Phase 3: US1 — results screen visible to all players
4. **STOP and VALIDATE** using quickstart.md Scenario 1
5. Demo/merge if sufficient

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 → Results screen live → validate Scenarios 1, 2 → demo
3. Phase 4 → Restart working → validate Scenarios 3, 5 → demo
4. Phase 5 → Cumulative scores → validate Scenario 4 → demo
5. Phase 6 → Polish → final CI gate pass

### Solo Developer

Work phases sequentially in priority order (Phase 1 → 2 → 3 → 4 → 5 → 6). Within each phase, use the parallel tasks to reduce context-switch cost by batching similar work (e.g., write all tests for a story before writing any implementation).

---

## Notes

- **[P]** = different files, no blocking dependency on an incomplete task in the same phase
- **[USx]** = maps task to user story for traceability to spec.md
- Constitution Principle III is non-negotiable: every test task (T004, T006–T008, T016–T018, T026–T027) MUST be written and confirmed failing BEFORE its corresponding implementation task runs
- `scores` (cumulative) must never be zeroed out after the first `startGame()` call — this is the key invariant for US3
- `secretWord` on a `"completed"` snapshot is non-null for all participants — the drawer can no longer be the only one who sees it
