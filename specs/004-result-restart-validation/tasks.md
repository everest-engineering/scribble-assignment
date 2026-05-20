# Tasks: Result, Restart And Final Validation

**Input**: Design documents from `specs/004-result-restart-validation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Tests**: Manual two-tab testing (per constitution). No test framework.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/models/`, `backend/src/services/`, `backend/src/api/`
- **Frontend**: `frontend/src/components/`, `frontend/src/pages/`, `frontend/src/state/`, `frontend/src/services/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project already initialized from previous scenarios. No setup tasks needed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Data model changes required by ALL user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T001 [P] Add `"result"` to `RoomStatus` type union and `timerDuration` field to `Room` in `backend/src/models/game.ts`
- [ ] T002 [P] Add `timerStartedAt` field to `Round` interface in `backend/src/models/game.ts`

**Checkpoint**: Foundation ready — data model extended for result state and timer.

---

## Phase 3: User Story 1 - All players see round result state (Priority: P1) 🎯 MVP

**Goal**: When a round ends (all guessers correct OR timer expires), all players see the correct word, final scores, full guess history, and final canvas.

**Independent Test**: Start a game as host, draw on canvas, submit guesses until all guessers are correct (or wait for timer). Confirm both tabs show: correct word, scores, guess history with correct/incorrect badges, and the final canvas.

### Implementation for User Story 1

- [ ] T003 [US1] Implement `checkRoundEnd()` in `backend/src/services/roomStore.ts` — checks both all-guessers-correct and timer-expiry triggers; returns `true` if round should end
- [ ] T004 [US1] Integrate `checkRoundEnd()` call into `submitGuess()` in `backend/src/services/roomStore.ts` — transition to result state when all guessers guess correctly
- [ ] T005 [US1] Integrate `checkRoundEnd()` call into `getRoom()` in `backend/src/services/roomStore.ts` — transition to result state when timer expires (runs on every poll)
- [ ] T006 [US1] Expose `secretWord` to all viewers in `toRoomSnapshot()` when room status is `"result"` in `backend/src/services/roomStore.ts`
- [ ] T007 [US1] Create `ResultView` component in `frontend/src/components/ResultView.tsx` — displays correct word, final scores, full guess history, final canvas (read-only), and restart button (host only)
- [ ] T008 [US1] Update `GamePage` in `frontend/src/pages/GamePage.tsx` — detect `room.status === "result"` and render `ResultView` instead of game UI

**Checkpoint**: US1 complete — both tabs show result state after round ends.

---

## Phase 4: User Story 2 - Host restarts the game (Priority: P1)

**Goal**: Host sees a restart button in the result state. On click, all players return to the lobby with players preserved and round state cleared.

**Independent Test**: After round ends (result state), confirm host sees restart button and non-host does not. Click restart — both tabs should show lobby with same players.

### Implementation for User Story 2

- [ ] T009 [US2] Implement `restartGame()` in `backend/src/services/roomStore.ts` — host-only, clears `currentRound`, sets status to `"lobby"`, preserves `participants` and cumulative scores
- [ ] T010 [US2] Add `POST /:code/restart` route in `backend/src/api/rooms.ts` — validate hostId, call `restartGame()`, return updated room snapshot
- [ ] T011 [US2] Add `restartGame()` method to frontend `roomStore` in `frontend/src/state/roomStore.ts` — calls `POST /:code/restart`, updates room state
- [ ] T012 [US2] Add restart button to `ResultView` in `frontend/src/components/ResultView.tsx` — visible only if viewer is host, calls `store.restartGame()`
- [ ] T013 [US2] Update `GamePage` in `frontend/src/pages/GamePage.tsx` — detect `room.status === "lobby"` during polling and navigate to `/lobby`

**Checkpoint**: US2 complete — both tabs return to lobby with players preserved after restart.

---

## Phase 5: User Story 3 - Round state cleared on restart (Priority: P1)

**Goal**: After restart, lobby shows no round data (no canvas, no guesses, no current round scores, no active drawer). Cumulative scores are preserved.

**Independent Test**: Take note of cumulative scores before round ends. After restart, verify lobby has no round data and cumulative scores match.

**Note**: Most of this is satisfied by `restartGame()` in T009. This phase adds verification and edge case handling.

### Implementation for User Story 3

- [ ] T014 [US3] Add `currentRound: null` assertion in `restartGame()` in `backend/src/services/roomStore.ts` — verify round data is fully cleared (strokes, guesses, secretWord, drawerId all gone)
- [ ] T015 [US3] Verify `toRoomSnapshot()` handles `"lobby"` status correctly — `currentRound` is null, `secretWord` not exposed in `frontend/src/services/api.ts` (or related types)
- [ ] T016 [US3] Add cumulative scores preservation check in `restartGame()` — merge round scores into room-level cumulative scores in `backend/src/services/roomStore.ts`

**Checkpoint**: US3 complete — lobby is clean, scores preserved, next game can start fresh.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification and edge case hardening.

- [ ] T017 [P] Add Zod schema for `restartSchema` in `backend/src/api/schemas.ts` — validates `participantId` on restart request
- [ ] T018 Run `npm run build` in `backend/` — verify zero type errors
- [ ] T019 Run `npm run build` in `frontend/` — verify zero type errors
- [ ] T020 Run `quickstart.md` validation — walk through each checklist item
- [ ] T021 Create `manual-test/manual-test-phase4.md` with step-by-step two-tab test scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No tasks needed (project exists from prior scenarios)
- **Foundational (Phase 2)**: Must complete before all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — no dependencies on other stories
- **US2 (Phase 4)**: Depends on Phase 2 + US1 (need result state before restart)
- **US3 (Phase 5)**: Depends on Phase 2 + US2 (restart must work before verifying state cleared)
- **Polish (Phase 6)**: Depends on all stories complete

### User Story Dependencies

- **US1 (P1)**: No dependencies on other stories — start after Phase 2
- **US2 (P1)**: Requires US1 (restart button lives in result state)
- **US3 (P1)**: Requires US2 (verified after restart action)

### Within Each Phase

- Models before services
- Services before endpoints
- Backend before frontend (for new endpoints)
- Story complete before moving to next

### Parallel Opportunities

- T001 and T002 can run in parallel (different model changes)
- T003 and T006 can run in parallel (backend end-check + frontend component)
- T004 and T005 can run in parallel (different integration points for checkRoundEnd)
- T007 and T008 are sequential (create component, then use it)
- T009 and T010 are sequential (service, then route)
- T011 and T012 can run in parallel (roomStore method + UI component)
- T017-T021 all independent

---

## Parallel Example: User Story 1

```bash
# Launch backend model changes and frontend component together:
Task: "T003 Implement checkRoundEnd() in backend/src/services/roomStore.ts"
Task: "T007 Create ResultView component in frontend/src/components/ResultView.tsx"

# Integrate checkRoundEnd into both paths:
Task: "T004 Integrate checkRoundEnd into submitGuess()"
Task: "T005 Integrate checkRoundEnd into getRoom()"
```

---

## Implementation Strategy

### MVP First (Phase 3 Only)

1. Complete Phase 2: Foundational model changes
2. Complete Phase 3: US1 (result state display)
3. **STOP and VALIDATE**: Two-tab test — round ends, result state visible
4. Test works with all-guessers-correct trigger (timer is extra)

### Incremental Delivery

1. Foundational models → data model extended
2. US1: Result state visible on round end → MVP!
3. US2: Host can restart → full cycle complete
4. US3: State cleared on restart → validated
5. Polish: Builds pass, manual tests documented
