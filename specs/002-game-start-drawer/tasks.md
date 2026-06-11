---
description: "Task list for Game Start & Drawer Flow feature"
---

# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `specs/002-game-start-drawer/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks are included per constitution requirement (Test-First, NON-NEGOTIABLE).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Read and document existing Round data model placeholder in `backend/src/models/game.ts`
- [X] T002 Read and document existing frontend room store pattern in `frontend/src/state/roomStore.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data model changes that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Add `Round` type (roundNumber, drawerId, secretWord) and `rounds` array to `Room` in `backend/src/models/game.ts`
- [X] T004 [P] Add round fields (roundNumber, drawerId, yourRole, wordForDrawer, wordLength) to `RoomSnapshot` in `backend/src/models/game.ts`
- [X] T005 [P] Implement `selectWord()` utility function for deterministic word selection in `backend/src/services/wordService.ts` (pure function, hash of roomCode + roundNumber mod word list)
- [X] T006 [P] Add round fields to frontend `RoomSnapshot` type in `frontend/src/services/api.ts`
- [X] T007 Update backend type exports and re-export from `backend/src/models/game.ts`

**Checkpoint**: Foundation ready — Round type, word selection, and snapshot shape defined

---

## Phase 3: User Story 1 - First Round Begins with Drawer Assignment (Priority: P1) 🎯 MVP

**Goal**: When a game transitions from lobby to playing, the first round starts. The host is assigned as drawer, all others as guessers. The drawer identity is visible to all participants.

**Independent Test**: Create a room with 2+ participants, start the game. Verify every participant's screen shows the same drawer identity within 3 seconds.

### Tests for User Story 1 ⚠️

> **NOTE**: Write these tests FIRST, ensure they FAIL before implementation

- [X] T008 [P] [US1] Unit test: startGame creates first round with host as drawer in `backend/src/services/roomStore.test.ts`
- [X] T009 [P] [US1] Unit test: toRoomSnapshot returns drawerId visible to all participants in `backend/src/services/roomStore.test.ts`
- [X] T010 [P] [US1] Unit test: toRoomSnapshot returns yourRole correctly per participant in `backend/src/services/roomStore.test.ts`

### Implementation for User Story 1

- [X] T011 [US1] Extend `startGame()` to create a Round with host as drawerId and append to room.rounds in `backend/src/services/roomStore.ts`
- [X] T012 [P] [US1] Extend `toRoomSnapshot()` to return roundNumber, drawerId, yourRole (computed from viewerParticipantId vs drawerId) in `backend/src/services/roomStore.ts`
- [X] T013 [P] [US1] Update frontend `RoomState` interface to include round fields in `frontend/src/state/roomStore.ts`
- [X] T014 [US1] Create minimal `GamePage.tsx` with role-based views in `frontend/src/pages/GamePage.tsx`
- [X] T015 [US1] Wire `/game` route in `frontend/src/App.tsx`

**Checkpoint**: User Story 1 is functional — first round starts, drawer identity visible to all

---

## Phase 4: User Story 2 - Secret Word Selection and Visibility (Priority: P1)

**Goal**: When the first round begins, a secret word is deterministically selected. The drawer sees the word; non-drawers see only the word length.

**Independent Test**: Start a game as host. Verify host's screen shows a word. Verify second participant's screen does not show the word but shows its letter count.

### Tests for User Story 2 ⚠️

- [X] T016 [P] [US2] Unit test: wordForDrawer present for drawer, absent for guessers in `backend/src/services/roomStore.test.ts`
- [X] T017 [P] [US2] Unit test: selectWord returns deterministic results based on roomCode+roundNumber in `backend/src/services/wordService.test.ts`
- [X] T018 [P] [US2] Unit test: wordLength equals secretWord.length in `backend/src/services/roomStore.test.ts`

### Implementation for User Story 2

- [X] T019 [US2] Call `selectWord()` during round creation and store secretWord on the Round in `backend/src/services/roomStore.ts`
- [X] T020 [P] [US2] Implement participant-aware filtering in `toRoomSnapshot()` — include wordForDrawer only when viewer is drawer, always include wordLength in `backend/src/services/roomStore.ts`
- [X] T021 [P] [US2] Display secret word on GamePage drawer view in `frontend/src/pages/GamePage.tsx`
- [X] T022 [P] [US2] Display word length on GamePage guesser view in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: Both user stories complete — full game start flow with word visibility

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T023 [P] Add host-badge and self-identification to GamePage participant list in `frontend/src/pages/GamePage.tsx`
- [X] T024 Run quickstart.md validation scenarios in two browser tabs
- [X] T025 Final review: verify all acceptance scenarios from spec.md pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3-4)**: Both depend on Foundational completion
  - US1 must complete before US2 (word visibility depends on round creation)
- **Polish (Phase 5)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no story dependencies
- **US2 (P1)**: Depends on US1 (word selection happens during round creation)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Models before services
- Services before endpoints/UI
- Story complete before moving to next priority

### Parallel Opportunities

- T004, T005, T006 can run in parallel (different files)
- T008, T009, T010 can run in parallel (test files)
- T012, T013 can run in parallel (backend vs frontend)
- T016, T017, T018 can run in parallel (test files)
- T020, T021, T022 can run in parallel (backend vs frontend)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "T008 [P] [US1] Unit test: startGame creates first round..."
Task: "T009 [P] [US1] Unit test: toRoomSnapshot returns drawerId..."
Task: "T010 [P] [US1] Unit test: toRoomSnapshot returns yourRole..."

# Launch backend + frontend implementation together:
Task: "T012 [P] [US1] Extend toRoomSnapshot()..."
Task: "T013 [P] [US1] Update frontend RoomState interface..."
```

## Parallel Example: User Story 2

```bash
# Launch all tests for User Story 2 together:
Task: "T016 [P] [US2] Unit test: wordForDrawer present/absent..."
Task: "T017 [P] [US2] Unit test: selectWord deterministic..."
Task: "T018 [P] [US2] Unit test: wordLength equals secretWord.length..."

# Launch backend + frontend implementation together:
Task: "T020 [P] [US2] Participant-aware filtering..."
Task: "T021 [P] [US2] Display secret word on GamePage..."
Task: "T022 [P] [US2] Display word length on GamePage..."
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Drawer Assignment + GamePage)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Continue with US2

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 (Drawer Assignment) → Test independently → Deploy/Demo (MVP!)
3. Add US2 (Word Visibility) → Test independently → Deploy/Demo
4. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
