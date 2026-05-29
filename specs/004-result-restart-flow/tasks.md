# Tasks: Result Restart Flow

**Input**: Design documents from `/specs/004-result-restart-flow/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rooms-api.md, quickstart.md

**Tests**: Included because the user requested restart polling validation, multi-player testing, multi-room isolation testing, and final acceptance validation.

**Organization**: Tasks are grouped by user story to enable independently testable increments. Every implementation task traces to `spec.md` requirements FR-001 through FR-020.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files or only adds tests/docs.
- **[Story]**: Maps to user stories from `spec.md`.
- Every task includes affected file paths.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the existing files and artifact references for Result Restart implementation.

- [X] T001 Review current gameplay lifecycle and snapshot behavior in `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`, `frontend/src/pages/GamePage.tsx`, and `frontend/src/components/ResultPanel.tsx`
- [X] T002 [P] Review endpoint and schema patterns for room mutations in `backend/src/api/rooms.ts` and `backend/src/api/schemas.ts`
- [X] T003 [P] Review frontend API and store mutation patterns in `frontend/src/services/api.ts` and `frontend/src/state/roomStore.ts`
- [X] T004 [P] Confirm no new dependencies, WebSockets, timers, persistence, authentication, or multi-round behavior are needed in `specs/004-result-restart-flow/plan.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add shared lifecycle types and validation primitives required by all user stories.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 Add result lifecycle types, completed-round types, and restart snapshot fields in `backend/src/models/game.ts`
- [X] T006 Add result/restart response and request types in `frontend/src/services/api.ts`
- [X] T007 Add end-round and restart request schemas in `backend/src/api/schemas.ts`
- [X] T008 [P] Add schema tests for end-round and restart payload validation in `backend/src/api/schemas.test.ts`
- [X] T009 Update room snapshot typing to support playing, result, and restarted lobby states in `backend/src/models/game.ts` and `frontend/src/services/api.ts`

**Checkpoint**: Foundation ready; lifecycle states and request shapes exist before story implementation.

---

## Phase 3: User Story 1 - Players Review the Final Result (Priority: P1) MVP

**Goal**: Players can reach a result state after a round ends and see the revealed word, final scores, and complete guess history.

**Independent Test**: End a round after drawing and multiple guesses, then verify host, drawer, and guesser snapshots all show the same secret word, final scores, and ordered guess history.

### Tests for User Story 1

- [X] T010 [P] [US1] Add room service tests for `playing` to `result` transition, revealed secret word, final scores, and ordered guess history in `backend/src/services/roomStore.test.ts`
- [X] T011 [P] [US1] Add API tests for `POST /rooms/:code/round/end` and result-state `GET /rooms/:code` snapshots in `backend/src/api/rooms.test.ts`
- [X] T012 [P] [US1] Add frontend API tests for end-round request and result snapshot parsing in `frontend/src/services/api.test.ts`

### Implementation for User Story 1

- [X] T013 [US1] Implement completed-round snapshot creation and `endRound` service flow in `backend/src/services/roomStore.ts`
- [X] T014 [US1] Extend `toRoomSnapshot` result-state output with `completedRound`, revealed `secretWord`, final `scores`, and ordered `guesses` in `backend/src/services/roomStore.ts`
- [X] T015 [US1] Add `POST /rooms/:code/round/end` route using existing error handling in `backend/src/api/rooms.ts`
- [X] T016 [US1] Ensure drawing, clear, and guess service operations reject result-state rooms in `backend/src/services/roomStore.ts`
- [X] T017 [US1] Add frontend `endRound` API method and result snapshot types in `frontend/src/services/api.ts`
- [X] T018 [US1] Add end-round/result state handling to the room store in `frontend/src/state/roomStore.ts`
- [X] T019 [US1] Update `ResultPanel` to display revealed word, final scores, full guess history, and empty-history state in `frontend/src/components/ResultPanel.tsx`
- [X] T020 [US1] Update `Scoreboard` to render final result scores without relying on active gameplay state in `frontend/src/components/Scoreboard.tsx`
- [X] T021 [US1] Update `GamePage` to render result view when room status is result in `frontend/src/pages/GamePage.tsx`
- [X] T022 [US1] Add result-state styling for revealed word, final scores, guess history, and empty history in `frontend/src/styles/app.css`

