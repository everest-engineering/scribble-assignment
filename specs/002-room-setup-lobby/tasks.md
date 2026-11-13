# Tasks: Room Setup & Lobby

**Input**: Design documents from `/specs/002-room-setup-lobby/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rooms-api.md, quickstart.md

**Tests**: Unit tests are included for store logic and api route handlers to ensure code correctness and maintain 90% test coverage.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and validation

- [x] T001 Verify and install dependencies in [backend/package.json](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/package.json) and [frontend/package.json](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/package.json)
- [x] T002 Verify dev script execution for [backend/src/server.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/server.ts) and [frontend/src/main.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/main.tsx)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core model updates and endpoint definitions

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Extend the models to track hostId in [backend/src/models/game.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/models/game.ts)
- [x] T004 Update Participant interface to match backend types in [frontend/src/services/api.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/services/api.ts)
- [x] T005 [P] Create stubs for start and leave room endpoints in [backend/src/api/rooms.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/api/rooms.ts)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Host Tracking on Room Creation (Priority: P1) 🎯 MVP

**Goal**: Automatically identify and track the room creator as the host.

**Independent Test**: Navigate to `/create-room`, enter name, submit, and confirm that in the lobby, this participant displays a host badge.

### Implementation for User Story 1

- [x] T006 [P] [US1] Write backend unit tests for host designation in [backend/src/services/roomStore.test.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.test.ts)
- [x] T007 [US1] Update createRoom to assign the participant ID to hostId in [backend/src/services/roomStore.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.ts)
- [x] T008 [US1] Update toRoomSnapshot to set isHost dynamically in [backend/src/services/roomStore.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.ts)
- [x] T009 [US1] Update LobbyPage to display Host badge next to the host's name in [frontend/src/pages/LobbyPage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/LobbyPage.tsx)

**Checkpoint**: User Story 1 is functional. The room creator is correctly labeled and rendered as the host.

---

## Phase 4: User Story 2 - Join Validation with Clear Error Feedback (Priority: P1)

**Goal**: Validate join parameters (player name, room code length/format) and display clear validation errors.

**Independent Test**: Attempt joining with empty name or invalid room code format and verify on-screen error displays.

### Implementation for User Story 2

- [x] T010 [P] [US2] Update Zod validation schemas for playerName and code in [backend/src/api/schemas.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/api/schemas.ts)
- [x] T011 [P] [US2] Write unit tests for schemas validation in [backend/src/api/schemas.test.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/api/schemas.test.ts)
- [x] T012 [US2] Add client-side empty name validation in [frontend/src/pages/CreateRoomPage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/CreateRoomPage.tsx) and [frontend/src/pages/JoinRoomPage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/JoinRoomPage.tsx)
- [x] T013 [US2] Handle 404 Room Not Found and bad requests to show message alert in [frontend/src/pages/JoinRoomPage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/JoinRoomPage.tsx)

**Checkpoint**: Joining rooms is fully validated, and user feedback matches requirements.

---

## Phase 5: User Story 3 - Multi-Room Isolation (Priority: P1)

**Goal**: Ensure participant lists and room states are completely isolated by room code.

**Independent Test**: Create Room A as Alice, Room B as Bob. Join Bob's room as guest Charlie, verify Alice's lobby is unaffected.

### Implementation for User Story 3

- [x] T014 [P] [US3] Write unit test asserting state isolation between two active rooms in [backend/src/services/roomStore.test.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.test.ts)
- [x] T015 [US3] Uppercase-normalize and trim room codes in [backend/src/services/roomStore.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.ts) and [backend/src/api/rooms.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/api/rooms.ts)

**Checkpoint**: Multiple lobbies can run concurrently without state leaks.

---

## Phase 6: User Story 4 - Lobby Auto-polling (Priority: P2)

**Goal**: Auto-update the participant list at a ~2s cadence, showing connection warning banner if polling fails.

**Independent Test**: Keep two browser tabs open. Join from tab 2, and observe automatic update in tab 1 within 2.5 seconds. Disable network to see warning banner.

### Implementation for User Story 4

- [x] T016 [US4] Implement a setInterval loop triggering fetchRoom every 2s in [frontend/src/pages/LobbyPage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/LobbyPage.tsx)
- [x] T017 [US4] Add network warning banner showing retry connection status in [frontend/src/pages/LobbyPage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/LobbyPage.tsx)

**Checkpoint**: Auto-polling keeps clients in sync, and handles transient network loss.

---

## Phase 7: User Story 5 - Host-Only Start with 2-Player Minimum (Priority: P1)

**Goal**: Restrict game start trigger to the host and gate start action until at least 2 players are present.

**Independent Test**: Host alone sees disabled start button. Guest Bob joins: Bob sees "Waiting for host...", host sees enabled Start Game. Host clicks: both navigate to `/game`.

### Implementation for User Story 5

- [x] T018 [P] [US5] Add unit tests for start game validation rules in [backend/src/services/roomStore.test.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.test.ts)
- [x] T019 [US5] Implement startGame state transition (updating status to "game") in [backend/src/services/roomStore.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.ts)
- [x] T020 [US5] Implement POST /rooms/:code/start endpoint with host verification in [backend/src/api/rooms.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/api/rooms.ts)
- [x] T021 [US5] Implement startGame API method and store handler in [frontend/src/services/api.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/services/api.ts) and [frontend/src/state/roomStore.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/state/roomStore.ts)
- [x] T022 [US5] Conditionally render Start Game button only if current player is host in [frontend/src/pages/LobbyPage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/LobbyPage.tsx)
- [x] T023 [US5] Disable Start Game button when participant count is less than 2 in [frontend/src/pages/LobbyPage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/LobbyPage.tsx)
- [x] T024 [US5] Redirect guest/host players to `/game` route once room status transitions to "game" in [frontend/src/pages/LobbyPage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/LobbyPage.tsx)

**Checkpoint**: Game start is secure, validated, and synchronized across participants.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Handle edge cases such as leaving the room, cleanup, and styling alignment.

- [x] T025 Implement host leave room deletion logic in [backend/src/services/roomStore.ts](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/backend/src/services/roomStore.ts)
- [x] T026 Add leave button click handler calling leave endpoint in [frontend/src/pages/LobbyPage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/LobbyPage.tsx)
- [x] T027 Redirect guests to landing page on room termination in [frontend/src/pages/LobbyPage.tsx](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/pages/LobbyPage.tsx)
- [x] T028 Verify all styling is compliant with Vanilla CSS guidelines in [frontend/src/styles/app.css](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/frontend/src/styles/app.css)
- [x] T029 Run the verification steps in [specs/002-room-setup-lobby/quickstart.md](file:///Users/pagidipallydivyasai/Developer/learning/scribble-assignment/specs/002-room-setup-lobby/quickstart.md) to validate the full feature

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion, blocks all user stories.
- **User Stories (Phases 3-7)**: Depends on Foundational completion. Can run in parallel, or sequentially: US1 (P1) → US2 (P1) → US3 (P1) → US4 (P2) → US5 (P1).
- **Polish (Phase 8)**: Depends on all user story tasks being completed.

### User Story Dependencies

- **US1 (Host)**: Blocks US5 (Start Game visibility checks depend on Host badge mapping).
- **US2 (Validation)**: Independent.
- **US3 (Isolation)**: Independent.
- **US4 (Polling)**: Blocks US5 (Automatic redirect to `/game` relies on working polling system).
- **US5 (Start Game)**: Depends on US1 and US4.

### Parallel Opportunities

- **Setup**: T001, T002 can run in parallel.
- **Foundational**: T003, T004, T005 can run in parallel.
- **US1**: Backend tests (T006) and store changes (T007, T008) in parallel with frontend rendering (T009).
- **US2**: Schemas validation (T010, T011) in parallel with client-side UI forms (T012, T013).
- **US5**: Backend logic (T018, T019, T020) in parallel with frontend store/UI wiring (T021, T022, T023, T024).

---

## Parallel Example: User Story 1

```bash
# Developers can work on backend changes and frontend visual changes at the same time:
Task: "Write backend unit tests for host designation in backend/src/services/roomStore.test.ts"
Task: "Update LobbyPage to display Host badge next to the host's name in frontend/src/pages/LobbyPage.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1 (Host Tracking).
4. **STOP and VALIDATE**: Create a room and verify host role displays correctly.

### Incremental Delivery

1. Setup + Foundation complete.
2. Deliver US1 (Host badge) -> Verify.
3. Deliver US2 (Validation errors) -> Verify.
4. Deliver US3 (Multi-room isolation) -> Verify.
5. Deliver US4 (Lobby polling + network lost retry banner) -> Verify.
6. Deliver US5 (Start game restriction) -> Verify.
7. Deliver Phase 8 (Leave/cleanup logic + final CSS polish) -> Verify.
