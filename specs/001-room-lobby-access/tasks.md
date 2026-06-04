---

description: "Task list for Room Lobby Access"
---

# Tasks: Room Lobby Access

**Input**: Design documents from `/specs/001-room-lobby-access/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Explicit Vitest coverage is included for backend room-state invariants,
schema validation, and frontend room/session mapping. Manual browser validation
remains for polling and host/start flows.

**Organization**: Tasks are grouped by user story to keep each story independently
implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label, e.g. `[US1]`, `[US2]`, `[US3]`
- Include exact file paths in every task description

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align shared room types and API scaffolding before feature work

- [x] T001 [P] Add shared room identity fields and snapshot types in `backend/src/models/game.ts` and `frontend/src/services/api.ts`
- [x] T002 [P] Add start-room request schema and client method scaffolding in `backend/src/api/schemas.ts`, `backend/src/api/rooms.ts`, and `frontend/src/services/api.ts`
- [x] T003 [P] Add polling lifecycle hooks in `frontend/src/state/roomStore.ts` so the lobby can refresh and stop cleanly on navigation or tab close

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core room behavior that all user stories depend on

**⚠️ CRITICAL**: Do not begin user story work until these are complete

- [x] T004 Implement backend room-store invariants for host tracking, immutable snapshots, and room-scoped updates in `backend/src/services/roomStore.ts`
- [x] T005 [P] Extend backend room routes for create/join/fetch/start validation and error mapping in `backend/src/api/rooms.ts`
- [x] T006 [P] Extend the frontend room store to retain `participantId`, `hostParticipantId`, and room status across navigation in `frontend/src/state/roomStore.ts`

**Checkpoint**: Room state can be created, stored, fetched, and kept isolated per room code.

---

## Phase 3: User Story 1 - Create or Join a Room (Priority: P1)

**Goal**: A player can create a room or join an existing one and the creator is
automatically the host.

**Independent Test**: Create a room and confirm the creator is the host. Join a
valid room code and confirm the player is admitted to that room.

### Implementation for User Story 1

- [x] T007 [US1] Persist the creator as host on room creation and include the host id in returned room snapshots in `backend/src/services/roomStore.ts`
- [x] T008 [P] [US1] Wire create-room and join-room pages to store the returned session data and navigate into the lobby in `frontend/src/pages/CreateRoomPage.tsx`, `frontend/src/pages/JoinRoomPage.tsx`, and `frontend/src/state/roomStore.ts`
- [x] T009 [P] [US1] Show the host identity in lobby state so players can confirm who owns the room in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: Room creation and join flow work end-to-end with host ownership visible.

---

## Phase 4: User Story 2 - Validate Room Codes and Isolate Rooms (Priority: P2)

**Goal**: Invalid room codes are rejected clearly and room state never bleeds
between room codes.

**Independent Test**: Try empty and invalid codes, then create two rooms and confirm
their player lists and state never mix.

### Implementation for User Story 2

- [x] T010 [US2] Reject empty, whitespace-only, and invalid room codes with explicit backend errors in `backend/src/api/schemas.ts` and `backend/src/api/rooms.ts`
- [x] T011 [P] [US2] Keep room reads and writes scoped to a single room code so actions in one room cannot affect another in `backend/src/services/roomStore.ts`
- [x] T012 [P] [US2] Surface join/create failures clearly in the room entry screens in `frontend/src/pages/JoinRoomPage.tsx`, `frontend/src/pages/CreateRoomPage.tsx`, and `frontend/src/state/roomStore.ts`

**Checkpoint**: Bad room codes fail cleanly and separate rooms remain isolated.

---

## Phase 5: User Story 3 - Polling Lobby and Host Start Rules (Priority: P3)

**Goal**: Lobby state refreshes automatically and only the host can start the
game once at least two players are present.

**Independent Test**: Open the same room in two tabs, wait for the lobby to refresh,
then verify only the host can start and only after 2+ players are present.

### Implementation for User Story 3

- [x] T013 [US3] Add host-only room start behavior and the lobby-to-game transition in `backend/src/api/rooms.ts` and `backend/src/services/roomStore.ts`
- [x] T014 [P] [US3] Add automatic lobby polling on a 2000 ms cadence that stops on navigation or tab close and refresh the displayed room snapshot in `frontend/src/state/roomStore.ts` and `frontend/src/pages/LobbyPage.tsx`
- [x] T015 [P] [US3] Render the host-only `Start Game` control and minimum-player messaging in `frontend/src/pages/LobbyPage.tsx`
- [x] T016 [P] [US3] Route the room into the game screen after a successful start in `frontend/src/pages/LobbyPage.tsx` and `frontend/src/pages/GamePage.tsx`
- [x] T017 [US3] Delete the room when the host leaves before the game starts and redirect remaining participants home on the next poll in `backend/src/services/roomStore.ts`, `backend/src/api/rooms.ts`, `frontend/src/state/roomStore.ts`, and `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: Lobby polling and host-only start rules are visible and enforced end-to-end.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and manual validation across the full room lifecycle

