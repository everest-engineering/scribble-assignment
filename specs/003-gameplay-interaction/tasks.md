# Tasks: Gameplay Interaction

**Input**: Design documents from `/specs/003-gameplay-interaction/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/rooms-api.md](./contracts/rooms-api.md), [quickstart.md](./quickstart.md)

**Tests**: Included because the feature request explicitly requires edge-case testing and the implementation plan calls for focused backend/frontend validation.

**Organization**: Tasks are grouped by user story to support independent implementation and testing. Each task references the affected file path and traces to requirements in `spec.md`.

## Phase 1: Setup (Shared Context)

**Purpose**: Confirm scope and existing brownfield files before modifying implementation.

- [X] T001 Review gameplay scope, non-goals, and success criteria in specs/003-gameplay-interaction/spec.md and specs/003-gameplay-interaction/plan.md
- [X] T002 [P] Inspect existing room model, service, router, and schema patterns in backend/src/models/game.ts, backend/src/services/roomStore.ts, backend/src/api/rooms.ts, and backend/src/api/schemas.ts
- [X] T003 [P] Inspect existing gameplay UI, API service, room store, and polling pattern in frontend/src/pages/GamePage.tsx, frontend/src/services/api.ts, frontend/src/state/roomStore.ts, and frontend/src/pages/LobbyPage.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add shared data contracts and initialization required by all gameplay stories.

**CRITICAL**: No user story work should begin until this phase is complete.

- [X] T004 Add backend gameplay state types for CanvasState, DrawingStroke, DrawingPoint, Guess, ScoreEntry, and extended CurrentRound/RoomSnapshot in backend/src/models/game.ts
- [X] T005 Add frontend gameplay snapshot and request types matching backend contracts in frontend/src/services/api.ts
- [X] T006 Initialize scores, blank canvas state, empty guess history, and correct-guesser tracking when startRoom creates currentRound in backend/src/services/roomStore.ts
- [X] T007 Extend toRoomSnapshot to include public canvas, guess history, and scores while preserving drawer-only secretWord behavior in backend/src/services/roomStore.ts
- [X] T008 [P] Add schema coverage for base gameplay payload validation helpers in backend/src/api/schemas.test.ts
- [X] T009 Add Zod schemas for participant gameplay actions, drawing strokes, clear requests, and guess submissions in backend/src/api/schemas.ts

**Checkpoint**: Backend and frontend types can represent the full gameplay snapshot, and the active round initializes shared gameplay state.

---

## Phase 3: User Story 1 - Drawer Uses the Canvas (Priority: P1) MVP

**Goal**: The assigned drawer can draw visible marks and clear the active room canvas while non-drawers cannot mutate canvas state.

**Independent Test**: Start a room with one drawer and one guesser, draw a stroke as the drawer, clear the canvas, and confirm non-drawer drawing or clearing is rejected without changing state.

### Tests for User Story 1

- [X] T010 [P] [US1] Add room service tests for drawer stroke append, clear canvas, non-drawer rejection, and room isolation in backend/src/services/roomStore.test.ts
- [X] T011 [P] [US1] Add API tests for POST /rooms/:code/drawing and POST /rooms/:code/drawing/clear success and authorization failures in backend/src/api/rooms.test.ts
- [X] T012 [P] [US1] Add schema tests for stroke point bounds, minimum points, brush size, color, and participantId validation in backend/src/api/schemas.test.ts
- [X] T013 [P] [US1] Add frontend API service tests for submitDrawingStroke and clearDrawing request paths and bodies in frontend/src/services/api.test.ts

### Implementation for User Story 1

- [X] T014 [US1] Implement appendDrawingStroke and clearDrawing service operations with drawer role validation in backend/src/services/roomStore.ts
- [X] T015 [US1] Add POST /rooms/:code/drawing and POST /rooms/:code/drawing/clear routes that return viewer-specific room snapshots in backend/src/api/rooms.ts
- [X] T016 [US1] Add submitDrawingStroke and clearDrawing API client methods in frontend/src/services/api.ts
- [X] T017 [US1] Add submitDrawingStroke and clearDrawing room store methods that update the local room snapshot in frontend/src/state/roomStore.ts
- [X] T018 [US1] Create CanvasBoard with native canvas rendering, pointer stroke capture, normalized points, and drawer-only clear control in frontend/src/components/CanvasBoard.tsx
- [X] T019 [US1] Replace the placeholder canvas with CanvasBoard and pass drawer role, strokes, draw handler, and clear handler in frontend/src/pages/GamePage.tsx
- [X] T020 [US1] Add canvas, clear-button, and disabled guesser canvas styles in frontend/src/styles/app.css

**Checkpoint**: User Story 1 is independently functional and testable as the MVP.

---

## Phase 4: User Story 2 - Guessers Submit Answers (Priority: P2)

**Goal**: Guessers can submit trimmed guesses, receive validation feedback, build guess history, and update scores with case-insensitive correct matching.

**Independent Test**: In an active round, submit whitespace, incorrect, correct with different capitalization, and repeated correct guesses from a guesser view and verify feedback, history, and scoring.

### Tests for User Story 2

- [X] T021 [P] [US2] Add room service tests for empty guess rejection, trimming, incorrect guess history, case-insensitive correct matching, exact 100-point award, duplicate correct scoring, drawer guess rejection, and multiple guesser scoring in backend/src/services/roomStore.test.ts
- [X] T022 [P] [US2] Add API tests for POST /rooms/:code/guesses success, empty guess 400, drawer 403, unknown participant 404, and score snapshot response in backend/src/api/rooms.test.ts
- [X] T023 [P] [US2] Add schema tests for guess trimming, empty-after-trim rejection, and participantId validation in backend/src/api/schemas.test.ts
- [X] T024 [P] [US2] Add frontend API service tests for submitGuess request path, trimmed body behavior, and error propagation in frontend/src/services/api.test.ts

### Implementation for User Story 2

- [X] T025 [US2] Implement submitGuess service operation with guesser role validation, trimming, case-insensitive comparison, guess history append, and score updates in backend/src/services/roomStore.ts
- [X] T026 [US2] Add POST /rooms/:code/guesses route that validates payloads and returns the submitting guesser's room snapshot in backend/src/api/rooms.ts
- [X] T027 [US2] Add submitGuess API client method and guess/score response types in frontend/src/services/api.ts
- [X] T028 [US2] Add submitGuess room store method that updates the local room snapshot and preserves backend error messages in frontend/src/state/roomStore.ts
- [X] T029 [US2] Update GuessForm to trim input, reject empty guesses with inline feedback, disable for drawers, submit through the room store, and clear input after accepted submission in frontend/src/components/GuessForm.tsx
- [X] T030 [US2] Update Scoreboard to render participant score snapshots sorted by current room participant order in frontend/src/components/Scoreboard.tsx
- [X] T031 [US2] Update ResultPanel to render ordered guess history with participant name, trimmed text, correctness, and points awarded in frontend/src/components/ResultPanel.tsx
- [X] T032 [US2] Wire GuessForm, Scoreboard, and ResultPanel to the current room snapshot in frontend/src/pages/GamePage.tsx
- [X] T033 [US2] Add guess feedback, activity history, correctness, and scoreboard styles in frontend/src/styles/app.css

**Checkpoint**: User Stories 1 and 2 work independently, and guess submission updates history and scores correctly.

---

## Phase 5: User Story 3 - Players Stay Synchronized (Priority: P3)

**Goal**: All players in a room see updated canvas, guess history, and scores through polling while other rooms remain isolated.

**Independent Test**: Open one drawer tab and two guesser tabs for one room plus another active room; draw, clear, and guess in the first room, then confirm all first-room tabs synchronize through polling and the second room is unchanged.

### Tests for User Story 3

- [X] T034 [P] [US3] Add room service tests proving drawing, clearing, guess history, and score changes remain isolated between simultaneous rooms in backend/src/services/roomStore.test.ts
- [X] T035 [P] [US3] Add API polling tests proving GET /rooms/:code returns updated canvas, guess history, scores, and no guesser secretWord after gameplay mutations in backend/src/api/rooms.test.ts
- [X] T036 [P] [US3] Add frontend API service tests proving fetchRoom accepts extended gameplay snapshots with canvas, guesses, scores, and absent guesser secretWord in frontend/src/services/api.test.ts

### Implementation for User Story 3

- [X] T037 [US3] Ensure GET /rooms/:code polling snapshots include current canvas, guess history, scores, drawer identity, and viewer-specific secretWord privacy in backend/src/services/roomStore.ts
- [X] T038 [US3] Add active gameplay polling with existing 2-second cadence, stale-state error feedback, and interval cleanup in frontend/src/pages/GamePage.tsx
- [X] T039 [US3] Preserve the latest successful room snapshot when gameplay polling fails and expose recoverable errors in frontend/src/state/roomStore.ts
- [X] T040 [US3] Render gameplay polling or stale-update feedback on the game page without requiring page refresh in frontend/src/pages/GamePage.tsx
- [X] T041 [US3] Add polling and stale-state message styles in frontend/src/styles/app.css

**Checkpoint**: All user stories are independently functional and synchronized through polling.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate edge cases, builds, manual flows, and scope compliance across the complete feature.

- [X] T042 [P] Run backend unit/API/schema tests and fix failures in backend/src/services/roomStore.test.ts, backend/src/api/rooms.test.ts, and backend/src/api/schemas.test.ts
- [X] T043 [P] Run frontend API tests and fix failures in frontend/src/services/api.test.ts
- [X] T044 Run backend TypeScript build and resolve type errors in backend/src/models/game.ts, backend/src/services/roomStore.ts, backend/src/api/schemas.ts, and backend/src/api/rooms.ts
- [X] T045 Run frontend TypeScript build and resolve type errors in frontend/src/services/api.ts, frontend/src/state/roomStore.ts, frontend/src/pages/GamePage.tsx, frontend/src/components/CanvasBoard.tsx, frontend/src/components/GuessForm.tsx, frontend/src/components/Scoreboard.tsx, and frontend/src/components/ResultPanel.tsx
- [ ] T046 Execute manual two-tab gameplay validation from specs/003-gameplay-interaction/quickstart.md
- [ ] T047 Execute manual room-isolation validation from specs/003-gameplay-interaction/quickstart.md
- [X] T048 Review implementation for prohibited scope additions in specs/003-gameplay-interaction/spec.md and affected source files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user story phases.
- **User Story 1 (Phase 3)**: Depends on Foundational; recommended MVP.
- **User Story 2 (Phase 4)**: Depends on Foundational and uses shared snapshot state; can be implemented after or alongside US1 once foundation is stable.
- **User Story 3 (Phase 5)**: Depends on Foundational and is most valuable after US1/US2 mutations exist.
- **Polish (Phase 6)**: Depends on selected user stories being complete.

### User Story Dependencies

- **US1 Drawer Uses the Canvas**: Can start after Phase 2; no dependency on US2 or US3.
- **US2 Guessers Submit Answers**: Can start after Phase 2; no dependency on US1 for backend logic, but final GamePage composition touches shared UI.
- **US3 Players Stay Synchronized**: Depends on the polling snapshot fields from Phase 2 and should validate against mutations delivered by US1 and US2.

### Within Each User Story

- Tests before implementation.
- Backend schemas before routes.
- Backend service operations before route handlers.
- API client methods before room store methods.
- Room store methods before component integration.
- Component implementation before CSS polish.

### Parallel Opportunities

- T002 and T003 can run in parallel.
- T008 can run in parallel with T004-T007 before T009 finalizes schemas.
- US1 test tasks T010-T013 can run in parallel.
- US2 test tasks T021-T024 can run in parallel.
- US3 test tasks T034-T036 can run in parallel.
- Backend tests T042 and frontend tests T043 can run in parallel.

---

## Parallel Example: User Story 1

```bash
Task: "T010 Add room service tests for drawer stroke append, clear canvas, non-drawer rejection, and room isolation in backend/src/services/roomStore.test.ts"
Task: "T011 Add API tests for POST /rooms/:code/drawing and POST /rooms/:code/drawing/clear success and authorization failures in backend/src/api/rooms.test.ts"
Task: "T012 Add schema tests for stroke point bounds, minimum points, brush size, color, and participantId validation in backend/src/api/schemas.test.ts"
Task: "T013 Add frontend API service tests for submitDrawingStroke and clearDrawing request paths and bodies in frontend/src/services/api.test.ts"
```

## Parallel Example: User Story 2

```bash
Task: "T021 Add room service tests for empty guess rejection, trimming, incorrect guess history, case-insensitive correct matching, exact 100-point award, duplicate correct scoring, drawer guess rejection, and multiple guesser scoring in backend/src/services/roomStore.test.ts"
Task: "T022 Add API tests for POST /rooms/:code/guesses success, empty guess 400, drawer 403, unknown participant 404, and score snapshot response in backend/src/api/rooms.test.ts"
Task: "T023 Add schema tests for guess trimming, empty-after-trim rejection, and participantId validation in backend/src/api/schemas.test.ts"
Task: "T024 Add frontend API service tests for submitGuess request path, trimmed body behavior, and error propagation in frontend/src/services/api.test.ts"
```

## Parallel Example: User Story 3

```bash
Task: "T034 Add room service tests proving drawing, clearing, guess history, and score changes remain isolated between simultaneous rooms in backend/src/services/roomStore.test.ts"
Task: "T035 Add API polling tests proving GET /rooms/:code returns updated canvas, guess history, scores, and no guesser secretWord after gameplay mutations in backend/src/api/rooms.test.ts"
Task: "T036 Add frontend API service tests proving fetchRoom accepts extended gameplay snapshots with canvas, guesses, scores, and absent guesser secretWord in frontend/src/services/api.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 for drawer drawing and clearing.
3. Stop and validate that the drawer can draw/clear and guessers cannot mutate canvas state.

### Incremental Delivery

1. Deliver US1 canvas controls.
2. Deliver US2 guess submission, history, and scores.
3. Deliver US3 polling synchronization and room isolation validation.
4. Run Phase 6 validation before accepting the feature.

### Notes

- [P] tasks use different files or are test-writing tasks that can proceed without depending on incomplete implementation.
- Story labels map to user stories in specs/003-gameplay-interaction/spec.md.
- Keep implementation limited to HTTP polling, in-memory state, one active round, and native browser canvas support.
- Avoid WebSockets, server-sent events, long polling, databases, authentication, timers, multiple rounds, drawer rotation, and new libraries.
