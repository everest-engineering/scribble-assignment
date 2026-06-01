# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `/specs/002-game-start-drawer-flow/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/http-api.md, quickstart.md

**Tests**: Required by the Scribble Constitution and quickstart TDD flow. Write tests first and confirm they fail before implementation.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files or does not depend on incomplete tasks
- **[Story]**: Maps to the user story from spec.md
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing project structure and baseline before changing Scenario 2 behavior.

- [X] T001 Review Scenario 2 plan and contracts in specs/002-game-start-drawer-flow/plan.md and specs/002-game-start-drawer-flow/contracts/http-api.md
- [X] T002 Run backend baseline tests with `npm run test` from backend/
- [X] T003 Run frontend baseline tests with `npm run test` from frontend/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add shared typed room and round shapes needed by all stories.

**CRITICAL**: No user story work should begin until these types are in place.

- [X] T004 Update room status and round-related types in backend/src/models/game.ts
- [X] T005 [P] Update room snapshot and round-related types in frontend/src/services/api.ts
- [X] T006 Add start-game request schema for participantId validation in backend/src/api/schemas.ts
- [X] T007 [P] Add schema tests for start-game participantId validation in backend/src/api/schemas.test.ts

**Checkpoint**: Backend and frontend can type-check the planned round and snapshot shape.

---

## Phase 3: User Story 1 - Validate Player Names Before Game Start (Priority: P1) MVP

**Goal**: Players cannot enter or start play with blank names, and accepted names are trimmed consistently.

**Independent Test**: Submit whitespace-only names and confirm clear rejection; submit names with surrounding spaces and confirm the stored/displayed name is trimmed.

### Tests for User Story 1

- [X] T008 [P] [US1] Add backend roomStore tests for trimmed accepted names and whitespace-only rejection in backend/src/services/roomStore.test.ts
- [X] T009 [P] [US1] Add frontend API or store tests covering name submission behavior in frontend/src/services/api.test.ts

### Implementation for User Story 1

- [X] T010 [US1] Replace fallback player display name behavior with strict trimmed-name validation in backend/src/services/roomStore.ts
- [X] T011 [US1] Ensure create and join routes return clear validation errors for invalid names in backend/src/api/rooms.ts
- [X] T012 [US1] Ensure create and join pages surface invalid-name errors without navigating in frontend/src/pages/CreateRoomPage.tsx and frontend/src/pages/JoinRoomPage.tsx

**Checkpoint**: User Story 1 is independently functional and validates SC-001 and SC-002.

---

## Phase 4: User Story 2 - Start the First Round with a Clear Drawer (Priority: P1)

**Goal**: Host starts the first round as a shared room state transition, and all players see the same drawer.

**Independent Test**: In a two-player room, the host starts the game and both players see the same drawer name; non-host start and single-player start are rejected.

### Tests for User Story 2

- [X] T013 [P] [US2] Add backend service tests for host start, first-player drawer fallback, non-host rejection, single-player rejection, and already-started rejection in backend/src/services/roomStore.test.ts
- [X] T014 [P] [US2] Add frontend API test for POST /rooms/:code/start request shape in frontend/src/services/api.test.ts
- [X] T015 [P] [US2] Add frontend roomStore test for startGame updating the room snapshot in frontend/src/state/roomStore.test.ts

### Implementation for User Story 2

- [X] T016 [US2] Implement startGame room transition and drawer assignment in backend/src/services/roomStore.ts
- [X] T017 [US2] Add POST /rooms/:code/start route with host and start-state error handling in backend/src/api/rooms.ts
- [X] T018 [US2] Add startGame client method and response typing in frontend/src/services/api.ts
- [X] T019 [US2] Add startGame action to frontend/src/state/roomStore.ts
- [X] T020 [US2] Replace local-only Start Game navigation with startGame API flow and error display in frontend/src/pages/LobbyPage.tsx
- [X] T021 [US2] Redirect or guide players from lobby to game when polling returns inProgress state in frontend/src/pages/LobbyPage.tsx
- [X] T022 [US2] Display the current drawer name on the game screen in frontend/src/pages/GamePage.tsx

