# Tasks: Gameplay Interaction

**Input**: Design documents from `specs/003-gameplay-interaction/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are included as TDD-style tasks — written before implementation, verified to fail first.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Format**: `[ID] [P?] [Story] Description`

- `[P]`: Can run in parallel (different files, no dependencies)
- `[Story]`: Which user story this task belongs to (US1, US2, etc.)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No setup tasks needed — the project is already initialized with Express backend and React frontend from prior specs.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend types and validation schemas required by ALL user stories. MUST be complete before any user story work begins.

- [x] T001 Add DrawingStroke, Point, RoundStatus, Guess, PlayerScore types to `backend/src/models/game.ts`
- [x] T002 [P] Add Zod schemas for guess submission (text validation), stroke submission (action + strokes array), and reveal action in `backend/src/api/schemas.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin. US1 (Drawing) and US3 (Guessing) can proceed in parallel.

---

## Phase 3: User Story 1 - Drawing and Viewing the Canvas (Priority: P1) 🎯 MVP

**Goal**: The drawer can draw freehand on an interactive canvas with color and width tools. All other players see the strokes appear via polling within one poll cycle.

**Independent Test**: Open two browser sessions in the same room. Start the game. The drawer draws strokes on the canvas. The second session sees the same strokes appear after the next poll (within 2-3 seconds).

### TDD: Tests for User Story 1

> **Write these FIRST, ensure they FAIL before implementation**

- [ ] T003 [P] [US1] Backend test: stroke submission only accepted from drawer in `backend/src/services/roomStore.test.ts`
- [ ] T004 [P] [US1] Backend test: strokes rejected when room is not in "playing" status
- [ ] T005 [P] [US1] Backend test: stored strokes returned in room snapshot via polling
- [ ] T006 [P] [US1] Backend test: empty canvas returned when no strokes submitted

### Implementation for User Story 1

- [ ] T007 [US1] Backend: Add `strokes: DrawingStroke[]` and `clearVersion: number` to Room, initialize on game start in `backend/src/services/roomStore.ts`
- [ ] T008 [P] [US1] Backend: Implement `appendStrokes(roomCode, participantId, strokes)` in `backend/src/services/roomStore.ts` — validate drawer, append strokes
- [ ] T009 [P] [US1] Backend: Implement `getStrokes(roomCode)` returning current strokes + clearVersion
- [ ] T010 [P] [US1] Backend: Extend `toRoomSnapshot()` to include strokes, clearVersion fields in `backend/src/services/roomStore.ts`
- [ ] T011 [P] [US1] Backend: Add POST `/rooms/:code/strokes` and GET `/rooms/:code/strokes` handlers in `backend/src/api/rooms.ts`
- [ ] T012 [US1] Backend: Mount stroke routes in `backend/src/api/router.ts`
- [ ] T013 [P] [US1] Frontend: Add `submitStrokes(roomCode, participantId, strokes)` and `fetchStrokes(roomCode)` API functions in `frontend/src/services/api.ts`
- [ ] T014 [P] [US1] Frontend: Create `DrawingCanvas` component with HTML5 canvas, mouse event handlers (mousedown/mousemove/mouseup), color picker (8 colors), and width picker (3 sizes) in `frontend/src/components/DrawingCanvas.tsx`
- [ ] T015 [P] [US1] Frontend: Add stroke state (strokes array, clearVersion) to roomStore in `frontend/src/state/roomStore.ts`
- [ ] T016 [US1] Frontend: Integrate DrawingCanvas into GamePage — replace placeholder, pass polling strokes to canvas, handle local drawing + server sync in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: US1 complete — the core drawing mechanic works. Single-browser testing confirms drawer can draw, multi-browser confirms strokes sync via polling.

---

## Phase 4: User Story 2 - Clear Canvas (Priority: P2)

**Goal**: The drawer can clear the canvas with one click. All players see a blank canvas after the next poll.

**Independent Test**: Draw strokes, click clear. Verify canvas is blank locally. Verify a second session sees an empty canvas after polling.

### TDD: Tests for User Story 2

- [ ] T017 [P] [US2] Backend test: clear action only accepted from drawer
- [ ] T018 [P] [US2] Backend test: clear increments clearVersion and resets strokes array
- [ ] T019 [P] [US2] Backend test: clear rejected for non-drawer (guesser)

