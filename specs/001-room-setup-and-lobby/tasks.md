# Tasks: Room Setup and Lobby

**Input**: Design documents from `/specs/001-room-setup-and-lobby/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Constitution requires tests for new schemas and roomStore helpers.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm brownfield baseline before changes

- [X] T001 Verify backend and frontend dev scripts run from repo root per quickstart.md
- [X] T002 [P] Confirm default API base URL in frontend/src/services/api.ts is http://localhost:3001 (fix /bug if present)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared backend types and validation used by all user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Add hostParticipantId to Room and RoomSnapshot in backend/src/models/game.ts
- [X] T004 [P] Add playerNameSchema with trim and 1–24 length validation in backend/src/api/schemas.ts
- [X] T005 [P] Add normalizePlayerName helper and export MAX_PARTICIPANTS=8 in backend/src/services/roomStore.ts
- [X] T006 [P] Add negative and positive tests for playerNameSchema in backend/src/api/schemas.test.ts
- [X] T007 [P] Add normalizePlayerName unit tests in backend/src/services/roomStore.test.ts

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 - Create a room as host (Priority: P1) 🎯 MVP

**Goal**: Creator becomes host; names validated; rooms isolated

**Independent Test**: Create room as Alice; verify hostParticipantId matches participantId; second room has different code/roster

### Implementation for User Story 1

- [X] T008 [US1] Set hostParticipantId in createRoom and include in toRoomSnapshot in backend/src/services/roomStore.ts
- [X] T009 [US1] Use playerNameSchema and normalizePlayerName in POST /rooms handler via backend/src/api/rooms.ts
- [X] T010 [US1] Add createRoom host and name rejection tests in backend/src/services/roomStore.test.ts
- [X] T011 [P] [US1] Mirror hostParticipantId on RoomSnapshot in frontend/src/services/api.ts
- [X] T012 [US1] Add client-side trim/empty/length validation on CreateRoomPage in frontend/src/pages/CreateRoomPage.tsx

**Checkpoint**: Room creation with host tracking works end-to-end

---

## Phase 4: User Story 2 - Join a room by code (Priority: P1)

**Goal**: Valid joins succeed; invalid codes and full rooms rejected clearly

**Independent Test**: Bob joins Alice's code; invalid code and 9th player get clear errors

### Implementation for User Story 2

- [X] T013 [US2] Enforce 8-participant cap and name validation in joinRoom in backend/src/services/roomStore.ts
- [X] T014 [US2] Map join cap overflow to HttpError 409 in backend/src/api/rooms.ts
- [X] T015 [US2] Add join cap and name validation tests in backend/src/services/roomStore.test.ts
- [X] T016 [US2] Add client-side code and name validation on JoinRoomPage in frontend/src/pages/JoinRoomPage.tsx

**Checkpoint**: Join flow with validation and cap enforced

---

## Phase 5: User Story 3 - Automatic lobby sync and host-only start gating (Priority: P1)

**Goal**: 2 s polling replaces manual refresh; Start gated to host with 2+ players

**Independent Test**: Two tabs sync without refresh; non-host and solo host see disabled Start with reasons

### Implementation for User Story 3

- [X] T017 [P] [US3] Create useRoomPolling hook with 2000 ms interval and visibility pause in frontend/src/hooks/useRoomPolling.ts
- [X] T018 [P] [US3] Add useRoomPolling tests with Vitest fake timers in frontend/src/hooks/useRoomPolling.test.ts
- [X] T019 [US3] Add silent fetchRoomPoll method to frontend/src/state/roomStore.ts (no isLoading toggle)
- [X] T020 [US3] Wire polling, remove Refresh button, add host/2-player Start gating in frontend/src/pages/LobbyPage.tsx
- [X] T021 [P] [US3] Show host badge on participant list for host in frontend/src/pages/LobbyPage.tsx

**Checkpoint**: Lobby auto-sync and Start gating complete

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Tests, builds, and validation

- [X] T022 [P] Add api default URL assertion test in frontend/src/services/api.test.ts
- [X] T023 Run cd backend && npm test && npm run build
- [X] T024 Run cd frontend && npm test && npm run build
- [X] T025 Run node .github/scripts/pre-evaluation-check.mjs

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3–5)**: Depend on Foundational; US2/US3 depend on US1 backend snapshot shape
- **Polish (Phase 6)**: Depends on all user stories

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no other story dependencies
- **US2 (P1)**: After US1 backend snapshot includes hostParticipantId
- **US3 (P1)**: After US1 frontend types include hostParticipantId

### Parallel Opportunities

- T004, T005, T006, T007 can run in parallel after T003
- T011 parallel with backend US1 tasks after T003
- T017, T018 parallel with T019

---

## Parallel Example: User Story 3

```bash
# Hook + tests in parallel:
T017: frontend/src/hooks/useRoomPolling.ts
T018: frontend/src/hooks/useRoomPolling.test.ts
# Then integrate:
T019: frontend/src/state/roomStore.ts
T020: frontend/src/pages/LobbyPage.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1–2
2. Complete Phase 3 (US1)
3. **STOP and VALIDATE**: create room, confirm host

### Incremental Delivery

1. Add US2 → validate join + cap
2. Add US3 → validate polling + Start gating
3. Polish → full test/build/precheck pass

---

## Notes

- Do NOT implement POST /rooms/:code/start (Scenario 2)
- Start button navigates to /game only when host + 2 players
- Poll must not set isLoading to avoid UI flicker
