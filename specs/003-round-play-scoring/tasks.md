# Tasks: Round Play and Scoring

**Input**: Design documents from `/specs/003-round-play-scoring/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/rooms.openapi.yaml`, `quickstart.md`

**Tests**: Focused backend and frontend tests are included because this feature changes game rules, validation, REST contracts, and UI behavior.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and has no direct dependency on another task in the same phase
- **[Story]**: User story label from `spec.md` (`US1`, `US2`, `US3`)
- Include exact file paths in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing project validation surface and prepare for feature implementation.

- [ ] T001 [P] Confirm backend test/build scripts remain usable for this feature in `backend/package.json`
- [ ] T002 [P] Confirm frontend test/build scripts remain usable for this feature in `frontend/package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared contracts, types, and room-state shape required by all stories.

**Critical**: No user story work should begin until this phase is complete.

- [ ] T003 Update backend game models for `playing` rooms, active rounds, canvas state, drawing marks, guesses, player scores, participant snapshots, and room snapshots in `backend/src/models/game.ts`
- [ ] T004 [P] Add Zod schemas for viewer-aware polling, drawing points, draw requests, clear requests, and guess requests in `backend/src/api/schemas.ts`
- [ ] T005 Update backend room snapshot conversion to include active-round canvas, scores, guess history, drawer flags, participant scores, and drawer-only `secretWord` in `backend/src/services/roomStore.ts`
- [ ] T006 [P] Update frontend API DTOs for active-round snapshots, canvas state, drawing marks, guesses, scores, and command responses in `frontend/src/services/api.ts`
- [ ] T007 Update frontend room store state shape for active-round snapshots, command errors, and polling-friendly refreshes in `frontend/src/state/roomStore.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Draw and Clear During the Round (Priority: P1) - MVP

**Goal**: The assigned drawer can draw freehand marks with color and stroke size controls, persist those marks, and clear the active-round canvas.

**Independent Test**: Start an active round as the drawer, draw marks using multiple colors and stroke sizes, refresh/poll room state, then clear the canvas and confirm the saved canvas becomes blank.

### Tests for User Story 1

- [ ] T008 [P] [US1] Add backend service tests for drawer-only drawing, color/stroke persistence, clear behavior, and non-drawer rejection in `backend/src/services/roomStore.test.ts`
- [ ] T009 [P] [US1] Add backend schema tests for drawing point arrays, color values, stroke sizes, and clear payloads in `backend/src/api/schemas.test.ts`
- [ ] T010 [P] [US1] Add frontend API tests for draw and clear REST calls in `frontend/src/services/api.test.ts`

### Implementation for User Story 1

- [ ] T011 [US1] Implement drawer-only `addDrawingMark` and `clearCanvas` service commands with persisted current canvas state in `backend/src/services/roomStore.ts`
- [ ] T012 [US1] Wire `POST /rooms/:code/round/draw` and `POST /rooms/:code/round/clear` routes with validated responses and clear errors in `backend/src/api/rooms.ts`
- [ ] T013 [US1] Add frontend `addDrawingMark` and `clearCanvas` API methods in `frontend/src/services/api.ts`
- [ ] T014 [US1] Add frontend room store methods for draw, clear, optimistic drawer feedback, and command error handling in `frontend/src/state/roomStore.ts`
- [ ] T015 [US1] Implement freehand canvas rendering, pointer capture, color controls, stroke-size controls, and clear command wiring in `frontend/src/components/DrawingCanvas.tsx`
- [ ] T016 [US1] Integrate drawer-only canvas controls and read-only guesser canvas rendering into the game view in `frontend/src/pages/GamePage.tsx`
- [ ] T017 [US1] Add responsive canvas, toolbar, color swatch, stroke-size, clear-button, and disabled-state styling in `frontend/src/styles/app.css`

**Checkpoint**: User Story 1 is functional and testable independently.

---

## Phase 4: User Story 2 - Submit and Validate Guesses (Priority: P1)

