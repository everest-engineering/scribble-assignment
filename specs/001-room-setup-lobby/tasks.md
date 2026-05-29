# Tasks: Room Setup and Lobby

**Input**: Design documents from `/specs/001-room-setup-lobby/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/rooms-api.md`, `quickstart.md`

**Tests**: Focused validation tasks are included because the plan and quickstart require backend/frontend tests plus manual two-tab validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing. The requested dependency order is preserved: host tracking, room validation, start game endpoint, lobby polling, host-only UI, validation.

## Phase 1: Setup

**Purpose**: Confirm the brownfield project structure and active feature context before editing code.

- [X] T001 Review the Feature Group 1 specification and plan in `specs/001-room-setup-lobby/spec.md` and `specs/001-room-setup-lobby/plan.md`
- [X] T002 Review the API and state contracts in `specs/001-room-setup-lobby/contracts/rooms-api.md` and `specs/001-room-setup-lobby/data-model.md`
- [X] T003 Verify TypeScript build/test scripts and ignore coverage in `backend/package.json`, `frontend/package.json`, and `.gitignore`

---

## Phase 2: Foundational

**Purpose**: Shared contracts and validation primitives that block all user stories.

**Critical**: No user story implementation should begin until this phase is complete.

- [X] T004 Update room lifecycle and snapshot types for host/start metadata in `backend/src/models/game.ts`
- [X] T005 Update frontend room snapshot and session types to match the backend contract in `frontend/src/services/api.ts`
- [X] T006 Add normalized room-code, player-name, participant, and start-game schemas in `backend/src/api/schemas.ts`
- [X] T007 Add matching schema coverage for room-code, player-name, participant, and start-game validation in `backend/src/api/schemas.test.ts`

**Checkpoint**: Shared model and validation contracts are ready.

---

## Phase 3: User Story 1 - Create a Room as Host (Priority: P1) MVP

**Goal**: A player creates a room, receives a unique code, appears in the lobby, and is marked as host.

**Independent Test**: Create a room as one player and verify the room code, participant list, host ID, `isHost`, and `canStart` values in the room snapshot.

### Implementation for User Story 1

- [X] T008 [US1] Add host assignment and host-aware room snapshot generation in `backend/src/services/roomStore.ts`
- [X] T009 [US1] Return host-aware snapshots from the create room route in `backend/src/api/rooms.ts`
- [X] T010 [US1] Store host-aware room snapshots in the frontend room store in `frontend/src/state/roomStore.ts`
- [X] T011 [US1] Validate trimmed player name before create-room submission and show clear feedback in `frontend/src/pages/CreateRoomPage.tsx`
- [X] T012 [US1] Show host labeling and start-readiness information for the creator in `frontend/src/pages/LobbyPage.tsx`
- [X] T013 [US1] Add backend coverage for creator host assignment and room snapshot metadata in `backend/src/services/roomStore.test.ts`

**Checkpoint**: US1 works independently as the MVP.

---

## Phase 4: User Story 2 - Join a Room by Code (Priority: P2)

**Goal**: A player joins an existing lobby by code, invalid codes are rejected clearly, and rooms remain isolated.

**Independent Test**: Create two rooms, join one by code, verify the joining player appears only in the target room, and verify invalid code attempts do not mutate any room.

### Implementation for User Story 2

- [X] T014 [US2] Normalize room codes and reject not-found or not-joinable rooms without mutation in `backend/src/services/roomStore.ts`
- [X] T015 [US2] Apply room-code and player-name validation in the join route in `backend/src/api/rooms.ts`
- [X] T016 [US2] Validate trimmed player name and normalized room code before join submission in `frontend/src/pages/JoinRoomPage.tsx`
- [X] T017 [US2] Preserve clear API error messages for invalid join attempts in `frontend/src/services/api.ts`
- [X] T018 [US2] Add backend coverage for invalid room codes, no-mutation failed joins, and room isolation in `backend/src/services/roomStore.test.ts`
- [X] T019 [US2] Add frontend API coverage for normalized join requests and error handling in `frontend/src/services/api.test.ts`

**Checkpoint**: US1 and US2 work independently without leaking room state.

---

## Phase 5: User Story 3 - Start the Game from Lobby (Priority: P3)

**Goal**: Only the host can start the game, and start succeeds only when at least 2 players are in the room.

**Independent Test**: Verify host start is rejected with one player, non-host start is rejected with two players, and host start succeeds with two players.

### Implementation for User Story 3

- [X] T020 [US3] Add start-game service behavior with host and minimum-player checks in `backend/src/services/roomStore.ts`
- [X] T021 [US3] Add the `POST /rooms/:code/start` endpoint with participant validation in `backend/src/api/rooms.ts`
- [X] T022 [US3] Add `startRoom` API client behavior for `POST /rooms/:code/start` in `frontend/src/services/api.ts`
- [X] T023 [US3] Add `startGame` state action and status-aware room updates in `frontend/src/state/roomStore.ts`
- [X] T024 [US3] Disable or hide start controls for non-hosts and show minimum-player feedback in `frontend/src/pages/LobbyPage.tsx`
- [X] T025 [US3] Add backend coverage for host-only start, minimum-player rejection, and successful start transition in `backend/src/services/roomStore.test.ts`
- [X] T026 [US3] Add frontend API coverage for start-game success and rejection handling in `frontend/src/services/api.test.ts`

