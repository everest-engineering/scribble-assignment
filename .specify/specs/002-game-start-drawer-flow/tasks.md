# Tasks: Game Start & Drawer Flow

**Feature**: Game Start & Drawer Flow
**Branch**: `002-game-start-drawer-flow`

## Phase 1: Setup

- [x] T001 Initialize project structure for feature branch
- [x] T002 [P] Install necessary dependencies (zod)
- [x] T003 [P] Configure linting and Vitest settings

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T004 Define Room model in backend/src/models/game.ts
- [x] T005 Define Participant model in backend/src/models/game.ts
- [x] T006 Implement Room service in backend/src/services/roomStore.ts
- [x] T007 Setup API router in backend/src/api/router.ts

---

## Phase 3: User Story 1 - Player Name Validation (Priority: P1) 🎯 MVP

**Goal**: Implement player name validation (trimming, rejecting empty/whitespace-only).

**Independent Test**: Create/join room with "" or "   " and verify error.

- [x] T008 [US1] Implement name validation logic in backend/src/api/schemas.ts
- [x] T009 [US1] Update room creation/join endpoint to use validation in backend/src/api/rooms.ts
- [x] T010 [P] [US1] Create frontend validation service in frontend/src/services/api.ts
- [x] T011 [US1] Add error handling for name validation in frontend/src/pages/CreateRoomPage.tsx
- [x] T012 [US1] Add error handling for name validation in frontend/src/pages/JoinRoomPage.tsx
- [x] T008a [P] [US1] Unit tests for name validation in backend/tests/api/schemas.test.ts
- [x] T008b [P] [US1] Integration tests for room join/create in backend/tests/api/rooms.test.ts

---

## Phase 4: User Story 2 - Game Start & Drawer (Priority: P1) 🎯 MVP

**Goal**: Implement game start, drawer designation, and secret word visibility.

**Independent Test**: Host starts game, verify they are drawer and see secret word.

- [X] T013 [US2] Implement startGame logic in backend/src/services/roomStore.ts
- [X] T014 [US2] Implement secret word selection in backend/src/services/roomStore.ts
- [X] T015 [US2] Update game state API to include drawerId/currentWord in backend/src/api/rooms.ts
- [X] T016 [US2] Implement client-side drawer masking logic in frontend/src/state/roomStore.ts
- [X] T017 [US2] Implement secret word visibility in frontend/src/components/Card.tsx
- [X] T013a [P] [US2] Unit tests for startGame and drawer logic in backend/tests/services/roomStore.test.ts
- [X] T014a [P] [US2] Unit tests for deterministic word selection in backend/tests/services/roomStore.test.ts
- [X] T016a [P] [US2] Frontend component tests for masking logic in frontend/tests/components/Card.test.tsx

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T018 [P] Implement host disconnection logic in backend/src/services/roomStore.ts
- [X] T019 [P] Prevent late joins in backend/src/api/rooms.ts
