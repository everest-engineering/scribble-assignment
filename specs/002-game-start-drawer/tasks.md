---

description: "Task list for Scenario 2 game start and drawer flow implementation"

---

# Tasks: Scenario 2 Game Start & Drawer Flow

**Input**: Design documents from `/specs/002-game-start-drawer/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Include automated backend and frontend API coverage plus manual two-tab validation for each user story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Paths below follow this repository's monorepo layout

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the active Scenario 2 artifacts and validation targets before editing code

- [X] T001 Review implementation inputs in `specs/002-game-start-drawer/spec.md`, `specs/002-game-start-drawer/plan.md`, and `specs/002-game-start-drawer/contracts/rooms-scenario2.openapi.yaml`
- [X] T002 Confirm manual and automated validation steps in `specs/002-game-start-drawer/quickstart.md`, `backend/src/api/rooms.ts`, and `frontend/src/pages/GamePage.tsx`
- [X] T003 [P] Capture shared round-state and viewer-snapshot expectations from `specs/002-game-start-drawer/data-model.md` and `specs/002-game-start-drawer/research.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared round-state, validation, and snapshot contract changes that all Scenario 2 stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Update shared room, round, and viewer snapshot types in `backend/src/models/game.ts`
- [X] T005 [P] Extend shared room snapshot and session response types in `frontend/src/services/api.ts`
- [X] T006 [P] Add trimmed player-name normalization and whitespace-only rejection in `backend/src/api/schemas.ts`
- [X] T007 [P] Add round-aware room session and snapshot storage in `frontend/src/state/roomStore.ts`
- [X] T008 Implement shared deterministic drawer/word helpers and viewer-specific snapshot derivation in `backend/src/services/roomStore.ts`
- [X] T009 Implement shared room response mapping for create, join, fetch, and start snapshots in `backend/src/api/rooms.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in priority order

---

## Phase 3: User Story 1 - Start a Round with a Deterministic Drawer (Priority: P1) 🎯 MVP

**Goal**: Starting a valid room moves it into a stable playing state with a deterministic drawer assignment

**Independent Test**: Create a room, add a second player, start the game, and confirm the same drawer is chosen every time for the same room state

### Verification for User Story 1 ⚠️

- [X] T010 [P] [US1] Add deterministic drawer assignment and host-fallback coverage in `backend/src/services/roomStore.test.ts`
- [X] T011 [P] [US1] Add start-room playing snapshot coverage in `frontend/src/services/api.test.ts`
- [ ] T012 [US1] Validate deterministic host-first drawer assignment with `specs/002-game-start-drawer/quickstart.md`

### Implementation for User Story 1

- [X] T013 [US1] Initialize round state with host-first drawer selection and first-player fallback in `backend/src/services/roomStore.ts`
- [X] T014 [US1] Return playing-room start snapshots and preserve start failure mapping in `backend/src/api/rooms.ts`
- [X] T015 [P] [US1] Preserve drawer-aware start responses in `frontend/src/services/api.ts` and `frontend/src/state/roomStore.ts`
- [X] T016 [US1] Update lobby-to-game transition and drawer announcement states in `frontend/src/pages/LobbyPage.tsx` and `frontend/src/pages/GamePage.tsx`

**Checkpoint**: At this point, the room can leave the lobby with a deterministic drawer and a stable round identity

---

## Phase 4: User Story 2 - Validate and Preserve Player Names (Priority: P2)

**Goal**: Accepted player names are trimmed consistently, while whitespace-only names are rejected with clear feedback before room entry

**Independent Test**: Try creating and joining with leading/trailing spaces and with whitespace-only names, then confirm only trimmed valid names enter the room

### Verification for User Story 2 ⚠️

- [X] T017 [P] [US2] Add trimmed-name and whitespace-only rejection coverage in `backend/src/api/schemas.test.ts` and `backend/src/services/roomStore.test.ts`
- [X] T018 [P] [US2] Add create-room and join-room player-name request coverage in `frontend/src/services/api.test.ts`
- [ ] T019 [US2] Validate trimmed and rejected player-name flows with `specs/002-game-start-drawer/quickstart.md`

### Implementation for User Story 2

- [X] T020 [US2] Enforce trimmed player-name parsing and whitespace-only rejection in `backend/src/api/schemas.ts`
- [X] T021 [US2] Persist trimmed accepted names and return clear validation failures in `backend/src/services/roomStore.ts` and `backend/src/api/rooms.ts`
- [X] T022 [P] [US2] Preserve trimmed player names in room-session responses in `frontend/src/services/api.ts` and `frontend/src/state/roomStore.ts`
- [X] T023 [US2] Surface create/join player-name validation feedback in `frontend/src/pages/CreateRoomPage.tsx` and `frontend/src/pages/JoinRoomPage.tsx`

**Checkpoint**: At this point, invalid names are blocked and accepted names remain trimmed across lobby and game flows

---

## Phase 5: User Story 3 - Reveal the Secret Word Only to the Drawer (Priority: P3)

**Goal**: The round selects a deterministic secret word and reveals it only to the assigned drawer

**Independent Test**: Start the same room in two tabs, confirm the drawer sees the chosen word, and confirm the non-drawer does not receive the actual word value

### Verification for User Story 3 ⚠️

- [X] T024 [P] [US3] Add deterministic secret-word selection and drawer-only visibility coverage in `backend/src/services/roomStore.test.ts`
- [X] T025 [P] [US3] Add viewer-specific playing snapshot coverage in `frontend/src/services/api.test.ts`
- [ ] T026 [US3] Validate drawer-only secret-word visibility with `specs/002-game-start-drawer/quickstart.md`

### Implementation for User Story 3

- [X] T027 [US3] Select and persist the deterministic secret word from `backend/src/seed/starterData.ts` inside `backend/src/services/roomStore.ts`
- [X] T028 [US3] Return shared round identity plus hidden-word snapshots from `backend/src/services/roomStore.ts` and `backend/src/api/rooms.ts`
- [X] T029 [P] [US3] Store viewer-specific word visibility fields in `frontend/src/services/api.ts` and `frontend/src/state/roomStore.ts`
- [X] T030 [US3] Render drawer identity, visible-word, and hidden-word game states in `frontend/src/pages/GamePage.tsx` and `frontend/src/styles/app.css`

**Checkpoint**: All Scenario 2 drawer and secret-word visibility behavior should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and artifact alignment across the completed Scenario 2 slice

- [ ] T031 [P] Refresh Scenario 2 behavior notes in `specs/002-game-start-drawer/quickstart.md` and `specs/002-game-start-drawer/contracts/rooms-scenario2.openapi.yaml` if implementation wording changed
- [X] T032 Run backend validation for `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`, `backend/src/api/schemas.ts`, and `backend/src/api/rooms.ts` with `cd backend && npm test && npm run build`
- [X] T033 Run frontend validation for `frontend/src/services/api.ts`, `frontend/src/state/roomStore.ts`, `frontend/src/pages/CreateRoomPage.tsx`, `frontend/src/pages/JoinRoomPage.tsx`, `frontend/src/pages/LobbyPage.tsx`, and `frontend/src/pages/GamePage.tsx` with `cd frontend && npm test && npm run build`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion and defines the MVP slice
- **User Story 2 (Phase 4)**: Depends on Foundational completion and should follow User Story 1 so trimmed names are validated through the existing room-start flow
- **User Story 3 (Phase 5)**: Depends on Foundational completion and benefits from User Stories 1 and 2 being in place so drawer identity and viewer-specific word visibility can be validated end to end
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on other user stories; establishes the deterministic round-start flow
- **User Story 2 (P2)**: Uses the shared room/session contract and should preserve the start flow from User Story 1
- **User Story 3 (P3)**: Uses the round-start contract plus the validated name flow from User Story 2 for full two-tab verification

### Within Each User Story

- Verification tasks MUST be completed before the story is treated as done
- Shared types before services
- Services before routes or client state integration
- Client state before page-level UI behavior
- Manual two-tab validation before moving to the next priority

### Parallel Opportunities

- `T003` can run in parallel with `T001-T002`
- `T005-T007` can run in parallel once `T004` is defined
- `T010-T011`, `T017-T018`, and `T024-T025` can run in parallel within their user stories
- `T015`, `T022`, and `T029` can run in parallel with their paired backend work once the backend contract is stable
- `T031` can run in parallel with final validation once implementation is complete

---

## Parallel Example: User Story 1

```bash
# Launch User Story 1 automated verification together:
Task: "Add deterministic drawer assignment and host-fallback coverage in backend/src/services/roomStore.test.ts"
Task: "Add start-room playing snapshot coverage in frontend/src/services/api.test.ts"

