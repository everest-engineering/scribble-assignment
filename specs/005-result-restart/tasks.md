# Tasks: Result & Restart Flow

**Input**: Design documents from `/specs/005-result-restart/`

**Prerequisites**: plan.md, spec.md

**Tests**: Unit tests are included for store transitions, auto-round-termination, scoreboard clearing, and API endpoints.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verification of current codebase status before implementing new features

- [x] T001 Verify existing setup by running dev build of frontend and backend
- [x] T002 Ensure linting and tests pass on existing code

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core model extensions for the `"result"` status

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Extend RoomStatus type in [backend/src/models/game.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/models/game.ts) and RoomSnapshot["status"] type in [frontend/src/services/api.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/services/api.ts) to support `"result"`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Shared Result State (Priority: P1)

**Goal**: Render round results showing scoreboard, guess history, and correct word when round ends or when host ends it.

**Independent Test**: Host starts game, guest submits correct guess. Host clicks "End Round". Verify both host and guest transition to a result screen showing the secret word "rocket", guest's score as 100, and the guess log.

### Implementation for User Story 1

- [x] T004 [P] [US1] Implement `endRound` room state update and write unit tests in [backend/src/services/roomStore.test.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.test.ts) and [backend/src/services/roomStore.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.ts)
- [x] T005 [P] [US1] Implement auto-ending logic in `submitGuess` (transition to `"result"` when all guessers guess correctly) and write unit tests in [backend/src/services/roomStore.test.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.test.ts) and [backend/src/services/roomStore.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.ts)
- [x] T006 [US1] Add `POST /api/rooms/:code/end` endpoint in [backend/src/api/rooms.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/api/rooms.ts)
- [x] T007 [US1] Expose `secretWord` on the snapshot mapping for all roles when status is `"result"` in [backend/src/services/roomStore.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.ts)
- [x] T008 [US1] Expose `endRound` API endpoint call in [frontend/src/services/api.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/services/api.ts)
- [x] T009 [US1] Mount "End Round" button for Host when game is active, and build Results dashboard layout when room status is `"result"` in [frontend/src/pages/GamePage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/GamePage.tsx)

**Checkpoint**: Game round ends manually or automatically, transitioning all players to a shared results dashboard revealing the correct word.

---

## Phase 4: User Story 2 - Clean Restart to Lobby (Priority: P1)

**Goal**: Host triggers restart, status resets to lobby, player scores and roles reset, round data is cleared, and all players redirect to Lobby.

**Independent Test**: From the results view, Host clicks "Restart Game". Confirm both host and guest automatically navigate back to the Lobby Page, their roles and scores are cleared, and the start button is enabled again.

### Implementation for User Story 2

- [x] T010 [P] [US2] Implement `restartGame` room cleanup and write unit tests in [backend/src/services/roomStore.test.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.test.ts) and [backend/src/services/roomStore.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.ts)
- [x] T011 [US2] Add `POST /api/rooms/:code/restart` endpoint in [backend/src/api/rooms.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/api/rooms.ts)
- [x] T012 [US2] Expose `restartGame` API endpoint call in [frontend/src/services/api.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/services/api.ts)
- [x] T013 [US2] Render "Restart Game" button for Host and waiting indicator for guests on results dashboard in [frontend/src/pages/GamePage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/GamePage.tsx)
- [x] T014 [US2] Add redirect effect on GamePage to navigate back to `/lobby` if room status becomes `"lobby"` in [frontend/src/pages/GamePage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/GamePage.tsx)

**Checkpoint**: Host triggers restart, status resets to lobby, player scores/roles clear, and all clients redirect back to Lobby.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: General codebase formatting, type-safety, and validation check

- [x] T015 Code cleanup, formatting, and linting checks across modified files
- [x] T016 Complete full manual verification walkthrough using multiple tabs/browsers

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed sequentially (US1 → US2)
- **Polish (Final Phase)**: Depends on all desired user stories being complete