**Checkpoint**: User Story 1 is independently functional and testable as the MVP result state.

---

## Phase 4: User Story 2 - Host Restarts to the Lobby (Priority: P2)

**Goal**: The host can restart from result state and all players return to the same room's lobby with room code and players preserved.

**Independent Test**: From result state, restart as host and verify the host immediately sees lobby state while non-host players return to lobby through polling with the same room code and player list.

### Tests for User Story 2

- [X] T023 [P] [US2] Add room service tests for host-only restart authorization, non-host rejection, invalid status rejection, and room code/player preservation in `backend/src/services/roomStore.test.ts`
- [X] T024 [P] [US2] Add API tests for `POST /rooms/:code/restart` success, non-host forbidden, missing participant, and non-result state errors in `backend/src/api/rooms.test.ts`
- [X] T025 [P] [US2] Add frontend API tests for restart request and restarted lobby response handling in `frontend/src/services/api.test.ts`

### Implementation for User Story 2

- [X] T026 [US2] Implement host-only `restartRoom` service operation with result-state precondition in `backend/src/services/roomStore.ts`
- [X] T027 [US2] Add `POST /rooms/:code/restart` route using restart schema and centralized errors in `backend/src/api/rooms.ts`
- [X] T028 [US2] Add frontend `restartRoom` API method in `frontend/src/services/api.ts`
- [X] T029 [US2] Add restart action, in-flight state, and error handling to room store in `frontend/src/state/roomStore.ts`
- [X] T030 [US2] Update `ResultPanel` to show restart control only for host viewers and waiting copy for non-host viewers in `frontend/src/components/ResultPanel.tsx`
- [X] T031 [US2] Update `GamePage` status branching so restarted lobby snapshots render the existing lobby view without route reload in `frontend/src/pages/GamePage.tsx`
- [X] T032 [US2] Add restart button, waiting state, and restart error styling in `frontend/src/styles/app.css`

**Checkpoint**: User Story 2 works independently once result state exists: host restart returns all players to lobby with the same room and players.

---

## Phase 5: User Story 3 - Restart Clears Round-Specific State (Priority: P3)

**Goal**: Restart clears all completed-round game data while preserving room identity and players.

**Independent Test**: Complete a round with canvas, guesses, scores, secret word, and drawer assignment; restart; verify the lobby snapshot has the same room code and players but no active/completed round data, scores, canvas, guesses, word, or drawer.

### Tests for User Story 3

- [X] T033 [P] [US3] Add room service reset tests for clearing current round, completed round, scores, canvas, guesses, secret word, drawer assignment, and correctness tracking in `backend/src/services/roomStore.test.ts`
- [X] T034 [P] [US3] Add API tests that restarted lobby responses omit active/completed round, scores, canvas, guesses, secret word, and drawer assignment in `backend/src/api/rooms.test.ts`
- [X] T035 [P] [US3] Add frontend API tests for clean lobby snapshot after restart in `frontend/src/services/api.test.ts`

### Implementation for User Story 3

- [X] T036 [US3] Complete atomic reset logic for active round, completed round, scores, canvas, guesses, secret word, drawer assignment, and correctness tracking in `backend/src/services/roomStore.ts`
- [X] T037 [US3] Ensure restarted lobby snapshots preserve room code, host, participants, and `canStart` behavior in `backend/src/services/roomStore.ts`
- [X] T038 [US3] Clear result/gameplay-only client state on lobby transition in `frontend/src/state/roomStore.ts`
- [X] T039 [US3] Ensure `CanvasBoard` renders blank or unmounted state after restart and does not retain previous strokes in `frontend/src/components/CanvasBoard.tsx`
- [X] T040 [US3] Ensure `ResultPanel` and `Scoreboard` do not render previous result data after restarted lobby state in `frontend/src/components/ResultPanel.tsx` and `frontend/src/components/Scoreboard.tsx`
- [X] T041 [US3] Update `GamePage` polling behavior to continue across result-to-lobby transition without duplicate intervals in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: User Story 3 confirms restart is a clean room reset, not a new room or score/history carryover.

---

