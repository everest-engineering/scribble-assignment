# Tasks: Secret Word Drawer

**Input**: Design documents from `/specs/002-secret-word-drawer/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the shared types and helpers that the round feature builds on.

- [X] T001 [P] Add drawer-aware room and round types in `backend/src/models/game.ts` and `frontend/src/services/api.ts`
- [X] T002 [P] Add starter-word validation and selection helpers in `backend/src/seed/starterData.ts` and `backend/src/services/roomStore.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core room/snapshot plumbing that every user story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 [P] Add start-request validation for host-selected starter words and viewer-aware room snapshot wiring in `backend/src/api/schemas.ts` and `backend/src/api/rooms.ts`
- [X] T004 [P] Extend the frontend API client and room store to carry drawer-visible snapshots in `frontend/src/services/api.ts` and `frontend/src/state/roomStore.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Host Becomes Drawer (Priority: P1) 🎯 MVP

**Goal**: When the host starts the game, the host is assigned as the drawer for the first round.

**Independent Test**: Start a game as the host and confirm the round begins with the host clearly identified as the drawer.

### Tests for User Story 1

- [X] T005 [P] [US1] Add backend tests for first-participant drawer assignment and round transition in `backend/src/services/roomStore.test.ts`
- [X] T006 [P] [US1] Add frontend tests for host start-game gating and drawer label rendering in `frontend/src/pages/LobbyPage.test.tsx` and `frontend/src/pages/GamePage.test.tsx`

### Implementation for User Story 1

- [X] T007 [US1] Implement round-start state and first-participant drawer assignment in `backend/src/services/roomStore.ts`
- [X] T008 [US1] Wire the room start endpoint and return the updated round snapshot in `backend/src/api/rooms.ts`
- [X] T009 [US1] Update the lobby and game screens to show the drawer identity after the round starts in `frontend/src/pages/LobbyPage.tsx` and `frontend/src/pages/GamePage.tsx`

**Checkpoint**: User Story 1 should now be fully functional and testable independently

---

## Phase 4: User Story 2 - Secret Word Visible Only to Drawer (Priority: P1)

**Goal**: The selected word is visible only to the drawer and hidden from all guessers.

**Independent Test**: Start a round and confirm the drawer sees the secret word while a guesser does not.

### Tests for User Story 2

- [X] T010 [P] [US2] Add backend tests for host-selected starter-word choice and drawer-only visibility in `backend/src/services/roomStore.test.ts` and `backend/src/api/schemas.test.ts`
- [X] T011 [P] [US2] Add frontend tests for viewer-specific room snapshots in `frontend/src/services/api.test.ts` and `frontend/src/state/roomStore.test.ts`

### Implementation for User Story 2

- [X] T012 [US2] Store the host-selected secret word on round start and omit it from guesser snapshots in `backend/src/services/roomStore.ts`
- [X] T013 [US2] Thread viewer-aware secret-word visibility through room fetches in `backend/src/api/rooms.ts` and `frontend/src/services/api.ts`
- [X] T014 [US2] Render the secret word only for the drawer and keep it hidden for guessers in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: User Stories 1 and 2 should both work independently

---

## Phase 5: User Story 3 - Reject Empty Player Names (Priority: P2)

**Goal**: Player names are trimmed and empty or whitespace-only names are rejected with a clear message.

**Independent Test**: Try blank and whitespace-only names and confirm the player stays on the form with a validation error.

### Tests for User Story 3

- [X] T015 [P] [US3] Add backend validation tests for trimmed and rejected player names in `backend/src/api/schemas.test.ts`
- [X] T016 [P] [US3] Add frontend form tests for trimmed input and blank-name rejection in `frontend/src/pages/CreateRoomPage.test.tsx` and `frontend/src/pages/JoinRoomPage.test.tsx`

### Implementation for User Story 3

- [X] T017 [US3] Enforce trimmed player-name validation at the backend request boundary in `backend/src/api/schemas.ts` and `backend/src/api/rooms.ts`
- [X] T018 [US3] Keep the create and join forms aligned with trimmed-name validation and error feedback in `frontend/src/pages/CreateRoomPage.tsx` and `frontend/src/pages/JoinRoomPage.tsx`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T019 [P] Reconcile the contract and quickstart docs with host-selected starter-word visibility in `specs/002-secret-word-drawer/contracts/rooms.md` and `specs/002-secret-word-drawer/quickstart.md`
- [ ] T020 [P] Re-run and stabilize round-state coverage in `backend/src/services/roomStore.test.ts`, `frontend/src/state/roomStore.test.ts`, `frontend/src/pages/LobbyPage.test.tsx`, and `frontend/src/pages/GamePage.test.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel if needed
  - Or sequentially in priority order
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - May build on the same round snapshot plumbing, but should remain independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independent of the drawer flow

### Within Each User Story

- Tests MUST be written before implementation where included
- Shared types before services
- Services before route wiring
- Route wiring before UI consumption
- Story complete before moving to the next priority

### Parallel Opportunities

- Phase 1 tasks T001 and T002 can run in parallel
- Phase 2 tasks T003 and T004 can run in parallel once the shared types exist
- Phase 3 tasks T005 and T006 can run in parallel
- Phase 4 tasks T010 and T011 can run in parallel
- Phase 5 tasks T015 and T016 can run in parallel
- Phase 6 tasks T019 and T020 can run in parallel

---

## Parallel Example: User Story 1

```bash
Task: "Add backend tests for first-participant drawer assignment and round transition in backend/src/services/roomStore.test.ts"
Task: "Add frontend tests for host start-game gating and drawer label rendering in frontend/src/pages/LobbyPage.test.tsx and frontend/src/pages/GamePage.test.tsx"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Complete Phase 4: User Story 2
5. **STOP and VALIDATE**: Test the drawer flow independently before moving on

### Incremental Delivery

1. Complete Setup + Foundational
2. Add User Story 1 to make the round start and drawer assignment work
3. Add User Story 2 so the secret word is visible only to the drawer
4. Add User Story 3 to harden name validation
5. Finish with polish and cross-cutting test stabilization

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundation is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
