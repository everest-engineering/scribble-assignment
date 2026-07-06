# Tasks: Gameplay Interaction — Drawing, Guessing, and Scoring

**Input**: Design documents from `/specs/007-gameplay-interaction/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Backend model extensions and schema definitions that all stories depend on

- [x] T001 Add Point, Stroke, Guess interfaces and ScoreMap type in backend/src/models/game.ts
- [x] T002 Add scores, guesses, canvasStrokes, correctGuessersInRound fields to Room and RoomSnapshot
- [x] T003 Add submitGuessSchema and canvasBodySchema (discriminated union) in backend/src/api/schemas.ts
- [x] T004 Initialize new Room fields (scores, guesses, canvasStrokes, correctGuessersInRound) in createRoom() and startGame()

---

## Phase 2: Foundational (Backend Services)

**Purpose**: Core game logic for guessing, scoring, and canvas management

- [x] T005 Implement submitGuess() in backend/src/services/roomStore.ts — validate drawer/guesser, reject empty, case-insensitive compare, 100/0 scoring, reject duplicate correct
- [x] T006 [P] Implement addCanvasStroke() in backend/src/services/roomStore.ts — validate drawer, append stroke
- [x] T007 [P] Implement clearCanvas() in backend/src/services/roomStore.ts — validate drawer, reset strokes array
- [x] T008 Update toRoomSnapshot() in backend/src/services/roomStore.ts to include scores, guesses, canvasStrokes

**Checkpoint**: Backend services ready — route handlers can be added for each user story

---

## Phase 3: User Story 1 — Interactive Drawing Canvas (Priority: P1) 🎯 MVP

**Goal**: The drawer can draw and clear a canvas; guessers see updates via polling

**Independent Test**: Open two browser tabs. Tab 1 is the drawer. Tab 1 draws on the canvas; Tab 2 sees the drawing reflected via polling (~2s). Tab 1 clears; Tab 2 sees the blank canvas.

### Backend

- [x] T009 [US1] Add POST /:code/canvas route in backend/src/api/rooms.ts
- [x] T010 [US1] Wire addCanvasStroke() and clearCanvas() to canvas route with participantId query param

### Frontend

- [x] T011 [P] [US1] Add Stroke, Point types and submitCanvasStroke(), clearCanvas() methods to frontend/src/services/api.ts
- [x] T012 [US1] Add submitCanvasStroke() and clearCanvas() methods to frontend/src/state/roomStore.ts
- [x] T013 [P] [US1] Create Canvas.tsx component in frontend/src/components/ — HTML Canvas API, single black pen, mouse/touch drawing, clear button
- [x] T014 [US1] Add canvas CSS styles (canvas-container, canvas, canvas-toolbar) in frontend/src/styles/app.css

**Checkpoint**: Drawer can draw and see marks; guessers see updated canvas via polling

---

## Phase 4: User Story 2 — Guess Submission with Validation (Priority: P1)

**Goal**: Guessers can submit guesses with validation; drawer cannot access guess form

**Independent Test**: Open two browser tabs. Tab 1 is drawer. Tab 2 submits empty, whitespace-only, correct, and incorrect guesses. Verify inline error, correct/incorrect recording, and drawer has no guess form.

### Backend

- [x] T015 [US2] Add POST /:code/guess route in backend/src/api/rooms.ts with Zod validation
- [x] T016 [US2] Wire submitGuess() to guess route

### Frontend

- [x] T017 [P] [US2] Add submitGuess() method to frontend/src/services/api.ts
- [x] T018 [US2] Add submitGuess() method to frontend/src/state/roomStore.ts
- [x] T019 [US2] Rewrite GuessForm.tsx in frontend/src/components/ — trim validation, loading/error/success states, already-correct state

**Checkpoint**: Guessers can submit guesses with full validation feedback; drawer form hidden

---

## Phase 5: User Story 3 — Guess History and Scoring (Priority: P1)

**Goal**: All participants see guess history and updated scores via polling

**Independent Test**: Tab 2 submits guesses. Both tabs see guess history with text, submitter, correct/wrong, and updated scores via polling.

### Frontend

- [x] T020 [P] [US3] Update RoomSnapshot type in frontend/src/services/api.ts to include scores and guesses
- [x] T021 [US3] Update Scoreboard.tsx in frontend/src/components/ to display scores prop
- [x] T022 [US3] Rewrite ResultPanel.tsx in frontend/src/components/ to render guess history
- [x] T023 [US3] Add auto-polling to GamePage.tsx in frontend/src/pages/ — 2s interval, navigate home on 404
- [x] T024 [US3] Integrate Canvas component into GamePage.tsx — replace canvas placeholder, wire callbacks
- [x] T025 [P] [US3] Pass scores to Scoreboard and guesses to ResultPanel in GamePage.tsx
- [x] T026 [US3] Add guess list CSS styles in frontend/src/styles/app.css

**Checkpoint**: Scores visible, guess history visible, polling keeps everything in sync

---

## Phase 6: Next Word (Drawer Advances Round)

**Goal**: The drawer can advance to the next word, resetting canvas/guesses while preserving cumulative scores.

### Backend

- [x] T031 [US1] Implement nextWord() in backend/src/services/roomStore.ts — validate drawer, increment round, pick new word, reset canvas/guesses/correctGuessersInRound, preserve scores
- [x] T032 [US1] Add POST /:code/next-word route in backend/src/api/rooms.ts

### Frontend

- [x] T033 [P] [US1] Add nextWord() method to frontend/src/services/api.ts
- [x] T034 [US1] Add nextWord() method to frontend/src/state/roomStore.ts
- [x] T035 [US1] Add "Next Word" button in GamePage.tsx — visible only to drawer, wired to roomStore.nextWord()

**Checkpoint**: Drawer can advance rounds; scores persist; canvas/guesses reset.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Verification and consolidation

- [x] T036 Run npm run build in backend/ — verify no TypeScript errors
- [x] T037 Run npm run build in frontend/ — verify no TypeScript errors
- [x] T038 Run npm test in backend/ — verify all tests pass
- [x] T039 Run npm test in frontend/ — verify all tests pass
- [x] T040 Update AGENTS.md with Feature 007 entry

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — base types and schemas
- **Foundational (Phase 2)**: Depends on Setup — core service logic
- **User Story 1 (Phase 3)**: Depends on Phase 1 + Phase 2 (canvas endpoints + Canvas component)
- **User Story 2 (Phase 4)**: Depends on Phase 1 + Phase 2 (guess endpoint + GuessForm) — can run in parallel with US1
- **User Story 3 (Phase 5)**: Depends on Phase 1 + Phase 2 + US2 (needs guess data to display) — can partially overlap with US1
- **Polish**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Backend Phase 1+2 → Canvas API routes → Canvas component → CSS
- **User Story 2 (P1)**: Backend Phase 1+2 → Guess API route → GuessForm component — **no dependency on US1**
- **User Story 3 (P1)**: US2 must be partially complete (backend guess endpoint) — Scoreboard, ResultPanel, GamePage polling

### Within Each User Story

- Backend routes before frontend integration
- API/types before store methods
- Store methods before UI components
- Core functionality before polish

### Parallel Opportunities

- T006 + T007 (clear/stroke canvas) can run in parallel
- T011 (API types) is independent of T013 (Canvas component)
- US1 (Canvas) and US2 (Guessing) backend work can run in parallel
- T020 (API types) and T021 (Scoreboard update) can run in parallel
- T022 (ResultPanel) is independent of other US3 tasks

---

## Parallel Example: User Story 1

```bash
# API types + store methods (frontend):
Task: "Add Stroke, Point types and submitCanvasStroke(), clearCanvas() to frontend/src/services/api.ts"
Task: "Add submitCanvasStroke() and clearCanvas() to frontend/src/state/roomStore.ts"