**Goal**: Guessers can submit trimmed guesses, empty guesses are rejected with clear feedback, and valid guesses are compared to the secret word case-insensitively.

**Independent Test**: Submit guesses with whitespace, empty input, different casing, and incorrect wording; confirm validation, recording, and correctness are deterministic.

### Tests for User Story 2

- [ ] T018 [US2] Add backend service tests for trimmed guess recording, empty guess rejection, case-insensitive correctness, incorrect guess recording, and drawer rejection in `backend/src/services/roomStore.test.ts`
- [ ] T019 [P] [US2] Add backend schema tests for required participant id, trimming, and whitespace-only guess rejection in `backend/src/api/schemas.test.ts`
- [ ] T020 [P] [US2] Add frontend API tests for submit-guess request payloads and error responses in `frontend/src/services/api.test.ts`

### Implementation for User Story 2

- [ ] T021 [US2] Implement `submitGuess` service logic for guesser-only access, trimming, empty rejection, case-insensitive comparison, and guess history entries in `backend/src/services/roomStore.ts`
- [ ] T022 [US2] Wire `POST /rooms/:code/round/guess` with validation, forbidden drawer guesses, empty-guess feedback, and updated room snapshots in `backend/src/api/rooms.ts`
- [ ] T023 [US2] Add frontend `submitGuess` API method and response handling in `frontend/src/services/api.ts`
- [ ] T024 [US2] Add frontend room store submit-guess method, validation feedback state, and snapshot updates in `frontend/src/state/roomStore.ts`
- [ ] T025 [US2] Update guess form submit behavior, disabled drawer state, empty-guess feedback, and successful reset behavior in `frontend/src/components/GuessForm.tsx`
- [ ] T026 [US2] Wire guesser-only guess submission and feedback into the game view in `frontend/src/pages/GamePage.tsx`
- [ ] T027 [US2] Add guess form validation, error, disabled, and activity-adjacent styling in `frontend/src/styles/app.css`

**Checkpoint**: User Story 2 is functional and testable independently.

---

## Phase 5: User Story 3 - Sync Scores and Guess History (Priority: P1)

**Goal**: Active-round participants start at 0 points, first correct guesses award 100 once per guesser, incorrect guesses do not change scores, late joins are rejected, and polling keeps clients synchronized.

**Independent Test**: Start a round with one drawer and one guesser, submit incorrect and correct guesses, poll from both clients, and confirm identical scoreboards and guess history; then attempt a late join and confirm rejection.

### Tests for User Story 3

- [ ] T028 [US3] Add backend service tests for score initialization, incorrect guesses awarding 0, first correct guesses awarding 100 once, repeat correct guesses awarding 0, snapshot sync, and late-join rejection in `backend/src/services/roomStore.test.ts`
- [ ] T029 [P] [US3] Add frontend API tests for polling active-round scores, guess history, canvas state, and late-join errors in `frontend/src/services/api.test.ts`

### Implementation for User Story 3

- [ ] T030 [US3] Add score initialization, roster locking, and one-time correct-award tracking when active-round state is created in `backend/src/services/roomStore.ts`
- [ ] T031 [US3] Enforce active-round late-join rejection while preserving existing participant polling and reconnect behavior in `backend/src/services/roomStore.ts`
- [ ] T032 [US3] Ensure `GET /rooms/:code` supports viewer-specific polling snapshots and `POST /rooms/:code/join` returns a clear active-round conflict in `backend/src/api/rooms.ts`
- [ ] T033 [US3] Render active-round scores, 0-point starts, and updated point totals in `frontend/src/components/Scoreboard.tsx`
- [ ] T034 [US3] Render ordered guess history, correctness state, and awarded points in `frontend/src/components/ResultPanel.tsx`
- [ ] T035 [US3] Add active-round polling cadence, polling error resilience, and reconnect-safe snapshot refreshes in `frontend/src/state/roomStore.ts`
- [ ] T036 [US3] Connect polling, scoreboard, guess history, late-join feedback, and participant permissions in `frontend/src/pages/GamePage.tsx`
- [ ] T037 [US3] Add scoreboard, guess history, polling status, and late-join feedback styling in `frontend/src/styles/app.css`

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the full feature and check project constraints.

