# Tasks: Game Start and Drawer Flow

**Input**: Design documents from `/specs/002-game-start-drawer/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/rooms-api.md`, `quickstart.md`

**Tests**: Tests are included because the request explicitly requires role assignment and word visibility tests, and the plan requires backend/frontend validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing. The requested dependency order is preserved: drawer assignment, deterministic word selection, room round state, drawer-specific snapshots, hidden guesser word, UI indicators, drawer-only word display, tests, and game-start validation.

## Phase 1: Setup

**Purpose**: Confirm the current Feature Group 2 context and existing Feature Group 1 implementation before editing code.

- [X] T001 Review Feature Group 2 specification, plan, and quickstart in `specs/002-game-start-drawer/spec.md`, `specs/002-game-start-drawer/plan.md`, and `specs/002-game-start-drawer/quickstart.md`
- [X] T002 Review current room start implementation and tests in `backend/src/services/roomStore.ts`, `backend/src/api/rooms.ts`, and `backend/src/services/roomStore.test.ts`
- [X] T003 Review current frontend room snapshot and game screen usage in `frontend/src/services/api.ts`, `frontend/src/state/roomStore.ts`, and `frontend/src/pages/GamePage.tsx`

---

## Phase 2: Foundational

**Purpose**: Shared room, round, and snapshot model changes that block all user stories.

**Critical**: No user story implementation should begin until this phase is complete.

- [X] T004 Update backend room status, current round, viewer role, and drawer-only snapshot types in `backend/src/models/game.ts`
- [X] T005 Update frontend room snapshot, current round, viewer role, and optional secret word types in `frontend/src/services/api.ts`
- [X] T006 Confirm player-name and participant validation schemas still satisfy Feature Group 2 requirements in `backend/src/api/schemas.ts`
- [X] T007 Add schema regression coverage for trimmed names and participant IDs in `backend/src/api/schemas.test.ts`

**Checkpoint**: Shared model contracts support playing state, current round, and viewer-specific snapshots.

---

## Phase 3: User Story 1 - Start First Round with Drawer (Priority: P1) MVP

**Goal**: Starting the game transitions the room to playing state and assigns exactly one drawer, using the host when valid and earliest joined player as fallback.

**Independent Test**: Create a room with at least 2 players, start the game, and verify playing status plus exactly one drawer visible to all players.

### Tests for User Story 1

- [X] T008 [P] [US1] Add backend service tests for host drawer assignment and earliest-player fallback in `backend/src/services/roomStore.test.ts`
- [X] T009 [P] [US1] Add backend API tests for start response drawer identity and playing transition in `backend/src/api/rooms.test.ts`

### Implementation for User Story 1

- [X] T010 [US1] Add current round storage to room creation/start transition in `backend/src/services/roomStore.ts`
- [X] T011 [US1] Implement drawer assignment helper using valid host then earliest joined participant in `backend/src/services/roomStore.ts`
- [X] T012 [US1] Update start-room behavior to create first round and reject missing drawer cases in `backend/src/services/roomStore.ts`
- [X] T013 [US1] Return drawer identity in start and fetch room responses in `backend/src/api/rooms.ts`
- [X] T014 [US1] Extend frontend room state to store current round and drawer fields in `frontend/src/state/roomStore.ts`

**Checkpoint**: US1 is complete when a valid start creates playing state with exactly one public drawer.

---

## Phase 4: User Story 2 - Protect the Secret Word (Priority: P2)

**Goal**: The first round selects a deterministic secret word from the starter list and exposes it only to the drawer.

**Independent Test**: Start the same room setup repeatedly, confirm the same word is selected, and compare drawer versus guesser snapshots to verify only the drawer receives `secretWord`.

### Tests for User Story 2

- [X] T015 [P] [US2] Add backend service tests for deterministic word selection and word persistence in `backend/src/services/roomStore.test.ts`
- [X] T016 [P] [US2] Add backend service tests that guesser and unknown-viewer snapshots omit `secretWord` in `backend/src/services/roomStore.test.ts`
- [X] T017 [P] [US2] Add backend API tests comparing drawer and guesser `GET /rooms/:code` responses in `backend/src/api/rooms.test.ts`
- [X] T018 [P] [US2] Add frontend API tests for drawer snapshots with `secretWord` and guesser snapshots without `secretWord` in `frontend/src/services/api.test.ts`

