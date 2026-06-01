# Tasks: Gameplay Interaction

**Input**: Design documents from `/specs/003-gameplay-interaction/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/http-api.md, quickstart.md

**Tests**: Required by the Scribble Constitution and quickstart TDD flow. Write tests first and confirm they fail before implementation.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files or does not depend on incomplete tasks
- **[Story]**: Maps to the user story from spec.md
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the Scenario 3 feature baseline before implementation begins.

- [ ] T001 Review Scenario 3 spec, plan, and HTTP contract in specs/003-gameplay-interaction/spec.md, specs/003-gameplay-interaction/plan.md, and specs/003-gameplay-interaction/contracts/http-api.md
- [ ] T002 Run backend baseline tests with `npm run test` in backend/
- [ ] T003 Run frontend baseline tests with `npm run test` in frontend/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add shared typed shapes, schemas, and backend support for guess submission and active round history.

- [ ] T004 Update `backend/src/models/game.ts` to add `Guess` and `guessHistory` types on `Round` and `RoundSnapshot`
- [ ] T005 Update `backend/src/models/game.ts` to preserve viewer-specific `secretWord` while exposing `guessHistory` in `RoundSnapshot`
- [ ] T006 Add `guessText` validation and active-round submission schema to `backend/src/api/schemas.ts`
- [ ] T007 Add `POST /rooms/:code/guesses` route to `backend/src/api/rooms.ts`
- [ ] T008 Implement backend guess submission, scoring, and guess history appending in `backend/src/services/roomStore.ts`
- [ ] T009 Add backend service tests for whitespace-only guess rejection, trimmed guess normalization, case-insensitive scoring, and history appending in `backend/src/services/roomStore.test.ts`
- [ ] T010 [P] Add `submitGuess` client method in `frontend/src/services/api.ts`

**Checkpoint**: Backend and frontend are prepared to support guess submission and shared active round history.

---

## Phase 3: User Story 1 - Draw and Clear the Active Canvas (Priority: P1) 🎯 MVP

**Goal**: Give the drawer a local canvas they can draw on and clear without losing the active round state.

**Independent Test**: A drawer draws and clears the canvas in `frontend/src/pages/GamePage.tsx`; the canvas resets and can be used again.

### Tests for User Story 1

- [ ] T011 [P] [US1] Add unit tests for draw and clear behavior in `frontend/src/components/CanvasBoard.test.tsx`

### Implementation for User Story 1

- [ ] T012 [P] [US1] Create a local drawer canvas component in `frontend/src/components/CanvasBoard.tsx`
- [ ] T013 [US1] Render the drawer canvas in `frontend/src/pages/GamePage.tsx` and keep it local to the drawer
- [ ] T014 [US1] Add a clear button and reset behavior in `frontend/src/components/CanvasBoard.tsx`

**Checkpoint**: User Story 1 is independently functional and validates drawer canvas behavior.

---

## Phase 4: User Story 2 - Submit Validated Guesses (Priority: P1)

**Goal**: Validate guess input, submit it through the API, and keep round state consistent.

**Independent Test**: A guesser submits whitespace-only text and sees a validation error, then submits a valid guess and the room snapshot updates.

### Tests for User Story 2

- [ ] T015 [P] [US2] Add frontend validation tests for `GuessForm` in `frontend/src/components/GuessForm.test.tsx`
- [ ] T016 [P] [US2] Add frontend API tests for `submitGuess` request shape and error handling in `frontend/src/services/api.test.ts`

### Implementation for User Story 2

- [ ] T017 [US2] Implement guess trimming and validation in `frontend/src/components/GuessForm.tsx`
- [ ] T018 [US2] Update `frontend/src/state/roomStore.ts` to call `api.submitGuess(...)` and refresh room snapshot on success
- [ ] T019 [US2] Ensure `GuessForm` displays backend validation errors clearly in `frontend/src/components/GuessForm.tsx`
- [ ] T020 [US2] Add server-side guess validation and scoring as part of `POST /rooms/:code/guesses` handling in `backend/src/services/roomStore.ts`

**Checkpoint**: User Story 2 is independently functional and validates guess submission rules and scoring.

---

## Phase 5: User Story 3 - Sync Guess History via Polling (Priority: P2)

**Goal**: Show shared guess history to all active players and refresh it through existing polling.

**Independent Test**: A second browser sees a newly submitted guess appear in the active round history during the next poll.

### Tests for User Story 3

- [ ] T021 [P] [US3] Add backend snapshot tests for guess history exposure and viewer-safe active round responses in `backend/src/services/roomStore.test.ts`
- [ ] T022 [P] [US3] Add frontend UI tests for guess history rendering in `frontend/src/pages/GamePage.test.tsx`

### Implementation for User Story 3

- [ ] T023 [US3] Update `backend/src/services/roomStore.ts` to include `guessHistory` in `currentRound` snapshots for all viewers
- [ ] T024 [US3] Update `frontend/src/pages/GamePage.tsx` to render `room.currentRound.guessHistory`
- [ ] T025 [US3] Ensure polling in `frontend/src/state/roomStore.ts` keeps guess history fresh during an active round
- [ ] T026 [US3] Keep drawer-only `secretWord` behavior intact while exposing shared guess history in `backend/src/services/roomStore.ts`

**Checkpoint**: User Story 3 is independently functional and validates shared history sync.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, documentation, and validation across all Scenario 3 work.

- [ ] T027 [P] Update `specs/003-gameplay-interaction/contracts/http-api.md` if any request or response examples changed
- [ ] T028 [P] Add or update frontend and backend README or quickstart notes in `specs/003-gameplay-interaction/quickstart.md`
- [ ] T029 [P] Run backend tests and build in backend/
- [ ] T030 [P] Run frontend tests and build in frontend/
- [ ] T031 [P] Perform manual two-browser validation using `specs/003-gameplay-interaction/quickstart.md`
- [ ] T032 [P] Clean up `frontend/src/pages/GamePage.tsx`, `frontend/src/services/api.ts`, and `backend/src/services/roomStore.ts` after feature integration

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion; blocks all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2
- **User Story 2 (Phase 4)**: Depends on Phase 2
- **User Story 3 (Phase 5)**: Depends on Phase 4
- **Polish (Phase 6)**: Depends on all user stories and validation

### User Story Dependencies

- **US1**: Independent after foundational infrastructure is in place
- **US2**: Requires API and backend guess submission support
- **US3**: Requires active round snapshot and polling support

### Within Each User Story

- Write tests before implementation
- Define types and API shapes before service logic
- Implement services before routes
- Integrate frontend API/store before page rendering
- Validate each story independently before moving to the next

## Parallel Opportunities

- T005 and T010 can run in parallel because they touch backend model/types and frontend client API separately
- T011 and T016 can run in parallel because they are both test tasks in different frontend layers
- T012 and T017 can run in parallel because one is a component and one is a page integration task
- T021 and T022 can run in parallel because backend snapshot and frontend UI tests are separate responsibilities
- T027, T028, T029, T030, and T032 can run in parallel during the final polish phase

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup
2. Complete Phase 2 foundational backend and API support
3. Complete Phase 3 drawer canvas implementation and tests
4. Stop and validate canvas draw/clear behavior independently

### Incremental Delivery

1. Deliver US1 to ensure drawer canvas interaction
2. Deliver US2 to enable validated guess submission and scoring
3. Deliver US3 to expose shared guess history via polling
4. Validate with automated tests and manual two-browser play

### Notes

- Maintain HTTP polling only, per project constraints
- Do not introduce WebSockets, databases, authentication, sessions, JWT, or persistent backend canvas sync
- Keep round state in-memory and viewer-safe
- Commit after each story checkpoint or logical task group
