# Tasks: Room Setup & Lobby

**Input**: Design documents from `/specs/001-room-setup-lobby/`

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 [P] Review `backend/src/api/rooms.ts`, `backend/src/services/roomStore.ts`, `frontend/src/pages/CreateRoomPage.tsx`, `frontend/src/pages/JoinRoomPage.tsx`, `frontend/src/pages/LobbyPage.tsx`, and `frontend/src/services/api.ts` to verify current room creation, join, and lobby flows.
- [ ] T002 [P] Confirm current `backend/src/models/game.ts` types and `frontend/src/services/api.ts` contracts match the Scenario 1 plan in `specs/001-room-setup-lobby/plan.md`.

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T003 [P] Update `backend/src/models/game.ts` to add `isHost: boolean` on `Participant` and preserve room state for lobby host identification.
- [ ] T004 [P] Update `backend/src/services/roomStore.ts` so `createRoom()` marks the first participant as host and `joinRoom()` preserves participant state.
- [ ] T005 [P] Update `backend/src/services/roomStore.ts` and `backend/src/api/rooms.ts` to normalize room codes to uppercase and ensure code lookup is case-insensitive.
- [ ] T006 [P] Improve validation in `backend/src/api/schemas.ts` to require trimmed, non-empty `playerName` values for `createRoom` and `joinRoom` requests.
- [ ] T007 [P] Add a new backend endpoint `POST /rooms/:code/start` in `backend/src/api/rooms.ts` to transition room status from `lobby` to the next game phase.
- [ ] T008 [P] Add `api.startGame` client method to `frontend/src/services/api.ts` to call `POST /rooms/:code/start`.
- [ ] T009 [P] Add a `startRoom` or `startGame` helper method to `frontend/src/state/roomStore.ts` so UI components can trigger the backend start endpoint and refresh the room snapshot.

---

## Phase 3: User Story 1 - Host Creates Room and Starts Game (Priority: P1)

**Goal**: Enable room creators to become hosts, wait for a second player, and start the game with host-only gating.

**Independent Test**: Create a room, confirm the creator is shown as host in the lobby, add another player, and verify only the host can start once two players exist.

- [ ] T010 [US1] Update `backend/src/services/roomStore.ts` and `backend/src/api/rooms.ts` so the room snapshot exposes host identity to the client.
- [ ] T011 [US1] Update `frontend/src/pages/LobbyPage.tsx` to derive host status using the stored `participantId` and the room snapshot.
- [ ] T012 [US1] Update `frontend/src/pages/LobbyPage.tsx` to show a host badge for the current user and a clear message about start eligibility.
- [ ] T013 [US1] Update `frontend/src/pages/LobbyPage.tsx` so the start button is enabled only for the host and only when `room.participants.length >= 2`.
- [ ] T014 [US1] Add a user action in `frontend/src/pages/LobbyPage.tsx` to call `roomStore.startGame()` and navigate to `/game` when start succeeds.
- [ ] T015 [US1] Add backend validation in `backend/src/api/rooms.ts` for `POST /rooms/:code/start` to reject non-host requests and rooms with fewer than two players.
- [ ] T016 [US1] Add a backend test in `backend/src/api/rooms.test.ts` or `backend/src/services/roomStore.test.ts` validating host-only start and player-count gating.
- [ ] T017 [P] [US1] Add a frontend test for `LobbyPage` confirming the start button is enabled only for the host when two or more players exist.

---

## Phase 4: User Story 2 - Joiner Enters Room and Sees Live Lobby Updates (Priority: P2)

**Goal**: Allow a second player to join an existing room and see the lobby update automatically.

**Independent Test**: Join an existing room from another browser/tab and confirm the participant list refreshes within 2 seconds.

- [ ] T018 [US2] Update `frontend/src/pages/JoinRoomPage.tsx` so room code input is normalized to uppercase and the join flow uses the existing `roomStore.joinRoom()` method.
- [ ] T019 [US2] Update `frontend/src/pages/LobbyPage.tsx` to poll `roomStore.fetchRoom()` every 2000ms while the lobby is mounted.
- [ ] T020 [US2] Add a visible polling status or last-updated message in `frontend/src/pages/LobbyPage.tsx` so users know the lobby is refreshing.
- [ ] T021 [US2] Add a frontend test for `LobbyPage` ensuring lobby polling refreshes the participant list without manual action.
- [ ] T022 [US2] Add a backend test ensuring `GET /rooms/:code` returns the current room snapshot and works for codes in different casing.

---

## Phase 5: User Story 3 - Room Code and Name Validation (Priority: P3)

**Goal**: Reject invalid room codes and empty/whitespace-only player names with clear feedback.

**Independent Test**: Try joining with a bad code and create/join with blank names; verify errors display and access is denied.

- [ ] T023 [US3] Add frontend validation in `frontend/src/pages/CreateRoomPage.tsx` to reject empty or whitespace-only player names before submit.
- [ ] T024 [US3] Add frontend validation in `frontend/src/pages/JoinRoomPage.tsx` to reject empty or whitespace-only player names before submit and show a clear inline error.
- [ ] T025 [US3] Update `backend/src/api/rooms.ts` to return a clear 404 error for invalid or non-existent room codes on join.
- [ ] T026 [US3] Update `backend/src/api/schemas.ts` so `playerName` is required and trimmed values are validated in both `createRoom` and `joinRoom` requests.
- [ ] T027 [US3] Add a backend test for `joinRoom` with an invalid room code and for create/join with blank names.
- [ ] T028 [P] [US3] Add a frontend test for `CreateRoomPage` and `JoinRoomPage` to verify name validation and error display.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T029 [P] Update `frontend/src/pages/LobbyPage.tsx` to preserve the current lobby state while polling and avoid flicker when refreshes occur.
- [ ] T030 [P] Review and adjust API error handling in `frontend/src/services/api.ts` so backend validation errors show meaningful messages.
- [ ] T031 [P] Add comments or documentation near the lobby polling logic and host gating behavior in `frontend/src/pages/LobbyPage.tsx`.
- [ ] T032 [P] Run the Scenario 1 independent test flow manually in two browser tabs and document any mismatches from `specs/001-room-setup-lobby/spec.md`.

---

## Dependencies & Execution Order

- **Phase 1 Setup**: Can start immediately.
- **Phase 2 Foundational**: Blocks all feature implementation until complete.
- **Phase 3 US1**: Can start after Foundational is complete.
- **Phase 4 US2**: Can start after Foundational is complete; depends on the join flow and lobby polling.
- **Phase 5 US3**: Can start after Foundational is complete; depends on backend validation and join/create flow error handling.
- **Phase 6 Polish**: Run after all stories are implemented.

## Parallel Opportunities

- T001 and T002 can run in parallel to identify current gaps.
- T003 through T009 are all foundational and can be worked in parallel where they touch different backend/frontend files.
- T016, T017, T021, T022, T027, and T028 are test tasks that can run in parallel once their corresponding implementation tasks are ready.
- T023 and T024 can run in parallel because they update different frontend pages.
- US2 and US3 implementation work can proceed in parallel after the foundational backend and API contract changes are complete.

## Implementation Strategy

1. Finish Phase 2 foundation tasks first so the backend and API contract support host identity, normalized codes, and game start.
2. Implement User Story 1 next and validate the host start flow independently.
3. Add User Story 2 lobby polling and joiner refresh behavior.
4. Add User Story 3 validation and error handling.
5. Finish with polish, documentation, and cross-cutting cleanup.
