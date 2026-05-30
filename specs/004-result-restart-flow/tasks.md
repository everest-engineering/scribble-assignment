---

description: "Task list for Scenario 4 result state and restart implementation"

---

# Tasks: Scenario 4 Result State and Restart

**Input**: Design documents from `/specs/004-result-restart-flow/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Include automated backend and frontend API coverage plus manual two-tab validation for each user story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Paths below follow this repository's monorepo layout

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the active Scenario 4 artifacts, validation targets, and result/restart boundaries before editing code

- [X] T001 Review implementation inputs in `specs/004-result-restart-flow/spec.md`, `specs/004-result-restart-flow/plan.md`, and `specs/004-result-restart-flow/contracts/rooms-scenario4.openapi.yaml`
- [X] T002 Confirm manual and automated validation steps in `specs/004-result-restart-flow/quickstart.md`, `backend/src/api/rooms.ts`, `frontend/src/pages/GamePage.tsx`, and `frontend/src/pages/LobbyPage.tsx`
- [X] T003 [P] Capture shared result-state, restart, and reset expectations from `specs/004-result-restart-flow/data-model.md` and `specs/004-result-restart-flow/research.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared result-state, restart contract, and status-model changes that all Scenario 4 stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Update shared room status, round completion, and result-snapshot types in `backend/src/models/game.ts`
- [X] T005 [P] Extend shared result/restart room snapshot and session response types in `frontend/src/services/api.ts`
- [X] T006 [P] Add reusable restart request schema support in `backend/src/api/schemas.ts`
- [X] T007 [P] Add shared restart action support in `frontend/src/state/roomStore.ts`
- [X] T008 Implement shared result-state snapshot derivation and restart/reset helpers in `backend/src/services/roomStore.ts`
- [X] T009 Implement shared result/restart response mapping in `backend/src/api/rooms.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in priority order

---

## Phase 3: User Story 1 - Players Review Round Results (Priority: P1) 🎯 MVP

**Goal**: When the first correct accepted guess ends the round, every player can review the correct word, final scores, and full guess history in a shared result state

**Independent Test**: Complete a round with a correct guess, then confirm in at least two tabs that every player sees the same correct word, final scores, and full guess history for that room

### Verification for User Story 1 ⚠️

- [X] T010 [P] [US1] Add correct-guess result-transition and shared result-visibility coverage in `backend/src/services/roomStore.test.ts`
- [X] T011 [P] [US1] Add result-state snapshot and result-fetch coverage in `frontend/src/services/api.test.ts`
- [ ] T012 [US1] Validate shared result-state transition and completed-round review with `specs/004-result-restart-flow/quickstart.md`

### Implementation for User Story 1

- [X] T013 [US1] Add result-state fields and round completion metadata in `backend/src/models/game.ts`
- [X] T014 [US1] Implement first-correct-guess transition from `playing` to `results` in `backend/src/services/roomStore.ts`
- [X] T015 [US1] Expose shared result snapshots for fetch and guess responses in `backend/src/api/rooms.ts`
- [X] T016 [P] [US1] Extend result-state API/store mapping in `frontend/src/services/api.ts` and `frontend/src/state/roomStore.ts`
- [X] T017 [US1] Render result-state review with shared word, final scores, and full guess history in `frontend/src/pages/GamePage.tsx` and `frontend/src/styles/app.css`

**Checkpoint**: At this point, completed rounds should transition into a shared read-only result state without restart behavior

---

## Phase 4: User Story 2 - Host Restarts the Room (Priority: P2)

**Goal**: Only the host can restart a completed room and return all players to the lobby with the same room and roster

**Independent Test**: Finish a round, restart from the host tab, and confirm that every player returns to the lobby in the same room with the same player list still present

### Verification for User Story 2 ⚠️

- [X] T018 [P] [US2] Add host-only restart and pre-results rejection coverage in `backend/src/api/schemas.test.ts` and `backend/src/services/roomStore.test.ts`
- [X] T019 [P] [US2] Add restart request and lobby-after-restart snapshot coverage in `frontend/src/services/api.test.ts`
- [ ] T020 [US2] Validate host-only restart behavior and rejection paths with `specs/004-result-restart-flow/quickstart.md`

### Implementation for User Story 2

- [X] T021 [US2] Add restart request validation in `backend/src/api/schemas.ts`
- [X] T022 [US2] Implement host-only restart flow and restart eligibility checks in `backend/src/services/roomStore.ts`
- [X] T023 [US2] Add `POST /rooms/:code/restart` handling and restart conflict mapping in `backend/src/api/rooms.ts`
- [X] T024 [P] [US2] Add restart API/store methods in `frontend/src/services/api.ts` and `frontend/src/state/roomStore.ts`
- [X] T025 [US2] Render host-only restart control and post-restart lobby routing behavior in `frontend/src/pages/GamePage.tsx` and `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: At this point, hosts can restart completed rooms and non-host or too-early restart attempts are rejected

---

## Phase 5: User Story 3 - Restart Clears Round State Cleanly (Priority: P3)

**Goal**: Restart removes prior round data, resets scores, and keeps the next lobby state isolated and clean

**Independent Test**: Finish a round, restart it, and confirm in at least two tabs that the room keeps the same players but no longer exposes the finished word, round scores, guess history, or drawing state

### Verification for User Story 3 ⚠️

- [X] T026 [P] [US3] Add restart reset and room-isolation coverage in `backend/src/services/roomStore.test.ts`
- [X] T027 [P] [US3] Add cleared-lobby snapshot and result-control disablement coverage in `frontend/src/services/api.test.ts`
- [ ] T028 [US3] Validate round-state clearing, score reset, and room isolation with `specs/004-result-restart-flow/quickstart.md`

