# Tasks: Gameplay Interaction

**Input**: Design documents from `specs/003-gameplay-interaction/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Core data model and types that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T001 Add `Point`, `Stroke`, `CanvasState`, `Guess` interfaces to `backend/src/models/game.ts`
- [ ] T002 [P] Add `scores` (Record<string, number>), `guessLog` (Guess[]), `roundEnded` (boolean) fields to `Room` interface in `backend/src/models/game.ts`
- [ ] T002b [P] Add `scores`, `guessLog`, `roundEnded` fields to `RoomSnapshot` interface in `backend/src/models/game.ts`
- [ ] T003 In-memory canvas storage: add `Map<string, CanvasState>` alongside existing `rooms` map in `backend/src/services/roomStore.ts`
- [ ] T004 [P] Add Zod schemas for draw, guess, end-round endpoints in `backend/src/api/schemas.ts`
- [ ] T005 [P] Add `submitDraw`, `clearCanvas`, `fetchCanvas`, `submitGuess`, `endRound` API methods to `frontend/src/services/api.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 2: User Story 1 - Drawer Draws on Canvas and Others See It (Priority: P1) 🎯 MVP

**Goal**: The drawer can draw strokes that are stored server-side and rendered on all guessers' canvases via a dedicated polling endpoint.

**Independent Test**: Open game in two browser tabs (drawer + guesser). Drawer draws lines in various colors and clears canvas. Guesser sees each stroke appear within 3 seconds and canvas clears appropriately.

### Implementation for User Story 1

**Backend — Canvas endpoints:**

- [ ] T006 [P] [US1] Implement `POST /rooms/:code/draw` handler in `backend/src/api/router.ts` — accepts stroke body, validates drawer role, appends to canvas state
- [ ] T007 [P] [US1] Implement `DELETE /rooms/:code/draw` handler in `backend/src/api/router.ts` — validates drawer role, clears canvas state
- [ ] T008 [P] [US1] Implement `GET /rooms/:code/canvas` handler in `backend/src/api/router.ts` — returns current strokes for any participant

**Backend — Canvas service logic:**

- [ ] T009 [US1] Add `appendStroke(roomCode, participantId, stroke)` function to `backend/src/services/roomStore.ts` — validates drawer role, stores stroke
- [ ] T010 [US1] Add `clearCanvas(roomCode, participantId)` function to `backend/src/services/roomStore.ts` — validates drawer role, clears strokes
- [ ] T011 [US1] Add `getCanvasState(roomCode)` function to `backend/src/services/roomStore.ts` — returns strokes for any participant

**Frontend — Canvas component:**

- [ ] T012 [US1] Update `Canvas` in `frontend/src/components/Canvas.tsx` — on stroke complete (mouseup), serialize stroke as `{color, points}` and call `api.submitDraw()`
- [ ] T013 [US1] Update `Canvas` in `frontend/src/components/Canvas.tsx` — wire "Clear" button to call `api.clearCanvas()`
- [ ] T014 [US1] Update `Canvas` in `frontend/src/components/Canvas.tsx` — accept remote strokes prop and render them on canvas (overlay or replay)
- [ ] T015 [US1] Update `Canvas` in `frontend/src/components/Canvas.tsx` — draw local strokes immediately (optimistic) while also sending to server

**Frontend — Canvas polling:**

- [ ] T016 [US1] Add `startCanvasPolling()`, `stopCanvasPolling()`, and `fetchCanvas()` methods to `frontend/src/state/roomStore.ts` — separate ~2s interval calling `api.fetchCanvas()`
- [ ] T017 [US1] Update `GamePage` in `frontend/src/pages/GamePage.tsx` — start/stop canvas polling in useEffect alongside room polling; pass remote strokes to Canvas component
- [ ] T018 [US1] Update `GamePage` in `frontend/src/pages/GamePage.tsx` — render Canvas for guessers in "view" mode (remote strokes only, no drawing interaction)

**Checkpoint**: Drawing sync functional — drawer draws, guessers see strokes appear within 3 seconds

---

## Phase 3: User Story 2 - Guesser Submits a Guess and Gets Feedback (Priority: P1)

**Goal**: Guessers can type a guess, submit it, and see correct/incorrect feedback. All guess appearances in the guess log visible to all participants.

**Independent Test**: Guesser submits incorrect word → sees "incorrect" feedback, guess appears in log. Guesser submits correct word → sees "correct" feedback with highlight, guess appears in log.

### Implementation for User Story 2

**Backend — Guess endpoint:**