**Checkpoint**: Host-only start rules work without relying on frontend-only checks.

---

## Phase 6: User Story 4 - See Lobby Updates Automatically (Priority: P4)

**Goal**: Players in the same lobby see membership and start-readiness updates automatically within 2 seconds.

**Independent Test**: With two browser tabs in the same room, join or start-readiness changes appear in the other tab within 2 seconds; polling stops when leaving lobby state.

### Implementation for User Story 4

- [X] T027 [US4] Keep viewer-aware `GET /rooms/:code?participantId=...` polling responses aligned with host/start metadata in `backend/src/api/rooms.ts`
- [X] T028 [US4] Ensure `fetchRoom` passes the viewer participant ID and preserves non-destructive refresh errors in `frontend/src/services/api.ts`
- [X] T029 [US4] Add a 2-second lobby polling lifecycle with interval cleanup in `frontend/src/pages/LobbyPage.tsx`
- [X] T030 [US4] Prevent duplicate polling timers and stop polling after game start in `frontend/src/pages/LobbyPage.tsx`
- [X] T031 [US4] Style lobby host labels, start eligibility, disabled actions, and refresh feedback in `frontend/src/styles/app.css`

**Checkpoint**: Lobby state refreshes automatically through HTTP polling only.

---

## Phase 7: Polish & Cross-Cutting Validation

**Purpose**: Validate the full feature against the specification, plan, and quickstart.

- [X] T032 Add or update backend route-level validation coverage for create, join, fetch, and start behavior in `backend/src/api/rooms.ts`
- [X] T033 Run and fix backend test/build validation for `backend/src/services/roomStore.test.ts`, `backend/src/api/schemas.test.ts`, and `backend/package.json`
- [X] T034 Run and fix frontend test/build validation for `frontend/src/services/api.test.ts`, `frontend/src/pages/LobbyPage.tsx`, and `frontend/package.json`
- [ ] T035 Execute the manual two-tab quickstart validation and record any findings in `specs/001-room-setup-lobby/quickstart.md`
- [X] T036 Review all changed files for scope, validation, polling-only synchronization, room isolation, and TypeScript correctness against `specs/001-room-setup-lobby/spec.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup and blocks all user stories.
- **US1 Create Room as Host (Phase 3)**: Depends on Foundational. Delivers host tracking.
- **US2 Join Room by Code (Phase 4)**: Depends on US1 host-aware snapshots. Delivers room validation and isolation.
- **US3 Start Game from Lobby (Phase 5)**: Depends on US1 host tracking and US2 participant validation. Delivers start endpoint and host-only UI.
- **US4 Automatic Lobby Updates (Phase 6)**: Depends on US1-US3 snapshot fields and status transitions. Delivers 2-second polling.
- **Polish (Phase 7)**: Depends on all desired stories being complete.

### Requested Dependency Order

1. Add host tracking: T004, T005, T008-T013
2. Add room validation: T006, T007, T014-T019
3. Add start game endpoint: T020-T023, T025-T026
4. Add lobby polling: T027-T031
5. Add host-only UI: T024
6. Validate behavior: T032-T036

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational.
- **US2 (P2)**: Starts after US1 so join responses include host-aware snapshots.
- **US3 (P3)**: Starts after US1 and US2 so start checks can rely on host and participant validation.
- **US4 (P4)**: Starts after US1-US3 so polling reflects final lobby/start state.

### Parallel Opportunities

- T001, T002, and T003 can be reviewed in parallel.
- T004 and T005 can run in parallel after Setup because they touch backend and frontend type files separately.
- T011 and T012 can run after T010 if one agent owns create form feedback and another owns lobby display.
- T016 and T017 can run in parallel after T015 because they touch different frontend files.
- T025 and T026 can run in parallel after T020-T023 because they cover different test files.
- T031 can run in parallel with T029-T030 because it only touches styles.

---

## Parallel Example: User Story 2

```bash
Task: "Validate trimmed player name and normalized room code before join submission in frontend/src/pages/JoinRoomPage.tsx"
Task: "Preserve clear API error messages for invalid join attempts in frontend/src/services/api.ts"
```

## Parallel Example: User Story 3

```bash
Task: "Add backend coverage for host-only start, minimum-player rejection, and successful start transition in backend/src/services/roomStore.test.ts"
Task: "Add frontend API coverage for start-game success and rejection handling in frontend/src/services/api.test.ts"
```

## Parallel Example: User Story 4

```bash
Task: "Add a 2-second lobby polling lifecycle with interval cleanup in frontend/src/pages/LobbyPage.tsx"
Task: "Style lobby host labels, start eligibility, disabled actions, and refresh feedback in frontend/src/styles/app.css"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 for US1.
3. Stop and validate: room creation returns a host-aware lobby snapshot and the creator is marked as host.

### Incremental Delivery

1. Deliver US1 host tracking.
2. Add US2 room validation and isolation.
3. Add US3 backend-enforced start behavior and host-only UI.
4. Add US4 2-second polling and cleanup.
5. Complete Phase 7 validation before accepting the feature.

### Review Rules

- Keep state in memory only.
- Do not add WebSockets, server-sent events, long polling, databases, authentication, sessions, or unrelated dependencies.
- Validate user-controlled values in the frontend and backend before mutating room state.
- Mark each task `[X]` in this file as it is completed during implementation.