- [ ] T038 [P] Run backend tests and build for the completed feature using `backend/package.json`
- [ ] T039 [P] Run frontend tests and build for the completed feature using `frontend/package.json`
- [ ] T040 Validate the two-browser drawing, guessing, scoring, polling, permission, and late-join flow from `specs/003-round-play-scoring/quickstart.md`
- [ ] T041 Confirm no WebSockets, databases, authentication, sessions, push protocols, or unrelated dependencies were introduced by reviewing `backend/package.json` and `frontend/package.json`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: No dependencies.
- **Phase 2 Foundational**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 US1**: Depends on Phase 2 and is the MVP slice.
- **Phase 4 US2**: Depends on Phase 2; can proceed in parallel with US1 after shared types and snapshots exist.
- **Phase 5 US3**: Depends on Phase 2 and uses the guess results from US2 for scoring validation.
- **Phase 6 Polish**: Depends on all selected user stories being complete.

### User Story Dependencies

- **US1 Draw and Clear**: No dependency on US2 or US3 after foundation.
- **US2 Submit and Validate Guesses**: No dependency on US1 after foundation, though it integrates in the same game view.
- **US3 Sync Scores and Guess History**: Depends on active-round roster state and guess history semantics; implement after or alongside US2 with care.

### Within Each User Story

- Write story tests before implementation and confirm they fail for the intended behavior.
- Backend models and schemas precede service commands.
- Service commands precede REST routes.
- REST and DTO updates precede frontend store wiring.
- Store wiring precedes page/component integration.
- Validate each story at its checkpoint before moving to the next story.

---

## Parallel Opportunities

- T001 and T002 can run in parallel.
- T004 and T006 can run in parallel after T003 is understood because they touch backend schemas and frontend DTOs separately.
- T008, T009, and T010 can run in parallel for US1 tests.
- T019 and T020 can run in parallel while T018 covers backend service behavior.
- T029 can run in parallel with T028 for US3 test coverage.
- T038 and T039 can run in parallel after implementation.
- US1 and US2 can be implemented in parallel after Phase 2 if backend route ownership is coordinated.

---

## Parallel Example: User Story 1

```bash
# Run these task streams together after Phase 2:
Task T008: "Add backend service tests for drawer-only drawing in backend/src/services/roomStore.test.ts"
Task T009: "Add backend schema tests for drawing payloads in backend/src/api/schemas.test.ts"
Task T010: "Add frontend API tests for draw and clear REST calls in frontend/src/services/api.test.ts"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 setup.
2. Complete Phase 2 foundation.
3. Complete Phase 3 User Story 1.
4. Validate drawing, clearing, canvas persistence, and drawer permissions independently.

### Incremental Delivery

1. Deliver US1 for drawable active rounds.
2. Deliver US2 for validated guessing.
3. Deliver US3 for scoring, history synchronization, polling confidence, and late-join rejection.
4. Run automated validation and the quickstart flow.

### Independent Test Criteria

- **US1**: Drawer adds marks with at least two colors and two stroke sizes, polling returns those marks, and drawer clear blanks the canvas without requiring any guess activity.
- **US2**: Guesser submits whitespace-wrapped, whitespace-only, incorrect, and case-varied correct guesses; only valid trimmed guesses are recorded and correctness is case-insensitive.
- **US3**: Active-round participants start at 0, incorrect guesses keep scores unchanged, a first correct guess awards exactly 100 once, polling shows identical scores/history to all participants, and late joins are rejected.

---

## Notes

- Keep synchronization on HTTP REST commands plus polling only.
- Keep all room and round state in memory only.
- Do not add authentication, sessions, databases, WebSockets, server-sent events, timers, round completion, later-round rotation, or advanced drawing tools.
- Preserve drawer-only `secretWord` visibility from the round-start feature.
