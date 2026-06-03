# Tasks: Scribble Game Result, Restart & Final Validation

**Input**: Design documents from `specs/004-result-restart-validation/`

**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅

**Tests**: MANDATORY — Vitest ≥ 80% coverage (Constitution Principle III: TDD Red-Green-Refactor). All test tasks MUST be written first and observed to FAIL before production code is written.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in every task description

---

## Phase 1: Setup (Shared Schema & Model Additions)

**Purpose**: Define all wire-format and model changes before any implementation begins (Constitution Principle VI: Contract First). These three tasks block ALL downstream work.

**⚠️ CRITICAL**: No backend or frontend work can begin until this phase is complete.

- [ ] T001 Add `resultExpiresAt: z.string().nullable()` field to `roomSnapshotSchema` in `shared/schemas/room.ts` and add `resultExpiresAt: string | null` to the `RoomSnapshot` interface in `backend/src/models/game.ts`
- [ ] T002 Add `restartRoomSchema` (`{ participantId: z.string().min(1) }`) to `backend/src/api/schemas.ts`
- [ ] T003 Add `resultExpiresAt: string | null` field to the `Room` interface in `backend/src/models/game.ts` (initialised to `null` in `createRoom`)

**Checkpoint**: Schema and model contracts defined — backend service and frontend implementation can now proceed.

---

## Phase 2: Foundational (Backend Service Layer — TDD)

**Purpose**: All backend service changes that US1, US2, and US3 depend on. Must be complete before frontend phases.

**⚠️ CRITICAL**: Write each test task first; confirm it FAILS; then implement the corresponding production code.

### Tests for Foundational Backend (write first — TDD)

- [ ] T004 [P] Write failing tests for `toRoomSnapshot()` revealing `currentWord` to all viewers when `room.status === "finished"` in `backend/src/services/roomStore.test.ts`
- [ ] T005 [P] Write failing tests for `toRoomSnapshot()` populating `resultExpiresAt` from the room model in `backend/src/services/roomStore.test.ts`
- [ ] T006 [P] Write failing tests for `submitGuess()` setting `room.scores[drawerId] += 50 * correctGuessers.size` and `resultExpiresAt` when round transitions to `"finished"` (all-correct path) in `backend/src/services/roomStore.test.ts`
- [ ] T007 [P] Write failing tests for `checkRoundExpiry()` setting drawer score and `resultExpiresAt` when timer expires in `backend/src/services/roomStore.test.ts`
- [ ] T008 [P] Write failing tests for new `checkResultExpiry()` transitioning `room.status` from `"finished"` to `"lobby"` and clearing all round fields when `Date.now() >= resultExpiresAt` in `backend/src/services/roomStore.test.ts`
- [ ] T009 [P] Write failing tests for new `restartRoom()` — host-only guard (`not_host`), `not_finished` guard, and successful reset (participants preserved, round fields cleared, status `"lobby"`) in `backend/src/services/roomStore.test.ts`

### Implementation for Foundational Backend (after tests fail)

- [ ] T010 Update `startRoom()` to initialise `resultExpiresAt: null` on the room in `backend/src/services/roomStore.ts`
- [ ] T011 Update `toRoomSnapshot()` to expose `currentWord` to all viewers when `room.status === "finished"`, and include `resultExpiresAt: room.resultExpiresAt` in the returned snapshot in `backend/src/services/roomStore.ts`
- [ ] T012 Update `submitGuess()` to set `room.scores[drawerId] += 50 * correctGuessers.size` and `room.resultExpiresAt = new Date(Date.now() + 30_000).toISOString()` at the point status transitions to `"finished"` in `backend/src/services/roomStore.ts`
- [ ] T013 Update `checkRoundExpiry()` to set drawer score (`50 * correctGuessers.size`) and `resultExpiresAt` when the timer-expiry transition fires in `backend/src/services/roomStore.ts`
- [ ] T014 Add `checkResultExpiry(room: Room): void` to `backend/src/services/roomStore.ts` — checks `room.status === "finished"` and `Date.now() >= resultExpiresAt`; clears round state; sets `status = "lobby"`
- [ ] T015 Add `restartRoom(code, participantId): RestartRoomResult` to `backend/src/services/roomStore.ts` — host-only, `"finished"`-only guard; clears `drawerId`, `currentWord`, `canvasDataUrl`, `guesses`, `scores`, `correctGuessers`, `roundStartedAt`, `resultExpiresAt`; sets `status = "lobby"`
- [ ] T016 Add `POST /:code/restart` route to `backend/src/api/rooms.ts` using `restartRoomSchema` and `restartRoom()`; return `200 { room: RoomSnapshot }` on success; map `not_found → 404`, `not_host → 403`, `not_finished → 400`

