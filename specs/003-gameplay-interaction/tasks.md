---

description: "Task list for Gameplay Interaction — Drawing, Guessing & Scoring"
---

# Tasks: Gameplay Interaction — Drawing, Guessing & Scoring

**Input**: Design documents from `specs/003-gameplay-interaction/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/api.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**⚠️ IMPORTANT**: Write all test tasks FIRST (before their corresponding implementation tasks) and ensure they FAIL before implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Verify project tooling and understand existing code

- [X] T001 Verify test infrastructure runs — execute `npm test` in both `backend/` and `frontend/`
- [X] T002 Explore existing backend types in `backend/src/models/game.ts` and services in `backend/src/services/roomStore.ts`
- [X] T003 Explore existing frontend types in `frontend/src/services/api.ts` and `frontend/src/state/roomStore.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, schemas, and model extensions that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 [P] Add `CanvasAction` discriminated union type to `backend/src/models/game.ts`
- [X] T005 [P] Add `GuessEntry` interface and `scores` type (`Record<string, number>`) to `backend/src/models/game.ts`
- [X] T006 [P] Extend `Room` interface with `canvasActions: CanvasAction[]`, `guessHistory: GuessEntry[]`, `scores: Record<string, number>` in `backend/src/models/game.ts`
- [X] T007 [P] Extend `RoomSnapshot` interface with `canvasActions: CanvasAction[]`, `guessHistory: GuessEntry[]`, `scores: Record<string, number>`, `roundOver: boolean` in `backend/src/models/game.ts`
- [X] T008 [P] Add `canvasActionSchema` (Zod discriminated union for stroke/clear) to `backend/src/api/schemas.ts`
- [X] T009 [P] Add `guessSubmissionSchema` (Zod: `.trim().min(1).max(100)`) and `playerIdQuerySchema` to `backend/src/api/schemas.ts`
- [X] T010 Extend frontend `RoomSnapshot` interface with `canvasActions`, `guessHistory`, `scores`, `roundOver` in `frontend/src/services/api.ts`

**Checkpoint**: Foundation ready — all shared types and schemas exist

---

## Phase 3: User Story 1 — Drawer Draws and Clears Canvas (Priority: P1) 🎯 MVP

**Goal**: The drawer can draw strokes on a canvas (native HTML5 Canvas API), see them in real time, and clear the canvas. Strokes persist on the server and are included in the polling snapshot.

**Independent Test**: Start a game as the drawer, draw strokes on the canvas (verify they appear), click clear (verify canvas resets to blank), draw again (verify new strokes appear). Guesser polling shows canvas actions unchanged.

### Backend — Test

> **NOTE**: Write these tests FIRST, ensure they FAIL before implementation

- [X] T011 [P] [US1] Test canvas action schema validation (stroke/clear) in `backend/src/api/schemas.test.ts`
- [X] T012 [P] [US1] Test canvas submission endpoint (POST /:code/canvas) in `backend/src/api/rooms.test.ts`
- [X] T013 [P] [US1] Test canvas state in room snapshot in `backend/src/services/roomStore.test.ts`

### Backend — Implementation

- [X] T014 [US1] Implement `appendCanvasAction()` and `clearCanvas()` in `backend/src/services/roomStore.ts`
- [X] T015 [US1] Update `toRoomSnapshot()` to include `canvasActions` array in `backend/src/services/roomStore.ts`
- [X] T016 [US1] Implement `POST /:code/canvas` route (drawer-only guard, schema validation) in `backend/src/api/rooms.ts`

### Frontend — Test

> **NOTE**: Write these tests FIRST, ensure they FAIL before implementation

- [X] T017 [P] [US1] Test `submitCanvasAction()` in `frontend/src/services/api.test.ts`

### Frontend — Implementation

- [X] T018 [P] [US1] Create `DrawingCanvas` component (native HTML5 Canvas API, mouse/touch drawing) in `frontend/src/components/DrawingCanvas.tsx`
- [X] T019 [P] [US1] Add `submitCanvasAction()` to `frontend/src/services/api.ts`
- [X] T020 [P] [US1] Add `canvasActions` to `RoomState` and expose via store in `frontend/src/state/roomStore.ts`
- [X] T021 [US1] Wire `DrawingCanvas` into `GamePage` — show for drawer, replay strokes for guessers in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: Drawing works end-to-end. Drawer sees real-time strokes; guessers see replayed canvas on poll.

