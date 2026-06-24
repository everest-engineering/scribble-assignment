# Tasks: Gameplay Interaction

**Input**: Design documents from `specs/004-gameplay-interaction/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No test tasks included (not explicitly requested in spec)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization — no changes needed (project already set up)

No setup tasks required. The project already has the backend and frontend structure in place.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core model types, schema contracts, and RoomSnapshot extensions that MUST be complete before any user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T001 Extend Round model with `strokes`, `guesses`, and `scores` fields in `backend/src/models/game.ts`
- [ ] T002 [P] Create `Stroke` type (points, color, width) in `backend/src/models/game.ts`
- [ ] T003 [P] Create `Guess` type (participantId, guesserName, text, isCorrect, timestamp) in `backend/src/models/game.ts`
- [ ] T004 [P] Add `guessBodySchema` Zod schema in `backend/src/api/schemas.ts`
- [ ] T005 [P] Add `canvasStrokesSchema` Zod schema in `backend/src/api/schemas.ts`
- [ ] T006 [P] Add `canvasClearBodySchema` Zod schema in `backend/src/api/schemas.ts`
- [ ] T007 Extend `RoomSnapshot` type with `strokes`, `guesses`, `scores` fields in `backend/src/models/game.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Core Drawing and Guessing Cycle (Priority: P1) 🎯 MVP

**Goal**: The drawer can draw on a canvas and clear it; the canvas state is visible to all players via polling.

**Independent Test**: Open two browser tabs. Tab A (host) starts a game. Tab A draws on the canvas. Tab B sees the drawing appear within 2 seconds. Tab A clears the canvas. Tab B sees a blank canvas within 2 seconds.

### Implementation for User Story 1

- [ ] T008 [P] [US1] Implement `updateCanvas` in `backend/src/services/roomStore.ts` — appends strokes to round
- [ ] T009 [P] [US1] Implement `clearCanvas` in `backend/src/services/roomStore.ts` — sets strokes to empty array
- [ ] T010 [US1] Add `POST /:code/canvas` route in `backend/src/api/rooms.ts` — validate drawer, call updateCanvas, return RoomSnapshot
- [ ] T011 [US1] Add `POST /:code/canvas/clear` route in `backend/src/api/rooms.ts` — validate drawer, call clearCanvas, return RoomSnapshot
- [ ] T012 [US1] Extend `toRoomSnapshot` in `backend/src/services/roomStore.ts` to include `strokes` in snapshot
- [ ] T013 [P] [US1] Add `updateCanvas` and `clearCanvas` API methods in `frontend/src/services/api.ts`
- [ ] T014 [P] [US1] Add `updateCanvas` and `clearCanvas` store methods in `frontend/src/state/roomStore.ts`
- [ ] T015 [US1] Create `Canvas` component in `frontend/src/components/Canvas.tsx` — HTML5 Canvas for drawer with draw/clear functionality
- [ ] T016 [US1] Update `GamePage.tsx` in `frontend/src/pages/GamePage.tsx` — replace canvas placeholder with actual Canvas component (drawer only)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Guess Processing and Scoring (Priority: P1)

**Goal**: Guessers can submit text guesses; guesses are trimmed, case-insensitively compared, empty ones rejected, and correct guesses score 100 points.

**Independent Test**: Open two browser tabs. Tab A (host) starts a game. Tab B submits a correct guess → score becomes 100. Tab B submits an incorrect guess → score unchanged, guess appears in history. Tab B submits empty guess → rejected, no history entry, no score change. Tab B submits with spaces/caps → handled correctly.

### Implementation for User Story 2

- [ ] T017 [US2] Implement `submitGuess` in `backend/src/services/roomStore.ts` — trim, case-insensitive compare, score, record
- [ ] T018 [P] [US2] Implement `processGuess` helper in `backend/src/services/roomStore.ts` — core comparison and scoring logic (extracted from submitGuess for testability)
- [ ] T019 [US2] Add `POST /:code/guess` route in `backend/src/api/rooms.ts` — validate guesser (not drawer), validate not empty, call submitGuess, return RoomSnapshot
- [ ] T020 [US2] Extend `toRoomSnapshot` in `backend/src/services/roomStore.ts` to include `guesses` and `scores` in snapshot
- [ ] T021 [P] [US2] Add `submitGuess` API method in `frontend/src/services/api.ts`
- [ ] T022 [US2] Add `submitGuess` store method in `frontend/src/state/roomStore.ts` — returns the guess result
- [ ] T023 [US2] Wire `GuessForm` component in `frontend/src/components/GuessForm.tsx` — call submitGuess on submit, clear input after
- [ ] T024 [US2] Update `GamePage.tsx` in `frontend/src/pages/GamePage.tsx` — pass real data to GuessForm, hide guess input for drawer

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Guess History Visibility (Priority: P2)

**Goal**: All players can see the full guess history (with guesser names and correct/incorrect markers) and the scoreboard via polling.

