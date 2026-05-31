# Tasks: Gameplay Interaction

**Input**: Design documents from `/specs/003-gameplay-interaction/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Include automated test tasks for changed backend services, API contracts, and frontend state logic. Include manual two-browser verification tasks for multiplayer flows.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

*(No setup tasks needed for this feature as the project is already initialized)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T001 Define `GuessEntry` interface and update `Participant` (initialized to `score: 0`), `Room` (initialized to `guessHistory: []`), and `RoomSnapshot` interfaces in `backend/src/models/game.ts`
- [ ] T002 [P] Update Zod schemas in `backend/src/api/schemas.ts` to include standardized error codes (`DRAWER_CANNOT_GUESS`, `GAME_NOT_STARTED`), `score` in `participantSchema`, `guessEntrySchema`, and `submitGuessSchema` for request validation, ensuring response schemas (`roomSnapshotSchema`, `roomResponseSchema`) validate all new output properties

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Interactive Drawer Canvas (Priority: P1) 🎯 MVP

**Goal**: Drawer has an interactive canvas on their screen to draw and clear drawings locally.

**Independent Test**: Start game as drawer. Click/drag on the canvas to draw strokes, then click "Clear Canvas" to reset the canvas.

### Implementation for User Story 1

- [ ] T003 [US1] Implement interactive `<canvas>` element and mouse/touch drawing event handlers in `frontend/src/pages/GamePage.tsx`
- [ ] T004 [US1] Implement local stroke rendering logic and a "Clear Canvas" action button in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Guess Submission UI & Client-Side Action (Priority: P1)

**Goal**: Guesser can type and submit guesses; client trims input, rejects empty guesses, and blocks drawer submissions.

**Independent Test**: As guesser, try to submit empty or whitespace-only guesses and verify they are blocked. Verify the guess input is disabled/hidden for the drawer.

### Tests for User Story 2 ⚠️

- [ ] T005 [P] [US2] Create API unit tests in `frontend/src/services/api.test.ts` covering successful guess submission, error handling for guess submission failures, and response mapping for updated room snapshots

### Implementation for User Story 2

- [ ] T006 [P] [US2] Update `RoomSnapshot` and `GuessEntry` interfaces and add `api.submitGuess` API method in `frontend/src/services/api.ts`
- [ ] T007 [US2] Implement `submitGuess` action in the room store (`frontend/src/state/roomStore.ts`), updating room state on successful submission and preserving the latest room snapshot
- [ ] T008 [US2] Update `GuessForm.tsx` in `frontend/src/components/GuessForm.tsx` to invoke the `submitGuess` room store action, trim inputs, block empty submissions, and disable fields for the drawer
- [ ] T009 [US2] Register the `POST /rooms/:code/guesses` route in `backend/src/api/rooms.ts` and validate both request body and response payload using Zod schemas (`submitGuessSchema` and `roomResponseSchema`)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Guess Evaluation & Scoring (Priority: P1)

**Goal**: Backend compares guesses case-insensitively, awards 100 points on the first match, and enforces drawer and lobby constraints.

**Independent Test**: Submit incorrect and correct guesses. Verify scores increase only once for correct guesses, and drawer guess submissions return `DRAWER_CANNOT_GUESS` without creating a log entry or affecting scores.

### Tests for User Story 3 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T010 [P] [US3] Create unit tests in `backend/src/services/roomStore.test.ts` verifying scoring rules (correct/incorrect guesses, case-insensitivity, points awarded only once per round), drawer blocks, lobby check logic, and that guess history preserves submission order
- [ ] T011 [P] [US3] Create endpoint validation tests in `backend/src/api/schemas.test.ts` verifying error response shapes, correct error codes returned (`DRAWER_CANNOT_GUESS`, `GAME_NOT_STARTED`), and validating response schema payloads

### Implementation for User Story 3

- [ ] T012 [US3] Implement guess evaluation, score calculation, defaults initialization, and drawer/status validation rules in `backend/src/services/roomStore.ts`

**Checkpoint**: User Stories 1, 2, and 3 should now be functional and testable

---

## Phase 6: User Story 4 - Synced Guess History & Scoreboard (Priority: P1)

**Goal**: Synchronize scoreboard and guess attempts log through polling, displaying chronological guess logs and descending scoreboard ranking.

**Independent Test**: Submit a guess. Verify it appears in chronological submission order on both players' UIs within 2 seconds. Verify scoreboard displays players ordered by score descending.

### Tests for User Story 4 ⚠️

- [ ] T013 [P] [US4] Create unit tests in `frontend/src/state/roomStore.test.ts` verifying the store `submitGuess` actions, score updates from polling, guess-history updates from polling, and state preservation during polling refreshes
- [ ] T014 [P] [US4] Create tests in the frontend (such as in `frontend/src/state/roomStore.test.ts` or component tests) verifying higher-scoring participants appear above lower-scoring participants and ordering updates correctly after a successful guess

### Implementation for User Story 4

- [ ] T015 [US4] Rename `ResultPanel.tsx` to `GuessHistoryPanel.tsx` in `frontend/src/components/GuessHistoryPanel.tsx`, and update it to render the room's guess history in submission order
- [ ] T016 [US4] Update `Scoreboard.tsx` in `frontend/src/components/Scoreboard.tsx` to display all room participants ordered by their score in descending order
- [ ] T017 [US4] Update `GamePage.tsx` in `frontend/src/pages/GamePage.tsx` to import `GuessHistoryPanel` instead of `ResultPanel`, and display guess history and scoreboard updates synced via HTTP polling

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup

- [ ] T018 Run quickstart.md validation steps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - Proceed sequentially: US1 (Canvas) → US2 (Submission UI) → US3 (Scoring/Validation Backend) → US4 (Log & Score Sync)
- **Polish (Final Phase)**: Depends on all user stories being complete

### Parallel Opportunities

- Foundational tasks marked [P] can run in parallel (within Phase 2)
- Unit tests `T010` and `T011` can be written in parallel in Phase 5
- Unit tests `T013` and `T014` can be written in parallel in Phase 6

---

## Parallel Example: User Story 3 Tests

```bash
# Run backend tests in watch mode
cd backend && npm test
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational
2. Complete Phase 3: User Story 1
3. **STOP and VALIDATE**: Test local drawing and clearing on canvas.
