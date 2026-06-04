# Tasks: Round End and Game Restart

**Input**: Design documents from `/.specify/specs/004-game-end-restart/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Vitest unit and integration tests are required as per Principle VI and the feature specification.

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

- [X] T001 Verify project structure and branch `004-game-end-restart`
- [X] T002 Update `GEMINI.md` to point to the current implementation plan (already completed)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [X] T003 [P] Add `RoomStatus` 'ended' and reveal logic in `backend/src/models/game.ts`
- [X] T004 [P] Update `toRoomSnapshot` in `backend/src/services/roomStore.ts` to reveal `currentWord` when status is 'ended'
- [X] T005 [P] Implement `endGame(code, participantId)` logic in `backend/src/services/roomStore.ts` (checks if participant is host, sets status)
- [X] T006 [P] Implement `restartGame(code, participantId)` logic in `backend/src/services/roomStore.ts` (checks host, clears state per data-model.md, resets scoreboard)
- [X] T007 Add `end` and `restart` endpoints to `backend/src/api/rooms.ts` with 400 guards for invalid state transitions
- [X] T008 [P] Add `endGame` and `restartGame` methods to `frontend/src/services/api.ts`
- [X] T009 [P] Expose `endGame` and `restartGame` in `frontend/src/state/roomStore.ts`
- [X] T010 [P] Add toast notification logic for host action failures in `frontend/src/state/roomStore.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 5 - Automatic Round Completion (Priority: P1) 🎯 MVP

**Goal**: The system automatically ends the round once all active guessers have identified the secret word.

**Independent Test**: Have all guessers submit the correct word and verify the round status transitions to 'ended' immediately.

### Tests for User Story 5

- [X] T011 [P] [US5] Add unit test for automatic completion logic and "no-end-on-churn" rule in `backend/src/services/roomStore.test.ts`
- [X] T012 [US5] Add integration test for automatic completion via guess endpoint in `backend/src/api/rooms.test.ts`

### Implementation for User Story 5

- [X] T013 [US5] Implement automatic completion check in `POST /:code/guess` handler in `backend/src/api/rooms.ts` using the "Active Guessers" definition

---

## Phase 4: User Story 1 - Round Results Visibility (Priority: P1)

**Goal**: All players see the correct word, final scores, and full guess history when the round ends via a modal.

**Independent Test**: End a round and verify the `RoundEndedModal` appears with all required content and 200px height constraints.

### Tests for User Story 1

- [X] T014 [P] [US1] Add unit tests for `RoundEndedModal` rendering in `frontend/src/components/RoundEndedModal.test.tsx`
- [X] T015 [US1] Add integration test for modal visibility in `frontend/src/pages/GamePage.test.tsx`

### Implementation for User Story 1

- [X] T016 [P] [US1] Create `frontend/src/components/RoundEndedModal.tsx` with vertical stack layout (Title, Word, Scores, History, Footer)
- [X] T017 [US1] Integrate `RoundEndedModal` into `frontend/src/pages/GamePage.tsx` based on `room.status === 'ended'`
- [X] T018 [P] [US1] Apply `panel`, `card`, and 200px max-height styling to the modal in `frontend/src/styles/app.css`

---

## Phase 5: User Story 4 - Manual Round Termination (Priority: P2)

**Goal**: The host can manually end a round at any time via a button beside "Exit Game".

**Independent Test**: Host clicks "End Round" and verify round transitions to results; verify non-hosts don't see the button.

### Tests for User Story 4

- [X] T019 [P] [US4] Add unit test for `endGame` host check in `backend/src/services/roomStore.test.ts`
- [X] T020 [US4] Add integration test for manual end round endpoint in `backend/src/api/rooms.test.ts`

### Implementation for User Story 4

- [X] T021 [US4] Render "End Round" button inside the `.button-row` beside "Exit Game" in `frontend/src/pages/GamePage.tsx` (Host only, `button--secondary` style)
- [X] T022 [US4] Implement `handleEndRound` action in `frontend/src/pages/GamePage.tsx` with toast error handling

---

## Phase 6: User Story 2 & 3 - Host Game Restart & Role-Based Actions (Priority: P1/P2)

**Goal**: Host can transition the room back to the lobby; system auto-navigates all players to `/lobby`.

**Independent Test**: Host clicks "Restart Game" on results screen and verify everyone is redirected to lobby with 0 scores (Verify SC-003: < 1s perception).

### Tests for User Stories 2 & 3

- [X] T023 [P] [US2] Add unit test for state clearing and scoreboard reset in `backend/src/services/roomStore.test.ts`
- [X] T024 [US2] Add integration test for restart endpoint in `backend/src/api/rooms.test.ts` (Verify latency < 1s)

### Implementation for User Stories 2 & 3

- [X] T025 [US2] Add "Restart Game" button to `RoundEndedModal.tsx` footer (Host only)
- [X] T026 [US2] Add "Waiting for host to restart..." message to `RoundEndedModal.tsx` footer (Non-hosts)
- [X] T027 [US2] Implement `handleRestart` in `RoundEndedModal.tsx` with toast error handling
- [X] T028 [US2] Implement automatic navigation to `/lobby` in `frontend/src/pages/GamePage.tsx` when room status transitions to 'lobby'

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and styling consistency

- [X] T029 [P] Verify 90% code coverage for new logic in `backend/` and `frontend/`
- [X] T030 [P] Ensure all new UI strictly matches `panel` and `card` styles in `frontend/src/styles/app.css`
- [X] T031 Run `quickstart.md` validation loop including churn edge cases

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup & Foundational (Phases 1-2)**: MUST be completed first.
- **User Stories (Phases 3-6)**: 
  - US5 (Automatic Completion) is the backend MVP.
  - US1 (Visibility) is the frontend MVP.
  - US4 and US2/3 build on the 'ended' state.
- **Polish (Final Phase)**: After all stories are verified.

### User Story Dependencies

- **US5 (P1)**: Foundation -> Backend Logic.
- **US1 (P1)**: Foundation -> Frontend Modal.
- **US4 (P2)**: US1 -> Host End Control.
- **US2/3 (P1/P2)**: US1 -> Host Restart Control + Auto-Navigation.

### Parallel Opportunities

- Backend (T003-T007) and Frontend (T008-T010) foundational work.
- US5 (Backend) and US1 (Frontend) implementation.
- All unit tests marked [P] across different stories.

---

## Implementation Strategy

### MVP First (Automatic End & Results visibility)

1. Complete Foundation.
2. Implement US5 (Backend auto-end).
3. Implement US1 (Frontend results modal).
4. **STOP and VALIDATE**: Final guess triggers modal showing correct word and scores.

### Incremental Delivery

1. Add US4 (Manual End) -> Test host control.
2. Add US2/3 (Restart) -> Test full game loop and auto-navigation.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Verify tests fail before implementing
- Commit after each task or logical group
