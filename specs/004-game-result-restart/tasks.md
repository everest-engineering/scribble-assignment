# Tasks: Game Result and Restart

**Input**: Design documents from `/specs/004-game-result-restart/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Verify project structure aligns with implementation plan

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Update `GameState` type to include `'RESULT'` in `backend/src/models/Room.ts`
- [X] T003 Implement `restartGame()` method in `backend/src/services/RoomService.ts` to clear round state
- [X] T004 Implement end-of-round transition to `RESULT` state in `backend/src/services/RoomService.ts`
- [X] T005 [P] Expose `POST /api/rooms/:roomId/restart` endpoint in `backend/src/api/routes.ts`

**Checkpoint**: Foundation ready - backend supports the new state and restart flow

---

## Phase 3: User Story 1 - View Round Results (Priority: P1) 🎯 MVP

**Goal**: Display the correct word, final scores, and the full guess history when the round ends.

**Independent Test**: Can be tested by manually transitioning the game into the result state and verifying the UI displays the correct word, scores, and all guesses.

### Implementation for User Story 1

- [X] T006 [P] [US1] Update `frontend/src/state/roomStore.ts` to type and handle the new `RESULT` state
- [X] T007 [P] [US1] Ensure backend returns `currentWord` to all players when `gameState === 'RESULT'` in `backend/src/api/routes.ts` or `RoomService.ts`
- [X] T008 [US1] Create `ResultScreen` component in `frontend/src/components/ResultScreen.tsx` to display scores, guesses, and the word
- [X] T009 [US1] Update `frontend/src/pages/GameRoom.tsx` to conditionally render `ResultScreen` when `gameState === 'RESULT'`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Restart Game to Lobby (Priority: P1)

**Goal**: Host can restart the game from the results screen, bringing everyone to the lobby.

**Independent Test**: Can be fully tested by clicking the restart button as the host and verifying all connected clients are routed to the lobby state with a clean slate.

### Implementation for User Story 2

- [X] T010 [US2] Add "Restart Game" button in `frontend/src/components/ResultScreen.tsx` visible/enabled only for the host
- [X] T011 [US2] Wire "Restart Game" button to call `POST /api/rooms/:roomId/restart` using `fetch` or existing API utilities
- [X] T012 [US2] Verify polling automatically transitions UI back to lobby state when backend state changes

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T013 Verify disconnect handling logic transfers host properly if host disconnects during result state
- [X] T014 Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### Parallel Opportunities

- T005, T006, T007 can be executed in parallel as they touch independent files across frontend and backend.

---

## Implementation Strategy

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
