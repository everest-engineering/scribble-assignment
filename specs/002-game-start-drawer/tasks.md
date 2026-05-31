# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `/specs/002-game-start-drawer/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Include manual two-browser verification tasks for multiplayer flows.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

*(No general setup tasks needed for this feature as the project is already initialized)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T001 Define `RoundState` and update `Room` and `RoomSnapshot` interfaces in `backend/src/models/game.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Player Name Validation (Priority: P1) 🎯 MVP

**Goal**: Players must provide valid, non-empty names when joining or creating a room, with leading/trailing whitespace removed.

**Independent Test**: Attempt to join with a blank name or spaces-only name and verify it's rejected with a clear message. Attempt to join with spaces around a name and verify it's trimmed in the lobby.

### Implementation for User Story 1

- [ ] T002 [P] [US1] Update `createRoomSchema` and `joinRoomSchema` in `backend/src/api/schemas.ts` with `.trim().min(1, "Player name is required")`
- [ ] T003 [P] [US1] Enforce trimming and display validation errors in `frontend/src/pages/StartPage.tsx`
- [ ] T004 [P] [US1] Enforce trimming and display validation errors in `frontend/src/pages/JoinRoomPage.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Game Start and Drawer Assignment (Priority: P1)

**Goal**: When the host starts the game, the host (or first player) is assigned the role of the drawer for the first round, and all other players become guessers.

**Independent Test**: Start a game as host with one other player. Verify the host's screen clearly identifies them as the drawer, and the other player's screen identifies them as a guesser.

### Implementation for User Story 2

- [ ] T005 [P] [US2] Update `startGame` in `backend/src/services/roomStore.ts` to transition status to `in-game` and assign `hostParticipantId` as `drawerId`
- [ ] T006 [US2] Update `frontend/src/pages/GamePage.tsx` to display whether the current participant is the drawer or a guesser based on `roundState.drawerId`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Secret Word Selection & Visibility (Priority: P1)

**Goal**: A secret word is deterministically chosen from the starter list when the game starts. Only the assigned drawer can see this word, while guessers do not see it.

**Independent Test**: Start a game, observe that the drawer's UI displays the chosen secret word, and the guessers' UI either hides it completely or shows a masked version.

### Implementation for User Story 3

- [ ] T007 [US3] Update `startGame` in `backend/src/services/roomStore.ts` to assign the first word from `STARTER_WORDS` to `roundState.secretWord`
- [ ] T008 [US3] Update `toRoomSnapshot` in `backend/src/services/roomStore.ts` to selectively include `secretWord` in the snapshot only if `participantId === roundState.drawerId`
- [ ] T009 [US3] Update `frontend/src/pages/GamePage.tsx` to conditionally display `roundState.secretWord` (if it exists in the snapshot)

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T010 Run quickstart.md manual validation steps

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
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Expands on US2's backend logic

### Parallel Opportunities

- Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members
