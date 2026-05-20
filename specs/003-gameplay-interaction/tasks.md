# Tasks: Gameplay Interaction

**Input**: Design documents from `specs/003-gameplay-interaction/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Tests**: Manual two-tab testing per constitution (no test framework configured)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on each other)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Core types and model extensions that MUST be in place before any user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T001 [P] Add CanvasStroke type (points, color, width) to `backend/src/models/game.ts`
- [ ] T002 [P] Add Guess and GuessSnapshot types to `backend/src/models/game.ts`
- [ ] T003 Extend Round interface in `backend/src/models/game.ts` with strokes: CanvasStroke[], guesses: Guess[], scores: Record<string, number>, correctGuessers: string[]; extend RoundSnapshot with strokes, guesses, scores, correctGuessers fields

**Checkpoint**: Foundation ready — CanvasStroke, Guess, GuessSnapshot types exist; Round/RoundSnapshot extended with gameplay fields

---

## Phase 2: User Story 1 — Drawer draws on canvas (Priority: P1) 🎯 MVP

**Goal**: Drawer can draw freehand lines on a canvas and clear the canvas; the drawing is synced to all players through polling.

**Independent Test**: Load the game as the drawer, draw lines on the canvas, and clear the canvas. The drawing appears immediately on the drawer's screen. After polling, guessers see the same drawing.

### Implementation for User Story 1

#### Backend

- [ ] T004 [US1] Extend toRoomSnapshot() in `backend/src/services/roomStore.ts` to include strokes, guesses, scores, correctGuessers from currentRound in the RoomSnapshot's RoundSnapshot
- [ ] T005 [US1] Implement saveStrokes() and clearCanvas() functions in `backend/src/services/roomStore.ts` — saveStrokes replaces the full strokes array on currentRound, clearCanvas sets strokes to []; both validate the caller is the round's drawer (return null / reject 403 if not); call saveRoom() to persist
- [ ] T006 [US1] Create POST /rooms/:code/draw route in `backend/src/api/rooms.ts` with Zod schema validating participantId + strokes array; call saveStrokes or clearCanvas; return updated RoomSnapshot via toRoomSnapshot

#### Frontend

- [ ] T007 [P] [US1] Add CanvasStroke type, draw() and clearCanvas() API helpers, and extend RoundSnapshot type (strokes, guesses, scores, correctGuessers) in `frontend/src/services/api.ts`
- [ ] T008 [P] [US1] Add drawStroke() and clearCanvas() methods to RoomStore in `frontend/src/state/roomStore.ts` — call api helpers, update room state with response
- [ ] T009 [US1] Create Canvas component in `frontend/src/components/Canvas.tsx` — freehand drawing via mouse/touch events, renders strokes from props, emits onStroke and onClear callbacks, single color (black), stroke width 3, normalized point coordinates (0-1)
- [ ] T010 [US1] Replace the placeholder canvas div in `frontend/src/pages/GamePage.tsx` with the Canvas component for the drawer role; wire onStroke/onClear to roomStore drawStroke/clearCanvas; guessers see the canvas in read-only mode (strokes rendered from snapshot)

**Checkpoint**: Drawer draws/clears canvas; all players see the drawing via polling

---

## Phase 3: User Story 2 — Guesser submits a guess (Priority: P1)

**Goal**: Guessers can submit text guesses; guesses are trimmed, compared case-insensitively, empty guesses rejected, max 50 chars enforced.

**Independent Test**: Load the game as a guesser, submit a guess. Valid guesses are accepted; empty/whitespace-only/over-50-char guesses are rejected with an error message.

### Implementation for User Story 2

#### Backend

- [ ] T011 [US2] Create guess submission Zod schema in `backend/src/api/schemas.ts` — validates participantId (string), text (string, trimmed, 1-50 chars after trim)
- [ ] T012 [US2] Implement submitGuess() in `backend/src/services/roomStore.ts` — validates caller is not the drawer (return null / 403), validates text via schema (400), appends Guess to round.guesses, calls saveRoom(), returns the created Guess
- [ ] T013 [US2] Create POST /rooms/:code/guess route in `backend/src/api/rooms.ts` — uses Zod schema, calls submitGuess, returns guess + updated RoomSnapshot via toRoomSnapshot

#### Frontend

- [ ] T014 [P] [US2] Add submitGuess() API helper in `frontend/src/services/api.ts`
- [ ] T015 [P] [US2] Add submitGuess() method to RoomStore in `frontend/src/state/roomStore.ts` — calls api helper, updates room state with response snapshot, returns the created guess
- [ ] T016 [US2] Update existing GuessForm component in `frontend/src/components/GuessForm.tsx` — wire handleSubmit to call roomStore.submitGuess, pass error string for inline display, accept onSubmit callback prop from parent
- [ ] T017 [US2] Wire GuessForm submission in `frontend/src/pages/GamePage.tsx` — pass participantId and room code to GuessForm; handle error display; ensure GuessForm receives onSubmit that calls roomStore.submitGuess

**Checkpoint**: Guessers can submit guesses; validation works (empty/max-length/drawer rejection)

---

## Phase 4: User Story 3 — All players see guess history (Priority: P2)

**Goal**: All players see an ordered, live-updating list of all guesses submitted during the round. Correct guesses are visually highlighted. Each entry shows the guesser's name.

**Independent Test**: Submit multiple guesses from the guesser's tab and confirm all players' screens show the same ordered history with correct guesses highlighted.

### Implementation for User Story 3

#### Frontend

- [ ] T018 [US3] Update existing ResultPanel component in `frontend/src/components/ResultPanel.tsx` — replace placeholder text with ordered list of guesses from a guesses prop; show guesser name, text, and timestamp; render correct guesses with distinctive style (green background / "Correct!" badge)
- [ ] T019 [US3] Wire guess data through to ResultPanel in `frontend/src/pages/GamePage.tsx` — pass currentRound.guesses from snapshot to ResultPanel as prop

**Checkpoint**: All players see the same guess history with correct guesses highlighted

---

## Phase 5: User Story 4 — Scoring on correct guess (Priority: P1)

**Goal**: Correct guess awards 100 points; incorrect adds 0. Already-correct guesser's input is disabled. Scores are visible to all players.

**Independent Test**: Submit the correct secret word as a guess and confirm score increases by 100. Submit an incorrect word and confirm score unchanged. Try guessing again after correct — input is disabled.

### Implementation for User Story 4

#### Backend

- [ ] T020 [US4] Add scoring and correctGuesser logic to submitGuess() in `backend/src/services/roomStore.ts` — after appending guess, evaluate trim().toLowerCase() against secretWord; if correct: scores[participantId] += 100, add participantId to correctGuessers, set guess.isCorrect = true; if incorrect: scores unchanged, isCorrect = false; reject if participantId already in correctGuessers (return null / 403)
- [ ] T021 [US4] Verify scores and correctGuessers are included in toRoomSnapshot() in `backend/src/services/roomStore.ts` — confirm scores map and correctGuessers array are present in RoundSnapshot (handled in T004)

#### Frontend

- [ ] T022 [P] [US4] Update existing Scoreboard component in `frontend/src/components/Scoreboard.tsx` — replace placeholder text with live scores from a scores prop and participants prop; display participant names with their scores, sorted by score descending
- [ ] T023 [US4] Add input disable for correct guessers in GuessForm component — check if current participantId is in currentRound.correctGuessers; if yes, disable input and show "You guessed correctly!" message; also pass isCorrect prop for inline celebration
- [ ] T024 [US4] Wire score data through to Scoreboard in `frontend/src/pages/GamePage.tsx` — pass currentRound.scores and participants from snapshot to Scoreboard as props

**Checkpoint**: Correct guess = +100 points, incorrect = +0, correct guesser input disabled, everyone sees scores

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification, build, and cleanup

- [ ] T025 Build backend: `cd backend && npm run build`
- [ ] T026 Build frontend: `cd frontend && npm run build`
- [ ] T027 Run manual two-tab test per `specs/003-gameplay-interaction/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: T001, T002, T003 — T001/T002 parallel; T003 depends on T001/T002 types
- **User Story 1 (Phase 2)**: Depends on Phase 1 — T004→T005→T006 (backend chain) + T007→T008→T009→T010 (frontend chain, T007/T008 parallel)
- **User Story 2 (Phase 3)**: Depends on Phase 1 only — T011→T012→T013 (backend chain) + T014→T015→T016→T017 (frontend chain, T014/T015 parallel)
- **User Story 3 (Phase 4)**: Depends on Phase 3 (guesses must exist in snapshot) + Phase 2 (toRoomSnapshot updated)
- **User Story 4 (Phase 5)**: Depends on Phase 3 (submitGuess must exist) + Phase 2 (toRoomSnapshot updated)
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational — No dependencies on other stories (independent of US1)
- **User Story 3 (P2)**: Depends on US2 (guess data) AND US1 (toRoomSnapshot extended) — display-only
- **User Story 4 (P1)**: Depends on US2 (submitGuess) AND US1 (toRoomSnapshot extended) — scoring logic + display
- **US1, US2 can be implemented in parallel** since they touch different files and models

