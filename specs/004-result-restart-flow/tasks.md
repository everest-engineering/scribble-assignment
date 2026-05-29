# Tasks: Result, Restart & Final Validation

**Input**: Design documents from `specs/004-result-restart-flow/`

**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api.md, research.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 0: Discovery & Artifacts

**Purpose**: Understanding existing code and aligning Spec Kit artifacts

- [x] T000 [P] Conduct discovery: document gaps and assumptions in specs/004-result-restart-flow/research.md
- [x] T001 [P] Sync artifacts: verify Constitution, Spec, and Plan consistency in specs/004-result-restart-flow/

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Update validation schemas for new endpoints

- [x] T002 [P] Add `finishRoundSchema` and `restartGameSchema` to `backend/src/api/schemas.ts`

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core model and service updates for game lifecycle

- [x] T003 Update `Room` interface in `backend/src/models/game.ts` to include `lastDrawerId`
- [x] T004 Implement `finishRound` logic in `backend/src/services/roomStore.ts` (transition to results)
- [x] T005 Implement `restartGame` logic in `backend/src/services/roomStore.ts` (reset strokes/guesses, preserve scores)
- [x] T006 Update `startGame` in `backend/src/services/roomStore.ts` to implement seniority-based round-robin rotation, explicitly handling dynamic list changes (joins/leaves)
- [x] T007 [P] Create unit tests for rotation logic and lifecycle transitions in `backend/src/services/roomStore.test.ts`

**Checkpoint**: Foundation ready - result viewing implementation can now begin

---

## Phase 3: User Story 1 - Viewing Final Results (Priority: P1) 🎯 MVP

**Goal**: Host can finish round; everyone sees final word and scores.

**Independent Test**: Alice (host) clicks "Finish Round"; Bob (guesser) immediately sees "Word: rocket" and final scores.

- [x] T008 [US1] Implement `POST /rooms/:code/finish` endpoint in `backend/src/api/rooms.ts`, including hostId validation
- [x] T009 [US1] Add `finishRound` method to `api` service in `frontend/src/services/api.ts`
- [x] T010 [US1] Update `toRoomSnapshot` in `backend/src/services/roomStore.ts` to reveal `secretWord` when status is `results`
- [x] T011 [US1] Update `GamePage.tsx` in `frontend/src/pages/GamePage.tsx` to display a "Finish Round" button for the host during `playing` state
- [x] T012 [US1] Add conditional rendering for `results` state UI components (reveal word, hide canvas tools) directly in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: US1 complete - Round ending and result viewing are functional.

---

## Phase 4: User Story 2 - Host Game Restart & Rotation (Priority: P1)

**Goal**: Host can restart; roles rotate correctly.

**Independent Test**: Alice restarts; everyone returns to lobby. Alice starts game again; Bob becomes the new drawer.

- [x] T013 [US2] Implement `POST /rooms/:code/restart` endpoint in `backend/src/api/rooms.ts`, including hostId validation
- [x] T014 [US2] Add `restartGame` method to `api` service in `frontend/src/services/api.ts`
- [x] T015 [US2] Add "Restart Game" button to the results view in `frontend/src/pages/GamePage.tsx` for the host only
- [x] T016 [US2] Update `addGuess` in `backend/src/services/roomStore.ts` to explicitly reject guesses if status is not `playing` (EC-03)

**Checkpoint**: US2 complete - Full game lifecycle with rotation is active.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and integrity checks

- [x] T017 [P] Run quickstart.md validation steps with multiple browser tabs to verify seniority rotation
- [x] T018 [P] Verify no TypeScript errors (Rule I) across both packages
- [x] T019 [P] Verify no layout crashes during microsecond state shifts (EC-02)

---

## Dependencies & Execution Order

- **Phase 2 (Foundational)**: BLOCKS all US phases (rotation logic is critical).
- **User Story 1**: Must be complete before US2 (cannot restart a game that hasn't finished).

---

## Implementation Strategy

### MVP First (User Story 1)
1. Complete Foundational Phase (Rotation index and state transitions).
2. Complete US1 (Finish Round + Result Reveal).
3. **STOP and VALIDATE**: Verify Alice can finish and Bob sees the secret word.

### Full Feature
1. Add US2 (Restart logic + seniority increment).
2. Final multi-player validation of the full loop.
