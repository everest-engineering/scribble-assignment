# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `/specs/002-game-start-drawer/`

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

**Purpose**: Project initialization and basic structure

- [x] T001 Configure development environments and run initial server verifies in `backend/package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Verify model structure in `backend/src/models/game.ts`

---

## Phase 3: User Story 1 - Username Trimming & Validation (Priority: P1) 🎯 MVP

**Goal**: Validate and trim player names upon room creation or join

**Independent Test**: Send POST requests with whitespace-only or empty usernames and verify they are rejected with HTTP 400 and appropriate error message.

### Implementation for User Story 1

- [x] T003 [US1] Update validation schemas in `backend/src/api/schemas.ts` to trim usernames and reject empty/whitespace-only strings
- [x] T004 [US1] Update create room route controller in `backend/src/api/rooms.ts` to utilize the trimmed/validated schemas
- [x] T005 [US1] Update join room route controller in `backend/src/api/rooms.ts` to utilize the trimmed/validated schemas
- [x] T006 [P] [US1] Update error handling in landing page component in `frontend/src/pages/LandingPage.tsx` to handle trimmed values and display empty username errors

---

## Phase 4: User Story 2 - Game Start & Drawer Assignment (Priority: P1)

**Goal**: Transition room status to active and assign the Host as the drawer

**Independent Test**: Start the game as the Host, verify that Host client receives the drawer role, and all other participants receive guesser roles.

### Implementation for User Story 2

- [x] T007 [US2] Update the `Room` interface and add `drawerId` and roles properties in `backend/src/models/game.ts`
- [x] T008 [US2] Implement drawer designation and room state updates in `backend/src/services/roomStore.ts`
- [x] T009 [US2] Update start game route handler in `backend/src/api/rooms.ts` to verify and apply new role properties
- [x] T010 [P] [US2] Update frontend room state management to process drawer role in `frontend/src/state/roomStore.ts`
- [x] T011 [US2] Update game UI component in `frontend/src/pages/GamePage.tsx` to display clearly who the drawer is

---

## Phase 5: User Story 3 - Secret Word Selection & Visibility (Priority: P1)

**Goal**: Select a secret word deterministically and display it only to the drawer

**Independent Test**: In active game, verify drawer sees raw secret word and guesser sees masked word representation.

### Implementation for User Story 3

- [x] T012 [US3] Implement word selection logic in `startGame` service in `backend/src/services/roomStore.ts`
- [x] T013 [US3] Implement word masking filter in `toRoomSnapshot` method in `backend/src/services/roomStore.ts`
- [x] T014 [P] [US3] Update frontend game dashboard in `frontend/src/pages/GamePage.tsx` to show secret word to drawer and mask it for guessers

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final check and verification

- [x] T015 Run quickstart.md validation scenario checks.
