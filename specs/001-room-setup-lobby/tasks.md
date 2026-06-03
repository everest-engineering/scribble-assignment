# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/api-endpoints.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Contains exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify repository scaffolding and initial build baseline.

- [X] T001 Verify backend and frontend projects build cleanly using `npm run build` in both `backend/` and `frontend/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core model updates and validations required before implementing individual user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] Update TypeScript models in `backend/src/models/game.ts` to support playing status, participant lastActiveAt, and room snapshot hostId properties
- [X] T003 [P] Update request validation schemas in `backend/src/api/schemas.ts` to validate player nickname lengths (1-20 characters, trimmed) and room codes (6 alphanumeric characters)
- [X] T004 [P] Update frontend API TypeScript interfaces in `frontend/src/services/api.ts` to match updated room snapshot types
- [X] T005 [P] Update frontend store types in `frontend/src/state/roomStore.ts` to align with new API response schemas

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Host Creates a Room (Priority: P1) 🎯 MVP

**Goal**: Host can create a room, receive a 6-character room code, and enter the lobby as host.

**Independent Test**: Create a room via UI, verify a 6-character alphanumeric code is displayed, and check that the creator is shown as the host.

### Implementation for User Story 1

- [X] T006 [P] [US1] Update room code generation logic in `backend/src/services/roomStore.ts` to generate a 6-character alphanumeric code
- [X] T007 [P] [US1] Implement name validation and lastActiveAt initialization in createRoom in `backend/src/services/roomStore.ts`
- [X] T008 [US1] Implement input trimming and validation error displaying in `frontend/src/pages/CreateRoomPage.tsx`
- [X] T009 [US1] Add unit tests for room creation schema validations in `backend/src/api/schemas.test.ts`

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Player Joins an Existing Room (Priority: P1)

**Goal**: Other players can join the room via code, enforcing capacity limits and name uniqueness.

**Independent Test**: Attempt to join a room with a duplicate name or when capacity (12 players) is reached, verifying clear rejection feedback is displayed.

### Implementation for User Story 2

- [X] T010 [P] [US2] Update joinRoom in `backend/src/services/roomStore.ts` to enforce a maximum capacity check of 12 players
- [X] T011 [P] [US2] Update joinRoom in `backend/src/services/roomStore.ts` to enforce nickname uniqueness check (trimmed, case-insensitive) in the room
- [X] T012 [US2] Implement input trimming, room code length limits, and API error formatting in `frontend/src/pages/JoinRoomPage.tsx`
- [X] T013 [US2] Add unit tests for joining validations (duplicate names, room capacity) in `backend/src/api/schemas.test.ts`

**Checkpoint**: User Stories 1 and 2 work together. Players can join rooms securely.

---

## Phase 5: User Story 3 - Lobby Polling and Starting the Game (Priority: P2)

**Goal**: Lobby list auto-refreshes via polling, inactive players prune, and only host can start game with >= 2 players.

**Independent Test**: Open two sessions, check auto-polling refresh list every 2 seconds, verify host button state, and confirm automatic redirect to `/game` when started.

### Implementation for User Story 3

- [X] T014 [P] [US3] Implement background interval to prune players after 10 seconds of no polling in `backend/src/services/roomStore.ts`
- [X] T015 [P] [US3] Update GET /rooms/:code route in `backend/src/api/rooms.ts` to update the polling participant's lastActiveAt timestamp
- [X] T016 [P] [US3] Implement POST /rooms/:code/start route in `backend/src/api/rooms.ts` to validate host credentials and start game
- [X] T017 [P] [US3] Add API calls for starting a game room in `frontend/src/services/api.ts` and `frontend/src/state/roomStore.ts`
- [X] T018 [US3] Implement auto-polling (every 2s), host-specific start controls, and auto-navigation to `/game` in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: All user stories are complete. Game rooms can be setup, populated, and started.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cross-story verification, automated testing, and build validations.

- [X] T019 Run all backend unit tests using `npm run test` in `backend/`
- [X] T020 Verify clean production builds using `npm run build` in both `backend/` and `frontend/`
- [X] T021 Validate end-to-end user scenarios and polling in local browser according to `specs/001-room-setup-lobby/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - Sequential execution is recommended: US1 (MVP) → US2 → US3
- **Polish (Phase 6)**: Depends on all user stories being complete

### Parallel Opportunities

- Foundational tasks (T002, T003, T004, T005) can run in parallel since they modify separate files.
- Model and generation changes for US1 (T006, T007) can be done in parallel.
- Capacity checks and uniqueness checks for US2 (T010, T011) can be done in parallel.
- Backend infrastructure for start-game/heartbeats (T014, T015, T016, T017) can be written in parallel.

---

## Parallel Example: User Story 1

```bash
# Implement room model generation changes and backend validations concurrently:
Task: "Update room code generation logic in backend/src/services/roomStore.ts to generate a 6-character alphanumeric code"
Task: "Implement name validation and lastActiveAt initialization in createRoom in backend/src/services/roomStore.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Room Creation)
4. **STOP and VALIDATE**: Verify room creation via UI and code format.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deliver Room Creation (MVP)
3. Add User Story 2 → Test capacity limits and joins
4. Add User Story 3 → Verify polling, automatic cleanup, and host game start
5. Verify clean builds and test suites
