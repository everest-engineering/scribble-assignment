# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `/specs/003-game-start-drawer-flow/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Tests**: Unit tests are included for store logic and schema validations, and integration tests verify role-based filtration.

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

**Purpose**: Core model extensions for role assignment, game round info, and schemas

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Extend Participant type and Room/RoomSnapshot interfaces in [backend/src/models/game.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/models/game.ts)
- [x] T004 Update Participant and RoomSnapshot interfaces to support role and secretWord in [frontend/src/services/api.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/services/api.ts)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Player Name Validation on Game Start (Priority: P1) 🎯 MVP

**Goal**: Validate that player names entered on Create Room and Join Room pages are trimmed and not empty or whitespace-only.

**Independent Test**: Try submitting an empty name or spaces-only on either page, check for direct on-screen error validation; ensure backend rejects with 400.

### Implementation for User Story 1

- [x] T005 [P] [US1] Write unit tests for playerName validation rules in [backend/src/api/schemas.test.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/api/schemas.test.ts)
- [x] T006 [US1] Ensure Zod validation schema playerName uses `.trim().min(1)` in [backend/src/api/schemas.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/api/schemas.ts)
- [x] T007 [US1] Add frontend trim and empty check validation messages in [frontend/src/pages/CreateRoomPage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/CreateRoomPage.tsx)
- [x] T008 [US1] Add frontend trim and empty check validation messages in [frontend/src/pages/JoinRoomPage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/JoinRoomPage.tsx)

**Checkpoint**: Player name validation is secure and rejects invalid entries on both frontend and backend.

---

## Phase 4: User Story 2 - Drawer Role Assignment on Game Start (Priority: P1)

**Goal**: Automatically assign host the `drawer` role and other players the `guesser` role on game start.

**Independent Test**: Host starts game with 2+ players, verify in the state that host gets `drawer` and guests get `guesser`.

### Implementation for User Story 2

- [x] T009 [P] [US2] Write unit tests for drawer role assignment upon starting the game in [backend/src/services/roomStore.test.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.test.ts)
- [x] T010 [US2] In `startGame` logic, assign roles to all participants dynamically in [backend/src/services/roomStore.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.ts)
- [x] T011 [US2] Update `toRoomSnapshot` to serialize participant roles in [backend/src/services/roomStore.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.ts)
- [x] T012 [US2] Render role badge on the user scoreboard inside [frontend/src/pages/GamePage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/GamePage.tsx)
- [x] T013 [US2] Fetch and store current player's role on game start transition in [frontend/src/pages/LobbyPage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/LobbyPage.tsx)

**Checkpoint**: Roles are assigned synchronously upon game start, and players can view their role badge.

---

## Phase 5: User Story 3 - Deterministic Secret Word Selection (Priority: P1)

**Goal**: Deterministically select the first word from the starter list as the secret word.

**Independent Test**: Verify that the starting round secret word is always "rocket" across multiple room sessions.

### Implementation for User Story 3

- [x] T014 [P] [US3] Write unit tests for deterministic word selection on room start in [backend/src/services/roomStore.test.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.test.ts)
- [x] T015 [US3] Initialize room round with the first word of the starter list in [backend/src/services/roomStore.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.ts)

**Checkpoint**: Secret word selection is fully deterministic and stored in-memory.

---

## Phase 6: User Story 4 - Drawer-Only Word Visibility (Priority: P1)

**Goal**: Exclude secret word from the snapshot for guesser roles, displaying it only to the drawer.

**Independent Test**: Inspect network responses on guesser tab; verify secretWord does not exist, but drawer can view it on screen.

### Implementation for User Story 4

- [x] T016 [P] [US4] Write unit/integration tests for role-based snapshot secretWord filtering in [backend/src/services/roomStore.test.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.test.ts)
- [x] T017 [US4] Modify `toRoomSnapshot` to dynamically filter `secretWord` based on viewer's role in [backend/src/services/roomStore.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.ts)
- [x] T018 [US4] UI: Display the secret word card on the canvas page for the drawer in [frontend/src/pages/GamePage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/GamePage.tsx)
- [x] T019 [US4] UI: Hide secret word elements and rendering logic for guessers in [frontend/src/pages/GamePage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/GamePage.tsx)

**Checkpoint**: Role-based filtering prevents network leakage, and the secret word is only visible to the drawer.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: General styling alignment, Edge cases, and quality checks

- [x] T020 Handle edge case: Ensure proper state preservation if a user reloads the GamePage (fetch state on mount) in [frontend/src/pages/GamePage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/GamePage.tsx)
- [x] T021 Apply styling and micro-animations to secret word details and badge elements in [frontend/src/styles/app.css](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/styles/app.css)
- [x] T022 Clean up debugging statements and verify TypeScript typings
- [x] T023 Run verification plan checks to confirm all scenarios are green

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1. Blocks all subsequent phases.
- **User Stories (Phases 3-6)**: Depend on Phase 2. US1, US2, and US3 are independent. US4 depends on US2 and US3.
- **Polish (Phase 7)**: Depends on all user story completions.

### User Story Dependencies

- **US1 (Name Validation)**: Independent.
- **US2 (Drawer Assignment)**: Blocks US4.
- **US3 (Secret Word)**: Blocks US4.
- **US4 (Drawer-Only Word)**: Depends on US2 (for drawer checking) and US3 (for word setup).

### Parallel Opportunities

- **Setup**: T001, T002 in parallel.
- **Foundational**: T003, T004 in parallel.
- **US1**: Backend tests and schema validation (T005, T006) in parallel with frontend UI validations (T007, T008).
- **US2**: Unit test and role mapping (T009, T010, T011) in parallel with frontend representation (T012, T013).
- **US4**: Backend filtration rules (T016, T017) in parallel with frontend UI changes (T018, T019).

---

## Parallel Example: User Story 1

```bash
# Developers can work on frontend and backend validations in parallel:
Task: "Ensure Zod validation schema playerName uses .trim().min(1) in backend/src/api/schemas.ts"
Task: "Add frontend trim and empty check validation messages in frontend/src/pages/CreateRoomPage.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundational phases.
2. Complete Player Name Validation (US1) -> Verify.

### Incremental Delivery

1. Setup + Foundation complete.
2. Deliver US1 (Name Validation) -> Verify.
3. Deliver US2 (Drawer Assignment) -> Verify.
4. Deliver US3 (Secret Word Selection) -> Verify.
5. Deliver US4 (Drawer-Only Word Visibility) -> Verify.
6. Polish edge cases, styling, and run full test suites.
