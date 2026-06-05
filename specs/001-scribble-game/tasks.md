---
description: "Task list for Room Setup & Lobby (Scenario 1)"
---

# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/001-scribble-game/`

**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/api.md ✅

**Tests**: Not requested — manual two-tab validation per `quickstart.md`.

**Organization**: Tasks are grouped by user story to enable independent implementation
and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths included in every description

---

## Phase 1: Setup

**Purpose**: Confirm the starter runs before any changes are made.

- [x] T001 Start backend (`cd backend && npm run dev`) and confirm `http://localhost:3001/health` returns `{ "ok": true }`
- [x] T002 Start frontend (`cd frontend && npm run dev`) and confirm `http://localhost:5173` shows the Start screen

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the shared data model — required before any user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 [P] Extend `RoomStatus` to `"lobby" | "active"` and add `hostId: string` to `Room` and `RoomSnapshot` interfaces in `backend/src/models/game.ts`
- [x] T004 [P] Add `hostId: string` to the `RoomSnapshot` interface and widen the `status` field type to include `"active"` in `frontend/src/services/api.ts`

**Checkpoint**: Data model updated — user story implementation can begin.

---

## Phase 3: User Story 1 — Create Room & Become Host (Priority: P1) 🎯 MVP

**Goal**: A player creates a room, becomes host automatically, and lands on the lobby
showing their name. Blank/whitespace names are rejected inline.

**Independent Test**: Open one tab, create a room with name "Alice" — confirm lobby
shows Alice and the room code. Try submitting a blank name — confirm inline error.

### Implementation for User Story 1

- [x] T005 [US1] Require trimmed non-empty `playerName` in `createRoomSchema` — change `z.string().optional()` to `z.string().min(1, "Player name cannot be empty")` with `.transform(s => s.trim())` in `backend/src/api/schemas.ts`
- [x] T006 [US1] In `createParticipant`, trim the name before storing; in `createRoom`, set `hostId: participant.id` on the new room; in `toRoomSnapshot`, include `hostId: room.hostId` in the returned object — all in `backend/src/services/roomStore.ts`
- [x] T007 [US1] In `CreateRoomPage`, trim the `playerName` state value before calling `roomStore.createRoom`; if the trimmed value is empty, set an inline error and return early without calling the API — in `frontend/src/pages/CreateRoomPage.tsx`

**Checkpoint**: User Story 1 independently functional — room creation, host assignment,
and name validation all work.

---

## Phase 4: User Story 2 — Join Room by Code (Priority: P1)

**Goal**: A second player joins an existing room by entering the correct code and a
valid name. Bad codes and blank names are rejected with visible messages.

**Independent Test**: Use the code from Phase 3. Open a second tab, join as "Bob" —
confirm both names appear in the lobby. Try a non-existent code and a blank name.

### Implementation for User Story 2

- [x] T008 [US2] Require trimmed non-empty `playerName` in `joinRoomSchema` — same change as T005 for the join schema — in `backend/src/api/schemas.ts`
- [x] T009 [US2] In `JoinRoomPage`, trim the `playerName` state value before calling `roomStore.joinRoom`; if the trimmed value is empty, set an inline error and return early — in `frontend/src/pages/JoinRoomPage.tsx`
- [x] T009b [US2] In `joinRoom()` in `backend/src/services/roomStore.ts`, check `room.status === "active"` after the null check and return `{ error: "ROOM_ACTIVE" } as const`; in the `POST /:code/join` handler in `backend/src/api/rooms.ts`, check for this error value and throw `HttpError(400, "Game already started")` — covers FR-011

**Checkpoint**: User Stories 1 and 2 both work independently — two players can join
the same room and see each other.

---

## Phase 5: User Story 3 — Lobby Auto-Refresh (Priority: P2)

**Goal**: The lobby participant list updates automatically at ~2 s intervals. All players
see new joiners without pressing Refresh. The lobby navigates to `/game` automatically
when `room.status` becomes `"active"`.

**Independent Test**: Host tab open on lobby. Join from a second tab. Within 2 s the
host tab shows the new participant without any interaction.

### Implementation for User Story 3

- [x] T010 [US3] In `LobbyPage`, add a `useEffect` that starts a `setInterval` (2 000 ms) on mount; each tick calls `roomStore.fetchRoom()` inside a try/catch — on success clear any poll error state and navigate to `/game` if `room.status === "active"`; on failure set a local `pollError` string shown as an inline message (error clears on next successful poll); clear the interval with `clearInterval` on unmount; remove the manual Refresh button — in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: Lobby auto-refreshes every ~2 s and all players navigate to `/game`
once status becomes active.

---