**Independent Test**: Open two browser tabs. Tab A (drawer) and Tab B (guesser). Tab B submits several guesses (correct and incorrect). Both tabs see the same complete guess history in order with names and correctness markers. Tab A's scoreboard shows all player scores.

### Implementation for User Story 3

- [ ] T025 [P] [US3] Create `GuessHistory` component in `frontend/src/components/GuessHistory.tsx` — scrollable list with guesser name, text, correct/incorrect badge
- [ ] T026 [US3] Update `ResultPanel` component in `frontend/src/components/ResultPanel.tsx` — show real guess data from store instead of placeholder
- [ ] T027 [US3] Update `Scoreboard` component in `frontend/src/components/Scoreboard.tsx` — show real scores from store instead of placeholder
- [ ] T028 [US3] Wire polling to update guesses and scores in `frontend/src/state/roomStore.ts` — ensure silentFetchRoom picks up new fields
- [ ] T029 [US3] Update `GamePage.tsx` in `frontend/src/pages/GamePage.tsx` — add GuessHistory component to sidebar, wire Scoreboard and ResultPanel with store data

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements and edge case handling across all stories.

- [ ] T030 Verify drawer filtering — confirm guess endpoint rejects drawer submissions with 400
- [ ] T031 Verify duplicate prevention — confirm already-correct guesser does not receive additional score
- [ ] T032 Handle canvas race condition — confirm simultaneous guess and canvas-clear don't block each other
- [ ] T033 Add error handling for network failures during guess/canvas requests in frontend store
- [ ] T034 Run quickstart.md validation — manual two-browser-tab test of all acceptance scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — project already initialized
- **Foundational (Phase 2)**: BLOCKS all user stories — types and schemas must exist first
- **US1 - Canvas Drawing (Phase 3)**: Depends on Foundational completion
- **US2 - Guess Processing (Phase 4)**: Depends on Foundational completion; can run in parallel with US1
- **US3 - Guess History (Phase 5)**: Depends on US2 (needs guesses to exist); partial US1 (needs GamePage structure)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational — No dependencies on other stories
- **User Story 3 (P2)**: Depends on US2 (guesses data must be generated) and partially on US1 (GamePage structure)

### Within Each User Story

- Models and schemas (Phase 2) before services
- Backend endpoints before frontend integration
- Core implementation before edge case handling

### Parallel Opportunities

- T008 & T009 can run in parallel (different functions in same file, but independent logic)
- T013 & T014 can run in parallel (different files)
- T002, T003, T004, T005, T006 can all run in parallel (independent schemas and types)
- US1 and US2 backend work can run in parallel (different endpoints)
- T018 [P] Can run in parallel with T017 (helper function is independent)

---

## Parallel Example: Phase 2 Foundational

```bash
# Launch all independent type/schema tasks together:
Task: "Create Stroke type in backend/src/models/game.ts" (T002)
Task: "Create Guess type in backend/src/models/game.ts" (T003)
Task: "Add guessBodySchema Zod schema in backend/src/api/schemas.ts" (T004)
Task: "Add canvasStrokesSchema Zod schema in backend/src/api/schemas.ts" (T005)
Task: "Add canvasClearBodySchema Zod schema in backend/src/api/schemas.ts" (T006)
```

## Parallel Example: User Story 1

```bash
# Launch backend canvas tasks together:
Task: "Implement updateCanvas in backend/src/services/roomStore.ts" (T008)
Task: "Implement clearCanvas in backend/src/services/roomStore.ts" (T009)

# After T008-T009 done, launch routes + frontend together:
Task: "Add POST /:code/canvas route in backend/src/api/rooms.ts" (T010)
Task: "Add POST /:code/canvas/clear route in backend/src/api/rooms.ts" (T011)
Task: "Add updateCanvas and clearCanvas API methods in frontend/src/services/api.ts" (T013)
Task: "Add updateCanvas and clearCanvas store methods in frontend/src/state/roomStore.ts" (T014)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (types + schemas)
2. Complete Phase 3: User Story 1 (canvas drawing)
3. **STOP and VALIDATE**: Test canvas drawing independently (drawer draws, guessers see)
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Phase 2: Foundational → Types and schemas ready
2. Add Phase 3: User Story 1 (Canvas) → Test independently → Deploy/Demo (MVP!)
3. Add Phase 4: User Story 2 (Guess/Score) → Test independently → Deploy/Demo
4. Add Phase 5: User Story 3 (History/Scoreboard) → Test independently → Deploy/Demo
5. Add Phase 6: Polish → Edge cases hardened

### Parallel Team Strategy

With multiple developers:

1. Team completes Phase 2 together
2. Once Phase 2 is done:
   - Developer A: Phase 3 (US1 - Canvas)
   - Developer B: Phase 4 (US2 - Guess/Score)
3. Phase 5 (US3 - History) starts after US2 backend endpoints are complete
4. Polish tasks can be picked up by anyone once all stories are implemented

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- No test tasks included — run `npx vitest run` in backend/ and frontend/ for existing test suites
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
