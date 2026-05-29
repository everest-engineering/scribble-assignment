# Tasks: Drawing, Guessing, and Scoring

**Input**: Design documents from `specs/003-drawing-guessing-scoring/`

**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api.md, research.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 0: Discovery & Artifacts

**Purpose**: Understanding existing code and aligning Spec Kit artifacts

- [x] T000 [P] Conduct discovery: document gaps and assumptions in specs/003-drawing-guessing-scoring/research.md
- [x] T001 [P] Sync artifacts: verify Constitution, Spec, and Plan consistency in specs/003-drawing-guessing-scoring/

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: External library installation and validation schemas

- [x] T002 [P] Install `react-sketch-canvas` in `frontend/package.json`
- [x] T003 [P] Add `strokeSchema` and `guessSchema` to `backend/src/api/schemas.ts`

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Model and store updates for gameplay state

- [x] T004 Update `Stroke`, `Guess`, `Participant`, and `Room` types in `backend/src/models/game.ts`
- [x] T005 Update `RoomSnapshot` in `backend/src/models/game.ts` to include strokes and guesses
- [x] T006 Update `roomStore.ts` in `backend/src/services/roomStore.ts` to initialize and persist strokes and guesses
- [x] T007 [P] Create unit tests for scoring and history limit logic in `backend/tests/roomStore.test.ts`

**Checkpoint**: Foundation ready - interaction implementation can now begin

---

## Phase 3: User Story 1 - Interactive Drawing (Priority: P1) 🎯 MVP

**Goal**: Drawer can sketch on canvas; strokes are persisted.

**Independent Test**: Draw a line as Alice (drawer); verify `strokes` array in backend state is no longer empty.

- [x] T008 [US1] Implement `POST /rooms/:code/strokes` endpoint in `backend/src/api/rooms.ts`
- [x] T009 [US1] Add `submitStrokes` method to `api` service in `frontend/src/services/api.ts`
- [x] T010 [P] [US1] Create a wrapper component `ResponsiveCanvas.tsx` in `frontend/src/components/` that handles 800x600 coordinate scaling
- [x] T011 [US1] Replace canvas placeholder with `react-sketch-canvas` in `frontend/src/pages/GamePage.tsx`
- [x] T012 [US1] Implement "Clear Canvas" functionality in `frontend/src/pages/GamePage.tsx` and backend store

**Checkpoint**: US1 complete - Drawing is functional and persistent.

---

## Phase 4: User Story 2 - Guess Submission & Scoring (Priority: P1)

**Goal**: Guessers can submit text; correct guesses award 100 points.

**Independent Test**: Bob submits "rocket"; verify Bob's score is 100 and guess log shows "Correct!".

- [x] T013 [US2] Implement `POST /rooms/:code/guesses` endpoint in `backend/src/api/rooms.ts` with scoring logic
- [x] T014 [US2] Update `GuessForm.tsx` in `frontend/src/components/GuessForm.tsx` to call backend and handle validation errors
- [x] T015 [US2] Add `submitGuess` method to `api` service in `frontend/src/services/api.ts`
- [x] T016 [US2] Implement first-correct-only scoring guard in `backend/src/services/roomStore.ts`

**Checkpoint**: US2 complete - Guessing and scoring are active.

---

## Phase 5: User Story 3 - Synced Gameplay (Priority: P2)

**Goal**: Drawing and history sync automatically for all players.

**Independent Test**: Alice draws; Bob (tab B) sees drawing without refresh. Bob guesses; Alice sees "Bob: Correct!" in history.

- [x] T017 [US3] Update `Scoreboard.tsx` in `frontend/src/components/Scoreboard.tsx` to display participant scores
- [x] T018 [P] [US3] Create `GuessHistory.tsx` component in `frontend/src/components/GuessHistory.tsx` to display the 50-item log
- [x] T019 [US3] Connect `GuessHistory` to `GamePage.tsx` and ensure strokes are synced to `react-sketch-canvas` for guessers

**Checkpoint**: US3 complete - Multiplayer loop is fully synchronized.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Final validation

- [x] T020 [P] Run quickstart.md validation steps with 2-3 browser tabs
- [x] T021 [P] Verify no TypeScript errors (Rule I) across both packages
