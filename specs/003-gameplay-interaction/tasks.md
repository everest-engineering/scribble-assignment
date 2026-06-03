# Tasks: Gameplay Interaction

**Input**: Design documents from `/specs/003-gameplay-interaction/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Existing Vitest tests in the project will be updated as needed. No new test files created unless specified per task.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup

**Purpose**: Verify existing codebase state and confirm dependencies from research

- [x] T001 Verify `startRoom` in `backend/src/services/roomStore.ts` already initializes `strokes`, `guesses`, `playerScores`, and `hasScored` as empty (from Scenario 2 changes)
- [x] T002 Verify `RoomSnapshot` in `backend/src/models/game.ts` and `frontend/src/services/api.ts` already includes `strokes`, `guesses`, `playerScores` fields (added in plan)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data model, types, and schema changes that ALL user stories depend on. No user story work can begin until this phase is complete.

- [x] T003 [P] Add `Stroke`, `Guess`, and `PlayerScore` types to `backend/src/models/game.ts`
- [x] T004 [P] Add `strokes`, `guesses`, `playerScores`, and `hasScored` fields to `Room` interface in `backend/src/models/game.ts`
- [x] T005 [P] Add `strokes`, `guesses`, and `playerScores` fields to `RoomSnapshot` interface in `backend/src/models/game.ts`
- [x] T006 [P] Add `Stroke`, `Guess`, and `PlayerScore` types and updated `RoomSnapshot` to `frontend/src/services/api.ts`
- [x] T007 Add `submitGuessSchema` and `addStrokeSchema` Zod schemas to `backend/src/api/schemas.ts`
- [x] T008 Modify `startRoom` in `backend/src/services/roomStore.ts` to initialize `strokes = []`, `guesses = []`, `playerScores` (Map with 0 for each participant), and `hasScored = []`
- [x] T009 Modify `toRoomSnapshot` in `backend/src/services/roomStore.ts` to include `strokes`, `guesses`, and `playerScores` (converted to display array with player names)
- [x] T010 Add `addStroke(code, stroke)`, `clearCanvas(code)`, and `submitGuess(code, participantId, text)` functions to `backend/src/services/roomStore.ts`

**Checkpoint**: Foundation ready — types, schemas, and service functions are in place

---

## Phase 3: User Story 1 — Drawer Draws on Canvas (Priority: P1) 🎯 MVP

**Goal**: The drawer can draw strokes on the canvas, clear it, and strokes are visible to all players via polling.

**Independent Test**: Drawer draws strokes and clears canvas; strokes appear in backend room state and are returned in snapshots to all viewers.

### Implementation for User Story 1

- [x] T011 [US1] Add `POST /rooms/:code/stroke` endpoint in `backend/src/api/rooms.ts` with drawer authorization (403 if not drawer)
- [x] T012 [US1] Add `POST /rooms/:code/clear` endpoint in `backend/src/api/rooms.ts` with drawer authorization (403 if not drawer)
- [x] T013 [US1] Add `addStroke` and `clearCanvas` methods to `frontend/src/services/api.ts`
- [x] T014 [US1] Create `DrawingCanvas` component in `frontend/src/components/DrawingCanvas.tsx` with HTML5 canvas, mouse/touch drawing, and clear button (drawer-only)
- [x] T015 [US1] Integrate `DrawingCanvas` into `GamePage.tsx` — render only when `isDrawer` is true, pass `room.strokes` for guesser rendering

**Checkpoint**: User Story 1 functional — drawer can draw and clear, strokes sync to all players via polling

---

## Phase 4: User Story 2 — Guessers Submit Guesses (Priority: P1) 🎯

**Goal**: Guessers submit trimmed, case-insensitive guesses; empty guesses rejected; correct guesses score 100 points.

**Independent Test**: Submit various guesses (correct, incorrect, empty, whitespace-padded, mixed-case) and verify scoring and validation behavior.

### Implementation for User Story 2

- [x] T016 [US2] Add `POST /rooms/:code/guess` endpoint in `backend/src/api/rooms.ts` with validation (400 if empty, 403 if drawer, correct/incorrect scoring)
- [x] T017 [US2] Update `submitGuess` method in `frontend/src/services/api.ts` to send guess text and handle response
- [x] T018 [US2] Modify `GuessForm` component in `frontend/src/components/GuessForm.tsx` to submit via API, display validation errors, and hide for drawer

**Checkpoint**: User Story 2 functional — guesses submitted, validated, scored; drawer cannot guess

---

## Phase 5: User Story 3 — Guess History Synced to All Players (Priority: P2)

**Goal**: All guesses visible in shared history, synced to all players via polling.

**Independent Test**: Multiple guessers submit guesses; all players see the complete history within one polling cycle.

### Implementation for User Story 3

- [x] T019 [P] [US3] Create `GuessHistory` component in `frontend/src/components/GuessHistory.tsx` that renders the list of guesses with correct/incorrect indicators
- [x] T020 [US3] Integrate `GuessHistory` into `GamePage.tsx` sidebar, passing `room.guesses` as prop

**Checkpoint**: User Story 3 functional — all players see shared guess history

---

## Phase 6: User Story 4 — Score Tracking (Priority: P3)

**Goal**: Scores start at 0, correct guesses award 100, incorrect award 0, scores visible to all.

**Independent Test**: Verify all scores are 0 at round start; correct guess increases to 100; incorrect guess leaves score unchanged.

### Implementation for User Story 4

- [x] T021 [US4] Update `Scoreboard` component in `frontend/src/components/Scoreboard.tsx` to display player scores from `room.playerScores`
- [x] T022 [US4] Add unit test in `backend/src/services/roomStore.test.ts` for `submitGuess` scoring logic (correct=100, incorrect=0, no double-scoring)

**Checkpoint**: All user stories functional — complete gameplay interaction

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T023 Run full test suite (`npm test` in backend and frontend) and fix any regressions
- [ ] T024 Run TypeScript compiler (`npx tsc --noEmit`) in both backend and frontend to verify zero type errors
- [ ] T025 [P] Update `frontend/src/services/api.test.ts` to test stroke, clear, and guess API methods
- [ ] T026 Run quickstart.md manual testing guide to validate end-to-end flow
- [ ] T027 Run lint checks (`npm run lint`) in both backend and frontend — may be N/A if no lint scripts configured

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup verification — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 (P1) — backend endpoints + frontend canvas component
  - US2 (P1) — backend guess endpoint + frontend form update
  - US3 (P2) — depends on US2 (needs guesses in snapshot to display history)
  - US4 (P3) — depends on US2 (needs scoring logic in submitGuess)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — no dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational — no dependencies on other stories
- **User Story 3 (P2)**: Depends on US2 completing (needs `guesses` in snapshot)
- **User Story 4 (P3)**: Depends on US2 completing (needs scoring logic)

### Within Each User Story

- Models before services
- Services before endpoints
- Backend before frontend integration
- Story complete before moving to next priority

### Parallel Opportunities

- T003, T004, T005, T006 (Phase 2 model/type changes) can run in parallel — different files
- T011, T012 (US1 backend endpoints) can run in parallel — both in same file but independent logic
- T019 (US3 component creation) can start in parallel with US1/US2 backend work — different codebases
- T023, T024, T025, T027 (Polish) — T025 can run in parallel with T023/T024

---

## Parallel Example: Foundational Phase

```bash
# Launch all model/type changes together:
Task: "Add Stroke, Guess, PlayerScore types to backend/src/models/game.ts"
Task: "Add strokes, guesses, playerScores, hasScored to Room in backend/src/models/game.ts"
Task: "Add strokes, guesses, playerScores to RoomSnapshot in backend/src/models/game.ts"
Task: "Add types to frontend/src/services/api.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 + US2)

1. Complete Phase 1: Setup (quick verification)
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (drawing + clearing + sync)
4. Complete Phase 4: User Story 2 (guess submission + scoring)
5. **STOP and VALIDATE**: Test drawing, guessing, and scoring end-to-end
6. Continue to US3 + US4 for history display and scoreboard

### Incremental Delivery

1. Setup + Foundational → types, schemas, service functions ready
2. Add US1 → Drawing canvas works, strokes sync via polling
3. Add US2 → Guess submission with validation and scoring works
4. Add US3 → Guess history displayed to all players
5. Add US4 → Scoreboard shows live scores
6. Each step adds value without breaking previous steps

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (backend endpoints + DrawingCanvas)
   - Developer B: User Story 2 (backend guess endpoint + GuessForm update)
3. After US1 + US2: Developer A or B handles US3 + US4
4. Polish phase together

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- TypeScript compiler must pass with zero errors before any commit
- HTML5 Canvas drawing requires careful mouse/touch event handling in DrawingCanvas
