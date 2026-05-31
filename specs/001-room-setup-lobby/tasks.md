---
description: "Task list for Room Setup & Lobby (Scenario 1)"
---

# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/rooms.md ✅

**Tests**: Not requested. Manual two-tab acceptance verification is the validation gate.

**Organization**: Tasks grouped by user story to enable independent implementation
and testing of each story slice.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- File paths are relative to repository root

---

## Phase 1: Setup

**Purpose**: No project initialization needed — starter is already configured.
This phase is intentionally empty; proceed to Phase 2.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend and frontend type definitions that every user story depends on.
All user story phases are blocked until this phase is complete.

- [x] T001 Extend `RoomStatus` to `"lobby" | "game"`, add `hostId: string` to `Room` and `RoomSnapshot` interfaces in `backend/src/models/game.ts`
- [x] T002 [P] Add `hostId: string` to `RoomSnapshot` interface and extend `status` type to `"lobby" | "game"` in `frontend/src/services/api.ts`

**Checkpoint**: Backend and frontend type contracts aligned — user story work can begin.

---

## Phase 3: User Story 1 — Create Room as Host (Priority: P1) 🎯 MVP

**Goal**: Player creates a room, is automatically the host, lands on Lobby showing
their name and a disabled Start Game button.

**Independent Test**: Open one browser tab, enter a name, create a room. Confirm the
Lobby screen shows the room code, the player's name, and a disabled "Start Game"
button (only 1 player present).

### Implementation for User Story 1

- [x] T003 Update `createRoomSchema` to `z.string().trim().min(1, "Player name is required")` in `backend/src/api/schemas.ts`
- [x] T004 [P] Set `hostId = participant.id` in `createRoom()` and include `hostId` in `toRoomSnapshot()` output in `backend/src/services/roomStore.ts`
- [x] T005 [P] Add client-side trim + empty name check before calling `roomStore.createRoom()` in `frontend/src/pages/CreateRoomPage.tsx`

**Checkpoint**: User Story 1 fully functional — create room, host tracking, name validation.

---

## Phase 4: User Story 2 — Join Room by Code (Priority: P1)

**Goal**: Second player joins using the room code, lands on the Lobby alongside
the host. Empty/invalid inputs are rejected with clear messages.

**Independent Test**: Open a second browser tab, enter the host's room code and a
valid name, join. Confirm both participants appear in each tab's Lobby after the
next poll. Confirm empty name and empty/non-existent room code are each rejected
with a message.

### Implementation for User Story 2

- [x] T006 [P] Update `joinRoomSchema` to `z.string().trim().min(1, "Player name is required")` in `backend/src/api/schemas.ts`
- [x] T007 [P] Add client-side trim + empty check for both `playerName` and `roomCode` before calling `roomStore.joinRoom()` in `frontend/src/pages/JoinRoomPage.tsx`

**Checkpoint**: User Stories 1 and 2 both work independently. Two players can be
in the same lobby.

---

## Phase 5: User Story 3 — Lobby Polling & Participant Sync (Priority: P2)

**Goal**: Lobby participant list updates automatically every 2 seconds without
any user action.

**Independent Test**: With two tabs in the same room (US1 + US2 done), open a
third tab and join. Confirm the new participant appears in the other two tabs
within approximately 2 seconds without clicking anything.

### Implementation for User Story 3

- [x] T008 Replace manual-only refresh with `setInterval(poll, 2000)` in a `useEffect` with `clearInterval` cleanup on unmount in `frontend/src/pages/LobbyPage.tsx`; keep existing "Refresh Room" manual button

**Checkpoint**: Lobby auto-refreshes every 2 seconds. Manual refresh still works.

---

## Phase 6: User Story 4 — Host-Only Start Game (Priority: P2)

**Goal**: Host sees an enabled "Start Game" button only when ≥ 2 players are
present; non-hosts do not see an active start control; clicking start transitions
all clients to the Game screen via polling.

**Independent Test**: With two tabs (one host, one joiner), confirm only the host
tab shows an enabled Start Game button. Confirm with 1 player the button is
disabled. Confirm host clicking Start Game navigates both tabs to `/game`.

### Implementation for User Story 4 — Backend

- [x] T009 Add `startRoomSchema` (`participantId: z.string().trim().min(1)`) to `backend/src/api/schemas.ts`
- [x] T010 Add `startRoom(code, participantId)` service function to `backend/src/services/roomStore.ts` — returns 404/403/400 signals and sets `status: "game"` on success
- [x] T011 Add `POST /:code/start` route using `startRoomSchema` and `startRoom()` in `backend/src/api/rooms.ts` (depends on T010)