**Checkpoint**: Backend fully implements round-end, drawer scoring, auto-advance, and restart — all service tests pass. Frontend phases can now proceed in parallel.

---

## Phase 3: User Story 1 — View Round Results (Priority: P1) 🎯 MVP

**Goal**: All players see the results screen (correct word + per-round scores + guess history) within 2 seconds of a round ending.

**Independent Test**: End a round (let timer expire or submit correct guess), then confirm all connected players see a results screen showing the secret word, each player's score including drawer's 50-pt bonus, and all guesses that were submitted.

### Tests for User Story 1 (MANDATORY — write first, confirm FAIL)

- [ ] T017 [P] [US1] Write failing test: `ResultsScreen` renders the revealed `currentWord` prominently when given a finished-state room snapshot in `frontend/src/components/ResultsScreen.test.tsx`
- [ ] T018 [P] [US1] Write failing test: `ResultsScreen` renders each participant's name and score from the `scores` map in `frontend/src/components/ResultsScreen.test.tsx`
- [ ] T019 [P] [US1] Write failing test: `GamePage` renders `ResultsScreen` (not the canvas/guess layout) when `room.status === "finished"` in `frontend/src/pages/GamePage.test.tsx`
- [ ] T020 [P] [US1] Write failing accessibility test: axe scan of `ResultsScreen` passes with zero critical/serious violations in `frontend/src/components/ResultsScreen.test.tsx`

### Implementation for User Story 1

- [ ] T021 [US1] Create `ResultsScreen` component in `frontend/src/components/ResultsScreen.tsx` — renders correct word, a score list (participant name + points for each entry in `room.scores`), and a placeholder for guess history (to be wired in US3); accepts `room: RoomSnapshot` and `participantId: string` as props
- [ ] T022 [US1] Update `GamePage.tsx` to conditionally render `<ResultsScreen room={room} participantId={participantId} />` when `room.status === "finished"` and hide the canvas/guess layout

**Checkpoint**: User Story 1 is independently testable — end a round and all players see the results screen with word and scores.

---

## Phase 4: User Story 2 — Host Restarts Game to Lobby (Priority: P2)

**Goal**: Host can manually return all players to lobby from the results screen; if the host is idle, auto-advance fires after 30 seconds. Player list is preserved; all round state is cleared.

**Independent Test**: On the results screen, click "Return to Lobby" as host and confirm all browser tabs return to the lobby with players listed but no round data visible. Separately, wait 30 seconds without clicking — confirm all tabs auto-navigate to lobby.

### Tests for User Story 2 (MANDATORY — write first, confirm FAIL)

- [ ] T023 [P] [US2] Write failing test: `api.restartGame()` sends `POST /rooms/:code/restart` with correct body and parses the `roomResponseSchema` response in `frontend/src/services/api.test.ts`
- [ ] T024 [P] [US2] Write failing test: `ResultsScreen` shows a "Return to Lobby" button only when `participantId === room.hostId`, and calls the provided `onRestart` callback when clicked in `frontend/src/components/ResultsScreen.test.tsx`
- [ ] T025 [P] [US2] Write failing test: `ResultsScreen` renders a countdown when `room.resultExpiresAt` is set, displaying the correct remaining seconds in `frontend/src/components/ResultsScreen.test.tsx`
- [ ] T026 [P] [US2] Write failing test: `GamePage` polling interval continues when `room.status === "finished"` (interval is not cleared) in `frontend/src/pages/GamePage.test.tsx`
- [ ] T027 [P] [US2] Write failing test: `GamePage` calls `navigate("/lobby")` when a polled room snapshot returns `status === "lobby"` in `frontend/src/pages/GamePage.test.tsx`

