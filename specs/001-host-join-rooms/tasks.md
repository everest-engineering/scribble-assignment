# Tasks: Host and Join Game Rooms

**Input**: Design documents from `/specs/001-host-join-rooms/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rooms-api.md, quickstart.md

**Tests**: Included per constitution Principle V and plan testing strategy (test-first for `roomStore` and route contracts).

**Organization**: Tasks grouped by user story for independent implementation and verification.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Brownfield alignment—no new project scaffold; wire feature constants and verify toolchain.

- [ ] T001 Verify local dev commands in `backend/package.json` and `frontend/package.json` match plan (dev, build, test)
- [ ] T002 [P] Add room feature constants (`MAX_PARTICIPANTS=10`, `PRESENCE_TIMEOUT_MS=30000`, `LOBBY_POLL_MS=2000`) in `backend/src/services/roomConstants.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, validation, and error shapes required by all user stories.

**⚠️ CRITICAL**: No user story work until this phase is complete.

- [ ] T003 Extend `Room`, `Participant`, `RoomSnapshot`, and `RoomStatus` (`lobby` | `drawing` | `result`) in `backend/src/models/game.ts` per `data-model.md` (`hostParticipantId`, `lastSeenAt`, `viewer` fields)
- [ ] T004 [P] Add trimmed `playerName` Zod schemas and `roomCode` normalization in `backend/src/api/schemas.ts`
- [ ] T005 [P] Extend `HttpError` usage and central error handler mapping for 400/404/409 in `backend/src/api/errorHandler.ts` (or existing error middleware in `backend/src/app.ts`)
- [ ] T006 [P] Mirror snapshot/viewer types in `frontend/src/services/api.ts` for typed client responses

**Checkpoint**: Types and validation ready—user story phases can begin.

---

## Phase 3: User Story 1 - Host Creates a Room (Priority: P1) 🎯 MVP

**Goal**: Create room with valid trimmed name; creator is host; unique 4-char code; lobby shows prominent code, full participant list, and host badge.

**Independent Test**: Single browser creates room → sees prominent 4-char code, self in participant list as host, empty/whitespace name rejected (quickstart step 1).

### Tests for User Story 1

> Write tests FIRST; ensure they FAIL before implementation.

- [ ] T007 [P] [US1] Add failing tests for `createRoom` host assignment, name trim, and empty-name rejection in `backend/src/services/roomStore.test.ts`
- [ ] T008 [P] [US1] Add failing contract test for `POST /rooms` 201/400 in `backend/src/api/rooms.test.ts`

### Implementation for User Story 1

- [ ] T009 [US1] Implement `createRoom` with `hostParticipantId`, trim/reject name, and `lastSeenAt` in `backend/src/services/roomStore.ts`
- [ ] T010 [US1] Update `toRoomSnapshot` with `hostParticipantId` and `viewer.isHost` / `canStart` in `backend/src/services/roomStore.ts`
- [ ] T011 [US1] Wire `POST /rooms` validation and 400 responses in `backend/src/api/rooms.ts`
- [ ] T012 [P] [US1] Add client-side name trim and validation UX in `frontend/src/pages/CreateRoomPage.tsx`
- [ ] T013 [US1] Persist `{ roomCode, participantId }` to sessionStorage on create in `frontend/src/state/roomStore.ts`
- [ ] T014 [US1] Show host badge for host participant in `frontend/src/pages/LobbyPage.tsx`
- [ ] T015 [P] [US1] Display room code prominently in lobby (large/copy-friendly UI per FR-012) in `frontend/src/pages/LobbyPage.tsx`
- [ ] T016 [P] [US1] Render full participant list with display names, updating on poll (FR-013) in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: User Story 1 independently testable (create + lobby host UI, visible code, participant list).

---

## Phase 4: User Story 2 - Player Joins with a Room Code (Priority: P1)

**Goal**: Join by code (case-insensitive); reject invalid/empty/full/`drawing` rooms with distinct messages; roster isolation; empty-room code invalid.

**Independent Test**: Second browser joins valid code; wrong/empty/full/`drawing` codes rejected with distinct messages; two rooms stay isolated (quickstart steps 2, 4–5).

### Tests for User Story 2

- [ ] T017 [P] [US2] Add failing tests for join not-found, room-full (10), join blocked when `status === drawing` (not `result`), case-insensitive code, and name trim in `backend/src/services/roomStore.test.ts`
- [ ] T018 [P] [US2] Add failing contract tests for `POST /rooms/:code/join` 404/409/400 in `backend/src/api/rooms.test.ts`

### Implementation for User Story 2

- [ ] T019 [US2] Implement join guards (`lobby` only; 409 when `drawing`; max participants) and uppercase code lookup in `backend/src/services/roomStore.ts`
- [ ] T020 [US2] Implement `pruneStaleParticipants` and delete room when empty in `backend/src/services/roomStore.ts`
- [ ] T021 [US2] Wire join route errors per `contracts/rooms-api.md` in `backend/src/api/rooms.ts`
- [ ] T022 [P] [US2] Add client-side code/name validation messages in `frontend/src/pages/JoinRoomPage.tsx`
- [ ] T023 [US2] Persist session on join and map API error messages in `frontend/src/state/roomStore.ts` and `frontend/src/services/api.ts`

