# Tasks: Gameplay Interaction

**Input**: Design documents from `/specs/004-gameplay-interaction/`

**Prerequisites**: plan.md, spec.md

**Tests**: Unit tests are included for store logic, canvas sync, guesses, scoring, and schemas.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verification of current codebase status before implementing new features

- [x] T001 Verify existing setup by running dev build of frontend and backend
- [x] T002 Ensure linting and tests pass on existing code

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core model extensions for canvas drawing state, guess tracking, and scores

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Extend Participant interface, Guess interface, GameRound interface, and RoomSnapshot interfaces in [backend/src/models/game.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/models/game.ts)
- [x] T004 Update Participant, Guess, and RoomSnapshot interfaces in [frontend/src/services/api.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/services/api.ts)
- [x] T005 Initialize participant scores to 0, room round guesses to empty array, and room round drawingData to empty string in [backend/src/services/roomStore.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.ts)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Interactive Synced Canvas (Priority: P1) 🎯 MVP

**Goal**: As the drawer, draw freehand on the canvas and have it automatically synchronize to the guessers' screens within 2.5 seconds.

**Independent Test**: Host starts game (becomes drawer) and draws on the canvas. Verify guest tab automatically displays the drawing within 2.5 seconds.

### Implementation for User Story 1

- [x] T006 [P] [US1] Create Zod schemas for drawing input validation in [backend/src/api/schemas.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/api/schemas.ts)
- [x] T007 [P] [US1] Implement `updateDrawing` state updates and write unit tests in [backend/src/services/roomStore.test.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.test.ts) and [backend/src/services/roomStore.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.ts)
- [x] T008 [US1] Add `POST /api/rooms/:code/canvas` route and validation in [backend/src/api/rooms.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/api/rooms.ts)
- [x] T009 [US1] Expose `drawingData` on the snapshot mapping in [backend/src/services/roomStore.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.ts)
- [x] T010 [US1] Expose drawing update API endpoint call in [frontend/src/services/api.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/services/api.ts)
- [x] T011 [US1] Build responsive HTML5 interactive canvas for drawer and image display for guessers in [frontend/src/pages/GamePage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/GamePage.tsx)

**Checkpoint**: Drawing on drawer canvas uploads state, and guessers poll and display drawing successfully.

---

## Phase 4: User Story 2 - Clear Canvas (Priority: P1)

**Goal**: As the drawer, clear the canvas locally and sync the cleared state to guessers.

**Independent Test**: As the drawer, draw a line, click "Clear Canvas", and confirm both drawer and guesser canvases become blank.

### Implementation for User Story 2

- [x] T012 [P] [US2] Implement `clearDrawing` in [backend/src/services/roomStore.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.ts) and write unit tests in [backend/src/services/roomStore.test.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.test.ts)
- [x] T013 [US2] Add `POST /api/rooms/:code/canvas/clear` route handler in [backend/src/api/rooms.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/api/rooms.ts)
- [x] T014 [US2] Expose clear drawing API endpoint call in [frontend/src/services/api.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/services/api.ts)
- [x] T015 [US2] Mount a "Clear Canvas" button on the drawer's panel in [frontend/src/pages/GamePage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/GamePage.tsx)

**Checkpoint**: Clearing canvas on drawer screen resets backend state and clears it for guessers on next poll.

---

## Phase 5: User Story 3 - Guess Validation & Comparison (Priority: P1)

**Goal**: As a guesser, submit guesses, reject empty/spaces guesses, and case-insensitively match valid guesses against the secret word.

**Independent Test**: Submit empty guess or spaces, verify validation error. Enter correct word in uppercase/lowercase, and confirm it matches.

### Implementation for User Story 3

- [x] T016 [P] [US3] Add Zod schemas and tests for guess submission in [backend/src/api/schemas.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/api/schemas.ts) and [backend/src/api/schemas.test.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/api/schemas.test.ts)
- [x] T017 [US3] Implement `submitGuess` logic (trimming, case-insensitive comparison, drawer blocking) in [backend/src/services/roomStore.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.ts) and write unit tests in [backend/src/services/roomStore.test.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.test.ts)
- [x] T018 [US3] Add `POST /api/rooms/:code/guesses` route handler in [backend/src/api/rooms.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/api/rooms.ts)
- [x] T019 [US3] Expose submit guess API endpoint call in [frontend/src/services/api.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/services/api.ts)
- [x] T020 [P] [US3] Implement `GuessForm` UI component with input trimming and empty/whitespace check validations in [frontend/src/components/GuessForm.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/components/GuessForm.tsx)
- [x] T021 [US3] Mount `GuessForm` component on GamePage for guessers in [frontend/src/pages/GamePage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/GamePage.tsx)

**Checkpoint**: Guesser can submit valid guesses, block empty guesses, and correct guesses are validated properly.

---

## Phase 6: User Story 4 - Synced Guess History & Scoreboard (Priority: P1)

**Goal**: As a player, see a running log of all guesses and updated scores (+100 points for a correct guess).

**Independent Test**: Bob guesses correctly. Bob's score increases to 100, and both players see "Bob guessed correctly!" in the log.

### Implementation for User Story 4

- [x] T022 [US4] Implement first-correct-guess scoring (+100 points) and double-score prevention logic in `submitGuess` in [backend/src/services/roomStore.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.ts) and add unit tests in [backend/src/services/roomStore.test.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.test.ts)
- [x] T023 [US4] Expose `guesses` array on the room snapshot in [backend/src/services/roomStore.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.ts)
- [x] T024 [P] [US4] Implement `Scoreboard` UI component showing sorted participants descending by score in [frontend/src/components/Scoreboard.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/components/Scoreboard.tsx)
- [x] T025 [P] [US4] Implement `ResultPanel` UI component showing the guess log (green for correct, red/grey for incorrect) in [frontend/src/components/ResultPanel.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/components/ResultPanel.tsx)
- [x] T026 [US4] Mount `Scoreboard` and `ResultPanel` components in [frontend/src/pages/GamePage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/GamePage.tsx)

**Checkpoint**: Guess attempts and scores synchronize across all clients within 2.5 seconds.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: General codebase formatting, type-safety, and validation check

- [x] T027 Code cleanup, formatting, and linting checks across modified files
- [x] T028 Complete full manual verification walkthrough using multiple tabs/browsers

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P2)**: Can start after Foundational (Phase 2)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2)
- **User Story 4 (P4)**: Depends on US3 (requires guess submission to display guess log and scores)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Interactive Canvas Sync)
4. Validate User Story 1 works.

### Incremental Delivery

1. Complete Setup + Foundational
2. Add User Story 1 (Canvas Sync)
3. Add User Story 2 (Clear Canvas)
4. Add User Story 3 (Guess Input Validation & Matching)
5. Add User Story 4 (Guess History Log & Scores)
6. Polish & Verify