- [x] T018 [P] Clean up stale lobby assumptions and ensure polling teardown on navigation in `frontend/src/state/roomStore.ts`
- [x] T019 Validate the full room lifecycle manually using `specs/001-room-lobby-access/quickstart.md` and fix any gaps in the touched files

## Phase 7: Automated Verification

**Purpose**: Lock in the room rules and API contract with explicit unit tests

- [x] T020 [P] Extend backend Vitest coverage in `backend/src/services/roomStore.test.ts` and `backend/src/api/schemas.test.ts` for host assignment, room isolation, invalid code rejection, host-start gating, and host-departure cleanup
- [x] T021 [P] Add frontend Vitest coverage in `frontend/src/services/api.test.ts` and `frontend/src/state/roomStore.test.ts` for participant/session mapping and polling lifecycle cleanup
- [x] T022 Run the backend and frontend Vitest suites and fix any regressions in the touched files in `backend/src/services/roomStore.test.ts`, `backend/src/api/schemas.test.ts`, `frontend/src/services/api.test.ts`, and `frontend/src/state/roomStore.test.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories
- **User Stories (Phase 3+)**: Depend on Foundational completion
- **Polish (Phase 6)**: Depends on all desired user stories being complete
- **Automated Verification (Phase 7)**: Depends on the touched feature work and
  the relevant story phases being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational; no dependency on later stories
- **User Story 2 (P2)**: Can start after Foundational; should not depend on Story 3
- **User Story 3 (P3)**: Can start after Foundational; may reuse Story 1 session data

### Within Each User Story

- Shared types and scaffolding first
- Backend state/route behavior before frontend wiring
- Frontend session/polling behavior before UI polish
- Complete each story before starting the next priority

### Parallel Opportunities

- `T001`, `T002`, `T003` can run in parallel because they touch different files
- `T005` and `T006` can run in parallel after `T004`
- `T008` and `T009` can run in parallel after `T007`
- `T011` and `T012` can run in parallel after `T010`
- `T014`, `T015`, and `T016` can run in parallel after `T013`
- `T020` and `T021` can run in parallel once the corresponding code paths exist

## Implementation Strategy

### MVP First

1. Complete Setup and Foundational work
2. Complete User Story 1
3. Validate create/join and host assignment
4. Stop and review before adding room isolation and polling rules

### Incremental Delivery

1. Foundation ready
2. Add host-aware create/join flow
3. Add invalid-code handling and room isolation
4. Add lobby polling and host-only start
5. Finish with manual validation and cleanup

### Parallel Team Strategy

1. One person can handle backend room store and route work
2. A second person can wire frontend session and lobby state
3. A third person can handle UI feedback and manual validation once the backend
   contract is stable

## Notes

- `[P]` tasks = different files, no dependencies
- `[Story]` label maps task to the specific user story
- Keep each story independently testable before moving to the next one
- Automated verification tasks are included to match the plan's explicit Vitest
  coverage commitment