### Implementation for User Story 4 — Frontend

- [x] T012 [P] Add `api.startGame(code: string, participantId: string)` calling `POST /rooms/:code/start` in `frontend/src/services/api.ts`
- [x] T013 Add `startGame()` action to `RoomStore` using `api.startGame()` with `withLoading` wrapper in `frontend/src/state/roomStore.ts` (depends on T012)
- [x] T014 Update `frontend/src/pages/LobbyPage.tsx`: derive `isHost = room.hostId === participantId`; render Start Game button only for host; disable when `participants.length < 2` with "Need at least 2 players" hint; wire `handleStartGame()`; navigate to `/game` when poll detects `status === "game"` (depends on T013)

**Checkpoint**: Host-only Start Game works end to end. Both tabs navigate to Game screen on start.

---

## Phase 7: User Story 5 — Room Isolation (Priority: P2)

**Goal**: Participants and state in one room never appear in another room.

**Independent Test**: Create two rooms in two separate browser sessions. Join
room A in one session; confirm only room A's participants appear. Join room B in
the other session; confirm only room B's participants appear.

### Implementation for User Story 5

- [x] T015 Verify room isolation manually: create two rooms in separate sessions, confirm participant lists are independent (no code changes needed — isolation is guaranteed by the existing `Map<string, Room>` keyed by unique code)

**Checkpoint**: All five user stories independently functional and verified.

---

## Phase 8: Polish & Build Validation

**Purpose**: TypeScript build checks and full Scenario 1 acceptance run.

- [x] T016 [P] Run `cd backend && npm run build` and confirm zero TypeScript errors
- [x] T017 [P] Run `cd frontend && npm run build` and confirm zero TypeScript errors
- [x] T018 Two-tab manual acceptance run: create room → join → lobby polls → host starts → both tabs land on Game screen; verify all edge cases (empty name, empty code, non-existent code, non-host start blocked)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately
- **US1 (Phase 3)**: Depends on Phase 2 completion
- **US2 (Phase 4)**: Depends on Phase 2 completion; can run in parallel with US1
- **US3 (Phase 5)**: Depends on US1 + US2 completion
- **US4 (Phase 6)**: Depends on US3 completion (polling must be working to detect `status="game"`)
- **US5 (Phase 7)**: Depends on US1 + US2 completion (verification only)
- **Polish (Phase 8)**: Depends on all user story phases

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — no story dependencies
- **US2 (P1)**: Can start after Foundational — no story dependencies; parallel with US1
- **US3 (P2)**: Requires US1 + US2 (needs two players in a room to test polling)
- **US4 (P2)**: Requires US3 (navigate-on-status depends on polling already working)
- **US5 (P2)**: Requires US1 + US2 (needs two rooms to verify isolation)

### Within Each User Story

- Backend schema changes before backend service/handler changes
- Backend changes before frontend type changes that depend on them
- `api.ts` type changes before `roomStore.ts` action changes
- `roomStore.ts` action changes before page-level consumption

### Parallel Opportunities

| Tasks              | Why Parallel                                         |
| ------------------ | ---------------------------------------------------- |
| T001 + T002        | Different files (backend model vs frontend types)    |
| T003 + T004 + T005 | Different files (schemas, roomStore, CreateRoomPage) |
| T006 + T007        | Different files (schemas, JoinRoomPage)              |
| T009 + T012        | Different files (backend schema, frontend api)       |
| T016 + T017        | Independent build commands                           |

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 2: Foundational (T001, T002)
2. Complete Phase 3: US1 (T003–T005)
3. **STOP and VALIDATE**: Create room, confirm host tracking, confirm name validation
4. Proceed to US2

### Incremental Delivery

1. Phase 2 → Phase 3 (US1) → validate → commit
2. Phase 4 (US2) → validate two-tab join → commit
3. Phase 5 (US3) → validate auto-poll → commit
4. Phase 6 (US4) → validate start game → commit
5. Phase 7 (US5) → validate isolation → commit
6. Phase 8 → build checks → full acceptance run → commit

---

## Notes

- `[P]` tasks touch different files with no blocking inter-dependencies
- `[Story]` label maps each task to its acceptance criteria in spec.md
- Commit after each task or logical group; reference task ID in commit message
- US5 has no implementation tasks — room isolation is guaranteed by existing `Map` structure
- The `displayName()` fallback removal (part of T004) is safe once T003 ensures non-empty names reach the service layer