### Implementation for User Story 2

- [ ] T028 [US2] Add `restartGame(code: string, participantId: string): Promise<RoomResponse>` to `frontend/src/services/api.ts` — `POST /rooms/:code/restart` with Zod parse via `roomResponseSchema`
- [ ] T029 [US2] Add `restartGame()` action to `frontend/src/state/roomStore.ts` — calls `api.restartGame()`, then `setRoomSnapshot()` with the returned room
- [ ] T030 [US2] Add countdown display to `ResultsScreen.tsx` — uses `resultExpiresAt` ISO timestamp to compute `secondsRemaining` via a `setInterval` tick; renders "Returning to lobby in Xs…" with `aria-live="polite"`; stops ticking at 0
- [ ] T031 [US2] Add host-only "Return to Lobby" button to `ResultsScreen.tsx` — visible only when `participantId === room.hostId`; calls `onRestart` prop; `aria-label="Return to lobby now"`
- [ ] T032 [US2] Update `GamePage.tsx` polling `useEffect` to keep the interval alive when `room.status === "finished"` (change condition from `status !== "in-progress"` to `status === "lobby"`)
- [ ] T033 [US2] Add lobby navigation to `GamePage.tsx` — when a polled snapshot returns `status === "lobby"`, call `navigate("/lobby", { replace: true })`

**Checkpoint**: User Story 2 is independently testable — host restart and 30-second auto-advance both return all players to lobby with state cleared.

---

## Phase 5: User Story 3 — Persistent Guess History on Results Screen (Priority: P3)

**Goal**: Results screen shows all guesses in chronological order with player attribution; correct guesses visually distinguished; empty state shown when no guesses were made.

**Independent Test**: Play a round with multiple guesses (including one correct guess). On the results screen, confirm all guesses appear in submission order with the guesser's name, the correct guess is highlighted in green, and submitting no guesses shows the empty state message.

### Tests for User Story 3 (MANDATORY — write first, confirm FAIL)

- [ ] T034 [P] [US3] Write failing test: `ResultsScreen` renders guesses in chronological order with each guesser's name when given a snapshot with multiple guesses in `frontend/src/components/ResultsScreen.test.tsx`
- [ ] T035 [P] [US3] Write failing test: `ResultsScreen` shows an empty state message (e.g., "No guesses were made this round") when `room.guesses` is empty in `frontend/src/components/ResultsScreen.test.tsx`
- [ ] T036 [P] [US3] Write failing test: correct guess entries have the `guess-entry--correct` CSS class (or equivalent) and incorrect entries do not in `frontend/src/components/ResultsScreen.test.tsx`

### Implementation for User Story 3

- [ ] T037 [US3] Add full guess history list to `ResultsScreen.tsx` — renders `room.guesses` in order; each entry shows `participantName` and `text`; applies `guess-entry--correct` class and green colour to `correct: true` entries; shows "No guesses were made this round" empty state when `room.guesses.length === 0`
- [ ] T038 [US3] Remove the guess history placeholder added in T021 and replace it with the full implementation from T037 in `frontend/src/components/ResultsScreen.tsx`

**Checkpoint**: All three user stories independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility hardening, coverage verification, and end-to-end validation.

- [ ] T039 [P] Verify `ResultsScreen` countdown `aria-live="polite"` region and restart button `aria-label` are in place; confirm keyboard tab order reaches restart button in `frontend/src/components/ResultsScreen.tsx`
- [ ] T040 [P] Run `cd backend && npm test` — confirm all tests pass and line/branch coverage ≥ 80%; fix any gaps in `backend/src/services/roomStore.test.ts`
- [ ] T041 [P] Run `cd frontend && npm test` — confirm all tests pass and line/branch coverage ≥ 80%; fix any gaps in `frontend/src/components/ResultsScreen.test.tsx` and `frontend/src/pages/GamePage.test.tsx`
- [ ] T042 Manual playtest per `specs/004-result-restart-validation/quickstart.md` — verify results screen, countdown, host restart, auto-advance, and player-list preservation end-to-end in two browser tabs

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user story phases
- **Phase 3 (US1)**: Depends on Phase 2 — can start as soon as Phase 2 is complete
- **Phase 4 (US2)**: Depends on Phase 2 — can run in parallel with Phase 3 after Phase 2
- **Phase 5 (US3)**: Depends on T021 (ResultsScreen created in Phase 3) — start after T021
- **Phase 6 (Polish)**: Depends on all story phases being complete