## Phase 6: User Story 4 — Host-Only Start with Minimum Players (Priority: P2)

**Goal**: Only the host sees an enabled Start Game button, and only when ≥ 2 players
are present. Clicking it transitions all players to the game screen via the status poll.

**Independent Test**: Two players in lobby — host tab shows enabled Start Game button,
joiner tab shows none. Click Start in host tab — both tabs navigate to `/game`.

### Implementation for User Story 4

- [x] T011 [US4] Add `startRoomSchema = z.object({ participantId: z.string().min(1) })` in `backend/src/api/schemas.ts`
- [x] T012 [US4] Add `startRoom(code: string, participantId: string)` function to `backend/src/services/roomStore.ts`: fetch the room (404 if missing), check `participantId === room.hostId` (throw `HttpError(403, "Only the host can start")` if not), check `room.participants.length >= 2` (throw `HttpError(400, "Need at least 2 players")` if not), set `room.status = "active"`, call `saveRoom`, return the updated snapshot
- [x] T013 [US4] Add `POST /rooms/:code/start` route to `backend/src/api/rooms.ts`: parse `code` from params (uppercase), parse body with `startRoomSchema`, call `startRoom(code, participantId)`, respond 200 with `{ room: snapshot }`
- [x] T014 [P] [US4] Add `startGame(code: string, participantId: string)` method to the `api` object in `frontend/src/services/api.ts` that calls `POST /rooms/:code/start` with `{ participantId }` and returns `{ room: RoomSnapshot }`
- [x] T015 [US4] Add `async startGame()` method to the `RoomStore` class in `frontend/src/state/roomStore.ts`: call `api.startGame(this.state.room.code, this.state.participantId)` inside `withLoading`, then call `setRoomSnapshot` with the result
- [x] T016 [US4] In `LobbyPage`, derive `isHost = participantId === room.hostId` and `canStart = isHost && room.participants.length >= 2`; render the Start Game button only when `isHost`; disable it when `!canStart`; on click, call `roomStore.startGame()` (navigation is handled by the polling interval from T010) — in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: All four user stories work independently — full Scenario 1 flow passes.

---

## Phase 7: Polish & Validation

**Purpose**: End-to-end verification and build confirmation.

- [x] T017 Walk through all scenarios in `specs/001-scribble-game/quickstart.md` with two browser tabs — all acceptance scenarios must pass
- [x] T018 [P] Run `cd backend && npm run build` — must exit 0 with no TypeScript errors
- [x] T019 [P] Run `cd frontend && npm run build` — must exit 0 with no TypeScript errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — verify starter works first
- **Foundational (Phase 2)**: Depends on Phase 1 — **blocks all user stories**
- **US1 (Phase 3)**: Depends on Phase 2 — first story, no other story dependency
- **US2 (Phase 4)**: Depends on Phase 2 — independent of US1 (different forms, different schema)
- **US3 (Phase 5)**: Depends on US1 + US2 being done (need a working join flow to test polling)
- **US4 (Phase 6)**: Depends on US1 (needs hostId from T006) and US3 (polling drives navigation)
- **Polish (Phase 7)**: Depends on all user stories complete

### Within Each User Story

- Backend schema → backend service → backend route → frontend types → frontend store → frontend page
- T003 and T004 are [P] (different files, no dependency between them)
- T014 [P] can be started as soon as T004 is done, while backend tasks T011–T013 proceed in parallel

### Parallel Opportunities

```bash
# Phase 2: both foundational tasks touch different files
T003  # backend/src/models/game.ts
T004  # frontend/src/services/api.ts

# Phase 6: frontend api type update can proceed while backend is built
T011  # backend/src/api/schemas.ts
T012  # backend/src/services/roomStore.ts
T013  # backend/src/api/rooms.ts
T014  # frontend/src/services/api.ts  ← [P] runs alongside T011–T013

# Phase 7: both builds are independent
T018  # backend build
T019  # frontend build
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Create room, confirm host, confirm name rejection

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3: US1 → Room creation works with host tracking
3. Phase 4: US2 → Join flow works with name validation
4. Phase 5: US3 → Auto-refresh working (both tabs see each other within 2 s)
5. Phase 6: US4 → Host-only start sends all players to game screen
6. Phase 7: Full validation + builds pass

---

## Notes

- [P] tasks = different files, no incomplete dependencies
- [Story] label maps each task to its user story for traceability
- T010 (polling) must be complete before T016 (Start Game click) because navigation
  relies on the polling loop detecting `status: "active"`, not a direct `navigate()` call
- Keep the manual Refresh button visible during development for debugging; remove or
  demote it to secondary once polling is verified
