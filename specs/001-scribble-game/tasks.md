# Tasks: Scribble Game Completion

**Input**: Design documents from `/specs/001-scribble-game/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rest-api.md, quickstart.md

**Tests**: Required where practical by the Scribble Assignment Constitution. Test tasks appear before implementation tasks they validate. Manual two-browser validation is included for multiplayer acceptance criteria.

**Organization**: Tasks are grouped by setup/foundation and then by the four required assignment scenarios.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other tasks that touch different files and do not depend on incomplete work
- **[Story]**: Maps to the user stories in [spec.md](./spec.md)
- Each task lists exact files to create or modify

## Phase 1: Setup

**Purpose**: Verify starter commands and align documentation for the active feature.

- [X] T001 Verify backend and frontend package scripts, test commands, and build commands in `backend/package.json`, `frontend/package.json`, and `README.md`
- [X] T002 [P] Add assignment validation report scaffold in `docs/spec-kit/validation-notes.md`
- [X] T003 [P] Add reflection report scaffold in `docs/reflection.md`

**Checkpoint**: Starter scripts and documentation locations are known before behavior changes.

## Phase 2: Foundation

**Purpose**: Extend shared types, validation schemas, and API/client contracts required by all scenarios.

- [X] T004 [P] Extend room, participant, round, drawing, guess, score, and viewer-specific snapshot types in `backend/src/models/game.ts` and `frontend/src/services/api.ts`
- [X] T005 [P] Add Zod schemas for validated player names, room codes, participant actions, drawing updates, guesses, start, and restart in `backend/src/api/schemas.ts`
- [X] T006 [P] Add schema validation tests for player names, room codes, action payloads, and guesses in `backend/src/api/schemas.test.ts`
- [X] T007 Add shared room-store helpers for participant lookup, host checks, viewer-specific snapshots, isolated room reset, and deterministic word selection in `backend/src/services/roomStore.ts`
- [X] T008 Extend frontend room store actions for start, drawing update, clear drawing, submit guess, restart, and polling-safe fetches in `frontend/src/state/roomStore.ts` and `frontend/src/services/api.ts`

**Checkpoint**: Shared models and contracts can support every scenario without adding out-of-scope infrastructure.

## Phase 3: User Story 1 - Host and Join a Lobby (Priority: P1)

**Goal**: Players can create/join rooms with validation, host tracking, room isolation, automatic lobby polling, and host-only start preconditions.

**Independent Test**: Two sessions can join one room, see participant updates through polling, and verify separate rooms remain isolated.

- [X] T009 [P] [US1] Add backend tests for create-room host assignment, empty-name rejection, join validation, unknown-room rejection, room isolation, and host-only start preconditions in `backend/src/services/roomStore.test.ts`
- [X] T010 [P] [US1] Add frontend API and room-store tests for create/join errors, polling fetch behavior, and start-game action shape in `frontend/src/services/api.test.ts` and `frontend/src/state/roomStore.test.ts`
- [X] T011 [US1] Implement validated create/join, host tracking, isolated snapshots, and start precondition service logic in `backend/src/services/roomStore.ts`
- [X] T012 [US1] Add start-game route and connect validation/error handling in `backend/src/api/rooms.ts` and `backend/src/api/router.ts`
- [X] T013 [US1] Update create/join forms to show validation feedback and prevent whitespace-only names in `frontend/src/pages/CreateRoomPage.tsx` and `frontend/src/pages/JoinRoomPage.tsx`
- [X] T014 [US1] Add lobby polling, host badge, participant count, and host-only start button behavior in `frontend/src/pages/LobbyPage.tsx`
- [X] T015 [US1] Record scenario 1 validation notes in `docs/spec-kit/validation-notes.md`

**Checkpoint**: Scenario 1 acceptance criteria and SC-001, SC-002, and SC-003 pass.

## Phase 4: User Story 2 - Start the Game and Assign Drawer (Priority: P2)

**Goal**: Host starts an active round with initialized scores, deterministic word selection, drawer assignment, and role-specific word visibility.

**Independent Test**: Host starts the game; all players enter active state; only the drawer sees the word.

- [X] T016 [P] [US2] Add backend tests for active state transition, score initialization, drawer assignment, deterministic word, and viewer-specific secret word visibility in `backend/src/services/roomStore.test.ts`
- [X] T017 [P] [US2] Add frontend tests for active game role display and drawer-only word rendering in `frontend/src/pages/GamePage.test.tsx`
- [X] T018 [US2] Implement start-game state transition, score initialization, drawer assignment, deterministic word selection, and secret-word filtering in `backend/src/services/roomStore.ts`
- [X] T019 [US2] Update frontend navigation and game page state handling for lobby-to-active transition in `frontend/src/pages/LobbyPage.tsx`, `frontend/src/pages/GamePage.tsx`, and `frontend/src/state/roomStore.ts`
- [X] T020 [US2] Render player role, drawer identity, and drawer-only secret word messaging in `frontend/src/pages/GamePage.tsx`
- [X] T021 [US2] Record scenario 2 validation notes in `docs/spec-kit/validation-notes.md`

**Checkpoint**: Scenario 2 acceptance criteria and SC-004 pass without regressing US1.

## Phase 5: User Story 3 - Draw and Guess During Gameplay (Priority: P3)

**Goal**: Drawer can draw/clear while guessers submit guesses; drawing, guesses, and scores sync through polling.

**Independent Test**: Drawer drawing and clear actions sync; empty guesses are rejected; incorrect and correct guesses update history and scores.

- [ ] T022 [P] [US3] Add backend tests for drawer-only drawing updates, clear drawing, guess validation, drawer-guess rejection, incorrect guesses, correct guesses, scoring, and result transition in `backend/src/services/roomStore.test.ts`
- [ ] T023 [P] [US3] Add frontend tests for drawing controls, guess form validation, guess history, and score rendering in `frontend/src/pages/GamePage.test.tsx`, `frontend/src/components/GuessForm.test.tsx`, and `frontend/src/components/Scoreboard.test.tsx`
- [ ] T024 [US3] Implement drawing update, clear drawing, submit guess, score update, and result transition service logic in `backend/src/services/roomStore.ts`
- [ ] T025 [US3] Add drawing, clear, and guess routes in `backend/src/api/rooms.ts`
- [ ] T026 [US3] Implement API client and room-store methods for drawing, clear, and guesses in `frontend/src/services/api.ts` and `frontend/src/state/roomStore.ts`
- [ ] T027 [US3] Replace placeholder canvas with drawer-only interactive drawing and clear controls in `frontend/src/pages/GamePage.tsx` and `frontend/src/styles/app.css`
- [ ] T028 [US3] Implement guess form submission, feedback, synced history, and score display in `frontend/src/components/GuessForm.tsx`, `frontend/src/components/Scoreboard.tsx`, and `frontend/src/pages/GamePage.tsx`
- [ ] T029 [US3] Record scenario 3 validation notes in `docs/spec-kit/validation-notes.md`

**Checkpoint**: Scenario 3 acceptance criteria and SC-005 and SC-006 pass without regressing US1-US2.

## Phase 6: User Story 4 - Show Results and Restart (Priority: P4)

**Goal**: Correct guess produces shared result state, and host restart returns all players to lobby with participants preserved and round state cleared.

**Independent Test**: Result shows word, scores, and history to all players; only host can restart; restart resets round state.

- [ ] T030 [P] [US4] Add backend tests for result snapshot contents, host-only restart, non-host restart rejection, restart state reset, and participant preservation in `backend/src/services/roomStore.test.ts`
- [ ] T031 [P] [US4] Add frontend tests for result panel rendering and host-only restart UI in `frontend/src/components/ResultPanel.test.tsx` and `frontend/src/pages/GamePage.test.tsx`
- [ ] T032 [US4] Implement restart service logic and route handling in `backend/src/services/roomStore.ts` and `backend/src/api/rooms.ts`
- [ ] T033 [US4] Render result state, final scores, full guess history, and host-only restart action in `frontend/src/components/ResultPanel.tsx`, `frontend/src/components/Scoreboard.tsx`, and `frontend/src/pages/GamePage.tsx`
- [ ] T034 [US4] Add restart client/store methods and lobby transition handling in `frontend/src/services/api.ts`, `frontend/src/state/roomStore.ts`, and `frontend/src/pages/GamePage.tsx`
- [ ] T035 [US4] Record scenario 4 validation notes in `docs/spec-kit/validation-notes.md`

**Checkpoint**: Scenario 4 acceptance criteria and SC-007 and SC-008 pass without regressing US1-US3.

## Phase 7: Polish and Final Validation

**Purpose**: Complete assignment evidence and final checks.

- [ ] T036 Run backend tests and build, then record results in `docs/spec-kit/validation-notes.md`
- [ ] T037 Run frontend tests and build, then record results in `docs/spec-kit/validation-notes.md`
- [ ] T038 Execute the manual two-browser validation from `specs/001-scribble-game/quickstart.md` and record pass/fail notes in `docs/spec-kit/validation-notes.md`
- [ ] T039 Complete reflection report covering starter behavior, added behavior, AI usage, tradeoffs, validation, and remaining limitations in `docs/reflection.md`
- [ ] T040 Review spec, plan, tasks, code, validation notes, and reflection for alignment before PR in `specs/001-scribble-game/spec.md`, `specs/001-scribble-game/plan.md`, `specs/001-scribble-game/tasks.md`, `docs/spec-kit/validation-notes.md`, and `docs/reflection.md`

## Dependencies & Execution Order

### Task Dependencies

```text
T001 -> T004
T002, T003 -> T015, T021, T029, T035, T039
T004, T005, T006 -> T007
T007 -> T008
T008 -> T009-T015
T009, T010 -> T011
T011 -> T012
T012 -> T013, T014
T015 -> T016-T021
T016, T017 -> T018
T018 -> T019, T020
T021 -> T022-T029
T022, T023 -> T024
T024 -> T025, T026
T025, T026 -> T027, T028
T029 -> T030-T035
T030, T031 -> T032
T032 -> T033, T034
T035 -> T036-T040
```

### Parallel Opportunities

- T002 and T003 can run in parallel with setup verification.
- T004, T005, and T006 touch different files and can be prepared in parallel.
- Test tasks marked [P] in each user story can be written in parallel before implementation.
- Frontend and backend implementation tasks can proceed in parallel only after the shared model and contract for that slice is stable.

## Implementation Strategy

### MVP First

1. Complete T001-T015.
2. Validate room setup and lobby with two tabs.
3. Commit scenario 1 before starting game logic.

### Incremental Delivery

1. Deliver room setup and lobby.
2. Add game start and drawer flow.
3. Add drawing, guesses, history, and scoring.
4. Add result, restart, validation notes, and reflection.

### Review Discipline

- Implement from the next unchecked task range in this file.
- Mark tasks complete as they are finished.
- Commit after each coherent checkpoint.
- If behavior changes from the spec, update `spec.md`, then update plan/tasks before continuing.