### Implementation for User Story 2

- [ ] T020 [US2] Backend: Implement `clearCanvas(roomCode, participantId)` in `backend/src/services/roomStore.ts` — validate drawer, reset strokes, increment clearVersion
- [ ] T021 [P] [US2] Backend: Add clear-canvas handling to POST `/rooms/:code/strokes` action="clear" in `backend/src/api/rooms.ts`
- [ ] T022 [P] [US2] Frontend: Add `clearStrokes(roomCode, participantId)` API function in `frontend/src/services/api.ts`
- [ ] T023 [US2] Frontend: Add clear button (drawer-only) to DrawingCanvas component in `frontend/src/components/DrawingCanvas.tsx` — sends clear action + clears local canvas

**Checkpoint**: US2 complete — drawer can clear and all players see the cleared canvas.

---

## Phase 5: User Story 3 - Guess Submission with Validation (Priority: P2)

**Goal**: A guesser submits a text guess and receives correct/incorrect feedback. The drawer cannot guess. Empty/long guesses are rejected.

**Independent Test**: Submit a correct guess — get `isCorrect: true`. Submit an incorrect guess — get `isCorrect: false`. Submit as drawer — get 403 error.

### TDD: Tests for User Story 3

- [ ] T024 [P] [US3] Backend test: correct guess matches secret word case-insensitively
- [ ] T025 [P] [US3] Backend test: incorrect guess returns isCorrect false
- [ ] T026 [P] [US3] Backend test: drawer's guess rejected with error
- [ ] T027 [P] [US3] Backend test: empty/whitespace-only guess rejected
- [ ] T028 [P] [US3] Backend test: guess exceeding 200 chars rejected
- [ ] T029 [P] [US3] Backend test: guess after round_ended rejected
- [ ] T030 [P] [US3] Backend test: guesser who already guessed correctly — subsequent guesses silently ignored

### Implementation for User Story 3

- [ ] T031 [US3] Backend: Implement `submitGuess(roomCode, participantId, text)` in `backend/src/services/roomStore.ts` — validate guesser (not drawer), validate text (1-200 chars, trimmed, not empty), case-insensitive match to secretWord, record guess in `guesses[]`, return `{isCorrect, allGuessersCorrect}`
- [ ] T032 [P] [US3] Backend: Extend `toRoomSnapshot()` to include `guesses: Guess[]` and `allGuessersCorrect: boolean` in `backend/src/services/roomStore.ts`
- [ ] T033 [P] [US3] Backend: Add POST `/rooms/:code/guesses` handler in `backend/src/api/rooms.ts` — call submitGuess, return validation result
- [ ] T034 [US3] Backend: Mount guess route in `backend/src/api/router.ts`
- [ ] T035 [P] [US3] Frontend: Add `submitGuess(roomCode, participantId, text)` API function in `frontend/src/services/api.ts`
- [ ] T036 [P] [US3] Frontend: Add guesses array, allGuessersCorrect flag to roomStore state in `frontend/src/state/roomStore.ts`
- [ ] T037 [US3] Frontend: Wire GuessForm to API — call submitGuess on submit, show loading state, display "Correct!" or "Incorrect" feedback, disable input after correct guess in `frontend/src/components/GuessForm.tsx`

**Checkpoint**: US3 complete — guess submission works with validation, feedback, and error handling.

---

## Phase 6: User Story 4 - Synced Guess History via Polling (Priority: P3)

**Goal**: All players (including drawer) see the full chronological guess history update via polling. Guess history shows who guessed what and whether it was correct. A guesser who has guessed correctly stops appearing in future guesses.

**Independent Test**: Open two guesser sessions. Both submit guesses. Polling shows all guesses from all sessions. Drawer sees all guesses. Once a guesser is correct, their subsequent guesses do not appear.

### TDD: Tests for User Story 4

- [ ] T038 [P] [US4] Frontend test: ResultPanel renders guess history with correct/incorrect markers
- [ ] T039 [P] [US4] Frontend test: guess history updates when new guesses arrive via polling
- [ ] T040 [P] [US4] Frontend test: correct guesser's subsequent guesses not shown

### Implementation for User Story 4

