# Tasks: Scribble Multiplayer Drawing Game

**Input**: Design documents from `/specs/001-scribble-game/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g. US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)
**Purpose**: Project initialization and basic structure
- [x] T001 Initialize Specify integration and active plan references in AGENTS.md

---

## Phase 2: Foundational (Blocking Prerequisites)
**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented
- [x] T002 [P] Fix VITE_API_URL default value in frontend/src/services/api.ts
- [x] T003 [P] Add hostId, drawerId, secretWord, canvasData, guesses, and scores to Room and RoomSnapshot interfaces in backend/src/models/game.ts
- [x] T004 [P] Sync RoomSnapshot and Guess interfaces in frontend/src/services/api.ts with backend models

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Scenario 1: Room Setup & Lobby (Priority: P1) 🎯 MVP
**Goal**: Implement room setup, name trimming, host tracking, automatic lobby polling, and host controls.
**Independent Test**: Connect 2 players in lobby, verify host badge, automatic lobby polling, and host-restricted start game button.

### Implementation for User Story 1
- [x] T005 [P] [US1] Enforce playerName trimming and non-empty schema validations in backend/src/api/schemas.ts
- [x] T006 [US1] Assign hostId and initialize player score to 0 on room creation in backend/src/services/roomStore.ts
- [x] T007 [US1] Trim playerName and initialize player score to 0 on join in backend/src/services/roomStore.ts
- [x] T008 [US1] Validate room codes (upper-case inputs) and return clear 404 errors for non-existent rooms in backend/src/api/rooms.ts
- [x] T009 [US1] Add test cases for creation/join validation and hostId assignment in backend/src/services/roomStore.test.ts
- [x] T010 [US1] Implement 2s automatic polling using setInterval in frontend/src/pages/LobbyPage.tsx
- [x] T011 [US1] Restrict Start Game button to host and enable when 2+ players are present in frontend/src/pages/LobbyPage.tsx
- [x] T012 [US1] Add crown Host badge to player list in frontend/src/pages/LobbyPage.tsx

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Scenario 2: Game Start & Drawer Flow (Priority: P2)
**Goal**: Implement start game endpoint, drawer assignment, deterministic word selection, word masking, and auto-redirection.
**Independent Test**: Click start in host tab, verify redirect to `/game` in both tabs, display secret word only to drawer.

### Implementation for User Story 2
- [ ] T013 [US2] Implement startGame logic (assign drawer, select word deterministically) in backend/src/services/roomStore.ts
- [ ] T014 [US2] Mount POST /rooms/:code/start route in backend/src/api/rooms.ts
- [ ] T015 [US2] Add test cases for startGame validation and word masking in backend/src/services/roomStore.test.ts
- [ ] T016 [US2] Add startGame method to frontend/src/services/api.ts and frontend/src/state/roomStore.ts
- [ ] T017 [US2] Add automatic redirect to GamePage when room status changes to playing in frontend/src/pages/LobbyPage.tsx
- [ ] T018 [US2] Display drawer role, name, and secret word (drawer-only) in frontend/src/pages/GamePage.tsx

**Checkpoint**: User Stories 1 and 2 work independently.

---

## Phase 5: User Story 3 - Scenario 3: Gameplay Interaction (Priority: P3)
**Goal**: Implement interactive canvas, vector line drawing, canvas clear, guess submission with trimming validation, and scoring.
**Independent Test**: Draw on host screen, verify synced to guest, submit correct guess and verify round ends with 100 points scored.

### Implementation for User Story 3
- [ ] T019 [US3] Implement submitDraw logic in backend/src/services/roomStore.ts and mount POST /rooms/:code/draw route in backend/src/api/rooms.ts
- [ ] T020 [US3] Implement submitGuess logic with scoring (correct guess ends round) in backend/src/services/roomStore.ts and mount POST /rooms/:code/guess route in backend/src/api/rooms.ts
- [ ] T021 [US3] Add test cases for draw and guess logic in backend/src/services/roomStore.test.ts
- [ ] T022 [US3] Add submitDraw and submitGuess methods to frontend/src/services/api.ts and frontend/src/state/roomStore.ts
- [ ] T023 [US3] Build interactive painting canvas component and clear button in frontend/src/pages/GamePage.tsx
- [ ] T024 [US3] Add automatic 2s polling in frontend/src/pages/GamePage.tsx to sync canvas and guesses
- [ ] T025 [US3] Connect Scoreboard.tsx and ResultPanel.tsx to display scores and guess logs in frontend/src/pages/GamePage.tsx

**Checkpoint**: All core drawing, guessing, and scoring interactions are complete.

---

## Phase 6: User Story 4 - Scenario 4: Result, Restart & Final Validation (Priority: P4)
**Goal**: Implement result display, host-only restart, state reset, and lobby redirect.
**Independent Test**: Complete a game, verify result overlay, click restart in host tab, verify both tabs return to lobby.

### Implementation for User Story 4
- [ ] T026 [US4] Reveal secretWord to everyone in toRoomSnapshot when status is result in backend/src/services/roomStore.ts
- [ ] T027 [US4] Implement restartRoom service method in backend/src/services/roomStore.ts and mount POST /rooms/:code/restart route in backend/src/api/rooms.ts
- [ ] T028 [US4] Add test cases for restart logic in backend/src/services/roomStore.test.ts
- [ ] T029 [US4] Add restartRoom store action in frontend/src/state/roomStore.ts
- [ ] T030 [US4] Add redirect to LobbyPage when room status transitions to lobby in frontend/src/pages/GamePage.tsx
- [ ] T031 [US4] Render result panel with scores, revealed word, and host-restricted restart button in frontend/src/pages/GamePage.tsx
- [ ] T032 [US4] Run full backend/frontend test suites and execute end-to-end happy path validation in browser

**Checkpoint**: Full round lifecycle is completed and verified.

---

## Phase 7: Polish & Cross-Cutting Concerns
**Purpose**: Final project cleanup and compilation checks
- [ ] T033 Run build validation in backend/ and frontend/
- [ ] T034 Update project documentation and compile a reflection report in reflection.md

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational (Phase 2) completion. Executed sequentially in priority order (P1 → P2 → P3 → P4).
- **Polish (Phase 7)**: Depends on all user stories completion.

### Within Each User Story
- Service methods before API endpoints.
- Backend logic before frontend pages.
- Manual verification before moving to the next story.
