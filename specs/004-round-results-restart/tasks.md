# Tasks: Round Results & Restart

**Input**: Design documents from `/specs/004-round-results-restart/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/rooms.openapi.yaml`, `quickstart.md`

**Tests**: Focused backend and frontend tests are included because this feature changes room lifecycle state, result visibility, command permissions, restart behavior, and client polling.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and has no direct dependency on another incomplete task
- **[Story]**: User story label from `spec.md` (`US1`, `US2`, `US3`)
- Include exact file paths in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm project validation surfaces before lifecycle work begins.

- [ ] T001 [P] Confirm backend test and build scripts for this feature in `backend/package.json`
- [ ] T002 [P] Confirm frontend test and build scripts for this feature in `frontend/package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared result-state types and contracts required by all stories.

**Critical**: No user story work should begin until this phase is complete.

- [ ] T003 Update backend game models for `results` room status, Host identity, `RoundResult`, `FinalScore`, result-aware snapshots, and restart command responses in `backend/src/models/game.ts`
- [ ] T004 [P] Add Zod schemas for result-aware room snapshots, restart requests, and result-state conflict responses in `backend/src/api/schemas.ts`
- [ ] T005 Update backend room snapshot conversion to include `roundResult`, Host flags, result status, and null active-round state after restart in `backend/src/services/roomStore.ts`
- [ ] T006 [P] Update frontend API DTOs for `results` status, `RoundResult`, `FinalScore`, result-aware participants, and restart responses in `frontend/src/services/api.ts`
- [ ] T007 Update frontend room store state shape for result snapshots, restart command state, polling errors, and result feedback in `frontend/src/state/roomStore.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - View Round Results (Priority: P1) - MVP

**Goal**: Current players can see the correct word, final scores, and complete valid guess history when a round ends.

**Independent Test**: End an active round with a drawer and guesser, then confirm each current player sees the same correct word, final scores, and ordered valid guess history.

### Tests for User Story 1

- [ ] T008 [P] [US1] Add backend service tests for capturing `RoundResult` with correct word, final scores, ordered guess history, zero-point players, and empty guess history in `backend/src/services/roomStore.test.ts`
- [ ] T009 [P] [US1] Add frontend API tests for polling a room snapshot that includes `status: "results"` and `roundResult` in `frontend/src/services/api.test.ts`

### Implementation for User Story 1

- [ ] T010 [US1] Implement the active-round-to-results transition that captures an immutable result snapshot in `backend/src/services/roomStore.ts`
- [ ] T011 [US1] Ensure `GET /rooms/:code` returns result snapshots with correct word, final scores, and guess history for all current players in `backend/src/api/rooms.ts`
- [ ] T012 [US1] Add frontend result snapshot parsing and fetch handling for polled results in `frontend/src/services/api.ts`
- [ ] T013 [US1] Add frontend room store handling for transitioning from active play to result state after polling in `frontend/src/state/roomStore.ts`
- [ ] T014 [US1] Render the correct word and complete ordered guess history in `frontend/src/components/ResultPanel.tsx`
- [ ] T015 [US1] Render final scores, including zero-point players, in `frontend/src/components/Scoreboard.tsx`
- [ ] T016 [US1] Show the result view from the game page when room status is `results` in `frontend/src/pages/GamePage.tsx`
- [ ] T017 [US1] Add result-view, final-score, correct-word, and guess-history styling in `frontend/src/styles/app.css`

**Checkpoint**: User Story 1 is functional and testable independently.

---

## Phase 4: User Story 2 - Keep Results Consistent and Final (Priority: P1)

**Goal**: Ended-round results remain consistent across polling clients and cannot be changed by late drawing, clearing, guessing, joining, refresh, or reconnect attempts.

**Independent Test**: End a round in two client sessions, confirm both show identical results after polling, then verify late draw, clear, guess, and join attempts leave results unchanged.

### Tests for User Story 2