**Checkpoint**: User Story 2 is independently functional and validates SC-003.

---

## Phase 5: User Story 3 - Show the Secret Word Only to the Drawer (Priority: P1)

**Goal**: The deterministic first word is visible to the drawer and hidden from every non-drawer.

**Independent Test**: Start a two-player game; the drawer sees `rocket`, while the guesser sees no secret word.

### Tests for User Story 3

- [X] T023 [P] [US3] Add backend snapshot tests for deterministic `rocket` selection and drawer-only `secretWord` visibility in backend/src/services/roomStore.test.ts
- [X] T024 [P] [US3] Add frontend roomStore polling test preserving viewer-specific active-round snapshots in frontend/src/state/roomStore.test.ts

### Implementation for User Story 3

- [X] T025 [US3] Extend toRoomSnapshot with viewer-specific currentRound and drawer-only secretWord in backend/src/services/roomStore.ts
- [X] T026 [US3] Ensure GET /rooms/:code passes participantId into viewer-specific snapshots in backend/src/api/rooms.ts
- [X] T027 [US3] Render drawer-only word visibility and guesser-safe messaging in frontend/src/pages/GamePage.tsx
- [X] T028 [US3] Add CSS for drawer and secret-word status elements in frontend/src/styles/app.css

**Checkpoint**: User Story 3 is independently functional and validates SC-004, SC-005, and SC-006.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the full Scenario 2 flow and keep artifacts aligned.

- [X] T029 Run backend tests with `npm run test` from backend/
- [X] T030 Run backend build with `npm run build` from backend/
- [X] T031 Run frontend tests with `npm run test` from frontend/
- [X] T032 Run frontend build with `npm run build` from frontend/
- [ ] T033 [P] Execute manual two-browser validation from specs/002-game-start-drawer-flow/quickstart.md
- [ ] T034 [P] Update implementation notes or task completion status in specs/002-game-start-drawer-flow/tasks.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; start immediately.
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational.
- **User Story 2 (Phase 4)**: Depends on Foundational and benefits from US1 validation.
- **User Story 3 (Phase 5)**: Depends on US2 active round state.
- **Polish (Phase 6)**: Depends on all selected stories.

### User Story Dependencies

- **US1**: Independent MVP after foundational types.
- **US2**: Requires room/player types and start schema; can be developed after foundational tasks.
- **US3**: Requires active round state from US2 to expose viewer-specific snapshots.

### Within Each User Story

- Tests must be written and observed failing before implementation.
- Models and schemas before services.
- Services before routes.
- Routes before frontend API integration.
- Frontend API/store before page rendering.

## Parallel Opportunities

- T005 and T007 can run in parallel with other foundational edits because they touch separate files.
- T008 and T009 can run in parallel for US1 test coverage.
- T013, T014, and T015 can run in parallel for US2 test coverage.
- T023 and T024 can run in parallel for US3 test coverage.
- T033 and T034 can run in parallel after automated validation.

## Parallel Example: User Story 2

```text
Task: "Add backend service tests for host start, first-player drawer fallback, non-host rejection, single-player rejection, and already-started rejection in backend/src/services/roomStore.test.ts"
Task: "Add frontend API test for POST /rooms/:code/start request shape in frontend/src/services/api.test.ts"
Task: "Add frontend roomStore test for startGame updating the room snapshot in frontend/src/state/roomStore.test.ts"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup.
2. Complete Phase 2 foundational types and schema.
3. Complete Phase 3 name validation.
4. Stop and validate whitespace-only rejection plus trimmed display names.

### Incremental Delivery

1. Deliver US1 to ensure valid player names.
2. Deliver US2 to make game start shared and drawer assignment visible.
3. Deliver US3 to enforce deterministic word selection and drawer-only visibility.
4. Run full automated and manual validation.

### Notes

- Keep all synchronization HTTP polling-based.
- Do not introduce databases, authentication, sessions, JWT, WebSockets, Socket.io, new state libraries, timers, scoring, or restart behavior.
- Commit after each story checkpoint or logical task group.