---

## Phase 4: User Story 2 — Guesser Submits a Guess (Priority: P1)

**Goal**: A guesser types a text guess, submits it. Server trims whitespace, rejects empty/whitespace-only, compares case-insensitively against the secret word, and returns the result (correct/incorrect). Drawer cannot guess.

**Independent Test**: Start a game as a guesser, submit a correct guess (trimmed, case-insensitive) — verify correct response. Submit empty guess — verify rejection. Submit incorrect guess — verify accepted with correct=false. Drawer tries to guess — verify 403.

### Backend — Test

> **NOTE**: Write these tests FIRST, ensure they FAIL before implementation

- [X] T022 [P] [US2] Test guess schema validation (trim, min, max, empty rejection) in `backend/src/api/schemas.test.ts`
- [X] T023 [P] [US2] Test guess submission endpoint (POST /:code/guess) in `backend/src/api/rooms.test.ts`
- [X] T024 [P] [US2] Test guess logic (trim, case-insensitive comparison, drawer rejection, already-scored rejection) in `backend/src/services/roomStore.test.ts`

### Backend — Implementation

- [X] T025 [US2] Implement `submitGuess()` service function (validate, trim, case-insensitive compare, reject drawer, reject already-scored, record guess) in `backend/src/services/roomStore.ts`
- [X] T026 [US2] Implement `POST /:code/guess` route (drawer guard, schema validation) in `backend/src/api/rooms.ts`

### Frontend — Test

> **NOTE**: Write these tests FIRST, ensure they FAIL before implementation

- [X] T027 [P] [US2] Test `submitGuess()` in `frontend/src/services/api.test.ts`

### Frontend — Implementation

- [X] T028 [P] [US2] Add `submitGuess()` to `frontend/src/services/api.ts`
- [X] T029 [US2] Wire `GuessForm` to call `submitGuess()` on submit, show result feedback (correct/incorrect/error) in `frontend/src/components/GuessForm.tsx`

**Checkpoint**: Guess submission works end-to-end. Correct guesses accepted, incorrect guesses recorded, edge cases handled.

---

## Phase 5: User Story 3 — Scores Update on Correct Guess (Priority: P1)

**Goal**: Scoring logic: correct guess awards 100 points, incorrect adds 0, already-scored guessers rejected. Scores visible via polling. Round ends when all guessers have scored 100.

**Independent Test**: Start a game with two guessers. Guesser A guesses correctly (score becomes 100). Guesser A submits again (rejected). Guesser B guesses correctly (score becomes 100). Verify `roundOver` flag is true when both have 100.

### Backend — Test

> **NOTE**: Write these tests FIRST, ensure they FAIL before implementation

- [X] T030 [P] [US3] Test scoring (correct=100, incorrect=0, no double-scoring) in `backend/src/services/roomStore.test.ts`
- [X] T031 [P] [US3] Test round-end detection (all guessers scored → roundOver flag) in `backend/src/services/roomStore.test.ts`
- [X] T032 [P] [US3] Test scores in room snapshot in `backend/src/services/roomStore.test.ts`

### Backend — Implementation

- [X] T033 [US3] Add scoring logic and round-end detection to `submitGuess()` in `backend/src/services/roomStore.ts`
- [X] T034 [US3] Include `scores` and `roundOver` in `toRoomSnapshot()` in `backend/src/services/roomStore.ts`
- [X] T035 [US3] Initialize scores to 0 for all non-drawer participants on game start in `backend/src/services/roomStore.ts`

### Frontend — Implementation

- [X] T036 [P] [US3] Add `scores` and `roundOver` to `RoomState` in `frontend/src/state/roomStore.ts`
- [X] T037 [US3] Wire `Scoreboard` to display real scores from room state in `frontend/src/components/Scoreboard.tsx`

**Checkpoint**: Scoring tracked end-to-end. Scores display on the scoreboard. Round-over flag reflects when all guessers have scored.

---

## Phase 6: User Story 4 — Guess History Syncs via Polling (Priority: P2)

**Goal**: All players see the full guess history (who guessed what, whether correct) via the existing polling mechanism.