- [ ] T041 [US4] Frontend: Render guess history in ResultPanel — iterate `room.guesses` from snapshot, show guesser name + text + timestamp + correct/incorrect badge, skip guesses from already-correct players in `frontend/src/components/ResultPanel.tsx`
- [ ] T042 [P] [US4] Frontend: Add sanitization for guess text display (prevent XSS) in ResultPanel
- [ ] T043 [US4] Frontend: Wire ResultPanel into GamePage — connected to polling snapshot data in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: US4 complete — all players see the guess history update in real time via polling.

---

## Phase 7: User Story 5 - Deterministic Scoring (Priority: P3)

**Goal**: Each correct guess awards exactly 1 point. Scoring is deterministic — same inputs always produce same result. Scores visible to all via polling.

**Independent Test**: Two guessers each guess correctly. Both receive exactly 1 point. Re-run the same scenario — same result.

### TDD: Tests for User Story 5

- [ ] T044 [P] [US5] Backend test: correct guess awards 1 point
- [ ] T045 [P] [US5] Backend test: scoring is deterministic — same inputs produce same result
- [ ] T046 [P] [US5] Backend test: all guessers receive same point value for correct guess
- [ ] T047 [P] [US5] Frontend test: Scoreboard renders correct scores

### Implementation for User Story 5

- [ ] T048 [US5] Backend: Add score tracking `scores: Map<string, number>` to Room, update when guess is correct (1 point per correct guess) in `backend/src/services/roomStore.ts`
- [ ] T049 [P] [US5] Backend: Extend `toRoomSnapshot()` to include scores sorted by score descending with participant names in `backend/src/services/roomStore.ts`
- [ ] T050 [P] [US5] Frontend: Render real scores in Scoreboard — display participant name + score, sorted by score descending in `frontend/src/components/Scoreboard.tsx`
- [ ] T051 [US5] Frontend: Wire Scoreboard into GamePage — connected to polling snapshot data in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: US5 complete — scoring is deterministic and visible to all via polling.

---

## Phase 8: Round End & Cross-Cutting Concerns

**Purpose**: Round-end detection (auto-end when all guessers correct + manual drawer reveal), game-ending state display, and final validation.

### TDD: Tests for Round End

- [ ] T052 [P] Backend test: round auto-ends when all guessers have a correct guess
- [ ] T053 [P] Backend test: drawer manual reveal transitions room to round_ended
- [ ] T054 [P] Backend test: strokes/guesses rejected after round_ended
- [ ] T055 [P] Backend test: secretWord revealed to ALL players in snapshot after round_ended

### Implementation for Round End

- [ ] T056 Backend: Implement `revealWord(roomCode, participantId)` — validate drawer, transition status to `"round_ended"` in `backend/src/services/roomStore.ts`
- [ ] T057 Backend: On every correct guess, check `allGuessersCorrect()` — auto-transition to round_ended if true in `backend/src/services/roomStore.ts`
- [ ] T058 [P] Backend: Update `toRoomSnapshot()` — on `round_ended`, include `secretWord` for ALL roles (not just drawer) in `backend/src/services/roomStore.ts`
- [ ] T059 [P] Backend: Add POST `/rooms/:code/reveal` endpoint in `backend/src/api/rooms.ts`
- [ ] T060 Backend: Mount reveal route in `backend/src/api/router.ts`
- [ ] T061 [P] Frontend: Add `revealWord(roomCode, participantId)` API function in `frontend/src/services/api.ts`
- [ ] T062 [P] Frontend: Show "Reveal Word" button (drawer-only during "playing") in GamePage in `frontend/src/pages/GamePage.tsx`
- [ ] T063 Frontend: Handle `round_ended` state — show secret word to all players, show final drawing and final scores, disable guess input and canvas drawing in `frontend/src/pages/GamePage.tsx`

### Cross-Cutting