### Implementation for User Story 2

- [X] T019 [US2] Add deterministic word selection helper using room code and starter word list in `backend/src/services/roomStore.ts`
- [X] T020 [US2] Store selected secret word on current round during start in `backend/src/services/roomStore.ts`
- [X] T021 [US2] Reject start with clear error when no starter word is available in `backend/src/services/roomStore.ts`
- [X] T022 [US2] Update `toRoomSnapshot` to include `secretWord` only for drawer viewers in `backend/src/services/roomStore.ts`
- [X] T023 [US2] Ensure API route responses rely on viewer-specific snapshots for start and fetch in `backend/src/api/rooms.ts`
- [X] T024 [US2] Update frontend room snapshot type and API fixtures so `secretWord` remains optional in `frontend/src/services/api.ts`

**Checkpoint**: US2 is complete when secret word selection is deterministic and guesser responses/UI state never contain `secretWord`.

---

## Phase 5: User Story 3 - Validate Player Names Before Start (Priority: P3)

**Goal**: Empty or whitespace-only names are rejected, accepted names are trimmed, and rejected attempts do not mutate room or round state.

**Independent Test**: Attempt create/join with empty and whitespace-only names, then create/join with padded names and confirm displayed names are trimmed.

### Tests for User Story 3

- [X] T025 [P] [US3] Add backend service or schema tests for trimmed accepted names and blank rejected names in `backend/src/api/schemas.test.ts`
- [X] T026 [P] [US3] Add backend API tests that rejected name attempts do not create or join rooms in `backend/src/api/rooms.test.ts`

### Implementation for User Story 3

- [X] T027 [US3] Preserve create and join name trimming behavior before room mutation in `backend/src/api/schemas.ts`
- [X] T028 [US3] Preserve frontend create-room whitespace validation and trimmed submission in `frontend/src/pages/CreateRoomPage.tsx`
- [X] T029 [US3] Preserve frontend join-room whitespace validation and trimmed submission in `frontend/src/pages/JoinRoomPage.tsx`

**Checkpoint**: US3 is complete when name validation remains enforced across create, join, and game-start prerequisites.

---

## Phase 6: User Story 4 - Keep Round State Consistent for All Players (Priority: P4)

**Goal**: All players see the same public playing state while drawer-only private state remains isolated.

**Independent Test**: Start a room with drawer and guesser, fetch both snapshots, and verify public round fields match while only the drawer has the secret word.

### Tests for User Story 4

- [X] T030 [P] [US4] Add backend route tests for matching public round fields across drawer and guesser snapshots in `backend/src/api/rooms.test.ts`
- [X] T031 [P] [US4] Add frontend API tests for expanded playing snapshot shape in `frontend/src/services/api.test.ts`

### Implementation for User Story 4

- [X] T032 [US4] Update frontend room state consumers to handle playing snapshots and optional private fields in `frontend/src/state/roomStore.ts`
- [X] T033 [US4] Show drawer identity and viewer role on the game screen in `frontend/src/pages/GamePage.tsx`
- [X] T034 [US4] Display the secret word only when the viewer is drawer in `frontend/src/pages/GamePage.tsx`
- [X] T035 [US4] Add guesser-safe copy that never renders or stores a placeholder secret word in `frontend/src/pages/GamePage.tsx`
- [X] T036 [US4] Style drawer indicator, role badge, and secret-word panel in `frontend/src/styles/app.css`

**Checkpoint**: US4 is complete when drawer and guesser screens share public state and differ only in drawer-only secret word visibility.

---

## Phase 7: Polish & Cross-Cutting Validation

**Purpose**: Validate the full Feature Group 2 flow against spec, plan, contracts, and quickstart.

