# Tasks: Result, Restart & Final Validation

**Input**: Design documents from `/specs/004-result-restart-validation/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Verify result API endpoints configuration in `backend/src/api/router.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T002 Update room types to support `"results"` status in `backend/src/models/game.ts`

---

## Phase 3: User Story 1 - Round End Results Display (Priority: P1) 🎯 MVP

**Goal**: Display unmasked secret word, final scores, and complete guess history

**Independent Test**: Transition game to results state, verify drawer and guessers see unmasked word and scoreboard list.

### Implementation for User Story 1

- [ ] T003 [US1] Create endpoint to end round and transition state to results in `backend/src/api/rooms.ts`
- [ ] T004 [US1] Expose unmasked word in results state in `toRoomSnapshot` in `backend/src/services/roomStore.ts`
- [ ] T005 [P] [US1] Create game results page in `frontend/src/pages/ResultsPage.tsx`
- [ ] T006 [US1] Support redirection on status transition to results in `frontend/src/pages/GamePage.tsx`

---

## Phase 4: User Story 2 - Host Restart to Lobby (Priority: P1)

**Goal**: Host restarts game, returning players to lobby with reset scores

**Independent Test**: Host restarts, and all clients are redirected to the lobby with scores reset to 0.

### Implementation for User Story 2

- [ ] T007 [US2] Create restart game route endpoint in `backend/src/api/rooms.ts`
- [ ] T008 [US2] Implement restart and room clean state logic in `backend/src/services/roomStore.ts`
- [ ] T009 [P] [US2] Add restart button for host in results view in `frontend/src/pages/ResultsPage.tsx`
- [ ] T010 [US2] Setup lobby polling redirection in `frontend/src/pages/ResultsPage.tsx`

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T011 Run quickstart.md validation scenario checks.
