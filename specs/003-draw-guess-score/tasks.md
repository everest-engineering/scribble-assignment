# Tasks: Round Drawing, Guessing, and Scoring

**Input**: Design documents from `/specs/003-draw-guess-score/`

**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api.md, quickstart.md, research.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing project structure is ready for feature 003. No new dependencies required.

- [x] T001 Confirm project structure matches plan.md (backend/src/, frontend/src/)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Update shared data models and core room logic so all user stories can build on them.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 [P] Add `Stroke`, `Point`, and `GuessEntry` types to `backend/src/models/game.ts`
- [x] T003 [P] Update `Room` interface in `backend/src/models/game.ts` to add `scores`, `guessHistory`, `canvasStrokes`
- [x] T004 Update `RoomSnapshot` interface in `backend/src/models/game.ts` to add `scores`, `guessHistory`, `canvasStrokes`
- [x] T005 [P] Update `Participant` interface in `backend/src/models/game.ts` to add `score` (derived from `room.scores`)
- [x] T006 Update `toRoomSnapshot` in `backend/src/services/roomStore.ts` to include new fields and map participant scores
- [x] T007 Update `startGame` in `backend/src/services/roomStore.ts` to initialize `scores` to 0, `guessHistory` and `canvasStrokes` to empty arrays
- [x] T008 Update `removeParticipant` in `backend/src/services/roomStore.ts` to clear round state (`scores`, `guessHistory`, `canvasStrokes`) when drawer leaves during `playing`
- [x] T009 [P] Update frontend `RoomSnapshot` and `Participant` types in `frontend/src/services/api.ts`
- [x] T010 [P] Update `roomStore.ts` frontend state types to include new room snapshot fields
- [x] T011 [P] Update existing backend tests in `backend/src/services/roomStore.test.ts` to account for new model fields
- [x] T012 [P] Update existing frontend API tests in `frontend/src/services/api.test.ts` to account for new snapshot fields

**Checkpoint**: Foundation ready — models, snapshot mapping, and round initialization/cleanup are in place.

---

## Phase 3: User Story 1 - Drawer Draws and Clears the Canvas (Priority: P1) 🎯 MVP

**Goal**: The drawer can draw freehand strokes on a canvas and clear it. All players see the canvas state via polling.

**Independent Test**: Start a game, verify the drawer sees an interactive canvas, draw a stroke, confirm it remains visible, and check that guessers see it after the next poll.

### Implementation for User Story 1

- [x] T013 [P] [US1] Add Zod schemas for canvas stroke (`updateCanvasSchema`) and clear (`clearCanvasSchema`) in `backend/src/api/schemas.ts`
- [x] T014 [US1] Implement `addStroke` and `clearCanvas` service methods in `backend/src/services/roomStore.ts`
- [x] T015 [US1] Add `POST /rooms/:code/canvas` and `POST /rooms/:code/canvas/clear` routes in `backend/src/api/rooms.ts`
- [x] T016 [P] [US1] Add `submitStroke` and `clearCanvas` API methods in `frontend/src/services/api.ts`
- [x] T017 [US1] Create `Canvas.tsx` component in `frontend/src/components/Canvas.tsx` with freehand drawing, normalized 0–1000 coordinates, and clear button
- [x] T018 [US1] Integrate `Canvas` into `frontend/src/pages/GamePage.tsx` replacing the canvas placeholder

**Checkpoint**: User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Guessers Submit Guesses with Validation (Priority: P1)

**Goal**: Guessers can submit text guesses. Empty/whitespace guesses are rejected. Case-insensitive matching against the secret word. Drawer cannot guess.

**Independent Test**: Have a guesser submit valid, whitespace-only, mixed-case, and incorrect guesses. Verify responses, scoring, and that the drawer is rejected.

### Implementation for User Story 2

- [x] T019 [P] [US2] Add Zod `submitGuessSchema` in `backend/src/api/schemas.ts`
- [x] T020 [US2] Implement `submitGuess` in `backend/src/services/roomStore.ts` with trim, empty rejection, case-insensitive compare, 100 points for first correct guess per player, 0 otherwise
- [x] T021 [US2] Add `POST /rooms/:code/guess` route in `backend/src/api/rooms.ts`
- [x] T022 [P] [US2] Add `submitGuess` API method in `frontend/src/services/api.ts`
- [x] T023 [US2] Update `GuessForm.tsx` to call `submitGuess`, show errors, and disable for drawer

