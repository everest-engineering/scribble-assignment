---

description: "Task list for Gameplay Interaction feature"

---

# Tasks: Gameplay Interaction

**Input**: Design documents from `specs/003-draw-guess-score/`

**Prerequisites**: plan.md (required), spec.md (required), clarify.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Tests**: Test tasks are included below as requested in the feature specification.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`

## Polling Model

The GamePage now polls `GET /rooms/:code?participantId=` every 2s (changed from
Scenario 2's single-fetch model). The poll response includes drawing strokes,
guess history, per-participant scores (round + cumulative), and optionally
`lastRoundResult` (present for ~6s after a round auto-advances).

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

No setup tasks required — the starter project is already initialized.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Data model extensions that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T001 [P] Add `Point`, `DrawingStroke`, `GuessEntry`, `ParticipantScore`, `RoundResult` types to `backend/src/models/game.ts`
- [X] T002 [P] Add `strokes`, `guessHistory`, `scores`, `lastRoundResult?` fields to the `Room` interface in `backend/src/models/game.ts`
- [X] T003 [P] Add `strokes`, `guessHistory`, `scores`, `lastRoundResult?` fields to the `RoomSnapshot` interface in `backend/src/models/game.ts`
- [X] T004 [P] Add `DrawingStroke`, `GuessEntry`, `ParticipantScore`, `RoundResult` types and `strokes`, `guessHistory`, `scores`, `lastRoundResult?` fields to the `RoomSnapshot` interface in `frontend/src/services/api.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Canvas Drawing (Priority: P1) 🎯 MVP

**Goal**: The drawer can draw strokes on an interactive canvas using a pen tool, change colors, and clear the canvas. All strokes are persisted server-side and synced to guessers via polling. Guessers see a read-only rendering of the same canvas.

**Independent Test**: Start a game, confirm the drawer can draw strokes on the canvas, change color, and clear the canvas. In a second tab as a guesser, confirm the drawing appears within one polling cycle (2s).

### Implementation for User Story 1

