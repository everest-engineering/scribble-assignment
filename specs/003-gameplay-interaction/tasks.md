# Tasks: Gameplay Interaction

**Input**: Design documents from `/specs/003-gameplay-interaction/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Confirm feature docs are present and aligned in `specs/003-gameplay-interaction/plan.md`, `specs/003-gameplay-interaction/spec.md`, `specs/003-gameplay-interaction/research.md`, `specs/003-gameplay-interaction/data-model.md`, and `specs/003-gameplay-interaction/contracts/room-gameplay-api.md`
- [ ] T002 Add gameplay API contract notes for room polling, guess submission, and drawing updates in `specs/003-gameplay-interaction/contracts/room-gameplay-api.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before any user story can be implemented

- [ ] T003 Extend shared room/game models to carry drawing state, guess history, participant scores, and correct-guess tracking in `backend/src/models/game.ts`
- [ ] T004 Update room snapshot serialization to include drawing, guess history, and participant scores in `backend/src/services/roomStore.ts`
- [ ] T005 [P] Add request schemas for drawing submissions, guess submissions, and room-state validation in `backend/src/api/schemas.ts`
- [ ] T006 [P] Add gameplay response shapes to the frontend API layer in `frontend/src/services/api.ts`
- [ ] T007 [P] Extend the frontend room store state to retain drawing, guess history, and score-driven room snapshots in `frontend/src/state/roomStore.ts`
- [ ] T008 Add shared polling refresh behavior for game-state updates in `frontend/src/state/roomStore.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in order

---

## Phase 3: User Story 1 - Drawer Draws on the Canvas (Priority: P1)

**Goal**: Drawer can submit stroke updates and clear the canvas, and guessers can see the same drawing through polling.

**Independent Test**: Create a room, start a game, draw as the drawer, clear the canvas, and confirm guessers receive the updated drawing on the next poll.

### Implementation for User Story 1

- [ ] T009 [US1] Implement drawing and clear-canvas room mutations in `backend/src/services/roomStore.ts`
- [ ] T010 [P] [US1] Add drawing endpoints to the room router in `backend/src/api/rooms.ts`
- [ ] T011 [P] [US1] Wire drawing request validation into `backend/src/api/schemas.ts`
- [ ] T012 [P] [US1] Create a drawing canvas component with stroke capture and clear handling in `frontend/src/components/DrawingCanvas.tsx`
- [ ] T013 [US1] Mount `DrawingCanvas` in `frontend/src/pages/GamePage.tsx` and connect it to the current drawer/guesser role
- [ ] T014 [US1] Render polling-driven drawing state in `frontend/src/components/DrawingCanvas.tsx` for guessers and the drawer

**Checkpoint**: User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Guesser Submits a Guess (Priority: P1)

**Goal**: Guesser can submit trimmed guesses, receive empty-input rejection, and have correct guesses recorded and scored.

**Independent Test**: Submit correct, incorrect, empty, and whitespace-only guesses as a guesser and verify validation, case-insensitive matching, score updates, and input clearing/disable behavior.

### Implementation for User Story 2

- [ ] T015 [US2] Implement guess submission validation and case-insensitive comparison in `backend/src/services/roomStore.ts`
- [ ] T016 [P] [US2] Add guess submission endpoint handling in `backend/src/api/rooms.ts`
- [ ] T017 [P] [US2] Add guess request and response validation in `backend/src/api/schemas.ts`
- [ ] T018 [P] [US2] Implement guess form submission, empty-input warning, and input clearing in `frontend/src/components/GuessForm.tsx`
- [ ] T019 [US2] Disable guess submission after a correct guess in `frontend/src/components/GuessForm.tsx` and `frontend/src/pages/GamePage.tsx`

**Checkpoint**: User Story 2 should be fully functional and testable independently

---

## Phase 5: User Story 3 - Guess History Synced to All Players (Priority: P1)

**Goal**: All server-accepted guesses appear in a shared ordered feed for drawer and guessers through polling.

**Independent Test**: Submit guesses from one player and confirm the drawer and other guessers see the same ordered feed on the next poll.

### Implementation for User Story 3

- [ ] T020 [US3] Persist ordered guess-history entries with participant name, guess text, and correctness flag in `backend/src/services/roomStore.ts`
- [ ] T021 [P] [US3] Include guess history in room snapshots returned by `backend/src/api/rooms.ts`
- [ ] T022 [P] [US3] Add guess-history rendering to `frontend/src/components/ResultPanel.tsx`
- [ ] T023 [US3] Wire polling updates so guess-history changes refresh the activity panel in `frontend/src/state/roomStore.ts`

**Checkpoint**: User Story 3 should be fully functional and testable independently

---

## Phase 6: User Story 4 - Scoring (Priority: P1)

**Goal**: All participants start at zero, correct guesses add exactly 100 points, and the scoreboard reflects those values on each poll.

**Independent Test**: Start a game, submit a correct guess, and confirm the guesser's score becomes 100 on the next polling refresh while incorrect guesses stay at 0.

### Implementation for User Story 4

- [ ] T024 [US4] Track participant scores in the room model and apply +100 only on correct guesses in `backend/src/models/game.ts` and `backend/src/services/roomStore.ts`
- [ ] T025 [P] [US4] Include participant scores in the room snapshot returned by `backend/src/api/rooms.ts`
- [ ] T026 [P] [US4] Render score values in `frontend/src/components/Scoreboard.tsx`
- [ ] T027 [US4] Ensure the scoreboard updates on each polling cycle in `frontend/src/state/roomStore.ts`

**Checkpoint**: User Story 4 should be fully functional and testable independently

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T028 [P] Verify the end-to-end polling flow in `specs/003-gameplay-interaction/quickstart.md`
- [ ] T029 Clean up any dead room-state fields or unused UI branches in `backend/src/` and `frontend/src/`
- [ ] T030 Review room snapshot payloads and trim any duplicate fields in `backend/src/api/rooms.ts` and `frontend/src/services/api.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): No dependencies
- Foundational (Phase 2): Depends on Setup completion; blocks all user stories
- User Stories (Phase 3+): Depend on Foundational completion
- Polish (Final Phase): Depends on completion of desired user stories