# Launch independent User Story 1 implementation work together:
Task: "Initialize round state with host-first drawer selection and first-player fallback in backend/src/services/roomStore.ts"
Task: "Preserve drawer-aware start responses in frontend/src/services/api.ts and frontend/src/state/roomStore.ts"
```

## Parallel Example: User Story 2

```bash
# Launch User Story 2 automated verification together:
Task: "Add trimmed-name and whitespace-only rejection coverage in backend/src/api/schemas.test.ts and backend/src/services/roomStore.test.ts"
Task: "Add create-room and join-room player-name request coverage in frontend/src/services/api.test.ts"

# Launch independent User Story 2 implementation work together:
Task: "Persist trimmed accepted names and return clear validation failures in backend/src/services/roomStore.ts and backend/src/api/rooms.ts"
Task: "Surface create/join player-name validation feedback in frontend/src/pages/CreateRoomPage.tsx and frontend/src/pages/JoinRoomPage.tsx"
```

## Parallel Example: User Story 3

```bash
# Launch User Story 3 automated verification together:
Task: "Add deterministic secret-word selection and drawer-only visibility coverage in backend/src/services/roomStore.test.ts"
Task: "Add viewer-specific playing snapshot coverage in frontend/src/services/api.test.ts"

# Launch independent User Story 3 implementation work together:
Task: "Select and persist the deterministic secret word from backend/src/seed/starterData.ts inside backend/src/services/roomStore.ts"
Task: "Store viewer-specific word visibility fields in frontend/src/services/api.ts and frontend/src/state/roomStore.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Confirm deterministic host-first drawer assignment with two tabs
5. Demo the room start transition into the Scenario 2 game state

### Incremental Delivery

1. Complete Setup + Foundational -> shared round contract ready
2. Add User Story 1 -> validate deterministic drawer assignment -> MVP complete
3. Add User Story 2 -> validate trimmed names and whitespace-only rejection
4. Add User Story 3 -> validate deterministic word selection and drawer-only visibility
5. Finish with Phase 6 validation and artifact cleanup

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. After foundation is stable:
   - Developer A: backend service and route changes for the active story
   - Developer B: frontend store and page changes for the active story
   - Developer C: automated verification updates in `backend/src/**/*.test.ts` and `frontend/src/services/api.test.ts`
3. Rejoin for manual two-tab validation at the end of each story

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] labels map tasks to specific user stories for traceability
- Every task includes an exact file path and can be executed without additional artifact discovery
- Suggested MVP scope: Phase 3 / User Story 1 only