## Phase 6: Polish & Cross-Cutting Validation

**Purpose**: Validate full behavior across players, rooms, polling, and acceptance criteria.

- [X] T042 [P] Run backend test suite and build for result/restart changes with `cd backend && npm test && npm run build`
- [X] T043 [P] Run frontend test suite and build for result/restart changes with `cd frontend && npm test && npm run build`
- [ ] T044 Perform manual two-player result and restart flow from `specs/004-result-restart-flow/quickstart.md`
- [ ] T045 Perform restart polling validation across host and non-host tabs using `specs/004-result-restart-flow/quickstart.md`
- [ ] T046 Perform multi-player final scores, correct word, and full guess history validation using `specs/004-result-restart-flow/quickstart.md`
- [ ] T047 Perform multi-room isolation validation to confirm restarting one room does not affect another room using `specs/004-result-restart-flow/quickstart.md`
- [X] T048 Review final implementation against prohibited scope and acceptance criteria in `specs/004-result-restart-flow/spec.md`
- [X] T049 Update any implementation notes discovered during validation in `specs/004-result-restart-flow/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational; MVP for result state and end-of-round transition.
- **User Story 2 (Phase 4)**: Depends on Foundational and practically requires US1 result state to restart from.
- **User Story 3 (Phase 5)**: Depends on US2 restart path and verifies reset correctness.
- **Polish (Phase 6)**: Depends on all implemented user stories.

### User Story Dependencies

- **US1 - Players Review the Final Result**: Required first because restart is only valid from result state.
- **US2 - Host Restarts to the Lobby**: Depends on US1 result status and snapshots.
- **US3 - Restart Clears Round-Specific State**: Depends on US2 restart action and validates reset completeness.

### Within Each User Story

- Tests should be written before implementation and should fail before the related code is added.
- Model/type changes precede service logic.
- Service logic precedes API routes.
- Backend validation precedes shared state mutation.
- Frontend API/store methods precede component wiring.
- Polling lifecycle updates precede manual multi-tab validation.

### Parallel Opportunities

- T002, T003, and T004 can run in parallel after T001 starts.
- T008 can run in parallel with T005 through T007 because it targets schema coverage.
- T010, T011, and T012 can run in parallel for US1 test coverage.
- T023, T024, and T025 can run in parallel for US2 test coverage.
- T033, T034, and T035 can run in parallel for US3 test coverage.
- T042 and T043 can run in parallel after implementation is complete.
- Manual validation tasks T044 through T047 can be split across reviewers once builds pass.

---

## Parallel Example: User Story 1

```bash
Task: "Add room service tests for playing to result transition in backend/src/services/roomStore.test.ts"
Task: "Add API tests for POST /rooms/:code/round/end in backend/src/api/rooms.test.ts"
Task: "Add frontend API tests for end-round request in frontend/src/services/api.test.ts"
```

## Parallel Example: User Story 2

```bash
Task: "Add restart service authorization tests in backend/src/services/roomStore.test.ts"
Task: "Add restart endpoint tests in backend/src/api/rooms.test.ts"
Task: "Add restart API client tests in frontend/src/services/api.test.ts"
```

## Parallel Example: User Story 3

```bash
Task: "Add reset-clearing service tests in backend/src/services/roomStore.test.ts"
Task: "Add restarted lobby response tests in backend/src/api/rooms.test.ts"
Task: "Add clean lobby snapshot client tests in frontend/src/services/api.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 to support explicit end-round result state.
3. Validate that all players can see revealed word, final scores, and complete guess history.
4. Stop and review against FR-001 through FR-005 before adding restart.

### Incremental Delivery

1. Add US1 result state and result UI.
2. Add US2 host restart action and lobby return.
3. Add US3 reset completeness and stale-data clearing.
4. Finish with multi-player, polling, multi-room, and final acceptance validation.

### Architecture Guardrails

- Keep all shared state in `backend/src/services/roomStore.ts`.
- Keep validation at `backend/src/api/schemas.ts` and service preconditions before mutation.
- Keep synchronization through `GET /rooms/:code?participantId=...` polling.
- Do not add WebSockets, timers, persistence, authentication, multiple rounds, automatic next-round start, or new dependencies.
