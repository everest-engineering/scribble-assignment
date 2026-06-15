# Tasks: Scribble Gameplay Core

**Input**: Design documents from `/specs/001-scribble-gameplay/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 [P] Initialize the feature documentation structure in `specs/001-scribble-gameplay/`
- [ ] T002 [P] Confirm backend and frontend package dependencies are installed in `backend/package.json` and `frontend/package.json`
- [ ] T003 [P] Validate the existing REST API and React routing structure in `backend/src/api/rooms.ts` and `frontend/src/routes/index.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T004 Implement backend room lifecycle validation in `backend/src/api/schemas.ts`
- [X] T005 [P] Add typed room and participant models for gameplay state in `backend/src/models/game.ts`
- [X] T006 [P] Extend the room store service to support snapshot projection and room saves in `backend/src/services/roomStore.ts`
- [X] T007 [P] Add frontend room session and polling state support in `frontend/src/state/roomStore.ts`
- [X] T008 [P] Add room snapshot request handling in `frontend/src/services/api.ts`

---

## Phase 3: User Story 1 - Room setup, lobby, and host control (Priority: P1)

**Goal**: Support room creation, joining, lobby refresh, host-only start, and invalid code handling.

**Independent Test**: Create a room with one player, join from a second player, refresh the lobby, and verify host start restrictions.

- [X] T009 [US1] Add room host assignment and participant metadata to `backend/src/services/roomStore.ts`
- [X] T010 [US1] Add new `POST /rooms/:code/start` route in `backend/src/api/rooms.ts`
- [X] T011 [US1] Add host-only game start validation to `backend/src/api/rooms.ts`
- [X] T012 [US1] Update `backend/src/api/schemas.ts` to validate `participantId` for start requests
- [X] T013 [US1] Update `frontend/src/pages/LobbyPage.tsx` to disable the Start button for non-host viewers and show a host-only start message
- [X] T014 [US1] Add polling-based lobby refresh to `frontend/src/pages/LobbyPage.tsx` via `roomStore.fetchRoom()`
- [X] T015 [US1] Add invalid room code and join validation handling in `frontend/src/pages/JoinRoomPage.tsx`
- [X] T016 [US1] Create a lobby error display path for refresh and start failure in `frontend/src/pages/LobbyPage.tsx`

---

## Phase 4: User Story 2 - Game start, drawer assignment, and secret word visibility (Priority: P1)

**Goal**: Assign the drawer, choose a deterministic secret word, and hide the word from guessers.

**Independent Test**: Start a game with two players and verify drawer role and word visibility.

- [X] T017 [US2] Add deterministic word selection logic to `backend/src/services/roomStore.ts`
- [X] T018 [US2] Add round state and drawer assignment to `backend/src/models/game.ts`
- [X] T019 [US2] Update `backend/src/services/roomStore.ts` to initialize game round data on start
- [X] T020 [US2] Extend `backend/src/services/roomStore.ts` `toRoomSnapshot()` to hide the secret word from non-drawers
- [X] T021 [US2] Update `frontend/src/pages/GamePage.tsx` to display the secret word only for the drawer and show a role indicator
- [X] T022 [US2] Add player name trimming and validation to `frontend/src/pages/CreateRoomPage.tsx` and `frontend/src/pages/JoinRoomPage.tsx`

---

## Phase 5: User Story 3 - Drawing interaction, guess submission, and synced history (Priority: P2)

**Goal**: Enable guess submission, canvas clearing, normalized hint comparison, and shared guess history.

**Independent Test**: Submit guesses from one player and verify normalized guesses, correct scoring, and shared history across sessions.

- [ ] T023 [US3] Add guess entity and scoring logic to `backend/src/models/game.ts`
- [ ] T024 [US3] Add `POST /rooms/:code/guess` route in `backend/src/api/rooms.ts`
- [ ] T025 [US3] Implement guess validation and scoring in `backend/src/services/roomStore.ts`
- [ ] T026 [US3] Add `POST /rooms/:code/clear-canvas` route in `backend/src/api/rooms.ts`
- [ ] T027 [US3] Add canvas clear state to `backend/src/models/game.ts` and `backend/src/services/roomStore.ts`
- [ ] T028 [US3] Extend `frontend/src/components/GuessForm.tsx` to submit guesses through the room store
- [ ] T029 [US3] Update `frontend/src/pages/GamePage.tsx` and `frontend/src/components/Scoreboard.tsx` to render guess history and scores from snapshot data

---

## Phase 6: User Story 4 - Round results and restart flow (Priority: P3)

**Goal**: Display final results and allow the host to restart the room while preserving players.

**Independent Test**: End a round, view results in both sessions, restart as host, and confirm the room resets to lobby state.

- [ ] T030 [US4] Add `POST /rooms/:code/restart` route in `backend/src/api/rooms.ts`
- [ ] T031 [US4] Implement restart state reset in `backend/src/services/roomStore.ts`
- [ ] T032 [US4] Extend `backend/src/services/roomStore.ts` `toRoomSnapshot()` with `canRestartGame` metadata
- [ ] T033 [US4] Update `frontend/src/components/ResultPanel.tsx` to render final word, scores, and guess history with a restart button for the host
- [ ] T034 [US4] Add restart handling in `frontend/src/pages/GamePage.tsx` and `frontend/src/state/roomStore.ts`
- [ ] T035 [US4] Ensure restart returns all players to the lobby with no active round state in `frontend/src/state/roomStore.ts`

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T036 [P] Add or update backend tests for room lifecycle, start validation, guess scoring, and restart in `backend/src/services/roomStore.test.ts`
- [ ] T037 [P] Add or update frontend tests for room navigation, name validation, polling, and guess submission in `frontend/src/services/api.test.ts`
- [ ] T038 [P] Update `README.md` or feature docs with any implemented behavior changes and polling expectations
- [ ] T039 [P] Clean up temporary placeholders and ensure UI copy matches the game state in `frontend/src/pages/LobbyPage.tsx`, `frontend/src/pages/GamePage.tsx`, and `frontend/src/pages/JoinRoomPage.tsx`
- [ ] T040 [P] Verify the feature against the user scenarios in `specs/001-scribble-gameplay/spec.md` using two browser tabs

---

## Dependencies & Execution Order

- Phase 1: Setup can begin immediately.
- Phase 2: Foundational must complete before any story work.
- Phase 3: US1 begins after foundational work and can be demoed independently.
- Phase 4: US2 relies on room start and drawer state from US1.
- Phase 5: US3 relies on active round state and game start from US2.
- Phase 6: US4 relies on result state from US3.
- Phase 7: Polish depends on completed story implementation and validation.

## Parallel Execution Opportunities

- `T004`, `T005`, `T006`, `T007`, `T008` can be worked in parallel because they touch distinct backend and frontend files.
- UI tasks for Create/Join pages and room polling (`T013`, `T015`, `T016`, `T021`, `T022`) can be developed concurrently with backend route additions once the contracts are stable.
- Test tasks `T036` and `T037` can run in parallel after their corresponding implementation tasks are complete.

## Suggested MVP

- MVP: Complete US1 and US2, including lobby setup, host-controlled game start, drawer assignment, and hidden word visibility.
- Remaining work (`US3` and `US4`) adds gameplay interaction and restart flow after the MVP is validated.