- [ ] T005 [US1] Implement `addStrokes()` in `backend/src/services/roomStore.ts` — append `DrawingStroke[]` to room, update `updatedAt`, return updated strokes
- [ ] T006 [US1] Implement `clearStrokes()` in `backend/src/services/roomStore.ts` — reset room strokes to `[]`, update `updatedAt`, return empty array
- [ ] T007 [P] [US1] Add `drawStrokesSchema`, `clearCanvasSchema` to `backend/src/api/schemas.ts` (Zod validation)
- [ ] T008 [US1] Add POST `/rooms/:code/draw` route in `backend/src/api/rooms.ts` — validate drawer identity, call `addStrokes()`, return updated strokes
- [ ] T009 [US1] Add DELETE `/rooms/:code/draw` route in `backend/src/api/rooms.ts` — validate drawer identity, call `clearStrokes()`, return empty strokes
- [ ] T010 [US1] Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` to include `strokes` in snapshot when `status === "playing"` (visible to all participants)
- [ ] T011 [P] [US1] Add `api.addStrokes()` and `api.clearCanvas()` methods to `frontend/src/services/api.ts`
- [ ] T012 [P] [US1] Add `addStrokes()`, `clearCanvas()` methods to `frontend/src/state/roomStore.ts`
- [ ] T013 [US1] Build `Canvas` component in `frontend/src/components/Canvas.tsx` — interactive canvas for drawer with pen tool, color picker (4+ colors), clear button; read-only rendering for guessers that displays strokes from room state
- [ ] T014 [US1] Update `frontend/src/pages/GamePage.tsx` — replace `CanvasPlaceholder` with `Canvas` component; pass real drawing state from room store

**Checkpoint**: US1 complete — drawer draws, guessers see drawing within 2s.

---

## Phase 4: User Story 2 — Guess Submission (Priority: P2)

**Goal**: Guessers can submit guesses through an input field. Guesses are trimmed, compared case-insensitively, empty/whitespace-only guesses are rejected, and the guesser receives instant feedback (correct/wrong/rejected) via the POST response.

**Independent Test**: As a guesser, submit a correct guess and verify "Correct!" feedback. Submit an incorrect guess and verify "Wrong". Submit empty/whitespace-only guess and verify rejection.

### Implementation for User Story 2

- [ ] T015 [US2] Implement `submitGuess()` in `backend/src/services/roomStore.ts` — validate drawer/guesser, trim guess, reject empty, compare case-insensitively, record `GuessEntry`, update scores, handle correct-guess round advancement; reject subsequent guesses after round ended with message "Round already ended"
- [ ] T016 [US2] Implement `advanceRound()` in `backend/src/services/roomStore.ts` — increment `currentRound`, pick next drawer (round-robin: `participants[(currentRound - 1) % participants.length]`), pick word `STARTER_WORDS[currentRound - 1]`, clear strokes array from room state, reset all roundScore to 0, set `lastRoundResult`
- [ ] T017 [US2] Add `submitGuessSchema` to `backend/src/api/schemas.ts` (Zod validation)
- [ ] T018 [US2] Add POST `/rooms/:code/guess` route in `backend/src/api/rooms.ts` — validate guesser identity, call `submitGuess()`, return `{ correct, message, guessEntry }`
- [ ] T019 [P] [US2] Add `api.submitGuess()` method to `frontend/src/services/api.ts`
- [ ] T020 [P] [US2] Add `submitGuess()` method to `frontend/src/state/roomStore.ts`
- [ ] T021 [US2] Update `frontend/src/components/GuessForm.tsx` — call `submitGuess` API on submit, show inline feedback (correct/wrong/rejected), disable input while submitting
- [ ] T022 [US2] Update `toRoomSnapshot()` to include `guessHistory` and `scores` in snapshot when `status === "playing"` (visible to all participants). Depends on T010 — extends the same function with additional fields.

**Checkpoint**: US2 complete — guessers submit guesses, get instant feedback, scores update.

---

## Phase 5: User Story 3 — Score & History Sync (Priority: P3)

**Goal**: All players see guess history and scores via polling. Round auto-advances on correct guess with a brief score card display. Drawer is prevented from guessing.

**Independent Test**: Have a guesser submit correct and incorrect guesses. Verify drawer's screen shows guess history. Verify scores update (correct=100, incorrect=0). Verify drawer's guess input is disabled/hidden.

### Implementation for User Story 3

- [ ] T023 [P] [US3] Build `GuessHistory` component in `frontend/src/components/GuessHistory.tsx` — ordered list of guesses with guesser name, guess text, correct/incorrect badge
- [ ] T024 [P] [US3] Build `Scoreboard` component (update existing `frontend/src/components/Scoreboard.tsx`) — show per-participant round score + cumulative score from room state
- [ ] T025 [P] [US3] Build `RoundResultCard` component in `frontend/src/components/RoundResultCard.tsx` — overlay showing "Round X Complete!" with secret word, correct guesser, scores; visible while `lastRoundResult` is present in state (server-managed expiry, ~6s)
- [ ] T026 [US3] Update `frontend/src/pages/GamePage.tsx` — integrate `GuessHistory` in right sidebar, `Scoreboard` in left sidebar, show `RoundResultCard` while `lastRoundResult` is present in poll response (server-managed, ~6s); start polling (2s interval) on mount, stop on unmount
- [ ] T027 [US3] Update `frontend/src/pages/GamePage.tsx` — disable/hide guess input for drawer participant (enforced server-side, but also hide on frontend)
- [ ] T028 [US3] Update `frontend/src/state/roomStore.ts` — on poll response, detect `lastRoundResult` and store it in state (server manages expiry, card hides when field is absent); update scores, guessHistory, and strokes from poll data

**Checkpoint**: US3 complete — history and scores visible, round auto-advances.

---

## Phase 6a: Bugfix — In-Progress Stroke Lost on Redraw

**Bug**: When polling updates `strokes` while the user is drawing, `redraw()` clears the canvas and redraws only committed strokes — the in-progress stroke in `currentStrokeRef.current` is not rendered, so it disappears until the user releases the mouse.

**Root cause**: `redraw()` in `Canvas.tsx` only iterates `strokesRef.current` (committed strokes) and ignores `currentStrokeRef.current` (in-progress stroke).

- [X] T039 [US1] Fix `redraw()` in `frontend/src/components/Canvas.tsx` — after drawing committed strokes, draw the in-progress stroke from `currentStrokeRef.current` using the stroke's stored color; store color per-stroke in `currentStrokeRef`

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Tests (backend + frontend) and build validation

- [ ] T029 [P] Write backend tests for `addStrokes()` and `clearStrokes()` in `backend/src/services/roomStore.test.ts`
- [ ] T030 [P] Write backend tests for `submitGuess()` — correct guess, incorrect guess, empty guess, drawer guess rejection, round advancement, duplicate correct-guess rejection in `backend/src/services/roomStore.test.ts`
- [ ] T031 [P] Write backend tests for `advanceRound()` — drawer round-robin, word selection, state reset in `backend/src/services/roomStore.test.ts`
- [ ] T032 [P] Write frontend render tests for `Canvas` component in `frontend/src/components/Canvas.test.tsx` — verify drawer sees interactive canvas with color picker and clear button; guesser sees read-only canvas
- [ ] T033 [P] Write frontend render tests for `GuessHistory` component in `frontend/src/components/GuessHistory.test.tsx` — verify guess entries display name, text, and correct/incorrect badge
- [ ] T034 [P] Write frontend render test for `RoundResultCard` component in `frontend/src/components/RoundResultCard.test.tsx` — verify overlay shows round number, secret word, scores
- [ ] T035 [P] Write frontend render test for `Scoreboard` component in `frontend/src/components/Scoreboard.test.tsx` — verify per-participant round + cumulative scores display
- [ ] T036 [P] Write frontend render test for `GuessForm` component in `frontend/src/components/GuessForm.test.tsx` — verify submit button, input field, inline feedback display
- [ ] T037 [P] Run `npm run build` in `backend/` — fix any type/build errors
- [ ] T038 [P] Run `npm run build` in `frontend/` — fix any type/build errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — already complete
- **Foundational (Phase 2)**: Blocks all user stories
- **User Stories (Phase 3-5)**:
  - **US1 (Phase 3)**: Canvas Drawing — can start after Phase 2
  - **US2 (Phase 4)**: Guess Submission — can start after Phase 2
  - **US3 (Phase 5)**: Score & History Sync — depends on US2 (needs guesses and scores to display)
- **Polish (Phase 6)**: Depends on all user stories being complete

### Within Each User Story

- Backend model updates before service logic
- Services before API routes
- Backend changes before frontend integration
- Core implementation before UI rendering

### Parallel Opportunities

- All Phase 2 [P] tasks can run in parallel
- All [P] tasks within a user story can run in parallel
- US1 and US2 backend can be developed in parallel since they touch different services (draw vs guess)
- Polish phase T029-T038 all run in parallel (backend and frontend tests are independent)

---

## Parallel Example: User Story 1

```bash
# Launch all backend service + schema tasks together:
Task: "addStrokes service in backend/src/services/roomStore.ts"
Task: "clearStrokes service in backend/src/services/roomStore.ts"
Task: "drawStrokesSchema in backend/src/api/schemas.ts"

# Launch API routes after services are done (sequential):
Task: "POST /draw route in backend/src/api/rooms.ts" (after T005)
Task: "DELETE /draw route in backend/src/api/rooms.ts" (after T006)

# Launch frontend API + store together:
Task: "addStrokes/clearCanvas in frontend/src/services/api.ts"
Task: "addStrokes/clearCanvas in frontend/src/state/roomStore.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational
2. Complete Phase 3: US1 (Canvas Drawing)
3. **STOP and VALIDATE**: Drawer can draw, guessers see drawing via polling

### Incremental Delivery

1. Add US1 → Test with two tabs (draw + see drawing)
2. Add US2 → Test guessing flow
3. Add US3 → Test history, scores, round advancement
4. Polish: tests (backend + frontend) + build validation
