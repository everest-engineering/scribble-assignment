# Tasks: Gameplay Interaction

**Input**: Design documents from `/specs/003-gameplay-interaction/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Review monolithic project structure (backend/ and frontend/) per plan.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 Update RoomState and Player models to include game state properties in backend/src/models/room.ts
- [ ] T003 Update backend polling mechanism to reliably return game state (players, scores) in backend/src/api/room.ts
- [ ] T004 Expand Zustand store to hold polling game state (drawing, guesses) in frontend/src/state/roomStore.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Drawer creates drawing (Priority: P1) 🎯 MVP

**Goal**: Drawer can draw on and clear the canvas, and changes are synced.

**Independent Test**: Can be tested by having a drawer make marks on the canvas and verifying they appear locally and are synced to others via polling.

### Implementation for User Story 1

- [ ] T005 [P] [US1] Define DrawingAction types in backend/src/models/drawing.ts
- [ ] T006 [P] [US1] Create drawing service to process draw/clear actions in memory in backend/src/services/drawingService.ts
- [ ] T007 [US1] Create API endpoint for submitting drawing actions in backend/src/api/drawing.ts
- [ ] T008 [P] [US1] Implement Canvas component for drawing locally and rendering remote state in frontend/src/components/Canvas.tsx
- [ ] T009 [US1] Integrate Canvas with roomStore to send draw actions and update from polling in frontend/src/components/Canvas.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Guessers submit guesses (Priority: P1)

**Goal**: Guessers can submit valid text guesses which are evaluated for scoring.

**Independent Test**: Can be tested by submitting text inputs and verifying they trigger scoring logic on the backend.

### Implementation for User Story 2

- [ ] T010 [P] [US2] Create Guess types and Zod schemas (max 50 chars, no empty string) in backend/src/models/guess.ts
- [ ] T011 [P] [US2] Create guess evaluation service (case-insensitive, trimming, awards 100 points) in backend/src/services/guessService.ts
- [ ] T012 [US2] Create API endpoint for submitting guesses in backend/src/api/guesses.ts
- [ ] T013 [P] [US2] Implement GuessInput component with frontend validation in frontend/src/components/GuessInput.tsx
- [ ] T014 [US2] Integrate GuessInput with roomStore to submit guesses to backend in frontend/src/components/GuessInput.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Players view guess history (Priority: P2)

**Goal**: Players see the history of all guesses from all players.

**Independent Test**: Can be tested by simulating multiple guesses and verifying they appear in order for all polling clients.

### Implementation for User Story 3

- [ ] T015 [P] [US3] Implement GuessHistory component to display list of guesses in frontend/src/components/GuessHistory.tsx
- [ ] T016 [US3] Integrate GuessHistory with roomStore to render polled guesses in frontend/src/components/GuessHistory.tsx

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and handle edge cases

- [ ] T017 Implement 10-second drawer timeout logic (if drawer disconnects) in backend/src/services/roomService.ts
- [ ] T018 Integrate game state components (Canvas, GuessInput, GuessHistory) into the main Room page in frontend/src/pages/RoomPage.tsx
- [ ] T019 Update CSS for the new game components in frontend/src/app.css
- [ ] T020 Run quickstart.md validation to ensure end-to-end functionality

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

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Displays data generated by US2

### Within Each User Story

- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Foundational tasks marked [P] can run in parallel
- Models and UI components marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch Models and UI components in parallel:
Task: "Define DrawingAction types in backend/src/models/drawing.ts"
Task: "Implement Canvas component for drawing locally and rendering remote state in frontend/src/components/Canvas.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Drawing) → Test independently
3. Add User Story 2 (Guessing) → Test independently
4. Add User Story 3 (Guess History) → Test independently
5. Complete Phase 6 (Polish/Integration) → Deploy/Demo