### User Story Dependencies

- **US1 (P1)**: Unblocked after Phase 2 complete
- **US2 (P2)**: Unblocked after Phase 2 complete — independent of US1 (different component surface, though same `ResultsScreen` file)
- **US3 (P3)**: Unblocked after T021 (ResultsScreen scaffolded in US1) — extends the same component

### Within Each Phase

1. Write test tasks → confirm they FAIL (Red)
2. Implement production code → confirm tests PASS (Green)
3. Refactor if needed → confirm tests still PASS

### Parallel Opportunities

- All Phase 1 tasks (T001–T003) can run in parallel (different files)
- All Phase 2 test tasks (T004–T009) can run in parallel (same test file, different describe blocks — commit separately)
- After T016 is done: Phase 3 and Phase 4 can proceed in parallel (different files)
- Within Phase 3: T017–T020 (test writing) can run in parallel
- Within Phase 4: T023–T027 (test writing) can run in parallel
- Within Phase 5: T034–T036 (test writing) can run in parallel
- Phase 6 tasks T039–T041 can run in parallel

---

## Parallel Example: Phase 2 Tests

```
Simultaneously write (each in a separate describe block in roomStore.test.ts):
  T004: toRoomSnapshot — word reveal when finished
  T005: toRoomSnapshot — resultExpiresAt field
  T006: submitGuess — drawer scoring + resultExpiresAt on all-correct
  T007: checkRoundExpiry — drawer scoring + resultExpiresAt on timer-expiry
  T008: checkResultExpiry — auto-advance to lobby
  T009: restartRoom — host-only guard + state reset
```

## Parallel Example: User Story 1 + 2 (after Phase 2 complete)

```
Stream A (US1 — results display):
  T017–T020 (write ResultsScreen display tests)
  → T021 (create ResultsScreen component with word + scores)
  → T022 (wire into GamePage)

Stream B (US2 — restart + polling, different files):
  T023–T027 (write restart/polling/nav tests)
  → T028 (api.restartGame)
  → T029 (store restartGame action)
  → T030–T031 (countdown + button in ResultsScreen)
  → T032–T033 (GamePage polling extension + nav)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational — T004–T016 (CRITICAL — blocks all stories)
3. Complete Phase 3: US1 — T017–T022
4. **STOP AND VALIDATE**: End a round; confirm all players see results screen with word and scores
5. Demo / ship US1 increment

### Incremental Delivery

1. Setup + Foundational → backend fully handles round-end
2. US1 → players see results screen (**MVP**)
3. US2 → host restart + auto-advance working
4. US3 → guess history with all formatting
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With two developers after Phase 2 complete:

- **Developer A**: Phase 3 (US1 — ResultsScreen display, GamePage mount)
- **Developer B**: Phase 4 (US2 — restart API, countdown, polling, nav)
- Both merge; **Developer A or B**: Phase 5 (US3 — guess history extension)

---

## Notes

- `[P]` tasks = operate on different files with no shared incomplete dependencies
- `[Story]` label maps each task to its user story for traceability
- Constitution Principle III: TDD is non-negotiable — test files MUST be committed with failing tests before production code is written
- Constitution Principle VI: shared schema changes (Phase 1) MUST precede all implementation
- `ResultsScreen.tsx` is the primary new file — US1 scaffolds it, US2 adds countdown/button, US3 completes the guess history
- `GamePage.tsx` is the integration point — mount `ResultsScreen` (US1) and extend polling (US2) are both in this file; implement US1 change first
