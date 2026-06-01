# Tasks: Drawing Canvas and Guess Scoring

**Input**: Design documents from `/specs/003-drawing-canvas/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Organization**: Tasks are grouped by user story so each round interaction can be implemented and tested independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the shared round and room types that canvas, guessing, and scoring all build on.

- [X] T001 [P] Add canvas, guess, and score fields to the shared room model in `backend/src/models/game.ts` and `frontend/src/services/api.ts`
- [X] T002 [P] Add shared guess normalization and validation helpers in `backend/src/api/schemas.ts` and `backend/src/seed/starterData.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core room-state plumbing that every user story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 [P] Extend the in-memory round snapshot to carry canvas events, guess history, and scores in `backend/src/services/roomStore.ts`
- [X] T004 [P] Extend the frontend API client and room store to poll and consume canvas, guess, and score snapshots in `frontend/src/services/api.ts` and `frontend/src/state/roomStore.ts`
- [X] T005 Add request validation and route scaffolding for draw, clear, and guess actions in `backend/src/api/schemas.ts` and `backend/src/api/rooms.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Drawer Can Draw and Clear the Canvas (Priority: P1) 🎯 MVP

**Goal**: When a round is active, the drawer can draw on the canvas and clear it when needed, and the drawer does not see the guess input.

**Independent Test**: Start an active round as the drawer, draw on the canvas, clear it, and confirm the guess field is hidden for the drawer while drawing controls stay available only to the drawer.

### Tests for User Story 1

- [X] T006 [P] [US1] Add backend tests for drawer-only draw and clear permissions plus canvas reset behavior in `backend/src/services/roomStore.test.ts`
- [X] T007 [P] [US1] Add frontend tests for drawer-hidden guess input and draw-control rendering in `frontend/src/pages/GamePage.test.tsx`

### Implementation for User Story 1

- [X] T008 [US1] Implement canvas event storage, clear behavior, and drawer-only permissions in `backend/src/services/roomStore.ts`
- [X] T009 [US1] Wire `POST /rooms/:code/draw` and `POST /rooms/:code/clear` in `backend/src/api/rooms.ts`
- [X] T010 [US1] Render the active canvas surface, draw/clear controls, and drawer-hidden guess form in `frontend/src/pages/GamePage.tsx` and `frontend/src/components/GuessForm.tsx`

**Checkpoint**: User Story 1 should now be fully functional and testable independently

---

## Phase 4: User Story 2 - Guessers Submit Valid Guesses (Priority: P1)

**Goal**: Guessers can submit guesses that are trimmed, compared case-insensitively with the secret word, and rejected when empty.

**Independent Test**: Submit blank, padded, and mixed-case guesses and confirm invalid guesses are rejected while valid guesses are evaluated correctly.

### Tests for User Story 2

- [X] T011 [P] [US2] Add backend tests for trimmed guesses, case-insensitive matching, and empty-guess rejection in `backend/src/api/schemas.test.ts` and `backend/src/services/roomStore.test.ts`
- [X] T012 [P] [US2] Add frontend tests for guess submission trimming and blank-guess feedback in `frontend/src/components/GuessForm.test.tsx` and `frontend/src/state/roomStore.test.ts`

### Implementation for User Story 2

- [X] T013 [US2] Implement guess evaluation, scoring, and empty-input validation in `backend/src/services/roomStore.ts` and `backend/src/api/schemas.ts`
- [X] T014 [US2] Wire `POST /rooms/:code/guess` and client-side guess submission in `backend/src/api/rooms.ts`, `frontend/src/services/api.ts`, and `frontend/src/state/roomStore.ts`
- [X] T015 [US2] Update `frontend/src/components/GuessForm.tsx` to trim submissions, surface validation errors, and clear the input on success

**Checkpoint**: User Stories 1 and 2 should both work independently

---

## Phase 5: User Story 3 - Share Guess History and Points (Priority: P2)

**Goal**: All players see synchronized guess history during the round, and correct guesses award 100 points while incorrect guesses award 0 points.

**Independent Test**: Make several guesses from different players and confirm the guess history and scores stay consistent for all players viewing the same room.

### Tests for User Story 3

- [X] T016 [P] [US3] Add backend tests for synchronized guess history and per-player score snapshots in `backend/src/services/roomStore.test.ts`
- [X] T017 [P] [US3] Add frontend tests for synchronized activity and score rendering in `frontend/src/pages/GamePage.test.tsx`, `frontend/src/components/Scoreboard.tsx`, and `frontend/src/components/ResultPanel.tsx`

### Implementation for User Story 3

- [X] T018 [US3] Extend room snapshots to include ordered guess history and per-player scores in `backend/src/services/roomStore.ts`
- [X] T019 [US3] Render guess history and score updates in `frontend/src/components/Scoreboard.tsx`, `frontend/src/components/ResultPanel.tsx`, and `frontend/src/pages/GamePage.tsx`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T020 [P] Reconcile `specs/003-drawing-canvas/contracts/rooms.md` and `specs/003-drawing-canvas/quickstart.md` with the final draw, guess, and score behavior
- [X] T021 [P] Re-run and stabilize round-state coverage in `backend/src/services/roomStore.test.ts`, `backend/src/api/schemas.test.ts`, `frontend/src/components/GuessForm.test.tsx`, and `frontend/src/pages/GamePage.test.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel if needed
  - Or sequentially in priority order
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - May reuse the shared round snapshot plumbing, but should remain independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Depends on the guess and score data added by the earlier stories, but still tests independently against the shared snapshot

### Within Each User Story

- Tests MUST be written before implementation where included
- Shared types before services
- Services before route wiring
- Route wiring before UI consumption
- Story complete before moving to the next priority

### Parallel Opportunities

- Phase 1 tasks T001 and T002 can run in parallel
- Phase 2 tasks T003 and T004 can run in parallel once the shared types exist
- Phase 3 tasks T006 and T007 can run in parallel
- Phase 4 tasks T011 and T012 can run in parallel
- Phase 5 tasks T016 and T017 can run in parallel
- Phase 6 tasks T020 and T021 can run in parallel

---

## Parallel Example: User Story 1

```bash
Task: "Add backend tests for drawer-only draw and clear permissions plus canvas reset behavior in backend/src/services/roomStore.test.ts"
Task: "Add frontend tests for drawer-hidden guess input and draw-control rendering in frontend/src/pages/GamePage.test.tsx"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Complete Phase 4: User Story 2
5. **STOP and VALIDATE**: Verify the canvas and guess flow independently before adding synchronized history and scoring polish

### Incremental Delivery

1. Complete Setup + Foundational
2. Add User Story 1 to make drawing and canvas clearing work
3. Add User Story 2 so guessers can submit validated guesses
4. Add User Story 3 so guess history and scores stay synchronized
5. Finish with polish and cross-cutting test stabilization

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundation is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid vague tasks, same-file conflicts, and cross-story dependencies that break independence
