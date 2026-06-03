# Tasks: Game Start and Drawer

**Input**: Design documents from `/specs/002-game-start-and-drawer/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required per constitution — service, schema, API client, and snapshot masking tests included.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm branch and feature directory active

- [X] T001 Verify `.specify/feature.json` points to `specs/002-game-start-and-drawer`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Types and pure helpers all stories depend on

- [X] T002 Extend `RoomStatus`, `CurrentRound`, and snapshot types in `backend/src/models/game.ts`
- [X] T003 [P] Add `sumCharCodes` and `pickWord` pure helpers in `backend/src/services/roomStore.ts`
- [X] T004 [P] Add unit tests for `pickWord` determinism in `backend/src/services/roomStore.test.ts`

**Checkpoint**: Types compile; word index formula testable

---

## Phase 3: User Story 1 - Host starts the game (Priority: P1)

**Goal**: Host-only `POST /rooms/:code/start`, lobby→playing, frontend start + navigate

**Independent Test**: Two tabs; host starts; both see `playing` via poll; non-host cannot start

### Tests for User Story 1

- [X] T005 [P] [US1] Add `startRoomSchema` tests in `backend/src/api/schemas.test.ts`
- [X] T006 [P] [US1] Add `startRound` happy and reject-path tests in `backend/src/services/roomStore.test.ts`

### Implementation for User Story 1

- [X] T007 [US1] Implement `startRound` and error classes in `backend/src/services/roomStore.ts`
- [X] T008 [US1] Add `startRoomSchema` in `backend/src/api/schemas.ts`
- [X] T009 [US1] Wire `POST /rooms/:code/start` in `backend/src/api/rooms.ts` and map errors in `backend/src/api/router.ts` if needed
- [X] T010 [P] [US1] Add `api.startGame` and types in `frontend/src/services/api.ts`
- [X] T011 [P] [US1] Add `api.startGame` test in `frontend/src/services/api.test.ts`
- [X] T012 [US1] Add `startGame` action in `frontend/src/state/roomStore.ts`
- [X] T013 [US1] Call `startGame` from `frontend/src/pages/LobbyPage.tsx` then navigate on success

**Checkpoint**: Host can start; status `playing`; guesser poll sees playing

---

## Phase 4: User Story 2 - Drawer sees secret word (Priority: P1)

**Goal**: Masked `toRoomSnapshot`, game UI word card vs hint, game polling

**Independent Test**: Drawer snapshot has word; guesser snapshot `secretWord` null

### Tests for User Story 2

- [X] T014 [P] [US2] Add drawer vs guesser masking tests in `backend/src/services/roomStore.test.ts`

### Implementation for User Story 2

- [X] T015 [US2] Implement viewer-aware `toRoomSnapshot` with `currentRound` and `viewer` in `backend/src/services/roomStore.ts`
- [X] T016 [P] [US2] Mirror snapshot types in `frontend/src/services/api.ts`
- [X] T017 [US2] Add `useRoomPolling` on `frontend/src/pages/GamePage.tsx`
- [X] T018 [US2] Render drawer word card vs guesser hint in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: Two-tab manual — word only on host tab

---

## Phase 5: User Story 3 - Player names validated (Priority: P2)

**Goal**: No regression on trim/empty name rules from Scenario 1

**Independent Test**: Existing `normalizePlayerName` and schema tests still pass

- [X] T019 [US3] Confirm create/join schemas unchanged; run full backend `npm test` — no code change unless regression found

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Builds, precheck, task hygiene

- [X] T020 Run `cd backend && npm run build && npm test`
- [X] T021 Run `cd frontend && npm run build && npm test`
- [X] T022 Run `node .github/scripts/pre-evaluation-check.mjs`
- [X] T023 Mark all tasks `[X]` in `specs/002-game-start-and-drawer/tasks.md`

---

## Dependencies & Execution Order

```text
T002 → T003/T004 → T005-T009 (backend start) → T010-T013 (frontend start)
T015 depends on T007; T014 after T015
T016-T018 after T015
T019-T022 final validation
```

## Parallel opportunities

- T003 + T004 parallel after T002
- T005 + T006 parallel before T007
- T010 + T011 parallel with backend route work after T008

## MVP scope

**User Story 1 only** (T002–T013): real backend start and playing status. US2 (masking + UI) completes Scenario 2 acceptance.
