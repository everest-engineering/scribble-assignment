# Tasks: Gameplay Interaction

**Input**: Design documents from `/specs/003-gameplay-interaction/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Review existing `backend/src` and `frontend/src` layout to identify where state and models currently reside.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 Update shared types (e.g. `backend/src/models/types.ts` and `frontend/src/types/index.ts`) with `Point`, `Stroke`, `Guess`, and `GameState` definitions.
- [ ] T003 Update backend room manager (`backend/src/services/roomManager.ts`) to initialize and hold the new game state (strokes, guesses, scores, round time, rate-limiting map).

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Drawer Interaction (Priority: P1) 🎯 MVP

**Goal**: The drawer uses an interactive canvas to draw the word and syncs strokes.

**Independent Test**: The canvas correctly captures mouse movements as strokes and sends batched updates to the server.

### Implementation for User Story 1

- [ ] T004 [P] [US1] Create POST endpoint `/api/rooms/:roomId/strokes` in `backend/src/api/routes.ts` to receive and store strokes in-memory.
- [ ] T005 [P] [US1] Create the interactive `Canvas` component in `frontend/src/components/Canvas.tsx` handling pointer events.
- [ ] T006 [US1] Add logic to `Canvas.tsx` to batch points every 500ms and send POST requests via `frontend/src/services/api.ts`.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Guesser Experience (Priority: P1)

**Goal**: Guessers see the drawing in real-time and submit text guesses with rate limiting.

**Independent Test**: The client polls for updates and renders strokes. Guessers can submit guesses (limited to 1/sec).

### Implementation for User Story 2

- [ ] T007 [US2] Update GET `/api/rooms/:roomId/state` endpoint in `backend/src/api/routes.ts` to include strokes, guesses, and scores (omitting `currentWord` for guessers).
- [ ] T008 [US2] Create POST endpoint `/api/rooms/:roomId/guesses` in `backend/src/api/routes.ts` with 1 guess/sec rate limiting.
- [ ] T009 [P] [US2] Update frontend polling logic in `frontend/src/state/roomStore.ts` to fetch and store `strokes` and `guesses`.
- [ ] T010 [P] [US2] Update `Canvas.tsx` to render read-only strokes when the user is a guesser.
- [ ] T011 [US2] Create `GuessInput` component (`frontend/src/components/GuessInput.tsx`) to submit guesses and display feedback.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Scoring and Game Progression (Priority: P2)

**Goal**: Points are awarded fairly based on guess speed and correctness.

**Independent Test**: Submitting a correct guess increases scores and potentially ends the round.

### Implementation for User Story 3

- [ ] T012 [US3] Add guess evaluation logic to POST `/api/rooms/:roomId/guesses` (case-insensitive check against `currentWord`).
- [ ] T013 [US3] Implement scoring distribution logic in backend (award points to guesser and drawer).
- [ ] T014 [US3] Add early round termination logic in backend if all guessers guess correctly.
- [ ] T015 [P] [US3] Create `Scoreboard` component (`frontend/src/components/Scoreboard.tsx`) to display player scores.
- [ ] T016 [P] [US3] Create `Chat` component (`frontend/src/components/Chat.tsx`) to display the history of guesses and correct/incorrect feedback.

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T017 Code cleanup and refactoring across frontend and backend.
- [ ] T018 Verify error handling and UI fallback for rate-limited guesses.
- [ ] T019 Follow the `quickstart.md` manual testing steps to ensure the entire flow works end-to-end.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P1)**: Can start after Foundational (Phase 2). Depends on US1's strokes existing to fully test rendering.
- **User Story 3 (P2)**: Depends on US2's guess submission logic to evaluate correctness.

### Within Each User Story

- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- Foundational tasks marked [P] can run in parallel (within Phase 2)
- Frontend component creation and Backend endpoint creation can run in parallel for each story.

---

## Parallel Example: User Story 1

```bash
# Launch endpoint and component together:
Task: "Create POST endpoint `/api/rooms/:roomId/strokes` in backend/src/api/routes.ts"
Task: "Create the interactive `Canvas` component in frontend/src/components/Canvas.tsx"
```

---

## Implementation Strategy

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Drawing) → Test independently → MVP Canvas
3. Add User Story 2 (Guessing & Syncing) → Test independently → Core Game Loop Working
4. Add User Story 3 (Scoring) → Test independently → Competitive Game Loop Working
5. Each story adds value without breaking previous stories
