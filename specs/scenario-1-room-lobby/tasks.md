---
description: "Task list for Scenario 1 — Room Setup & Lobby"
---

# Tasks: Scenario 1 — Room Setup & Lobby

**Input**: Design documents from `/specs/scenario-1-room-lobby/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Backend unit tests included for new validation and service logic.

**Organization**: Tasks are grouped by dependency order with a single user story for Scenario 1.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`
- **Frontend**: `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing setup and ensure build/tooling is ready.

- [x] T001 Verify backend compiles (`cd backend && npx tsc --noEmit`) and tests pass (`cd backend && npx vitest run`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core model changes that MUST be complete before US1 implementation.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 Add `hostId: string` to `Room` interface in `backend/src/models/game.ts`
- [ ] T003 Add `hostId: string` to `RoomSnapshot` interface in `backend/src/models/game.ts`
- [ ] T004 Add Zod `.min(1, "Room code is required")` validation to `roomCodeParamsSchema` in `backend/src/api/schemas.ts`
- [ ] T005 [P] Add Zod test for empty code rejection in `backend/src/api/schemas.test.ts`

**Checkpoint**: Foundation ready — Room model has hostId, empty codes are rejected at schema level.

---

## Phase 3: User Story 1 — Host Creates and Manages a Lobby (Priority: P1) 🎯 MVP

**Goal**: A player can create a room as host, share the code, see players join via auto-polling, and start the game once 2+ players are present. Invalid/empty codes are rejected with clear feedback.

**Independent Test**: Open the app, create a room, note the code, open a second browser, join with that code, both see each other within ~2s, host starts the game.

### Implementation for User Story 1

- [ ] T006 [US1] Update `createRoom()` in `backend/src/services/roomStore.ts` to set `hostId` to creator's participant ID
- [ ] T007 [US1] Implement `isHost(room, participantId)` helper in `backend/src/services/roomStore.ts`
- [ ] T008 [US1] Implement `canStartGame(room, participantId)` helper in `backend/src/services/roomStore.ts` (checks host + min 2 players)
- [ ] T009 [US1] Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` to include `hostId` in the returned snapshot
- [ ] T010 [US1] Write unit tests for host assignment, `isHost`, `canStartGame` in `backend/src/services/roomStore.test.ts`

**Checkpoint**: Backend services complete — host tracked, start-validation logic exists.

- [ ] T011 [P] [US1] Implement `POST /rooms/:code/start` endpoint in `backend/src/api/rooms.ts` with host check (403), 2-player minimum (400), and room-not-found (404) per contracts/start-game.md
- [ ] T012 [P] [US1] Add `startGame(code, participantId)` method to frontend API client in `frontend/src/services/api.ts`

**Checkpoint**: API endpoint and client ready.

- [ ] T013 [US1] Add auto-polling at ~2s interval in `frontend/src/pages/LobbyPage.tsx` with `useEffect` + `setInterval` and cleanup on unmount
- [ ] T014 [US1] Conditionally show "Start Game" button only when `room.hostId === participantId` in `frontend/src/pages/LobbyPage.tsx`
- [ ] T015 [US1] Wire start game click to `api.startGame()` and navigate to `/game` on success in `frontend/src/pages/LobbyPage.tsx`
- [ ] T016 [US1] Disable "Start Game" button and show tooltip when `room.participants.length < 2` in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: Lobby fully functional with auto-polling and host-only start.

- [ ] T017 [US1] Add client-side empty room code validation before form submission in `frontend/src/pages/JoinRoomPage.tsx`
- [ ] T018 [US1] Display specific API error messages (empty code vs room not found) in `frontend/src/pages/JoinRoomPage.tsx`

**Checkpoint**: User Story 1 is complete — full Scenario 1 flow works end-to-end.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final verification that Scenario 1 works end-to-end.

- [ ] T019 Run full test suite (`cd backend && npx vitest run && cd ../frontend && npx vitest run`)
- [ ] T020 Run TypeScript compilation check (`cd backend && npx tsc --noEmit && cd ../frontend && npx tsc --noEmit`)

**Checkpoint**: All Scenario 1 requirements implemented, tested, and compiling.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — verify existing tooling
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) completion
- **Polish (Phase 4)**: Depends on User Story 1 completion

### Within User Story 1 (Phase 3)

- Models/services (T006-T010) before API endpoints (T011-T012)
- API endpoint (T011) before frontend wiring (T013-T016)
- Frontend lobby changes (T013-T016) before join validation (T017-T018)
- T011 and T012 can run in parallel (different files)

### Parallel Opportunities

- T004 and T005 can run in parallel
- T011 and T012 can run in parallel
- T013-T016 and T017-T018 could partially overlap with careful file management

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup verification
2. Complete Phase 2: Foundational (model changes — CRITICAL)
3. Complete Phase 3: User Story 1 (services → endpoints → frontend)
4. **STOP and VALIDATE**: Run through quickstart.md test scenarios
5. Do NOT proceed to Scenarios 2, 3, or 4

### Incremental Delivery

1. Setup + Foundational → Models ready
2. Add backend services (T006-T010) → Host tracking works
3. Add API endpoint + client (T011-T012) → Start-game works
4. Add frontend lobby polling (T013-T016) → Lobby auto-refreshes
5. Add join validation (T017-T018) → Error handling complete
6. Polish (T019-T020) → Verified and clean

---

## Notes

- [P] tasks = different files, no dependencies
- [US1] label maps task to User Story 1
- Each phase should be independently verifiable (checkpoints provided)
- All changes are scoped to Scenario 1 only — no future scenario work
- No new libraries or architecture changes permitted