- [ ] T019 [US2] Implement `POST /rooms/:code/guess` handler in `backend/src/api/router.ts` — accepts `{participantId, text}`, validates guesser role, compares word
- [ ] T020 [US2] Add `submitGuess(roomCode, participantId, text)` function to `backend/src/services/roomStore.ts` — trim text, case-insensitive compare, record in guessLog, return correct/incorrect
- [ ] T021 [US2] Add backend guard: reject guess from drawer role (403), reject empty/whitespace guesses, reject if room not in "playing" status
- [ ] T022 [US2] Expose `guessLog` in `toRoomSnapshot()` in `backend/src/services/roomStore.ts` — include in snapshot when status is "playing" or "finished"

**Frontend — Guess form:**

- [ ] T023 [US2] Update `GuessForm` in `frontend/src/components/GuessForm.tsx` — wire submit button to call `api.submitGuess()`, display inline feedback (correct/incorrect)
- [ ] T024 [US2] Update `GuessForm` in `frontend/src/components/GuessForm.tsx` — handle error states: show inline error message and preserve guess text on network failure (FR-016)
- [ ] T025 [US2] Update `GuessForm` in `frontend/src/components/GuessForm.tsx` — disable input and show "Already guessed correctly" when user has already guessed the word
- [ ] T026 [US2] Update `GamePage` in `frontend/src/pages/GamePage.tsx` — hide GuessForm for drawer role (FR-012)

**Frontend — Guess log display:**

- [ ] T027 [US2] Update `ResultPanel` in `frontend/src/components/ResultPanel.tsx` — render guess log from room snapshot, show each guess with participant name, text, and correct/incorrect indicator
- [ ] T028 [US2] Update `ResultPanel` in `frontend/src/components/ResultPanel.tsx` — visually distinguish correct guesses (e.g., green highlight) from incorrect ones
- [ ] T029 [US2] Update `GamePage` in `frontend/src/pages/GamePage.tsx` — pass guess log from room snapshot to ResultPanel

**Checkpoint**: Guess submission and feedback fully functional — guesses flow end-to-end with error handling

---

## Phase 4: User Story 3 - Scoring and Round Results (Priority: P1)

**Goal**: Correct guessers earn 100 points. When all guessers have guessed correctly, the round ends and everyone sees results.

**Independent Test**: Two guessers in a room; each guesses correctly → each gets 100 points; after last guesser, round ends showing secret word and final scores.

### Implementation for User Story 3

**Backend — Scoring:**

- [ ] T030 [US3] Extend `submitGuess()` in `backend/src/services/roomStore.ts` — on correct guess, increment `scores[participantId] += 100`
- [ ] T031 [US3] Add `checkRoundEnd()` function in `backend/src/services/roomStore.ts` — count correct guessers vs total guessers; if all correct, trigger endRound
- [ ] T032 [US3] Add `endRound(roomCode)` function in `backend/src/services/roomStore.ts` — set `roundEnded = true`, `status = "finished"`, reveal secretWord to all, clear canvas state (FR-014)
- [ ] T033 [US3] Expose `scores` in `toRoomSnapshot()` — include as `Record<string, number>` when status is "playing" or "finished"

**Frontend — Scoreboard:**

- [ ] T034 [US3] Update `Scoreboard` in `frontend/src/components/Scoreboard.tsx` — render participant scores from room snapshot, sorted by score descending
- [ ] T035 [US3] Update `GamePage` in `frontend/src/pages/GamePage.tsx` — pass scores from room snapshot to Scoreboard

**Frontend — Results screen:**

- [ ] T036 [US3] Update `GamePage` in `frontend/src/pages/GamePage.tsx` — when `room.roundEnded === true`, render results view showing secret word revealed, final scores, full guess log
- [ ] T037 [US3] Update `GamePage` in `frontend/src/pages/GamePage.tsx` — when round ends, stop canvas polling and show "finished" state

**Checkpoint**: Full gameplay loop complete — guessing, scoring, round end, and results all work end-to-end

---

## Phase 5: User Story 4 - Host Can End the Round Early (Priority: P2)

**Goal**: The host can manually end the round at any time, revealing the word and showing results. Non-hosts cannot end the round.

**Independent Test**: Host clicks "End Round" → all participants see results screen with secret word revealed within 2 seconds. Non-host drawer cannot see or use the End Round button.

### Implementation for User Story 4

**Backend — End-round endpoint:**

- [ ] T038 [US4] Implement `POST /rooms/:code/end-round` handler in `backend/src/api/router.ts` — validates host role, calls endRound()
- [ ] T039 [US4] Add guard: reject end-round if participant is not the host (403), if room not in "playing" status (409)

**Frontend — End Round UI:**

- [ ] T040 [US4] Add "End Round" button in `GamePage` in `frontend/src/pages/GamePage.tsx` — visible only to host, calls `api.endRound()`
- [ ] T041 [US4] Add `endRound()` method to `frontend/src/state/roomStore.ts` — POST to `/rooms/:code/end-round`, update room state
- [ ] T042 [P] [US4] Add CSS styles for End Round button and results screen in `frontend/src/styles/app.css`