### User Story Dependencies

- User Story 1 (P1): Can start after Foundational phase
- User Story 2 (P1): Can start after Foundational phase
- User Story 3 (P1): Can start after Foundational phase and the guess mutation path from US2
- User Story 4 (P1): Can start after Foundational phase and the scoring state from US2

### Within Each User Story

- Implement backend state and API changes before frontend consumption
- Update polling consumers after snapshot shape changes
- Keep each story independently verifiable before moving on

### Parallel Opportunities

- T005-T008 can run in parallel because they touch different files
- T010-T013 can run in parallel after T009 lands
- T016-T018 can run in parallel after T015 lands
- T021-T022 can run in parallel after T020 lands
- T025-T026 can run in parallel after T024 lands

## Implementation Strategy

### MVP First

1. Complete Setup
2. Complete Foundational work
3. Complete User Story 1
4. Validate drawer drawing through polling before expanding further

### Incremental Delivery

1. Add drawing sync first
2. Add guess submission and scoring next
3. Add shared guess history feed
4. Finish with scoreboard rendering and polish

### Parallel Team Strategy

1. One developer owns backend room-state changes
2. One developer owns frontend polling and UI updates
3. Another developer can implement guess history and scoreboard rendering once snapshot fields are available

## Notes

- [P] tasks are safe to parallelize because they touch different files and have no direct dependency on incomplete work
- Each user story phase is scoped to remain independently testable
- Avoid out-of-scope work: no WebSockets, databases, auth, deployment, Docker, new state/routing libs, multiple rounds, drawer rotation, timers, bonuses, custom word packs, spectator mode, room moderation, room passwords, or starter rewrites
