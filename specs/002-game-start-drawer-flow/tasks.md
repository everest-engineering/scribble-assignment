# Tasks: Game Start and Drawer Flow

**Input**: Design documents from `specs/002-game-start-drawer-flow/`

**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api.md, research.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 0: Discovery & Artifacts

**Purpose**: Understanding existing code and aligning Spec Kit artifacts

- [ ] T000 [P] Conduct discovery: document gaps and assumptions in specs/002-game-start-drawer-flow/research.md
- [ ] T001 [P] Sync artifacts: verify Constitution, Spec, and Plan consistency in specs/002-game-start-drawer-flow/

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure updates that block all user stories

- [ ] T002 Update Participant and Room types in backend/src/models/game.ts to include role and secretWord
- [ ] T003 Update RoomSnapshot in backend/src/models/game.ts to include secretWord
- [ ] T004 Update RoomSnapshot interface in frontend/src/services/api.ts to match the new backend signature

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 2: User Story 1 - Drawer Assignment (Priority: P1) 🎯 MVP

**Goal**: Host is assigned "drawer", others are "guessers" upon game start.

**Independent Test**: Start the game with 2 players. Verify that the host's participant object has `role: "drawer"` and the guest has `role: "guesser"`.

- [ ] T005 [P] [US1] Create a test suite block for role assignment in backend/src/services/roomStore.test.ts
- [ ] T006 [US1] Update `startGame` logic in backend/src/services/roomStore.ts to assign roles to participants
- [ ] T007 [P] [US1] Update `GamePage.tsx` in frontend/src/pages/GamePage.tsx to conditionally render drawer vs guesser UI based on local role

**Checkpoint**: US1 complete - Roles are successfully assigned and utilized by the UI.

---

## Phase 3: User Story 2 - Secret Word Visibility (Priority: P1)

**Goal**: Drawer sees the secret word ("rocket"); guessers see `null`.

**Independent Test**: Inspect the API response for the room. Verify `secretWord` is populated for the drawer and `null` for the guessers.

- [ ] T008 [P] [US2] Create a test suite block for payload masking in backend/src/services/roomStore.test.ts
- [ ] T009 [US2] Update `startGame` logic in backend/src/services/roomStore.ts to deterministically set `room.secretWord = "rocket"`
- [ ] T010 [US2] Update `toRoomSnapshot` in backend/src/services/roomStore.ts to mask `secretWord` to `null` if the viewer is a guesser
- [ ] T011 [US2] Update GET /rooms/:code endpoint in backend/src/api/rooms.ts to pass `participantId` to `toRoomSnapshot` for conditional masking

**Checkpoint**: US2 complete - Secret word is deterministic and safely masked.

---

## Phase 4: User Story 3 - Room State Transition (Priority: P2)

**Goal**: Late joins are rejected; clients transition automatically.

**Independent Test**: Try to join a "playing" room and receive a 403. Start a game and verify clients navigate to the game board.

- [ ] T012 [P] [US3] Create test suite block for late join blocking in backend/src/services/roomStore.test.ts
- [ ] T013 [US3] Update `joinRoom` logic in backend/src/services/roomStore.ts to throw/return error if `status === "playing"`
- [ ] T014 [US3] Update `/:code/join` endpoint in backend/src/api/rooms.ts to handle the late-join error and return 403
- [ ] T015 [US3] Verify or add auto-navigation logic in frontend/src/state/roomStore.ts so polling clients navigate to `/game` when status changes to "playing"

**Checkpoint**: US3 complete - Transitions are seamless and late joins are prevented.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup

- [ ] T016 [P] Run quickstart.md validation steps in multiple browser tabs
- [ ] T017 [P] Verify no TypeScript errors (Rule I) in frontend and backend

---

## Dependencies & Execution Order

- **Phase 1 (Foundational)**: BLOCKS all US phases.
- **User Story 1 & 2**: Can be worked on concurrently after Phase 1.
- **User Story 3**: Independent of US1 and US2, focuses on network transitions and join barriers.

---

## Implementation Strategy

### MVP First (User Story 1 & 2)
1. Complete Foundational Phase (Types updates).
2. Complete US1 (Role assignment and UI conditional rendering).
3. Complete US2 (Word selection and masking).
4. **STOP and VALIDATE**: Verify Alice sees the word and Bob sees null.

### Full Feature
1. Add US3 (Join protection and transition sync).
2. Final multi-player validation.