- [ ] T018 [US2] Add backend service tests for immutable result snapshots, rejected draw/clear/guess attempts during results, rejected joins during results, and refresh-stable result polling in `backend/src/services/roomStore.test.ts`
- [ ] T019 [P] [US2] Add backend schema tests for result-state conflict payloads and viewer query validation in `backend/src/api/schemas.test.ts`
- [ ] T020 [P] [US2] Add frontend API tests for result polling consistency and result-state conflict errors from draw, clear, guess, and join requests in `frontend/src/services/api.test.ts`

### Implementation for User Story 2

- [ ] T021 [US2] Add result-state guards that reject drawing, clearing, guessing, and joining without mutating `roundResult` in `backend/src/services/roomStore.ts`
- [ ] T022 [US2] Map result-state draw, clear, guess, and join conflicts to clear HTTP conflict responses in `backend/src/api/rooms.ts`
- [ ] T023 [US2] Ensure polled result snapshots are stable across refreshes and reconnects until Host restart in `backend/src/services/roomStore.ts`
- [ ] T024 [US2] Add frontend API conflict handling for ended-round draw, clear, guess, and join attempts in `frontend/src/services/api.ts`
- [ ] T025 [US2] Preserve result view state during polling failures and reconnect-safe refreshes in `frontend/src/state/roomStore.ts`
- [ ] T026 [US2] Disable or hide drawing and guessing controls while results are displayed in `frontend/src/pages/GamePage.tsx`
- [ ] T027 [US2] Surface ended-round action feedback in the guess form area without submitting guesses in `frontend/src/components/GuessForm.tsx`
- [ ] T028 [US2] Add disabled-control, conflict-feedback, and polling-status styling for result state in `frontend/src/styles/app.css`

**Checkpoint**: User Story 2 is functional and testable independently.

---

## Phase 5: User Story 3 - Restart from Results as Host (Priority: P1)

**Goal**: Only the Host can restart from results, returning all current players to lobby while preserving membership and clearing all round-specific state.

**Independent Test**: End a round, verify non-host restart is rejected, restart as Host, then confirm all players return to lobby with membership and Host identity preserved and prior round data reset.

### Tests for User Story 3

- [ ] T029 [US3] Add backend service tests for Host-only restart, non-host rejection, missing-result rejection, membership preservation, Host preservation, result reset, current-round reset, and post-restart join allowance in `backend/src/services/roomStore.test.ts`
- [ ] T030 [P] [US3] Add backend schema tests for restart request payload validation in `backend/src/api/schemas.test.ts`
- [ ] T031 [P] [US3] Add frontend API tests for `POST /rooms/:code/restart` success, forbidden restart, and conflict responses in `frontend/src/services/api.test.ts`

### Implementation for User Story 3

- [ ] T032 [US3] Implement Host-only `restartGame` service behavior that returns the room to lobby and clears round-specific state in `backend/src/services/roomStore.ts`
- [ ] T033 [US3] Wire `POST /rooms/:code/restart` with request validation, Host authorization, conflict handling, and updated room snapshots in `backend/src/api/rooms.ts`
- [ ] T034 [US3] Add frontend `restartGame` API method and response types in `frontend/src/services/api.ts`
- [ ] T035 [US3] Add frontend room store restart method, Host-only command state, success snapshot update, and restart error feedback in `frontend/src/state/roomStore.ts`
- [ ] T036 [US3] Render a Host-only restart action and non-host waiting state in the result view in `frontend/src/components/ResultPanel.tsx`
- [ ] T037 [US3] Route all current players from result view back to lobby after restart polling updates the room to lobby in `frontend/src/pages/GamePage.tsx`
- [ ] T038 [US3] Ensure lobby view displays preserved players and Host identity after restart in `frontend/src/pages/LobbyPage.tsx`
- [ ] T039 [US3] Add restart button, non-host waiting, and restart feedback styling in `frontend/src/styles/app.css`

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete feature and confirm project constraints.