**Independent Test**: Start a game with one drawer and one guesser. Guesser submits a correct guess and an incorrect guess. Drawer polls game state — verify guess history contains both entries with correct flags and in order. Empty history when no guesses submitted.

### Backend — Test

> **NOTE**: Write these tests FIRST, ensure they FAIL before implementation

- [X] T038 [P] [US4] Test guess history in room snapshot (ordered, all entries) in `backend/src/services/roomStore.test.ts`

### Backend — Implementation

- [X] T039 [US4] Include `guessHistory` in `toRoomSnapshot()` (already recorded in submitGuess) in `backend/src/services/roomStore.ts`

### Frontend — Implementation

- [X] T040 [P] [US4] Add `guessHistory` to `RoomState` in `frontend/src/state/roomStore.ts`
- [X] T041 [US4] Wire `ResultPanel` to display ordered guess history (participant name, guess text, correct/incorrect) in `frontend/src/components/ResultPanel.tsx`

**Checkpoint**: Guess history visible to all players via polling. Drawer and guessers both see the history.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation, cleanup, and ensuring all edge cases are covered

- [X] T042 [P] Run full backend test suite (`cd backend && npm test`) — verify all pass
- [X] T043 [P] Run full frontend test suite (`cd frontend && npm test`) — verify all pass
- [X] T044 Update frontend `RoomSnapshot` types in `frontend/src/services/api.ts` to match final backend shape
- [ ] T045 Validate against quickstart.md manual test flow — draw, guess, score, history all functional
- [ ] T046 Verify no regressions in lobby flow (create, join, start game still work)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (Phase 3) and US2 (Phase 4) are independent — can be parallelized
  - US3 (Phase 5) builds on US2's guess submission but can be implemented in parallel with US1
  - US4 (Phase 6) builds on US2's guess recording but is frontend-only wiring
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Depends On | Independent Test |
|-------|-----------|-----------------|
| **US1** (P1) Drawing | Phase 2 only | Draw strokes, clear canvas, verify guessers see actions via poll |
| **US2** (P1) Guessing | Phase 2 only | Submit correct/incorrect/empty guess, verify response, drawer rejected |
| **US3** (P1) Scoring | US2 (backend) | Verify 100 points for correct, 0 for incorrect, round-end detection |
| **US4** (P2) History | US2 (backend) | Poll game state, verify guessHistory contains all entries in order |

### Within Each User Story

- Tests (where included) MUST be written and FAIL before implementation
- Models/types before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next

### Parallel Opportunities

- All **Phase 2** tasks marked [P] can run in parallel
- **US1** and **US2** can run in parallel (different files, no cross-dependencies)
- **US3** backend tasks and **US1** frontend tasks can run in parallel
- **US4** tasks are frontend-only and can run in parallel with other frontend tasks
- All tests within a story marked [P] can run in parallel
- Backend and frontend work for independent stories can run in parallel

---

## Parallel Example: User Story 1 (Drawing Canvas)

```bash
# Launch all tests for User Story 1 together:
Task: "Test canvas action schema in schemas.test.ts"
Task: "Test canvas submission endpoint in rooms.test.ts"
Task: "Test canvas state in snapshot roomStore.test.ts"
Task: "Test submitCanvasAction in api.test.ts"

# Launch all implementation tasks for User Story 1 together:
Task: "Create DrawingCanvas component in frontend/src/components/DrawingCanvas.tsx"
Task: "Add submitCanvasAction to frontend/src/services/api.ts"
Task: "Add canvasActions to roomStore in frontend/src/state/roomStore.ts"
```

---

## Implementation Strategy

### MVP First (US1 Drawing Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Drawing Canvas)
4. **STOP and VALIDATE**: Draw strokes, clear, verify guessers see drawing via polling
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add **US1 (Drawing)** → Test independently → Deploy/Demo (MVP!)
3. Add **US2 (Guessing)** → Test independently → Deploy/Demo
4. Add **US3 (Scoring)** → Test independently → Deploy/Demo
5. Add **US4 (Guess History)** → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 Drawing (backend + frontend)
   - Developer B: US2 Guessing (backend + frontend)
3. After US1 + US2 complete:
   - Developer A: US3 Scoring (backend + frontend)
   - Developer B: US4 Guess History (frontend only)
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks within same phase/story
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
