---
description: "Task list for Room Setup & Lobby"
---

# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅

**Tests**: Not explicitly requested — test tasks included only for new validation logic.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1–US4)

---

## Phase 1: Setup

**Purpose**: Fix the critical API base-URL bug so all subsequent work can be tested end-to-end.

- [x] T001 Fix API base URL in `frontend/src/services/api.ts` — change `"http://localhost:3001/bug"` to `"http://localhost:3001/api"`

**Checkpoint**: `npm run dev` in both directories; Create Room and Join Room should reach the backend without a "Route not found" error.

---

## Phase 2: Foundational

**Purpose**: Extend the shared data model with `hostId` and tighten input validation — these changes gate all four user stories.

- [x] T002 Add `hostId: string` field to `Room` and `RoomSnapshot` interfaces in `backend/src/models/game.ts`
- [x] T003 Extend `RoomStatus` type in `backend/src/models/game.ts` to `"lobby" | "active" | "completed"`
- [x] T004 [P] Update `RoomSnapshot` type in `frontend/src/services/api.ts` to add `hostId: string` and extend status to `"lobby" | "active" | "completed"`
- [x] T005 Tighten `playerName` Zod schema in `backend/src/api/schemas.ts` — apply `.trim().min(1, "Name cannot be empty.")` so empty/whitespace names are rejected with 422
- [x] T006 Set `hostId` to the creator's participant id in `roomStore.createRoom()` in `backend/src/services/roomStore.ts`
- [x] T007 Uppercase the incoming code before map lookup in `roomStore.joinRoom()` in `backend/src/services/roomStore.ts`
- [x] T008 Include `hostId` in the `toRoomSnapshot()` return value in `backend/src/services/roomStore.ts`
- [x] T009 [P] Add unit tests for `hostId` propagation and name validation in `backend/src/services/roomStore.test.ts`

**Checkpoint**: `npm test` in backend passes. `POST /api/rooms` with `{ "playerName": "" }` returns 422; with a valid name returns 201 with `hostId` in the body.

---

## Phase 3: User Story 1 — Host Creates a Room (Priority: P1)

**Goal**: Player enters name, creates room, lands in lobby as identified host with name trimmed and validated client-side.

**Independent Test**: Single tab — create room with name "  Alice  " → lobby shows "Alice" with "Host" label; empty name submission shows inline error without navigating away.

- [x] T010 [US1] Add client-side name validation to `frontend/src/pages/CreateRoomPage.tsx` — trim name, show "Name cannot be empty." if blank, prevent form submission
- [x] T011 [US1] Pass trimmed name to `roomStore.createRoom()` in `frontend/src/pages/CreateRoomPage.tsx`
- [x] T012 [US1] Display "Host" badge next to the creator's name in `frontend/src/pages/LobbyPage.tsx` — compare `participant.id === room.hostId`

**Checkpoint**: Create room with `"  Alice  "` → lobby shows `Alice` labeled `Host`. Create room with blank name → inline error, no navigation.

---

## Phase 4: User Story 2 — Guest Joins a Room (Priority: P1)

**Goal**: Player enters name and room code, joins existing room, both participants visible in lobby.

**Independent Test**: Two tabs — host creates room, guest joins with correct code → both names appear in each lobby; joining with wrong code shows "Room not found."; joining with blank name shows "Name cannot be empty."; joining with lowercase code works.

- [x] T013 [US2] Add client-side validation to `frontend/src/pages/JoinRoomPage.tsx` — trim name (reject blank with "Name cannot be empty.") and trim+uppercase code (reject blank with "Room code cannot be empty.")
- [x] T014 [US2] Pass trimmed, uppercased code and trimmed name to `roomStore.joinRoom()` in `frontend/src/pages/JoinRoomPage.tsx`
- [x] T015 [US2] Surface server-side error messages (404 "Room not found.") in the join form UI in `frontend/src/pages/JoinRoomPage.tsx`

**Checkpoint**: Join with lowercase code → succeeds. Join with unknown code → "Room not found." Join with blank name → "Name cannot be empty." Join with blank code → "Room code cannot be empty."

---

## Phase 5: User Story 3 — Lobby Auto-Refreshes (Priority: P2)

**Goal**: Lobby polls room state every ~2 seconds so new joiners appear without manual interaction.

**Independent Test**: Two tabs on same lobby — second player joins; first player's participant list updates within 2 seconds with no manual click.