### Within Each User Story

- Types before services
- Services before endpoints
- API helpers before roomStore methods
- Components before page integration

### Parallel Opportunities

- T001 and T002 can run in parallel (different types, no overlap)
- T007 (api.ts) and T008 (roomStore.ts) can run in parallel
- T014 (api.ts) and T015 (roomStore.ts) can run in parallel
- US1 and US2 backend chains can run in parallel (different files, no overlap)
- T018 (ResultPanel) and T022 (Scoreboard) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all independent tasks for US1 together:
Task: "Extend toRoomSnapshot in backend/src/services/roomStore.ts"
Task: "Add draw types and helpers in frontend/src/services/api.ts"
Task: "Add drawStroke/clearCanvas in frontend/src/state/roomStore.ts"

# After T004+T007+T008 complete:
Task: "Implement saveStrokes/clearCanvas in backend/src/services/roomStore.ts"
Task: "Create POST /rooms/:code/draw route in backend/src/api/rooms.ts"
Task: "Implement Canvas component in frontend/src/components/Canvas.tsx"

# After Canvas + backend draw API done:
Task: "Integrate Canvas into GamePage in frontend/src/pages/GamePage.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: T001-T003 (types)
2. Complete Phase 2: User Story 1 (T004-T010)
3. **STOP and VALIDATE**: Test US1 independently — drawer draws and clears, guessers see canvas via polling
4. Build and verify (T025-T026)

