# Tasks: Gameplay Interaction

**Input**: Design documents from `/specs/003-gameplay-interaction/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Verify API routes for gameplay in `backend/src/api/router.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T002 Update `Room` models to contain drawings and guesses in `backend/src/models/game.ts`

---

## Phase 3: User Story 1 - Canvas Drawing & Syncing (Priority: P1) 🎯 MVP

**Goal**: Capture drawing on drawer's screen and sync to guessers

**Independent Test**: Draw on canvas as drawer, verify guest canvases poll and render the drawing updates.

### Implementation for User Story 1

- [x] T003 [US1] Create canvas updates endpoint in `backend/src/api/rooms.ts`
- [x] T004 [US1] Implement canvas data storage and retrieval in `backend/src/services/roomStore.ts`
- [x] T005 [P] [US1] Build React Canvas component to capture mouse strokes in `frontend/src/components/DrawingCanvas.tsx`
- [x] T006 [US1] Setup polling sync to request canvas updates in `frontend/src/pages/GamePage.tsx`

---

## Phase 4: User Story 2 - Guess Submission, Validation & History Polling (Priority: P1)

**Goal**: Support guess submission, validation, and history synchronization

**Independent Test**: Submit a guess, verify that validation is run, the list is synced, and guesses are shown in history.

### Implementation for User Story 2

- [x] T007 [US2] Create guess submission endpoint and input schemas in `backend/src/api/rooms.ts`
- [x] T008 [US2] Implement guess matching, logging, and storage in `backend/src/services/roomStore.ts`
- [x] T009 [P] [US2] Build Guess input and log components in `frontend/src/components/GuessBox.tsx`
- [x] T010 [US2] Integrate guess history list updates in `frontend/src/pages/GamePage.tsx`

---

## Phase 5: User Story 3 - Score Calculation (Priority: P1)

**Goal**: Award 100 points on correct guess and sync player score list

**Independent Test**: Correct guesser has score increased to 100 on subsequent state updates.

### Implementation for User Story 3

- [x] T011 [US3] Implement score tracking logic in `backend/src/services/roomStore.ts`
- [x] T012 [US3] Send score updates in room state snapshot from `backend/src/api/rooms.ts`
- [x] T013 [P] [US3] Render updated scores in player scoreboard list in `frontend/src/components/ScoreBoard.tsx`

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T014 Run quickstart.md validation scenario checks.
