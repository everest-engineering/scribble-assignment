# Tasks: Game Start & Role Assignment

**Input**: Design documents from `/specs/002-start-game-roles/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL. The spec does not explicitly request tests, so none are generated. Add test tasks manually if needed.

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

No setup tasks required — project structure is already established from the previous feature.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 Add RoundState type and extend Room/RoomSnapshot with round, drawerId, phase, wordOptions, secretWord fields in `backend/src/models/game.ts`
- [x] T002 [P] Create WordBank service module with a curated word list (100+ age-appropriate words) and a `pickWords(count: number): string[]` function in `backend/src/services/wordBank.ts`
- [x] T003 Add wordSelectionSchema (participantId + word) in `backend/src/api/schemas.ts`
- [x] T004 Register POST /rooms/:code/select-word route in `backend/src/api/router.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Host Starts the Game (Priority: P1) 🎯 MVP

**Goal**: The host can start the game from the lobby. The system validates the start conditions (≥2 players, host status, not already started), assigns roles, selects 3 word options, and transitions the room to in-progress.

**Independent Test**: Create a room with 2+ players as host, click "Start Game", and verify all players receive role assignments and the game state changes to "in-progress".

### Implementation for User Story 1

- [x] T005 [US1] Implement startGame() with role assignment (random drawer selection), word option selection (3 random words from WordBank), and phase transition ("word-selection") in `backend/src/services/roomStore.ts`
- [x] T006 [US1] Modify POST /rooms/:code/start handler to return drawerId and phase in response in `backend/src/api/rooms.ts`
- [x] T007 [US1] Modify GET /rooms/:code to populate wordOptions and secretWord only when participantId matches drawerId in `backend/src/api/rooms.ts`
- [x] T008 [US1] Update frontend types (RoomSnapshot, RoomSessionResponse) and roomStore with drawerId, phase, wordOptions, secretWord fields in `frontend/src/services/api.ts` and `frontend/src/state/roomStore.ts`

**Checkpoint**: At this point, User Story 1 should be fully functional — host can start game, roles are assigned, state transitions to "in-progress". Can verify via API calls or frontend polling.

---

## Phase 4: User Story 2 - Players See Their Roles (Priority: P1)

**Goal**: All players see their assigned role (drawer or guesser) on the game screen immediately after the game starts.

**Independent Test**: Join a room with 2+ players, have the host start the game, and verify each player sees their correct role (exactly one drawer, all others guessers).

### Implementation for User Story 2

- [x] T009 [P] [US2] Create GamePage.tsx showing role display ("You are the Drawer" or "You are a Guesser") and phase-based content (word selection vs. drawing) in `frontend/src/pages/GamePage.tsx`
- [x] T010 [P] [US2] Create DrawerWordSelect component showing 3 word options for the drawer to pick from in `frontend/src/pages/DrawerWordSelect.tsx`
- [x] T011 [US2] Modify LobbyPage.tsx to redirect to GamePage when room status transitions to "in-progress" in `frontend/src/pages/LobbyPage.tsx`
- [x] T012 [US2] Add routing for GamePage in the frontend router

**Checkpoint**: At this point, User Story 2 should work — players see their roles on the game screen, drawer sees word options, guessers see "waiting" state.

---

## Phase 5: User Story 3 - Drawer Views the Secret Word (Priority: P2)

**Goal**: The drawer selects a word from the presented options. The selected word is stored and displayed prominently to the drawer. Guessers never see the word.

**Independent Test**: Start a game with 2+ players, verify the drawer sees a word on their screen while guessers see no word.

### Implementation for User Story 3

- [x] T013 [P] [US3] Implement selectWord() in roomStore that validates caller is drawer and word is in options, updates phase to "drawing" and stores secretWord in `backend/src/services/roomStore.ts`
- [x] T014 [P] [US3] Add POST /rooms/:code/select-word handler that calls selectWord() and returns updated room state in `backend/src/api/rooms.ts`
- [x] T015 [US3] Add selectWord() API call in frontend API client and store method in `frontend/src/services/api.ts` and `frontend/src/state/roomStore.ts`
- [x] T016 [US3] Wire up DrawerWordSelect component to call selectWord() on user click, transition phase to "drawing", and display the selected secret word in `frontend/src/pages/DrawerWordSelect.tsx`

**Checkpoint**: All user stories should now be independently functional. Drawer can select a word and see it. Guessers never see it.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T017 Run `npm run build` in backend to verify no type or compilation errors
- [x] T018 Run `npm run build` in frontend to verify no type or compilation errors
- [ ] T019 Run through quickstart.md validation steps manually

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational completion
- **US2 (Phase 4)**: Depends on Foundational + US1 (needs roles assigned)
- **US3 (Phase 5)**: Depends on US2 (needs game screen with word options)
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational — no other story dependencies
- **User Story 2 (P1)**: After US1 — roles must be assigned before they can be displayed
- **User Story 3 (P2)**: After US2 — game screen must exist before word selection can be wired

### Within Each User Story

- Models before services
- Services before endpoints
- Backend before frontend
- Story complete before moving to next priority

### Parallel Opportunities

- All Foundational tasks marked [P] can run in parallel
- T009 and T010 (US2 components) can run in parallel
- T013 and T014 (US3 backend tasks) can run in parallel

---

## Parallel Example: User Story 2

```bash
# Launch both frontend components together:
Task: "Create GamePage.tsx in frontend/src/pages/GamePage.tsx"
Task: "Create DrawerWordSelect.tsx in frontend/src/pages/DrawerWordSelect.tsx"
```

## Parallel Example: User Story 3

```bash
# Launch both backend tasks together:
Task: "Implement selectWord() in backend/src/services/roomStore.ts"
Task: "Add POST /rooms/:code/select-word handler in backend/src/api/rooms.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (types, word bank, schema, route registration)
2. Complete Phase 3: User Story 1 (start game with role assignment + word options)
3. **STOP and VALIDATE**: Test User Story 1 independently via API or frontend
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → Foundation ready
2. Add User Story 1 → Host can start game → **MVP!**
3. Add User Story 2 → Players see roles, drawer sees word options
4. Add User Story 3 → Drawer selects word, guessers see nothing

### Parallel Team Strategy

With multiple developers:

1. Team completes Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (backend + frontend types)
   - Developer B: Can start preparing US2 frontend components
3. After US1: Developer A → US3 backend, Developer B → US2 + US3 frontend
