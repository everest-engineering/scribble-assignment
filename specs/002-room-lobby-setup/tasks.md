# Tasks: Phase 1 Room Lobby Setup

**Input**: Design documents from `/specs/002-room-lobby-setup/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Verification tasks are REQUIRED. Each user story includes explicit manual
validation tasks using `specs/002-room-lobby-setup/quickstart.md`. Optional unit
checks may be added during implementation if pure helpers are extracted, but they
are not required for this phase.

**Organization**: Tasks are grouped by user story to enable independent implementation
and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Documentation for this feature: `specs/002-room-lobby-setup/`

## Current Starter Coverage

- Room creation, join, room fetch, and manual lobby refresh already exist.
- Multi-room isolation already exists through the in-memory room map.
- Create/Join/Lobby page routing already exists.
- The remaining work extends these starter flows to satisfy Phase 1 rather than
  recreating them.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align the existing starter behavior with the approved Phase 1 contract.

- [X] T001 Sync the implementation target with specs/002-room-lobby-setup/contracts/rooms.yaml and specs/002-room-lobby-setup/quickstart.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the starter state, contract, and store groundwork that MUST
exist before user story behavior changes ship.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Extend shared backend room and participant types for host and playing state in backend/src/models/game.ts
- [X] T003 Tighten backend validation schemas for trimmed names, exact 4-character room codes, and start requests in backend/src/api/schemas.ts
- [X] T004 Extend backend room state helpers and snapshot shaping with host-aware Phase 1 state in backend/src/services/roomStore.ts
- [X] T005 Extend backend room routes to use the stricter validation and expanded room snapshot contract in backend/src/api/rooms.ts
- [X] T006 [P] Extend frontend room API types and request helpers for hostId, playing status, and start-room requests in frontend/src/services/api.ts
- [X] T007 Extend frontend room store state with derived lobby permissions and polling/start hooks in frontend/src/state/roomStore.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Create and Join a Lobby (Priority: P1) 🎯 MVP

**Goal**: Players can create or join a lobby with trimmed valid names and clear room-code feedback.

**Independent Test**: A player can create a room and land in the lobby as host, and
a second player can join the same room with a valid name/code while blank,
whitespace-only, malformed, and not-found inputs are rejected clearly.

### Tests for User Story 1 ⚠️

- [X] T008 [US1] Run the Story 1 manual validation flow from specs/002-room-lobby-setup/quickstart.md

### Implementation for User Story 1

- [X] T009 [US1] Extend backend room creation/join logic with host assignment, trimmed name storage, and not-joinable outcomes in backend/src/services/roomStore.ts
- [X] T010 [US1] Extend create/join route responses and error mapping in backend/src/api/rooms.ts
- [X] T011 [P] [US1] Add fast-feedback trimmed-name validation to frontend/src/pages/CreateRoomPage.tsx
- [X] T012 [P] [US1] Add fast-feedback trimmed-name and 4-character room-code validation to frontend/src/pages/JoinRoomPage.tsx
- [X] T013 [US1] Adapt existing create/join session handling to the stricter contract in frontend/src/state/roomStore.ts

**Checkpoint**: User Story 1 is fully functional and testable on its own

---

## Phase 4: User Story 2 - See the Correct Lobby Roster (Priority: P2)

**Goal**: Lobby rosters stay isolated by room and refresh automatically within about two seconds.

**Independent Test**: Two concurrent rooms never leak participants across each
other, and a waiting player sees a new joiner appear in the correct lobby within
about two seconds without manual refresh.

### Tests for User Story 2 ⚠️

- [X] T014 [US2] Run the Story 2 manual validation flow from specs/002-room-lobby-setup/quickstart.md

### Implementation for User Story 2

- [X] T015 [US2] Preserve room-scoped fetch behavior while extending deterministic room snapshot reads in backend/src/services/roomStore.ts
- [X] T016 [US2] Add lobby polling lifecycle and transient refresh-error handling to frontend/src/state/roomStore.ts
- [X] T017 [US2] Extend frontend/src/pages/LobbyPage.tsx with auto-refresh roster updates and non-destructive refresh feedback

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: User Story 3 - Start From the Lobby as Host (Priority: P3)

**Goal**: Only the host can start the game, and only when at least two players are present.

**Independent Test**: In a one-player lobby the start control is disabled with the
minimum-player reason, in a two-player lobby non-host players see the host-only
restriction, and a valid host start moves all clients to the existing `/game`
screen after the room status becomes `playing`.

### Tests for User Story 3 ⚠️

- [X] T018 [US3] Run the Story 3 manual validation flow from specs/002-room-lobby-setup/quickstart.md

### Implementation for User Story 3

- [X] T019 [US3] Extend backend room state transitions with host-only start guards and playing status in backend/src/services/roomStore.ts
- [X] T020 [US3] Add the POST /rooms/:code/start endpoint and status-specific error mapping in backend/src/api/rooms.ts
- [X] T021 [US3] Add the start-room request helper and widened room status typing in frontend/src/services/api.ts
- [X] T022 [US3] Add start-room action handling and lobby permission derivation to frontend/src/state/roomStore.ts
- [X] T023 [US3] Extend frontend/src/pages/LobbyPage.tsx with disabled start states, host-only messaging, and playing-status navigation

**Checkpoint**: All user stories are independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency, documentation alignment, and required build checks
across the whole feature.

- [X] T024 Update feature validation notes and any implementation-specific clarifications in specs/002-room-lobby-setup/quickstart.md
- [X] T025 [P] Review backend and frontend code for redundant logic and tighten shared messaging in backend/src/api/rooms.ts and frontend/src/state/roomStore.ts
- [X] T026 Run backend build validation in backend/package.json
- [X] T027 Run frontend build validation in frontend/package.json

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion; benefits from the
  updated session handling in User Story 1 but remains independently testable
- **User Story 3 (Phase 5)**: Depends on Foundational completion and uses the
  updated lobby/store behavior from earlier phases
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: First MVP slice; no feature dependency on other stories
- **User Story 2 (P2)**: Builds on the same room/session state but can be verified
  independently once foundational work is complete
- **User Story 3 (P3)**: Uses the shared room/session model and final lobby state
  behavior from prior phases

### Within Each User Story

- Manual verification task defined before closing the story
- Backend service/state changes before route or page integration
- API/store wiring before page-level behavior
- Story must pass its independent validation before moving on

### Parallel Opportunities

- T006 can run in parallel with backend foundational tasks once the contract is fixed
- T011 and T012 can run in parallel in separate frontend page files
- T026 and T027 can run in parallel after implementation is complete

---

## Parallel Example: User Story 1

```bash
# Launch the independent form updates together:
Task: "Add fast-feedback trimmed-name validation to frontend/src/pages/CreateRoomPage.tsx"
Task: "Add fast-feedback trimmed-name and 4-character room-code validation to frontend/src/pages/JoinRoomPage.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Stop and run Story 1 manual validation from `specs/002-room-lobby-setup/quickstart.md`

### Incremental Delivery

1. Finish setup and foundational contract/state work
2. Deliver User Story 1 for create/join validation and host auto-join
3. Add User Story 2 polling and room isolation verification
4. Add User Story 3 host-only start behavior
5. Finish with build validation and documentation cleanup

### Parallel Team Strategy

With multiple developers:

1. One developer handles backend foundational tasks while another updates
   `frontend/src/services/api.ts`
2. After foundational work, split Create/Join page work and Lobby page work
3. Rejoin for start-flow integration and final manual validation

---

## Notes

- All tasks follow the required checklist format with IDs, labels, and file paths
- Manual validation is required for each user story in this phase
- No tasks introduce WebSockets, persistence, auth, multiple rounds, timers,
  drawer rotation, or later gameplay logic