- [x] T016 [US3] Add `startPolling(intervalMs: number)` and `stopPolling()` methods to `RoomStore` in `frontend/src/state/roomStore.ts` — use `setInterval` / `clearInterval`; call `fetchRoom()` on each tick; skip if no room in state
- [x] T017 [US3] Call `store.startPolling(2000)` on mount and `store.stopPolling()` on unmount in `frontend/src/pages/LobbyPage.tsx` via `useEffect`
- [x] T018 [US3] Remove or demote the manual "Refresh Room" button (keep as secondary if desired, but it must no longer be the only update mechanism) in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: Two browser tabs — guest joins; host's lobby shows guest name within 2 seconds automatically.

---

## Phase 6: User Story 4 — Host-Only Game Start (Priority: P2)

**Goal**: Start button visible only to host, disabled until ≥2 players, triggers game transition for all.

**Independent Test**: Host with 1 player sees disabled Start button; with 2 players sees enabled Start button; guest never sees Start button.

- [x] T019 [US4] Gate Start button visibility in `frontend/src/pages/LobbyPage.tsx` — render only when `participantId === room.hostId`
- [x] T020 [US4] Disable Start button when `room.participants.length < 2` in `frontend/src/pages/LobbyPage.tsx`; add hint text "Need at least 2 players to start."
- [x] T021 [US4] Add `POST /api/rooms/:code/start` endpoint to `backend/src/api/rooms.ts` — validates caller is host (via `participantId` query param), validates ≥2 participants, transitions `room.status` to `"active"`, returns updated `RoomSnapshot`
- [x] T022 [US4] Add `startGame(participantId: string)` API call to `frontend/src/services/api.ts`
- [x] T023 [US4] Add `startGame()` method to `RoomStore` in `frontend/src/state/roomStore.ts` — calls `api.startGame`, updates room snapshot, stops polling
- [x] T024 [US4] Wire Start button in `frontend/src/pages/LobbyPage.tsx` to `roomStore.startGame()`, then navigate to `/game` on success
- [x] T025 [US4] Update lobby polling in `frontend/src/pages/LobbyPage.tsx` — when polled `room.status` becomes `"active"`, navigate to `/game` automatically (so all players transition, not only the host)

**Checkpoint**: Host clicks Start with ≥2 players → both tabs navigate to game screen. Guest's tab auto-navigates within ~2 seconds via polling. Host alone → button disabled with hint text.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T026 [P] Verify all new error messages render accessibly — inputs use `aria-describedby` pointing to their error `<span>` in `CreateRoomPage.tsx` and `JoinRoomPage.tsx`
- [x] T027 [P] Run `npm test` in both `backend/` and `frontend/` and confirm all tests pass
- [x] T028 Run quickstart validation from `specs/001-room-setup-lobby/quickstart.md` — manually execute all 5 scenarios (A–E) and confirm expected outcomes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **blocks all user stories**
- **US1 (Phase 3)**: Depends on Phase 2 only
- **US2 (Phase 4)**: Depends on Phase 2 only — can run in parallel with US1
- **US3 (Phase 5)**: Depends on Phase 2 only — can run in parallel with US1 and US2
- **US4 (Phase 6)**: Depends on Phase 2; best started after US3 (polling) is in place so auto-nav works
- **Polish (Phase 7)**: Depends on all user stories complete

### Within Each User Story

- Client validation before API wiring
- API wiring before UI state updates
- Backend endpoint before frontend integration

### Parallel Opportunities

- T002, T003, T004 (type changes across frontend/backend) — different files, safe to parallelize
- T005, T006, T007, T008, T009 — within backend only; T009 test can run alongside T005–T008
- T010 and T013 — different page files, parallelizable
- T016 (store polling) and T019–T020 (button gating) — different concerns, parallelizable
- T026 and T027 — both read-only validation, parallelizable

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 only)

1. Phase 1: Fix the URL bug
2. Phase 2: Add `hostId`, fix validation
3. Phase 3: Host creates room with validated name
4. Phase 4: Guest joins with validated name + code
5. **Stop and validate**: Two tabs can create and join a room with proper error messages

### Incremental Delivery

1. MVP (above) → verifiable two-player lobby
2. Add Phase 5 (auto-polling) → lobby updates without manual refresh
3. Add Phase 6 (host-only Start) → game can be launched

---

## Notes

- [P] tasks involve different files with no shared state — safe to parallelize
- [Story] labels map to spec.md user stories for traceability
- The Start button endpoint (`POST /api/rooms/:code/start`) is defined in this feature group because gating depends on `hostId` and player count; the game logic it triggers belongs to Feature Group 2
- All polling uses `setInterval` — no WebSockets (constitution + AGENTS.md constraint)