**Checkpoint**: User Stories 1 and 2 work—create, join, isolation, and join error paths.

---

## Phase 5: User Story 3 - Lobby Sync and Host Start (Priority: P2)

**Goal**: ~2s lobby polling; host-only start with ≥2 players; non-host cannot start; resume via `participantId` on GET; transition `lobby` → `drawing`.

**Independent Test**: Two browsers—guest appears within ~2s; only host starts when 2+ players; guest blocked; refresh resumes same participant (quickstart steps 2–3, 7).

### Tests for User Story 3

- [ ] T024 [P] [US3] Add failing tests for `getRoomForParticipant` resume, `startGame` host-only and min players in `backend/src/services/roomStore.test.ts`
- [ ] T025 [P] [US3] Add failing contract tests for `GET /rooms/:code` viewer flags and `POST /rooms/:code/start` in `backend/src/api/rooms.test.ts`

### Implementation for User Story 3

- [ ] T026 [US3] Implement `getRoomForParticipant` (resume `lastSeenAt`, no duplicate row) in `backend/src/services/roomStore.ts`
- [ ] T027 [US3] Implement `startGame(hostParticipantId)` transitioning `lobby` → `drawing` in `backend/src/services/roomStore.ts`
- [ ] T028 [US3] Wire `GET /rooms/:code` and `POST /rooms/:code/start` in `backend/src/api/rooms.ts`
- [ ] T029 [US3] Add `startGame` API method in `frontend/src/services/api.ts`
- [ ] T030 [US3] Add 2000ms lobby polling `useEffect` and hydrate session on mount in `frontend/src/pages/LobbyPage.tsx`
- [ ] T031 [US3] Replace direct `navigate('/game')` with host-only Start calling API when `viewer.canStart` in `frontend/src/pages/LobbyPage.tsx`
- [ ] T032 [P] [US3] Show non-host messaging when start unavailable in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: All three user stories independently functional per spec acceptance scenarios.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates, distinct error copy, and manual validation.

- [ ] T033 [P] Run `npm run build` and `npm test` in `backend/` and fix any type or test failures
- [ ] T034 [P] Run `npm run build` in `frontend/` and fix type errors from snapshot changes
- [ ] T035 Execute full two-browser checklist in `specs/001-host-join-rooms/quickstart.md` and note gaps
- [ ] T036 [P] Align distinct user-visible join/create error strings per FR-005/FR-006 in `backend/src/api/rooms.ts` and frontend pages: (1) empty code → “Room code is required”; (2) unknown/destroyed room → “Room not found”; (3) room full → “Room is full”; (4) `drawing` status → “Game already started”; (5) empty name → “Name is required”

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **blocks all user stories**
- **User Stories (Phases 3–5)**: Depend on Phase 2 — recommended order **US1 → US2 → US3**
- **Polish (Phase 6)**: Depends on desired user stories complete (all three for full feature)

### User Story Dependencies

| Story | Depends on | Can test alone after |
|-------|------------|----------------------|
| US1 | Phase 2 | Phase 3 checkpoint |
| US2 | US1 create path (room must exist) | Phase 4 checkpoint |
| US3 | US1 + US2 (2+ players in lobby) | Phase 5 checkpoint |

### Within Each User Story

1. Tests written and failing  
2. `roomStore` service logic  
3. API routes (`backend/src/api/rooms.ts`)  
4. Frontend pages/state  

### Parallel Opportunities

- T002, T004, T005, T006 in parallel (different files)  
- Per story: test pairs T007+T008, T017+T018, T024+T025  
- After T011: T012, T014, T015, T016 in parallel (LobbyPage / CreateRoomPage)  
- T033 and T034 in parallel in polish  

---

## Parallel Example: User Story 1

```bash
# Tests in parallel:
T007: backend/src/services/roomStore.test.ts
T008: backend/src/api/rooms.test.ts

# After T011, frontend in parallel:
T012: frontend/src/pages/CreateRoomPage.tsx
T014, T015, T016: frontend/src/pages/LobbyPage.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 + Phase 2  
2. Complete Phase 3 (US1) through checkpoint  
3. Validate create + host lobby per quickstart step 1  

### Incremental Delivery

1. US1 → demo create/host/code/list  
2. US2 → demo join + error paths  
3. US3 → demo poll + start gate  
4. Phase 6 → ship-ready  

### Parallel Team Strategy

1. Team completes Setup + Foundational together  
2. Then sequential or parallel by story: US1 → US2 → US3 (US2 needs rooms from US1)  

---

## Notes

- **Total tasks**: 36 (T001–T036)  
- **Per story**: Setup 2 | Foundational 4 | US1 10 | US2 7 | US3 9 | Polish 4  
- **Join during `result`**: implement in `004-result-restart-lobby`, not T019  
- **No** WebSockets, database, or auth (constitution + AGENTS.md)  
- `[P]` = safe parallel when files differ and prerequisites are met  
- **FR coverage**: US1 → FR-001–003, 006, 012–013; US2 → FR-004–005, 007, 014–017, 019; US3 → FR-008–011, 015, 018; Polish → T036 + quickstart SC-003–SC-008
