# Tasks: Room Setup & Lobby

**Input**: Design documents from `/specs/001-room-setup-lobby/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rooms-api.md, quickstart.md

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: User story label (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Confirm environment and design context before code changes.

- [x] T001 Confirm branch `001-room-setup-lobby` and review spec.md, plan.md, and contracts/rooms-api.md in specs/001-room-setup-lobby/
- [x] T002 Verify starter runs: `cd backend && npm run dev` and `cd frontend && npm run dev` (health + start page)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared model and schema changes required by all user stories.

**⚠️ CRITICAL**: No user story work begins until this phase completes.

- [x] T003 Extend `RoomStatus`, add `hostId` to `Room` and `RoomSnapshot` in backend/src/models/game.ts
- [x] T004 Set `hostId` on `createRoom` and expose `hostId` in `toRoomSnapshot` in backend/src/services/roomStore.ts
- [x] T005 [P] Add `roomCodeSchema` and `startGameSchema` in backend/src/api/schemas.ts
- [x] T006 [P] Mirror `hostId` and `"playing"` status on `RoomSnapshot` in frontend/src/services/api.ts
- [x] T007 Add Vitest case that `createRoom` sets `hostId` to creator participant id in backend/src/services/roomStore.test.ts

**Checkpoint**: Backend create returns snapshot with `hostId`; frontend types compile.

---

## Phase 3: User Story 1 — Host Creates a Room (Priority: P1) 🎯 MVP

**Goal**: Creator gets a unique room code, enters lobby, and is shown as `(Host)`.

**Independent Test**: One tab — create room → lobby shows code + `(Host)` label on creator.

### Implementation for User Story 1

- [x] T008 [US1] Ensure POST /rooms response snapshot includes `hostId` via backend/src/api/rooms.ts and backend/src/services/roomStore.ts
- [x] T009 [US1] Render `(Host)` label when `participant.id === room.hostId` in frontend/src/pages/LobbyPage.tsx
- [x] T010 [US1] Verify create-room flow still navigates to lobby with RoomCodeBadge in frontend/src/pages/CreateRoomPage.tsx and frontend/src/pages/LobbyPage.tsx

**Checkpoint**: Single-browser create → lobby shows code and host label (US1 acceptance scenarios 1–3).

---

## Phase 4: User Story 2 — Player Joins by Room Code (Priority: P2)

**Goal**: Valid joins succeed; empty, malformed, not-found, and post-start joins show distinct errors; rooms stay isolated.

**Independent Test**: Two tabs — Tab A hosts; Tab B joins with valid code and appears in Tab A list only.

### Implementation for User Story 2

- [x] T011 [US2] Reject `joinRoom` when `status !== "lobby"` in backend/src/services/roomStore.ts
- [x] T012 [US2] Return 404 `Room not found` and 409 `Game already in progress` from POST /:code/join in backend/src/api/rooms.ts
- [x] T013 [P] [US2] Create `normalizeRoomCode` and `validateRoomCode` in frontend/src/utils/roomCode.ts
- [x] T014 [US2] Validate empty and malformed codes before API call in frontend/src/pages/JoinRoomPage.tsx
- [x] T015 [US2] Map join API errors to user-facing not-found vs in-progress messages in frontend/src/pages/JoinRoomPage.tsx
- [x] T016 [P] [US2] Add Vitest cases for join rejected when room is playing in backend/src/services/roomStore.test.ts

**Checkpoint**: Join validation matrix from quickstart.md §3 passes; two-tab join updates host lobby (US2 scenarios 1–6).

---

## Phase 5: User Story 3 — Lobby Sync and Host-Controlled Start (Priority: P3)

**Goal**: ~2s auto-polling, host-only start with 2-player minimum, auto-navigate all clients to game on start.

**Independent Test**: Two tabs in same room — joiner appears within ~3s without refresh; host start moves both to `/game`.

### Implementation for User Story 3

- [x] T017 [US3] Implement `startGame(code, participantId)` with host and min-player checks in backend/src/services/roomStore.ts
- [x] T018 [US3] Add POST /:code/start route per specs/001-room-setup-lobby/contracts/rooms-api.md in backend/src/api/rooms.ts
- [x] T019 [P] [US3] Add Vitest cases for startGame host auth and two-player minimum in backend/src/services/roomStore.test.ts
- [x] T020 [US3] Add `startGame(code, participantId)` to frontend/src/services/api.ts
- [x] T021 [US3] Add `startGame()` method on RoomStore in frontend/src/state/roomStore.ts
- [x] T022 [US3] Add ~2000ms polling with interval cleanup in frontend/src/pages/LobbyPage.tsx
- [x] T023 [US3] Auto-navigate to `/game` when snapshot `status === "playing"` in frontend/src/pages/LobbyPage.tsx
- [x] T024 [US3] Wire Start Game to `roomStore.startGame()` (not client-only navigate) in frontend/src/pages/LobbyPage.tsx
- [x] T025 [US3] Show Start Game only for host; hide or disable for non-host in frontend/src/pages/LobbyPage.tsx
- [x] T026 [US3] Block host start when fewer than two participants with clear message in frontend/src/pages/LobbyPage.tsx
- [x] T027 [US3] Keep manual Refresh Room working alongside polling in frontend/src/pages/LobbyPage.tsx

**Checkpoint**: quickstart.md §4–§6 pass — polling, start rules, auto-navigation (US3 scenarios 1–6).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end validation and build health.

- [x] T028 Run full manual checklist in specs/001-room-setup-lobby/quickstart.md (two tabs, isolation, builds)
- [x] T029 [P] Run `npm run build` in backend/ and frontend/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → **User Stories (Phases 3–5)** → **Polish (Phase 6)**
- User stories SHOULD complete in priority order: US1 → US2 → US3
- US2 depends on US1 (need a host room to join)
- US3 depends on US2 (need two players to test start)

### User Story Dependencies

| Story | Depends on | Independently testable after |
|-------|------------|------------------------------|
| US1 (P1) | Foundational | Phase 3 complete — single tab |
| US2 (P2) | US1 + Foundational | Phase 4 complete — two tabs, join only |
| US3 (P3) | US2 + Foundational | Phase 5 complete — polling + start |

### Within Each User Story

- Backend service logic before API routes
- API routes before frontend API client
- Frontend store before page wiring
- Story checkpoint before next priority

### Parallel Opportunities

- **Foundational**: T005 ∥ T006 (backend schemas vs frontend types)
- **US2**: T013 ∥ T016 (roomCode util vs Vitest while T011–T012 in progress on backend)
- **US3**: T019 ∥ T020 (Vitest vs frontend api after T017–T18)
- **Polish**: T029 parallel backend/frontend builds

---

## Parallel Example: User Story 2

```bash
# After T011–T012 land on backend:
Task T013: "Create roomCode utils in frontend/src/utils/roomCode.ts"
Task T016: "Add join-when-playing Vitest in backend/src/services/roomStore.test.ts"

