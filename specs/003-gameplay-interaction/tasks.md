---
description: "Task list for Gameplay Interaction feature"
---

# Tasks: Gameplay Interaction

**Input**: Design documents from `specs/003-gameplay-interaction/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks are included per constitution requirement (Test-First, NON-NEGOTIABLE).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Understand the current codebase state and identify extension points

- [ ] T001 Read and document existing Round, Room, RoomSnapshot types in `backend/src/models/game.ts` — identify where strokes, guesses, and scores will be added
- [ ] T002 Read and document existing frontend patterns in `frontend/src/pages/GamePage.tsx`, `frontend/src/components/GuessForm.tsx`, `frontend/src/state/roomStore.ts` — identify canvas, guess form, and scoreboard integration points

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data model changes that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Add `StrokePoint` (x, y), `Stroke` (points[]), and `Guess` (participantId, text, result, timestamp) types in `backend/src/models/game.ts`
- [X] T004 [P] Add `strokes: Stroke[]` and `guesses: Guess[]` to `Round`; add `scores: Record<string, number>` to `RoomSnapshot` in `backend/src/models/game.ts`
- [X] T005 [P] Add matching `StrokePoint`, `Stroke`, `Guess` types and extend frontend `RoomSnapshot` (strokes, guesses, scores) in `frontend/src/services/api.ts`

**Checkpoint**: Foundation ready — types defined for strokes, guesses, and scores on both backend and frontend

---

## Phase 3: User Story 1 - Canvas Drawing (Priority: P1) 🎯 MVP

**Goal**: Drawer draws/clears on an interactive canvas. All participants see the drawing (drawer sees real-time, guessers within one polling cycle).

**Independent Test**: Start a game as host (drawer). Draw on canvas. Verify guesser tab shows the same drawing within 2 seconds. Clear — verify both tabs are cleared.

### Tests for User Story 1 ⚠️

> **NOTE**: Write these tests FIRST, ensure they FAIL before implementation

- [X] T006 [P] [US1] Unit test: `addStroke()` appends a Stroke to `round.strokes` in `backend/src/services/roomStore.test.ts`
- [X] T007 [P] [US1] Unit test: `clearCanvas()` empties `round.strokes` in `backend/src/services/roomStore.test.ts`
- [X] T008 [P] [US1] Unit test: `toRoomSnapshot()` includes `strokes` for all participants in `backend/src/services/roomStore.test.ts`

### Implementation for User Story 1

- [X] T009 [US1] Implement `addStroke(code, participantId, points)` and `clearCanvas(code, participantId)` in `backend/src/services/roomStore.ts` — validate drawer role, return 403 if not drawer
- [X] T010 [P] [US1] Add `POST /:code/stroke` and `POST /:code/clear` routes in `backend/src/api/rooms.ts` + Zod schemas (strokePointsSchema, clearBodySchema) in `backend/src/api/schemas.ts` — validate drawer identity
- [X] T011 [P] [US1] Extend `toRoomSnapshot()` to include `strokes` from current round in `backend/src/services/roomStore.ts` — all participants see same strokes
- [X] T012 [P] [US1] Create `DrawingCanvas.tsx` (interactive, mouse events → stroke accumulation → POST on mouseup) and `GuessingCanvas.tsx` (read-only, renders strokes from snapshot) in `frontend/src/components/`
- [X] T013 [US1] Integrate canvases into `GamePage.tsx` (drawer sees DrawingCanvas, guessers see GuessingCanvas); add `strokes` state + `addStroke`/`clearCanvas` API methods in `frontend/src/state/roomStore.ts` and `frontend/src/services/api.ts`

**Checkpoint**: User Story 1 is functional — drawer draws and clears, all see the canvas

---

## Phase 4: User Story 2 - Guess Submission & Validation (Priority: P1)

**Goal**: Guessers submit text guesses. Backend trims whitespace, compares case-insensitively, rejects empty. Guesser sees correct/incorrect/already_correct feedback.

**Independent Test**: As guesser, submit a correct guess (case-insensitive), submit an incorrect guess, submit an empty guess. Verify each produces the correct response.

### Tests for User Story 2 ⚠️

- [X] T014 [P] [US2] Unit test: `submitGuess()` trims whitespace and compares case-insensitively in `backend/src/services/roomStore.test.ts`
- [X] T015 [P] [US2] Unit test: `submitGuess()` rejects empty/whitespace-only guesses with 400 in `backend/src/services/roomStore.test.ts`
- [X] T016 [P] [US2] Unit test: `submitGuess()` returns `already_correct` for previously-correct guesser in `backend/src/services/roomStore.test.ts`

### Implementation for User Story 2

- [X] T017 [US2] Implement `submitGuess(code, participantId, text)` in `backend/src/services/roomStore.ts` — trim, case-insensitive compare, guard against already-correct, return result, append to round.guesses
- [X] T018 [P] [US2] Add `POST /:code/guess` route in `backend/src/api/rooms.ts` + Zod schema (guessBodySchema) in `backend/src/api/schemas.ts` — validate participantId, non-empty text; handle 403 (drawer can't guess) and 400 (empty)
- [X] T019 [US2] Extend `toRoomSnapshot()` to include `guesses` array from current round in `backend/src/services/roomStore.ts` — all participants see guess history
- [X] T020 [P] [US2] Wire `GuessForm.tsx` to `submitGuess` API — show feedback messages (correct/incorrect/already_correct/empty) via local state; add `submitGuess` to frontend `api.ts`; add guess-related state to `roomStore.ts`
- [X] T021 [US2] Update `GamePage.tsx` to render `GuessForm` for guessers (not drawer) and display guess feedback

**Checkpoint**: User Story 2 is functional — guessers submit guesses and see validation results

---

## Phase 5: User Story 3 - Scoring & Guess History (Priority: P2)

**Goal**: Scores accumulate (100 per correct guess). Full guess history visible to all participants.

**Independent Test**: Multiple guessers submit correct/incorrect guesses. Verify scores are correct (100 per correct, no change for incorrect) and all participants see complete history.

### Tests for User Story 3 ⚠️

- [X] T022 [P] [US3] Unit test: scores computed as `correct guess count × 100` per participant in `backend/src/services/roomStore.test.ts`
- [X] T023 [P] [US3] Unit test: `toRoomSnapshot()` includes `guesses` array and `scores` map in `backend/src/services/roomStore.test.ts`

### Implementation for User Story 3

- [X] T024 [US3] Compute scores in `toRoomSnapshot()` — count correct guesses per participantId × 100, include in `scores` field in `backend/src/services/roomStore.ts`
- [X] T025 [P] [US3] Create `GuessHistory.tsx` component in `frontend/src/components/` — display guess list (guesser name, text, correct/incorrect badge, timestamp) and scoreboard (participant scores sorted descending)
- [X] T026 [US3] Add `GuessHistory` + scoreboard to `GamePage.tsx` sidebar; add guesses/scores state to `roomStore.ts`

**Checkpoint**: User Story 3 is functional — scores tracked, history visible to all

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and edge case handling

- [X] T027 [P] Run backend test suite — all US1, US2, US3 tests pass (`cd backend && npm test`)
- [ ] T028 Run quickstart.md validation scenarios in two browser tabs (Scenarios 1-6)
- [ ] T029 Final review: verify all acceptance scenarios from spec.md pass (FR-001 through FR-015)
- [ ] T030 [P] [Polish] Timing verification: after POST /:code/stroke assert snapshot.strokes includes stroke within 2500ms; same for POST /:code/guess → snapshot.guesses

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3-5)**:
  - US3 depends on US2 (scores derived from guesses; guess history in snapshot)
  - US1 and US2 are independent of each other (can be done in parallel after Phase 2)
- **Polish (Phase 6)**: Depends on all user stories complete

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Backend models before services
- Services before API endpoints
- API endpoints before frontend integration
- Story complete before moving to next priority

### Parallel Opportunities

- T004, T005 (Phase 2) can run in parallel (different files)
- T006, T007, T008 (US1 tests) can run in parallel
- T010, T011, T012 (US1 implementation) can run in parallel (API, snapshot, components)
- T014, T015, T016 (US2 tests) can run in parallel
- T018, T019 (US2 implementation) can run in parallel (API, snapshot)
- T020, T021 can run in parallel (component, page integration)
- T022, T023 (US3 tests) can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Canvas Drawing) — drawing visible to all
4. **STOP and VALIDATE**: Test US1 independently in browser tabs
5. Continue with US2 (Guess Submission) — independent of US1
6. Complete US3 (Scoring & History) — depends on US2

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 (Canvas Drawing) → Test independently → Deploy/Demo (MVP!)
3. Add US2 (Guess Submission) → Test independently → Can demo alongside US1
4. Add US3 (Scoring & History) → Test independently → Feature complete
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
