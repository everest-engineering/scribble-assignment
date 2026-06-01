# Tasks: Result & Restart Flow

**Input**: Design documents from `/specs/004-result-restart/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/http-api.md, quickstart.md

**Tests**: Scenario 4 is quality-critical. Write tests first for result and restart behavior, then implement.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files or does not depend on incomplete tasks
- **[Story]**: Maps to the user story from spec.md
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm Scenario 4 design artifacts and baseline behavior before implementation.

- [ ] T001 Review the Scenario 4 spec, plan, and API contract in `specs/004-result-restart/spec.md`, `specs/004-result-restart/plan.md`, and `specs/004-result-restart/contracts/http-api.md`
- [ ] T002 Run backend baseline tests in `backend/` with `npm test`
- [ ] T003 Run frontend baseline tests in `frontend/` with `npm test`
- [ ] T004 Confirm result/restart state model and round snapshot expectations in `specs/004-result-restart/data-model.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add backend room state, API contract support, and snapshot behavior required by result and restart flows.

- [ ] T005 Update `backend/src/models/game.ts` to add `Round.status`, `Round.result`, and `Room.gameState` supporting `finished`
- [ ] T006 Update `backend/src/models/game.ts` to ensure `RoundSnapshot` includes `guessHistory`, `secretWord`, and result metadata for finished rounds
- [ ] T007 Extend `backend/src/services/roomStore.ts` to preserve participant list and host identity while supporting finished round state
- [ ] T008 Add restart transition logic to `backend/src/services/roomStore.ts` with a new `restartRoom(code, participantId)` service method
- [ ] T009 Add or update `backend/src/api/rooms.ts` to expose finished room snapshots in `GET /rooms/:code` and to support `POST /rooms/:code/restart`
- [ ] T010 Add any request validation needed for restart authorization in `backend/src/api/schemas.ts`
- [ ] T011 Add backend tests in `backend/src/services/roomStore.test.ts` for finished room snapshots, restart transitions, and participant preservation
- [ ] T012 Add API-level tests in `backend/src/api/rooms.test.ts` or `backend/src/api/schemas.test.ts` to validate restart authorization and finished-state behavior
- [ ] T013 Update `frontend/src/services/api.ts` to add `restartRoom(code, participantId)` and handle finished room snapshots from `GET /rooms/:code`

**Checkpoint**: Backend and frontend have the core model and API support necessary for a shared result state and restart.

---

## Phase 3: User Story 1 - Display Round Results to All Players (Priority: P1)

**Goal**: Render a shared final result screen for every player after a round finishes.

**Independent Test**: After a round ends, two browser tabs should both display the same result screen with correct word, final scores, and guess history.

### Tests for User Story 1

- [ ] T014 [P] [US1] Add frontend component tests for `ResultPanel` in `frontend/src/components/ResultPanel.test.tsx`
- [ ] T015 [P] [US1] Add frontend page tests for finished `GamePage` rendering in `frontend/src/pages/GamePage.test.tsx`

### Implementation for User Story 1

- [ ] T016 [P] [US1] Create `frontend/src/components/ResultPanel.tsx` to display the secret word, ordered guess history, and final score summary
- [ ] T017 [US1] Update `frontend/src/pages/GamePage.tsx` to render `ResultPanel` when `room.gameState === "finished"`
- [ ] T018 [US1] Ensure `frontend/src/state/roomStore.ts` continues polling and refreshes finished room snapshots correctly
- [ ] T019 [US1] Add result UI copy and styling for finished state in `frontend/src/styles/app.css` if needed

**Checkpoint**: The result view is shared, visible in the UI, and renders data from the finished room snapshot.

---

## Phase 4: User Story 2 - Restart the Game from the Result State (Priority: P1)

**Goal**: Let the host restart the game from the result screen, clearing round state and returning all players to the lobby.

**Independent Test**: The host clicks restart on the result screen and both browser tabs return to the lobby with the same player list.

### Tests for User Story 2

- [ ] T020 [P] [US2] Add frontend tests for restart button visibility and interaction in `frontend/src/components/ResultPanel.test.tsx`
- [ ] T021 [P] [US2] Add frontend state tests for restart transition in `frontend/src/state/roomStore.test.ts`

### Implementation for User Story 2