### Implementation for User Story 3

- [X] T029 [US3] Finalize restart reset rules for scores, round state, and result visibility in `backend/src/models/game.ts` and `backend/src/services/roomStore.ts`
- [X] T030 [US3] Enforce no drawing or guessing after results and preserve room isolation in `backend/src/services/roomStore.ts` and `backend/src/api/rooms.ts`
- [X] T031 [P] [US3] Expose cleared lobby snapshots and disabled result-state controls in `frontend/src/services/api.ts` and `frontend/src/state/roomStore.ts`
- [X] T032 [US3] Update result and lobby UI states for cleared round data and reset participant scores in `frontend/src/pages/GamePage.tsx`, `frontend/src/pages/LobbyPage.tsx`, and `frontend/src/styles/app.css`

**Checkpoint**: All Scenario 4 result-state, restart, and reset behavior should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and artifact alignment across the completed Scenario 4 slice

- [ ] T033 [P] Refresh Scenario 4 behavior notes in `specs/004-result-restart-flow/quickstart.md` and `specs/004-result-restart-flow/contracts/rooms-scenario4.openapi.yaml` if implementation wording changed
- [X] T034 Run backend validation for `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`, `backend/src/api/schemas.ts`, and `backend/src/api/rooms.ts` with `cd backend && npm test && npm run build`
- [X] T035 Run frontend validation for `frontend/src/services/api.ts`, `frontend/src/state/roomStore.ts`, `frontend/src/pages/GamePage.tsx`, `frontend/src/pages/LobbyPage.tsx`, and `frontend/src/styles/app.css` with `cd frontend && npm test && npm run build`
- [ ] T036 Run the final end-to-end multi-tab Scenario 4 checks in `specs/004-result-restart-flow/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion and defines the MVP slice
- **User Story 2 (Phase 4)**: Depends on Foundational completion and should follow User Story 1 so restart works against a real result state
- **User Story 3 (Phase 5)**: Depends on Foundational completion and benefits from User Stories 1 and 2 being in place so reset behavior can be validated end to end
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on other user stories; establishes the shared result-state transition and result review
- **User Story 2 (P2)**: Uses the completed result state from User Story 1 to allow host-only restart
- **User Story 3 (P3)**: Uses the restart flow from User Story 2 to validate that all prior round state is cleared cleanly

### Within Each User Story

- Verification tasks MUST be completed before the story is treated as done
- Shared types before services
- Services before routes or client state integration
- Client state before page-level UI behavior
- Manual two-tab validation before moving to the next priority

### Parallel Opportunities

- `T003` can run in parallel with `T001-T002`
- `T005-T007` can run in parallel once `T004` is defined
- `T010-T011`, `T018-T019`, and `T026-T027` can run in parallel within their user stories
- `T016`, `T024`, and `T031` can run in parallel with their paired backend work once the backend contract is stable
- `T033` can run in parallel with final validation once implementation is complete

---

## Parallel Example: User Story 1

```bash
# Launch User Story 1 automated verification together:
Task: "Add correct-guess result-transition and shared result-visibility coverage in backend/src/services/roomStore.test.ts"
Task: "Add result-state snapshot and result-fetch coverage in frontend/src/services/api.test.ts"

# Launch independent User Story 1 implementation work together:
Task: "Implement first-correct-guess transition from playing to results in backend/src/services/roomStore.ts"
Task: "Extend result-state API/store mapping in frontend/src/services/api.ts and frontend/src/state/roomStore.ts"
```

## Parallel Example: User Story 2

```bash
# Launch User Story 2 automated verification together:
Task: "Add host-only restart and pre-results rejection coverage in backend/src/api/schemas.test.ts and backend/src/services/roomStore.test.ts"
Task: "Add restart request and lobby-after-restart snapshot coverage in frontend/src/services/api.test.ts"

# Launch independent User Story 2 implementation work together:
Task: "Implement host-only restart flow and restart eligibility checks in backend/src/services/roomStore.ts"
Task: "Add restart API/store methods in frontend/src/services/api.ts and frontend/src/state/roomStore.ts"
```

## Parallel Example: User Story 3

```bash
# Launch User Story 3 automated verification together:
Task: "Add restart reset and room-isolation coverage in backend/src/services/roomStore.test.ts"
Task: "Add cleared-lobby snapshot and result-control disablement coverage in frontend/src/services/api.test.ts"

# Launch independent User Story 3 implementation work together:
Task: "Finalize restart reset rules for scores, round state, and result visibility in backend/src/models/game.ts and backend/src/services/roomStore.ts"
Task: "Expose cleared lobby snapshots and disabled result-state controls in frontend/src/services/api.ts and frontend/src/state/roomStore.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Confirm the room ends on the first correct accepted guess and every player sees the same completed-round results
5. Demo the result-state review on top of Scenario 3 gameplay

### Incremental Delivery

1. Complete Setup + Foundational -> shared result/restart contract ready
2. Add User Story 1 -> validate result-state transition and shared completed-round review -> MVP complete
3. Add User Story 2 -> validate host-only restart and rejection behavior
4. Add User Story 3 -> validate clean round-state reset and room isolation
5. Finish with Phase 6 validation and artifact cleanup

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. After foundation is stable:
   - Developer A: backend service and route changes for the active story
   - Developer B: frontend store and page changes for the active story
   - Developer C: automated verification updates in `backend/src/**/*.test.ts` and `frontend/src/services/api.test.ts`
3. Rejoin for manual two-tab validation at the end of each story

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] labels map tasks to specific user stories for traceability
- Every task includes an exact file path and can be executed without additional artifact discovery
- Suggested MVP scope: Phase 3 / User Story 1 only
