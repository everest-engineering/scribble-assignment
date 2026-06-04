# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `/specs/002-game-start-drawer-flow/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included because the feature spec defines explicit independent test scenarios for each user story.

**Organization**: Tasks are grouped by user story to keep each story independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Shared type and fixture alignment for the new room snapshot shape

- [ ] T001 [P] Extend shared room/player types in `backend/src/models/game.ts` and `frontend/src/services/api.ts` to include `role`, `currentDrawerId`, and optional `currentWord`
- [ ] T002 [P] Refresh shared room snapshot fixtures in `backend/src/services/roomStore.test.ts`, `frontend/src/services/api.test.ts`, `frontend/src/state/roomStore.test.ts`, and `frontend/src/pages/LobbyPage.test.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core room-store helper that all game-start logic depends on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Add the pure room-code hash helper and game-state slots in `backend/src/services/roomStore.ts`

**Checkpoint**: Room/game data can now represent a drawer, a current word, and a deterministic word index

---

## Phase 3: User Story 1 - Host Starts Game and Becomes Drawer (Priority: P1) 🎯 MVP

**Goal**: Starting a game assigns the host as drawer, assigns everyone else as guessers, and selects a deterministic secret word.

**Independent Test**: Create a room, join a second player, start the game, and verify the drawer receives `currentWord` while a guesser snapshot omits it entirely. If the host leaves mid-game, the room is deleted.

### Tests for User Story 1

- [ ] T004 [US1] Extend `backend/src/services/roomStore.test.ts` with host-drawer assignment, deterministic word selection, and drawer-leave deletion cases

### Implementation for User Story 1

- [ ] T005 [US1] Implement host-as-drawer start flow, role assignment, and deterministic word selection in `backend/src/services/roomStore.ts`
- [ ] T006 [US1] Return viewer-aware room snapshots from `backend/src/api/rooms.ts` so drawer polls include `currentWord` and guesser polls omit it

**Checkpoint**: User Story 1 should now be fully functional and independently testable

---

## Phase 4: User Story 2 - Player Name Validation on Join (Priority: P1)

**Goal**: Create/join requests trim player names and reject empty or whitespace-only names with a clear error.

**Independent Test**: Submit whitespace-only names to create/join and confirm rejection; submit `"  Alice  "` and confirm the stored name is `Alice`.

### Tests for User Story 2

- [ ] T007 [US2] Add `backend/src/api/schemas.test.ts` coverage for whitespace-only rejection and trimmed-name acceptance

### Implementation for User Story 2

- [ ] T008 [US2] Enforce trimmed non-empty player names in `backend/src/api/schemas.ts`

**Checkpoint**: User Story 2 should now be fully functional and independently testable

---

## Phase 5: User Story 3 - Drawer Identification in Game UI (Priority: P2)

**Goal**: The game screen clearly shows the drawer to everyone, shows each player their own role label, and shows the secret word only to the drawer.

**Independent Test**: Start a game in two browser tabs and verify both tabs show the drawer identity; the drawer sees the word, and the guesser sees a hidden-word placeholder.

### Tests for User Story 3

- [ ] T009 [US3] Add `frontend/src/pages/GamePage.test.tsx` coverage for drawer identity, own role label, and hidden-word placeholder behavior

### Implementation for User Story 3

- [ ] T010 [US3] Render the drawer badge and participant role labels in `frontend/src/components/Scoreboard.tsx` and `frontend/src/pages/GamePage.tsx`
- [ ] T011 [US3] Show the secret word only to the drawer and a hidden-word placeholder to guessers in `frontend/src/pages/GamePage.tsx`
- [ ] T012 [US3] Add drawer/guesser presentation styles in `frontend/src/styles/app.css`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation sync

- [ ] T013 [P] Update `specs/002-game-start-drawer-flow/quickstart.md` with the final manual verification wording and room field names
- [ ] T014 [P] Run the focused validation pass using `backend/src/services/roomStore.test.ts`, `backend/src/api/schemas.test.ts`, and `frontend/src/pages/GamePage.test.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories
- **User Stories (Phase 3+)**: Depend on Foundational completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup + Foundational; no dependency on other stories
- **User Story 2 (P1)**: Can start after Setup + Foundational; independent of User Story 1
- **User Story 3 (P2)**: Can start after Setup + Foundational; consumes the shared snapshot shape from the earlier phases

### Within Each User Story

- Tests are written before implementation tasks in that story
- Backend state and contract changes come before UI consumption
- Each story should be complete before moving to the next priority

### Parallel Opportunities

- T001 and T002 can run in parallel because they touch different files
- After Phase 2, User Story 1 and User Story 2 can be worked independently if staffed
- User Story 3 can start once the shared snapshot shape is in place

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Stop and validate the start-game/drawer flow before expanding scope

### Incremental Delivery

1. Ship the game-start flow first
2. Add name validation next
3. Finish with drawer-identification UI and secret-word masking
4. Validate each story independently against the quickstart steps

### Parallel Team Strategy

1. One developer handles the shared type and fixture setup
2. Another can implement the room-store helper
3. After the foundation is done, the three user stories can be split by area

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to a specific user story for traceability
- Keep the implementation within the existing HTTP polling architecture
- Do not add WebSockets, databases, auth, drawers rotations, timers, or multiple rounds
