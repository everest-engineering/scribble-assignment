# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `/specs/002-game-start-drawer-flow/`

**Prerequisites**: spec.md, plan.md

## Phase 1: Setup (Review existing lobby/game flow)

- [ ] T001 [P] Review frontend lobby and game state flow in `frontend/src/state/roomStore.ts`, `frontend/src/pages/LobbyPage.tsx`, and `frontend/src/pages/GamePage.tsx`.
- [ ] T002 [P] Review backend room state and API surface in `backend/src/services/roomStore.ts` and `backend/src/api/rooms.ts`.

---

## Phase 2: User Story 2 - Enforce trimmed player names (Priority: P1)

**Goal**: Reject empty or whitespace-only player names and store trimmed names.

- [ ] T003 [US2] Trim player names in `frontend/src/pages/CreateRoomPage.tsx` and `frontend/src/pages/JoinRoomPage.tsx` before submitting.
- [ ] T004 [US2] Add client-side validation for empty or whitespace-only player names in `frontend/src/pages/CreateRoomPage.tsx` and `frontend/src/pages/JoinRoomPage.tsx`.
- [ ] T005 [US2] Add backend validation and trimming for player names in `backend/src/services/roomStore.ts` and `backend/src/api/rooms.ts` to reject invalid names.

---

## Phase 3: User Story 1 - Start the first round (Priority: P1)

**Goal**: Allow the host to start the first round and assign the drawer.

- [ ] T006 [US1] Add a lobby start control in `frontend/src/pages/LobbyPage.tsx` that only the host can use.
- [ ] T007 [US1] Gate the lobby start control behind at least two players in `frontend/src/pages/LobbyPage.tsx`.
- [ ] T008 [US1] Implement a `startGame` action in `frontend/src/state/roomStore.ts` and call it from `LobbyPage.tsx`.
- [ ] T009 [US1] Add a backend `POST /rooms/:code/start` route in `backend/src/api/rooms.ts` and a `startGame` method in `backend/src/services/roomStore.ts`.
- [ ] T010 [US1] Assign the host or first participant as the drawer when the first round begins in `backend/src/services/roomStore.ts`.

---

## Phase 4: User Story 3 - Deterministic secret word selection (Priority: P2)

**Goal**: Choose the first-round word deterministically and reveal it only to the drawer.

- [ ] T011 [US3] Implement deterministic secret word selection from the starter word list in `backend/src/services/roomStore.ts`.
- [ ] T012 [US3] Add drawer-specific game state to `backend/src/services/roomStore.ts`, returning the secret word only to the drawer.
- [ ] T013 [US3] Update `frontend/src/pages/GamePage.tsx` to display the drawer label and reveal the secret word only for the drawer.
- [ ] T014 [US3] Ensure non-drawer players in `frontend/src/pages/GamePage.tsx` do not see the secret word.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, UI clarity, and documentation.

- [ ] T015 [P] Add clear drawer labeling and round start guidance to `frontend/src/pages/GamePage.tsx`.
- [ ] T016 [P] Add tests for name trimming and start-game behavior in `backend/src/services/roomStore.test.ts` or a new frontend test file.
- [ ] T017 [P] Document the first-round start and drawer behavior in `specs/002-game-start-drawer-flow/plan.md` or a new `quickstart.md` file.

---

## Dependencies & Execution Order

- `T001` and `T002` can run in parallel as setup review tasks.
- `T003` through `T005` must complete before the start-game flow is implemented.
- `T006` through `T010` depend on the name validation foundation and backend start-game route.
- `T011` through `T014` depend on the start-game flow and backend game state contract.
- `T015` through `T017` are polish tasks that can run after the core feature is implemented.

## Parallel Opportunities

- `T001`, `T002`, and `T015` are parallelizable.
- `T003`, `T004`, and `T005` can be worked on in parallel by separate developers.
- `T016` and `T017` can be completed while implementation is being validated.