**Checkpoint**: User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Guess History Synced to All Players via Polling (Priority: P1)

**Goal**: All players see an ordered guess history that updates automatically via the existing ~2-second room polling.

**Independent Test**: Open two guesser tabs, submit guesses in each, and verify both tabs show the full chronological history within a few seconds.

### Implementation for User Story 3

- [x] T024 [US3] Update `ResultPanel.tsx` to render `guessHistory` from the room snapshot with guess text, submitter name, and correct/incorrect indicator

**Checkpoint**: User Stories 1, 2, and 3 should all work independently.

---

## Phase 6: User Story 4 - Scoreboard Reflects Correct and Incorrect Guesses (Priority: P2)

**Goal**: A scoreboard shows each player's current score. Correct guesses add 100; incorrect add 0. All start at 0.

**Independent Test**: Submit a mix of correct and incorrect guesses and verify the scoreboard totals update for all players.

### Implementation for User Story 4

- [x] T025 [US4] Update `Scoreboard.tsx` to display participants and their scores from the room snapshot `scores` field

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete feature and ensure existing tests pass.

- [x] T026 [P] Run backend test suite: `cd backend && npm test`
- [x] T027 [P] Run frontend test suite: `cd frontend && npm test`
- [x] T028 Run `npm run build` in both `/backend` and `/frontend`
- [x] T029 Validate all quickstart.md scenarios manually (draw, clear, correct guess, case variant, empty guess, incorrect guess, drawer cannot guess, history sync, scoreboard, drawer leave mid-round)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup. BLOCKS all user stories.
- **User Stories (Phase 3–6)**: All depend on Foundational phase completion.
  - Can proceed in parallel if team capacity allows.
  - Recommended order: US1 → US2 → US3 → US4.
- **Polish (Phase 7)**: Depends on all user stories.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational. No dependencies on other stories.
- **User Story 2 (P1)**: Can start after Foundational. No dependencies on other stories.
- **User Story 3 (P1)**: Can start after Foundational. Depends on US2 guess data existing, but can be implemented in parallel if types are ready.
- **User Story 4 (P2)**: Can start after Foundational. Depends on US2 scoring logic, but can be implemented in parallel if types are ready.

### Within Each User Story

- Backend schemas before service methods.
- Service methods before API routes.
- API routes before frontend API methods.
- Frontend API methods before component integration.

### Parallel Opportunities

- All Foundational tasks marked `[P]` can run in parallel (different files, no cross-dependencies).
- US1 backend schemas and US2 backend schemas can be written in parallel.
- US1 `Canvas.tsx` can be built while backend canvas routes are being added.
- US3 `ResultPanel.tsx` and US4 `Scoreboard.tsx` can be updated in parallel.
- All Polish tasks marked `[P]` can run in parallel.

---

## Parallel Example: User Story 1

```bash
# Backend canvas work:
Task: "Add Zod canvas schemas in backend/src/api/schemas.ts"
Task: "Implement addStroke and clearCanvas in backend/src/services/roomStore.ts"
Task: "Add canvas routes in backend/src/api/rooms.ts"

# Frontend canvas work (can start once backend types are stable):
Task: "Add canvas API methods in frontend/src/services/api.ts"
Task: "Create Canvas component in frontend/src/components/Canvas.tsx"
Task: "Integrate Canvas into GamePage.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test canvas drawing and clearing independently.
5. Then proceed to US2, US3, US4 sequentially.

### Incremental Delivery

1. Setup + Foundational → Foundation ready.
2. Add User Story 1 → Test canvas independently.
3. Add User Story 2 → Test guess validation and scoring independently.
4. Add User Story 3 → Test history sync independently.
5. Add User Story 4 → Test scoreboard independently.
6. Polish → Run tests and quickstart validation.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together.
2. Once Foundational is done:
   - Developer A: User Story 1 (Canvas)
   - Developer B: User Story 2 (Guess validation + scoring)
   - Developer C: User Stories 3 and 4 (History panel + Scoreboard UI)
3. Stories complete and integrate independently because all depend only on the shared room snapshot type.

---

## Notes

- `[P]` tasks = different files, no dependencies on incomplete tasks.
- `[Story]` label maps task to specific user story for traceability.
- Each user story should be independently completable and testable.
- Commit after each phase or logical group.
- Stop at any checkpoint to validate a story independently.
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence.