- [X] T037 Run backend test and build validation for `backend/package.json`
- [X] T038 Run frontend test and build validation for `frontend/package.json`
- [ ] T039 Execute manual two-tab drawer/guesser quickstart validation and record findings in `specs/002-game-start-drawer/quickstart.md`
- [X] T040 Review changed backend files for scope, in-memory state, validation, and secret-word privacy in `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`, and `backend/src/api/rooms.ts`
- [X] T041 Review changed frontend files for role-specific rendering and absence of guesser secret-word state in `frontend/src/services/api.ts`, `frontend/src/state/roomStore.ts`, and `frontend/src/pages/GamePage.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup and blocks all user stories.
- **US1 Start First Round with Drawer (Phase 3)**: Depends on Foundational. Delivers drawer assignment and room round state.
- **US2 Protect Secret Word (Phase 4)**: Depends on US1 current-round storage. Delivers deterministic word selection and drawer-specific snapshots.
- **US3 Validate Player Names Before Start (Phase 5)**: Can run after Foundational, but should be verified before final validation because gameplay relies on trimmed names.
- **US4 Keep Round State Consistent (Phase 6)**: Depends on US1 and US2 snapshot fields. Delivers UI drawer indicator and drawer-only word display.
- **Polish (Phase 7)**: Depends on all desired stories being complete.

### Requested Dependency Order

1. Add drawer assignment: T004, T008-T014
2. Add deterministic word selection: T015, T019-T021
3. Store round state in room: T004, T010, T020
4. Create drawer-specific room snapshots: T016-T018, T022-T024
5. Hide secret word from guessers: T016-T018, T022, T035
6. Show drawer indicator in UI: T033, T036
7. Display secret word only to drawer: T034-T035
8. Add tests for role assignment and word visibility: T008-T009, T015-T018, T030-T031
9. Validate game start flow: T037-T041

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational.
- **US2 (P2)**: Starts after US1 because word selection is stored on `currentRound`.
- **US3 (P3)**: Can run after Foundational and must remain compatible with US1 start prerequisites.
- **US4 (P4)**: Starts after US1 and US2 because the UI depends on public drawer fields and private word visibility.

### Parallel Opportunities

- T001, T002, and T003 can be reviewed in parallel.
- T004 and T005 can run in parallel after Setup because they touch backend and frontend type files separately.
- T008 and T009 can run in parallel before US1 implementation because they touch different test files.
- T015, T016, T017, and T018 can run in parallel before US2 implementation because they touch service/API/frontend test files.
- T025 and T026 can run in parallel because schema and route validation tests are separate concerns.
- T030 and T031 can run in parallel because they cover backend route and frontend API contracts.
- T036 can run in parallel with T033-T035 after the desired UI states are known.

---

## Parallel Example: User Story 2

```bash
Task: "Add backend service tests for deterministic word selection and word persistence in backend/src/services/roomStore.test.ts"
Task: "Add backend API tests comparing drawer and guesser GET /rooms/:code responses in backend/src/api/rooms.test.ts"
Task: "Add frontend API tests for drawer snapshots with secretWord and guesser snapshots without secretWord in frontend/src/services/api.test.ts"
```

## Parallel Example: User Story 4

```bash
Task: "Update frontend room state consumers to handle playing snapshots and optional private fields in frontend/src/state/roomStore.ts"
Task: "Style drawer indicator, role badge, and secret-word panel in frontend/src/styles/app.css"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 for US1.
3. Stop and validate: first-round start transitions to playing and assigns exactly one drawer.

### Incremental Delivery

1. Deliver US1 drawer assignment and room round state.
2. Add US2 deterministic word selection and secret-word privacy.
3. Verify US3 name validation still protects gameplay setup.
4. Add US4 game screen rendering for drawer and guesser views.
5. Complete Phase 7 validation before accepting the feature.

### Completion Criteria

- All selected tasks are marked `[X]` in `specs/002-game-start-drawer/tasks.md`.
- Backend tests and build pass.
- Frontend tests and build pass.
- Manual two-tab validation confirms drawer sees the word and guesser does not.
- No WebSockets, databases, authentication, sessions, or unrelated dependencies are introduced.
- Guesser API responses and frontend state omit `secretWord` entirely.