- [ ] T040 [P] Run backend tests and build for the completed feature using `backend/package.json`
- [ ] T041 [P] Run frontend tests and build for the completed feature using `frontend/package.json`
- [ ] T042 Validate the two-browser result, finality, restart, membership preservation, and reset flow from `specs/004-round-results-restart/quickstart.md`
- [ ] T043 Confirm no WebSockets, databases, authentication, sessions, push protocols, or unrelated dependencies were introduced by reviewing `backend/package.json` and `frontend/package.json`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: No dependencies.
- **Phase 2 Foundational**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 US1**: Depends on Phase 2 and is the MVP slice.
- **Phase 4 US2**: Depends on Phase 2 and should follow or coordinate with US1 because it hardens result snapshots.
- **Phase 5 US3**: Depends on Phase 2 and should follow US1 because restart begins from visible results.
- **Phase 6 Polish**: Depends on all selected user stories being complete.

### User Story Dependencies

- **US1 View Round Results**: No dependency on US2 or US3 after foundation.
- **US2 Keep Results Consistent and Final**: Builds on the result state from US1 but remains independently testable through service guards and polling snapshots.
- **US3 Restart from Results as Host**: Builds on the result state from US1 and can be tested without US2 UI hardening if service restart behavior is available.

### Within Each User Story

- Write story tests before implementation and confirm they fail for the intended behavior.
- Backend models and schemas precede service commands.
- Service behavior precedes REST route integration.
- REST and DTO updates precede frontend store wiring.
- Store wiring precedes page/component integration.
- Validate each story at its checkpoint before moving to the next story.

---

## Parallel Opportunities

- T001 and T002 can run in parallel.
- T004 and T006 can run in parallel after T003 is understood because they touch backend schemas and frontend DTOs separately.
- T008 and T009 can run in parallel for US1 tests.
- T019 and T020 can run in parallel while T018 covers backend service behavior for US2.
- T030 and T031 can run in parallel while T029 covers backend service behavior for US3.
- T040 and T041 can run in parallel after implementation.
- US2 and US3 can be implemented in parallel after US1 result-state contracts are stable if backend route ownership is coordinated.

---

## Parallel Example: User Story 1

```bash
# Run these task streams together after Phase 2:
Task T008: "Add backend service tests for capturing RoundResult in backend/src/services/roomStore.test.ts"
Task T009: "Add frontend API tests for polling result snapshots in frontend/src/services/api.test.ts"
```

---

## Parallel Example: User Story 2

```bash
# Run these task streams together after US1 result state exists:
Task T019: "Add backend schema tests for result-state conflicts in backend/src/api/schemas.test.ts"
Task T020: "Add frontend API tests for result-state conflict errors in frontend/src/services/api.test.ts"
```

---

## Parallel Example: User Story 3

```bash
# Run these task streams together after US1 result state exists:
Task T030: "Add backend schema tests for restart request payloads in backend/src/api/schemas.test.ts"
Task T031: "Add frontend API tests for restart responses in frontend/src/services/api.test.ts"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 setup.
2. Complete Phase 2 foundation.
3. Complete Phase 3 User Story 1.
4. Validate that ended rounds show correct word, final scores, and complete guess history consistently enough for a result view demo.

### Incremental Delivery

1. Deliver US1 for visible round results.
2. Deliver US2 for immutable, polling-consistent results and ended-round action rejection.
3. Deliver US3 for Host-only restart, preserved membership, and reset round state.
4. Run automated validation and the quickstart flow.

### Independent Test Criteria

- **US1**: End a round with a drawer and guesser, then confirm all current players can see the correct word, final scores, and ordered valid guess history.
- **US2**: After results appear, confirm polling clients show identical results and late draw, clear, guess, and join attempts do not change those results.
- **US3**: From results, confirm non-host restart fails, Host restart returns all current players to lobby, membership and Host identity remain, and prior round data is absent.

---

## Notes

- Keep synchronization on HTTP REST commands plus polling only.
- Keep all room, round, result, and restart state in memory only.
- Do not add authentication, sessions, databases, WebSockets, server-sent events, timers, automatic round-end triggers, historical result retention, player removal, or automatic next-round start.
- Preserve current-player result visibility and clear all round-specific state on restart.