- [ ] T022 [US2] Add host-only restart control to `frontend/src/components/ResultPanel.tsx`
- [ ] T023 [US2] Implement restart action handling in `frontend/src/state/roomStore.ts` using `api.restartRoom`
- [ ] T024 [US2] Update `frontend/src/pages/GamePage.tsx` and lobby navigation logic to return players to the lobby on successful restart
- [ ] T025 [US2] Ensure non-host players cannot trigger restart and see no restart control in `frontend/src/components/ResultPanel.tsx`
- [ ] T026 [US2] Add backend route tests to `backend/src/api/rooms.test.ts` validating `POST /rooms/:code/restart` for host-only restart and finished-state requirements

**Checkpoint**: Host restart is functional, lobby transition works for all players, and non-hosts cannot restart.

---

## Phase 5: User Story 3 - Preserve Room Participants Across Restart (Priority: P2)

**Goal**: Keep the same participant list when the room restarts so players do not need to rejoin.

**Independent Test**: After restart, the lobby in both browser tabs shows the same participants as before restart.

### Tests for User Story 3

- [ ] T027 [P] [US3] Add backend tests in `backend/src/services/roomStore.test.ts` confirming participants remain unchanged after restart
- [ ] T028 [P] [US3] Add frontend store tests in `frontend/src/state/roomStore.test.ts` verifying participant preservation and lobby refresh after restart

### Implementation for User Story 3

- [ ] T029 [US3] Ensure `backend/src/services/roomStore.ts` clears only round-specific state and preserves `participants` and `hostId` during restart
- [ ] T030 [US3] Ensure `backend/src/api/rooms.ts` returns a lobby snapshot with the same participant list after restart
- [ ] T031 [US3] Ensure `frontend/src/state/roomStore.ts` preserves participant state across restart and refreshes the lobby snapshot
- [ ] T032 [US3] Validate lobby UI in `frontend/src/pages/LobbyPage.tsx` if needed to show the preserved participants after restart

**Checkpoint**: Restart preserves players and returns everyone to a clean lobby state.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, validation, and documentation across Scenario 4.

- [ ] T033 [P] Update `specs/004-result-restart/quickstart.md` with any final manual validation instructions after implementation
- [ ] T034 [P] Update `specs/004-result-restart/contracts/http-api.md` if endpoint request/response details changed during implementation
- [ ] T035 [P] Run backend tests and build in `backend/`
- [ ] T036 [P] Run frontend tests and build in `frontend/`
- [ ] T037 [P] Perform manual two-browser validation using `specs/004-result-restart/quickstart.md`
- [ ] T038 [P] Clean up any temporary debugging logic in `frontend/src/pages/GamePage.tsx`, `frontend/src/state/roomStore.ts`, and `backend/src/services/roomStore.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; start immediately
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2
- **User Story 2 (Phase 4)**: Depends on Phase 2
- **User Story 3 (Phase 5)**: Depends on Phase 2
- **Polish (Phase 6)**: Depends on all user stories and validation

### User Story Dependencies

- **US1**: Independent once the result snapshot contract exists
- **US2**: Requires result state support and restart API contract
- **US3**: Requires restart contract and lobby snapshot preservation

### Within Each User Story

- Write tests before implementation
- Keep model/api changes before UI integration
- Implementation before cross-story integration
- Validate each story independently before moving to the next

## Parallel Opportunities

- T005, T006, T007, and T013 can run in parallel because they are backend model/service work separate from frontend API updates
- T014 and T015 can run in parallel because they are frontend UI tests in separate components/pages
- T020 and T021 can run in parallel because they are frontend restart interaction and state tests in separate files
- T027 and T028 can run in parallel because they are backend service and frontend state tests for participant preservation
- T033, T034, T035, T036, and T038 can run in parallel during the final polish phase

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup
2. Complete Phase 2 foundational model and API support
3. Complete Phase 3 result UI and finished snapshot rendering
4. Validate result state independently before restart work

### Incremental Delivery

1. Deliver US1 for shared result visibility
2. Deliver US2 for host restart behavior
3. Deliver US3 for participant preservation on restart
4. Validate each story with tests and a manual two-browser run

### Notes

- Keep HTTP polling as the synchronization mechanism; do not introduce WebSockets.
- Preserve the in-memory room model and avoid adding persistent storage.
- Restart should clear only prior round state, not participant or room identity.
- Keep the result view and restart behavior aligned with the spec requirements.
