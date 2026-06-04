# Tasks: Scribble Multiplayer Game

**Input**: Design documents from `speckit/`

---

# Phase 1: Discovery & Artifacts

## Purpose

Complete analysis and planning before implementation.

* [ ] T001 Create discovery notes
* [ ] T002 Create constitution
* [ ] T003 Create specification
* [ ] T004 Create implementation plan

**Checkpoint**: Discovery and planning complete

---

# Phase 2: Foundation

## Purpose

Core room and game state updates required by all scenarios.

* [ ] T005 Extend Room model with host tracking
* [ ] T006 Extend Room model with game state
* [ ] T007 Add drawer assignment support
* [ ] T008 Add deterministic word selection support
* [ ] T009 Add score tracking support
* [ ] T010 Add guess history support
* [ ] T011 Add drawing state support

**Checkpoint**: Shared game model ready

---

# Phase 3: User Story 1 - Room Setup & Lobby (P1)

## Goal

Support room creation, joining, polling, and host-only game start.

## Independent Test

Create a room, join from a second browser, verify polling updates, and verify only the host can start.

### Implementation

* [ ] T012 [US1] Assign room creator as host
* [ ] T013 [US1] Validate room codes during join
* [ ] T014 [US1] Display validation errors for invalid room codes
* [ ] T015 [US1] Add automatic lobby polling (~2 seconds)
* [ ] T016 [US1] Restrict game start to host
* [ ] T017 [US1] Require minimum two players before game start
* [ ] T018 [US1] Verify room isolation across multiple rooms

**Checkpoint**: User Story 1 independently testable

---

# Phase 4: User Story 2 - Game Start & Drawer Flow (P2)

## Goal

Support game start, drawer assignment, and secret word visibility.

## Independent Test

Start a game and verify drawer assignment and drawer-only word visibility.

### Implementation

* [ ] T019 [US2] Trim player names during create and join flows
* [ ] T020 [US2] Reject empty player names
* [ ] T021 [US2] Assign host as drawer
* [ ] T022 [US2] Select deterministic secret word
* [ ] T023 [US2] Display drawer identity in game screen
* [ ] T024 [US2] Display secret word to drawer only
* [ ] T025 [US2] Hide secret word from guessers

**Checkpoint**: User Story 2 independently testable

---

# Phase 5: User Story 3 - Gameplay Interaction (P3)

## Goal

Support drawing, guessing, scoring, and synchronized history.

## Independent Test

Draw, submit guesses, verify synchronization, and validate scoring.

### Implementation

* [ ] T026 [US3] Implement drawing canvas interaction
* [ ] T027 [US3] Persist drawing state in room
* [ ] T028 [US3] Implement clear canvas action
* [ ] T029 [US3] Implement guess submission
* [ ] T030 [US3] Trim guesses before validation
* [ ] T031 [US3] Reject empty guesses
* [ ] T032 [US3] Implement case-insensitive word comparison
* [ ] T033 [US3] Store synchronized guess history
* [ ] T034 [US3] Award 100 points for correct guesses
* [ ] T035 [US3] Award 0 points for incorrect guesses
* [ ] T036 [US3] Display synchronized guess history through polling

**Checkpoint**: User Story 3 independently testable

---

# Phase 6: User Story 4 - Result & Restart (P4)

## Goal

Display results and support restart flow.

## Independent Test

Complete a round, verify results, restart, and return all players to the lobby.

### Implementation

* [ ] T037 [US4] Add result state
* [ ] T038 [US4] Display correct word
* [ ] T039 [US4] Display final scores
* [ ] T040 [US4] Display full guess history
* [ ] T041 [US4] Add restart action
* [ ] T042 [US4] Preserve participants during restart
* [ ] T043 [US4] Clear round state during restart
* [ ] T044 [US4] Return players to lobby

**Checkpoint**: User Story 4 independently testable

---

# Phase 7: Validation & Reflection

## Purpose

Validate acceptance criteria and prepare submission.

* [ ] T045 Validate Scenario 1 using two browser sessions
* [ ] T046 Validate Scenario 2 using two browser sessions
* [ ] T047 Validate Scenario 3 using two browser sessions
* [ ] T048 Validate Scenario 4 using two browser sessions
* [ ] T049 Create reflection report
* [ ] T050 Verify frontend build
* [ ] T051 Verify backend build

**Checkpoint**: Ready for PR submission