### Incremental Delivery

1. Add User Story 1 (T004-T010) → Drawing with canvas sync → Test → Demo (MVP!)
2. Add User Story 2 (T011-T017) → Guessing with validation → Test
3. Add User Story 3 (T018-T019) → Guess history display → Test
4. Add User Story 4 (T020-T024) → Scoring and correct-guesser handling → Test
5. Each story adds value without breaking previous stories

---

## Existing Code Assessment

The following files already exist from Phase 2 and will be **updated** (not created):

| File | Status | What to change |
|------|--------|---------------|
| `frontend/src/components/GuessForm.tsx` | Exists (placeholder) | Wire submitGuess API call, add error display |
| `frontend/src/components/ResultPanel.tsx` | Exists (placeholder) | Show ordered guess list with highlights |
| `frontend/src/components/Scoreboard.tsx` | Exists (placeholder) | Show live scores from snapshot |
| `frontend/src/pages/GamePage.tsx` | Exists (functional) | Replace canvas placeholder, wire all new components |
| `frontend/src/state/roomStore.ts` | Exists (functional) | Add drawStroke, clearCanvas, submitGuess methods |

The following files are **new** and must be created:

| File | Purpose |
|------|---------|
| `frontend/src/components/Canvas.tsx` | Freehand drawing component |

---

## Notes

- [P] tasks = different files, no dependencies on each other
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- US1, US2 are independent — can be implemented in either order or in parallel
- US3, US4 depend on US2 + US1 — they add display on top of existing infrastructure
- All guess evaluation happens server-side (case-insensitive, trimmed)
- The drawer is prevented from seeing guess input at the UI level (FR-017)
- Correct guesser input is disabled both client-side and enforced server-side (FR-013)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