**Checkpoint**: Host can end round early; results screen appears for all participants

---

## Phase 6: User Story 5 - Canvas Reset for New Round Preparation (Priority: P3)

**Goal**: When the round ends, the canvas state is cleared so no leftover strokes remain visible.

**Independent Test**: Complete a round via any means (all guessed or host ended) → verify canvas is blank when viewing the room.

### Implementation for User Story 5

- [ ] T043 [US5] Already covered by `endRound()` in T032 — verify FR-014 is satisfied: canvas state is deleted from canvas map on round end
- [ ] T044 [US5] Add frontend guard: when GamePage detects `room.roundEnded === true` on poll, clear any locally cached stroke data

**Checkpoint**: Canvas cleanly resets on round end

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T045 Write backend unit tests for guess validation, scoring, and round-end logic in `tests/backend/roomStore.test.ts`
- [ ] T046 [P] Add error handling for edge cases: duplicate incorrect guesses in guess log, empty canvas clear as no-op
- [ ] T047 Add `frontend/src/styles/app.css` styles for guess log entries (correct/incorrect highlight), scoreboard layout, results screen, error messages
- [ ] T048 Run quickstart.md validation scenarios to verify end-to-end flows
- [ ] T049 Remove placeholder text from ResultPanel and Scoreboard components

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — can start immediately. BLOCKS all user stories.
- **User Story 1 (Phase 2)**: Depends on Foundational completion
- **User Story 2 (Phase 3)**: Depends on Foundational completion. Does NOT depend on US1 (guess form doesn't need drawing sync to function)
- **User Story 3 (Phase 4)**: Depends on US2 (guess submission must exist before scoring is meaningful)
- **User Story 4 (Phase 5)**: Depends on US3 (round end logic must exist before host can trigger it)
- **User Story 5 (Phase 6)**: Depends on US3 (round end must exist for canvas reset to trigger)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational — No dependencies on US1
- **User Story 3 (P1)**: Depends on US2 (needs guess submission to score)
- **User Story 4 (P2)**: Depends on US3 (needs round end mechanism)
- **User Story 5 (P3)**: Depends on US3 (needs round end to clear canvas)

### Within Each User Story

- Models before services
- Services before endpoints
- Backend before frontend
- Core implementation before integration

### Parallel Opportunities

- T001, T002, T002b can run in parallel (different type additions in same file — merge carefully)
- T004, T005 can run in parallel (backend schemas + frontend API methods)
- T006, T007, T008 (canvas endpoints) can run in parallel
- US1 and US2 can be worked on in parallel by different developers
- Within US2: backend (T019-T022) and frontend (T023-T029) can be done in parallel after types/schemas are ready

---

## Parallel Example: User Story 1

```bash
# Launch all backend canvas endpoints together:
Task: T006 Implement POST /rooms/:code/draw in backend/src/api/router.ts
Task: T007 Implement DELETE /rooms/:code/draw in backend/src/api/router.ts
Task: T008 Implement GET /rooms/:code/canvas in backend/src/api/router.ts

# Launch all frontend Canvas updates together:
Task: T012 Serialize stroke on mouseup and call api.submitDraw() in Canvas.tsx
Task: T013 Wire Clear button to api.clearCanvas() in Canvas.tsx
Task: T014 Render remote strokes on canvas in Canvas.tsx
```

## Parallel Example: User Story 2

```bash
# Backend and frontend can be worked on independently:
Task: T019 Implement POST /rooms/:code/guess in backend/src/api/router.ts
Task: T020 Implement submitGuess() in backend/src/services/roomStore.ts

Task: T023 Update GuessForm to call api.submitGuess() in GuessForm.tsx
Task: T027 Update ResultPanel to render guess log in ResultPanel.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Foundational
2. Complete Phase 2: User Story 1 (drawing sync)
3. **STOP and VALIDATE**: Open two tabs, drawer draws, guesser sees strokes
4. This is a valid MVP — drawing sync alone delivers gameplay value

### Incremental Delivery

1. Phase 1 → Foundation ready
2. Phase 2 (US1) → Drawing sync works → **MVP!**
3. Phase 3 (US2) → Guess submission works → Deploy/Demo
4. Phase 4 (US3) → Scoring and round end → Full game loop
5. Phase 5 (US4) → Host controls → Deploy/Demo
6. Phase 6 (US5) → Canvas cleanup → Deploy/Demo

### Parallel Team Strategy

With multiple developers:
1. Complete Phase 1 together
2. Developer A: US1 (drawing sync)
3. Developer B: US2 (guess submission — no dependency on US1)
4. Merge US1 and US2, then build US3 together
