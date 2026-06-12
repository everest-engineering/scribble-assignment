# Tasks: Gameplay Interaction

**Input**: Design documents from `/specs/003-gameplay-interaction/`

**Prerequisites**: spec.md, plan.md, research.md, data-model.md

## Phase 1: Setup (Shared Foundation)

- [ ] T001 [P] Review `specs/003-gameplay-interaction/spec.md`, `plan.md`, `data-model.md`, and `quickstart.md` to confirm the gameplay interaction scope.
- [ ] T002 [P] Review `backend/src/models/game.ts` and `frontend/src/services/api.ts` to extend the shared `RoomSnapshot` contract for active round state.
- [ ] T003 [P] Review `backend/src/api/rooms.ts` and `frontend/src/state/roomStore.ts` to confirm integration points for polling and gameplay actions.

---

## Phase 2: Foundational Backend Round State

- [ ] T004 [US1] Extend `backend/src/models/game.ts` to add `canvasState`, `guessHistory`, and `scores` to the round model.
- [ ] T005 [US1] Extend `frontend/src/services/api.ts` to include `guessHistory`, `scores`, and `canvasState` in the shared `RoomSnapshot` contract.
- [ ] T006 [US1] Update `backend/src/services/roomStore.ts` to initialize `guessHistory` and per-player `scores` when a round starts.
- [ ] T007 [US1] Add backend game state retrieval and guess submission API support in `backend/src/api/rooms.ts`.
- [ ] T008 [US1] Add server-side validation in `backend/src/services/roomStore.ts` for guess normalization, empty-guess rejection, and case-insensitive comparison.

---

## Phase 3: User Story 1 - Drawer canvas updates (Priority: P1)

**Goal**: The drawer can draw and clear the canvas and see the change immediately.

**Independent Test**: As the drawer, clear the canvas and verify the canvas resets instantly in the game view.

- [ ] T009 [US1] Implement drawer canvas controls in `frontend/src/pages/GamePage.tsx` so the drawer can clear the canvas state.
- [ ] T010 [US1] Store drawer canvas updates in `backend/src/services/roomStore.ts` so the active round preserves `canvasState`.
- [ ] T011 [US1] Keep canvas state updates isolated to the current room and ensure they do not break shared guess history in `backend/src/services/roomStore.ts`.

---

## Phase 4: User Story 2 - Guess submission validation (Priority: P1)

**Goal**: Guessers can submit normalized guesses and receive validation feedback for empty input.

**Independent Test**: Submit `  correctWord  ` and whitespace-only guesses, then verify correct behavior and rejection messaging.

- [ ] T012 [US2] Update `frontend/src/components/GuessForm.tsx` to trim guess text, reject whitespace-only guesses, and show a validation error.
- [ ] T013 [US2] Add a guess submission endpoint in `backend/src/api/rooms.ts` and wire it through `frontend/src/state/roomStore.ts`.
- [ ] T014 [US2] Implement guess validation and normalized comparison in `backend/src/services/roomStore.ts`.
- [ ] T015 [US2] Refresh the room snapshot after guess submission in `frontend/src/state/roomStore.ts` and update `frontend/src/pages/GamePage.tsx`.

---

## Phase 5: User Story 3 - Shared guess history and scoring sync (Priority: P2)

**Goal**: All players see guess history and score updates via polling.

**Independent Test**: Submit guesses from one player and verify another player sees updated history and scores after polling.

- [ ] T016 [US3] Render `guessHistory` and `scores` in `frontend/src/pages/GamePage.tsx`.
- [ ] T017 [US3] Add polling in `frontend/src/pages/GamePage.tsx` to refresh active round state regularly.
- [ ] T018 [US3] Add score update logic in `backend/src/services/roomStore.ts` so correct guesses earn `100` points and incorrect guesses earn `0`.
- [ ] T019 [US3] Ensure every `RoomSnapshot` response from `backend/src/services/roomStore.ts` includes the current shared guess history and player scores.

---

## Phase 6: Polish & Cross-Cutting Validation

- [ ] T020 [P] Add backend tests in `backend/src/services/roomStore.test.ts` for guess normalization, empty-guess rejection, case-insensitive matching, and scoring.
- [ ] T021 [P] Add frontend API tests in `frontend/src/services/api.test.ts` for the new guess submission and active round state requests.
- [ ] T022 [P] Add documentation for the active round API contract in `specs/003-gameplay-interaction/contracts/api.md`.
- [ ] T023 [P] Update `specs/003-gameplay-interaction/quickstart.md` with gameplay validation scenarios for drawer canvas actions, guess submission, and score sync.
- [ ] T024 [P] Run backend and frontend tests to verify the gameplay interaction feature.

---

## Dependencies & Execution Order

- `T004` through `T008` establish the backend round state and API contract before story implementation.
- `T009` through `T011` enable drawer canvas behavior once foundational round state exists.
- `T012` through `T015` implement guess validation and submission.
- `T016` through `T019` implement shared history and scoring synchronization.
- `T020` through `T024` are polish and validation tasks after the core feature is implemented.

## Parallel Opportunities

- `T001`, `T002`, and `T003` can run in parallel because they are review tasks across different documents and code areas.
- `T020`, `T021`, `T022`, and `T023` can run in parallel as polish tasks.
- Story-specific implementation tasks are ordered to preserve dependencies within each user story.
