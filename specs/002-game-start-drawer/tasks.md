# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `/specs/002-game-start-drawer/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Verify standard project structure and dependencies in backend and frontend

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [X] T002 Update `Player` entity to include `isDrawer` boolean in `backend/src/models/player.ts` (or equivalent types file)
- [X] T003 Update `Room` / `GameState` entity to include `secretWord`, `wordLength`, `drawerId`, and `roundNumber` in `backend/src/models/room.ts`
- [X] T004 [P] Add a predefined list of starter words to `backend/src/services/wordService.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Validate Player Name on Game Start (Priority: P1) 🎯 MVP

**Goal**: Ensure player names are trimmed, not empty/whitespace, and within 32 characters, and strictly unique.

**Independent Test**: Attempt to join or start a game with various invalid name inputs and verify rejection with clear messages.

### Implementation for User Story 1

- [X] T005 [P] [US1] Add schema validation for player name (trim, min 1, max 32) using Zod in `backend/src/api/routes/roomRoutes.ts` or corresponding schema file.
- [X] T006 [US1] Update `joinRoom` logic to reject duplicate names with "Name already taken" in `backend/src/services/roomService.ts`
- [X] T007 [P] [US1] Update frontend UI to display backend validation errors nicely when joining in `frontend/src/pages/Lobby.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Game Start and Drawer Assignment (Priority: P1)

**Goal**: Start the first round, assign the drawer role, and selectively broadcast the secret word payload.

**Independent Test**: Have multiple players join, start game, verify role assignment and word visibility per player.

### Implementation for User Story 2

- [X] T008 [P] [US2] Update `startGame` logic to assign `isDrawer = true` to the first player in `backend/src/services/roomService.ts`
- [X] T009 [US2] Deterministically select a secret word (e.g., first word in list) and set it in room state in `backend/src/services/roomService.ts`
- [X] T010 [US2] Implement payload scrubbing logic in `backend/src/api/routes/roomRoutes.ts` to omit `secretWord` for non-drawer requesters
- [X] T011 [US2] Update frontend room store to handle `isDrawer`, `secretWord`, and `wordLength` in `frontend/src/state/roomStore.ts`
- [X] T012 [P] [US2] Update frontend UI for Drawer to clearly show they are drawing and display the `secretWord` in `frontend/src/pages/Game.tsx`
- [X] T013 [P] [US2] Update frontend UI for non-drawers to show blanks (`_ _ _ _ _`) and a waiting message in `frontend/src/pages/Game.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T014 Code cleanup and type checking across backend and frontend
- [X] T015 Verify build succeeds with no warnings

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup completion
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies
- **User Story 1 (P1)**: Depends on Phase 2
- **User Story 2 (P1)**: Depends on Phase 2

### Parallel Opportunities
- Task T004 (adding word list) can be done in parallel with T002/T003.
- User Story 1 and User Story 2 can be developed in parallel as they touch different parts of the flow.
- UI updates in US2 (T012, T013) can be done in parallel.

## Implementation Strategy
1. Complete Foundational Tasks (T002-T004).
2. Complete US1 validation logic (T005-T007).
3. Complete US2 game start and word assignment logic (T008-T011).
4. Implement UI views for US2 (T012-T013).
5. Polish and verify builds.