- [ ] T064 [P] Frontend: Sanitize all guess text display to prevent XSS in ResultPanel and GuessForm
- [ ] T065 Frontend: Handle polling failures gracefully (show stale state, retry) in roomStore
- [ ] T066 Two-browser manual validation — execute all acceptance scenarios from spec.md
- [ ] T067 Run lint and typecheck: `cd backend && npx tsc --noEmit` and `cd frontend && npx tsc --noEmit`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — project already initialized
- **Phase 2 (Foundational)**: Can start immediately — BLOCKS all user stories
- **Phase 3 (US1 - P1)**: Depends on Phase 2 — NO dependency on other stories
- **Phase 4 (US2 - P2)**: Depends on Phase 3 (US1 — needs stroke infrastructure)
- **Phase 5 (US3 - P2)**: Depends on Phase 2 — NO dependency on US1/US2 (can parallel with Phase 3)
- **Phase 6 (US4 - P3)**: Depends on Phase 5 (US3 — needs guess storage)
- **Phase 7 (US5 - P3)**: Depends on Phase 5 (US3 — needs guess correctness)
- **Phase 8 (Round End)**: Depends on Phase 5 (US3) and Phase 7 (US5) — ties everything together

### User Story Dependencies

```
Phase 2 (Foundational)
        │
        ├──▶ Phase 3 (US1 - Drawing) ──▶ Phase 4 (US2 - Clear)
        │
        └──▶ Phase 5 (US3 - Guessing) ──▶ Phase 6 (US4 - History)
                                          └──▶ Phase 7 (US5 - Scoring)
                                                   │
                                                   └──▶ Phase 8 (Round End + Polish)
```

### Within Each Phase

- Tests MUST be written and FAIL before implementation
- Models/types before store logic
- Store logic before endpoints/routes (backend)
- API functions before component integration (frontend)
- Individual component before page integration
- Phase complete before moving to next

### Parallel Opportunities

| Tasks | Rationale |
|-------|-----------|
| T001 (game.ts types) and T002 (schemas.ts) | Different files, no overlap |
| All tests within a phase marked [P] | Independent test files/scenarios |
| Backend and frontend tasks within a story marked [P] | Independent environments |
| Phase 3 (US1) and Phase 5 (US3) | No dependencies — different features entirely |
| T003-T006 (US1 tests) | All independent test scenarios |
| T024-T030 (US3 tests) | All independent test scenarios |

---

## Parallel Example: MVP (User Story 1)

```bash
# Launch all US1 tests simultaneously:
Task: "T003 Backend test: stroke submission only from drawer"
Task: "T004 Backend test: strokes rejected when not playing"
Task: "T005 Backend test: strokes returned via polling"
Task: "T006 Backend test: empty canvas when no strokes"

# After tests pass, all US1 implementation tasks in parallel:
Task: "T007 Add strokes to Room model"
Task: "T008 Implement appendStrokes in roomStore"
Task: "T009 Implement getStrokes in roomStore"
Task: "T010 Extend toRoomSnapshot with strokes"
Task: "T011 Add stroke endpoints in rooms.ts"
Task: "T014 Create DrawingCanvas component"
Task: "T015 Add stroke state to roomStore"

# Then sequential integration:
Task: "T012 Mount stroke routes"
Task: "T013 Add API functions"
Task: "T016 Integrate DrawingCanvas into GamePage"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (T001-T002)
2. Complete Phase 3: User Story 1 (T003-T016)
3. **STOP and VALIDATE**: US1 independent test (two-browser drawing sync)
4. Deploy/demo if ready — core drawing mechanic works!

### Incremental Delivery

1. **Phase 2 (Foundation)** → Foundation ready
2. **Phase 3 (US1 - Drawing)** → Core drawing works → **MVP!**
3. **Phase 4 (US2 - Clear)** → Canvas clearing added
4. **Phase 5 (US3 - Guessing)** → Guess submission added (independent of drawing)
5. **Phase 6 (US4 - History)** → Guess history visible to all
6. **Phase 7 (US5 - Scoring)** → Scores tracked and displayed
7. **Phase 8 (Round End + Polish)** → Game completion + validation

### Parallel Team Strategy

**Developer A**: Phase 3 (US1 - Drawing) + Phase 4 (US2 - Clear)
**Developer B**: Phase 5 (US3 - Guessing) + Phase 6 (US4 - History) + Phase 7 (US5 - Scoring)
**Both**: Phase 2 (Foundational) together, then Phase 8 (Round End + Polish) together

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All new backend endpoints MUST use Zod validation (per constitution)
- All new types MUST be fully typed — no `any`