# Canvas component + CSS (frontend):
Task: "Create Canvas.tsx in frontend/src/components/"
Task: "Add canvas CSS styles in frontend/src/styles/app.css"

# Backend canvas route:
Task: "Add POST /:code/canvas route in backend/src/api/rooms.ts"
```

## Parallel Example: User Story 2

```bash
# Backend + frontend in parallel:
Task: "Add POST /:code/guess route in backend/src/api/rooms.ts"
Task: "Add submitGuess() to frontend/src/services/api.ts and src/state/roomStore.ts"
Task: "Rewrite GuessForm.tsx in frontend/src/components/"
```

## Parallel Example: User Story 3

```bash
# Scoreboard + ResultPanel + GamePage polling in parallel:
Task: "Update Scoreboard.tsx to display scores prop"
Task: "Rewrite ResultPanel.tsx to render guess history"
Task: "Add auto-polling to GamePage.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (types + schemas)
2. Complete Phase 2: Foundational (backend services)
3. Complete Phase 3: User Story 1 (Canvas drawing)
4. **STOP and VALIDATE**: Drawer can draw and clear; guessers see updates via polling
5. Deploy/demo if ready

### Incremental Delivery

1. Phase 1 + Phase 2 → Backend foundation ready
2. Add US1 → Canvas drawing functional → Deploy/Demo (MVP!)
3. Add US2 → Guess submission with validation → Deploy/Demo
4. Add US3 → Scores and guess history visible → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Phase 1 + Phase 2 together
2. Once Foundational is done:
   - Developer A: US1 (Canvas — backend route + Canvas component + CSS + GamePage integration)
   - Developer B: US2 (Guessing — backend route + GuessForm component + polling)
   - Developer C: US3 (Scoring — Scoreboard + ResultPanel + GamePage polling integration)
3. Stories complete and integrate independently — merge US1+US2+US3 into GamePage

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- US2 has NO dependency on US1 — can be implemented in parallel
- US3 depends on US2 for guess data but can begin as soon as backend guess endpoint is ready
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