# Then sequentially:
Task T014: "JoinRoomPage client validation"
Task T015: "JoinRoomPage API error mapping"
```

---

## Parallel Example: User Story 3

```bash
# Backend first (sequential):
Task T017 → T018

# Then in parallel:
Task T019: "Vitest startGame cases"
Task T020: "api.startGame in frontend/src/services/api.ts"

# Frontend page (sequential after T021):
Task T021 → T022 → T023 → T024 → T025 → T026 → T027
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup  
2. Complete Phase 2: Foundational  
3. Complete Phase 3: User Story 1  
4. **STOP and VALIDATE**: Single tab — create room, see code + `(Host)`  
5. Demo MVP if ready  

### Incremental Delivery

1. Setup + Foundational → shared model ready  
2. Add US1 → validate single-tab host lobby  
3. Add US2 → validate two-tab join + error matrix  
4. Add US3 → validate polling, start, auto-navigate  
5. Polish → quickstart + builds  

### Suggested Commit Slices

| Commit scope | Tasks |
|--------------|-------|
| Backend foundation | T003–T007, T008 |
| US1 lobby UI | T009–T010 |
| US2 join validation | T011–T016 |
| US3 lobby sync + start | T017–T027 |
| Validation | T028–T029 |

---

## Notes

- Tests included for backend service layer only (per plan.md); spec does not mandate TDD.
- No new npm dependencies expected.
- Drawer, secret word, and gameplay remain out of scope (Scenario 2+).
- [P] tasks touch different files — avoid same-file parallel edits.
