---
description: "Task list for Room Setup & Lobby"
---

# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`

**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/rooms-api.md ✅

**Branch**: `001-room-setup-lobby`

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no incomplete-task dependencies)
- **[Story]**: User story this task belongs to (US1–US4)
- Exact file paths are included in every task description

---

## Phase 1: Setup

**Purpose**: Fix the known starter defect before any feature work begins. This unblocks all frontend API calls.

- [ ] T001 Fix default API base URL fallback in `frontend/src/services/api.ts` — change `"http://localhost:3001/bug"` to `"http://localhost:3001/api"`

**Checkpoint**: Frontend can now reach the backend API. All subsequent frontend tasks depend on this.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the shared type model on both backend and frontend. All four user stories require these type changes before their implementation tasks can begin.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 [P] Add `"playing"` to `RoomStatus` type union, add `hostId: string` field to `Room` interface and `RoomSnapshot` interface in `backend/src/models/game.ts`
- [ ] T003 [P] Add `export type RoomStatus = "lobby" | "playing"` and add `hostId: string` to `RoomSnapshot` interface in `frontend/src/services/api.ts`

> T002 and T003 are parallel with **each other**; both depend on Phase 1 (T001) completing first — T001 and T003 both modify `frontend/src/services/api.ts` and must be sequential.

**Checkpoint**: Both backend and frontend type models are aligned. User story phases can now begin.

---

## Phase 3: User Story 1 — Host Creates a Room (Priority: P1) 🎯 MVP

**Goal**: When a player creates a room the creator is automatically recorded as the host (`hostId` equals their `participantId`), and `hostId` is included in every room snapshot returned by the API.

**Independent Test**: Open the app, fill in a player name, click "Create and Continue". Confirm you land on the Lobby screen, see your name in the participant list, and that the API response for `GET /api/rooms/:code` includes a `hostId` field equal to your `participantId`.

- [ ] T004 [US1] Update `createRoom()` in `backend/src/services/roomStore.ts` to assign `hostId: participant.id` on the new room object, and update `toRoomSnapshot()` to include `hostId` in the returned snapshot
- [ ] T005 [P] [US1] Add Vitest unit tests to `backend/src/services/roomStore.test.ts` — assert that after `createRoom()` the returned snapshot's `hostId` equals the returned `participantId`

**Checkpoint**: Creating a room now produces a room with a correct `hostId`. User Story 1 is fully functional and independently testable.

---

## Phase 4: User Story 2 — Guest Joins a Room by Code (Priority: P1)

**Goal**: A guest can join by entering a valid room code. Joining is rejected with a clear error if the code is unknown (404) or if the game is already in progress (409). Two rooms share no data.

**Independent Test**: Open two browser tabs. Create a room in tab 1. In tab 2, enter the code → join → both tabs should show both names after a lobby refresh. In a third tab, enter an invalid code → expect "Room not found". Start the game from tab 1 then try joining from a new tab → expect "Game already in progress".

- [ ] T006 [US2] Add a status guard to `joinRoom()` in `backend/src/services/roomStore.ts` — if `room.status !== "lobby"` throw an `HttpError` with status 409 and message `"Game already in progress"` (depends on T002 type changes, touches different function from T004)
- [ ] T007 [P] [US2] Add Vitest unit tests to `backend/src/services/roomStore.test.ts` — assert `joinRoom()` throws a 409-equivalent error when room status is `"playing"`
- [ ] T008 [P] [US2] Add pre-API validation guards to `frontend/src/pages/JoinRoomPage.tsx` — if `playerName.trim()` is empty, call `setError("Player name is required")` and return before any API call; if `roomCode.trim()` is empty, call `setError("Room code is required")` and return before any API call (covers FR-1 / US2-AC2, AC4 / Constitution IV). Note: API error display for 404/409 already works via the existing `catch → setError(error.message)` path in the current starter code.

> T007 and T008 touch different files — run in parallel.

**Checkpoint**: Guest join flow fully works including rejection cases. User Stories 1 and 2 are both independently testable.

---

## Phase 5: User Story 3 — Lobby Auto-Refreshes via Polling (Priority: P2)

**Goal**: The lobby participant list updates automatically every ~2 seconds without any user action. A single failed poll immediately redirects to `/`. The interval is always cleared on unmount.

**Independent Test**: Open two tabs. Create a room in tab 1. Join from tab 2. Within 2 seconds, the host's lobby in tab 1 should show the new joiner with no button click. Stop the backend server — the lobby should redirect to `/` within ~2 seconds.

- [ ] T009 [US3] Add a `useEffect` polling loop to `frontend/src/pages/LobbyPage.tsx`:
  - On a `setInterval` of 2000ms, call `roomStore.fetchRoom()` (existing method — already calls `api.fetchRoom()` and `setRoomSnapshot()` internally)
  - On success: check the returned room's `status`; if `room.status === "playing"` call `navigate("/game")`
  - On any error: call `clearInterval(intervalId)` then `navigate("/")`
  - Return `() => clearInterval(intervalId)` as the cleanup function

**Checkpoint**: Lobby refreshes automatically. New joiners appear without manual action. Polling stops on unmount or error.

---

## Phase 6: User Story 4 — Only the Host Can Start the Game (Priority: P2)

**Goal**: A host-only "Start Game" button (disabled with < 2 players) transitions the room to `"playing"`. All polling clients automatically navigate to `/game` when the status changes.

**Independent Test**: Create a room in tab 1 (host). Confirm the button is visible but disabled. Join from tab 2 (guest). Confirm tab 2 shows no start button. Confirm tab 1's button becomes enabled after the next poll. Click start — tab 1 navigates immediately; tab 2 navigates within ~2s.

- [ ] T010 [US4] Add `startRoomSchema` Zod schema (accepts empty body) to `backend/src/api/schemas.ts`
- [ ] T011 [US4] Add `startRoom(code: string)` function to `backend/src/services/roomStore.ts` — retrieve room (throw `HttpError` 404 if missing), set `room.status = "playing"`, persist, return `toRoomSnapshot(room)`
- [ ] T012 [US4] Add `POST /:code/start` route handler to `backend/src/api/rooms.ts` — call `startRoom(code.toUpperCase())`, return `{ room: snapshot }` with status 200
- [ ] T013 [P] [US4] Add `startRoom(code: string): Promise<{ room: RoomSnapshot }>` function to `frontend/src/services/api.ts` — `POST /rooms/:code/start` with empty body, return parsed JSON
- [ ] T014 [P] [US4] Add `startRoom()` async method to the `RoomStore` class in `frontend/src/state/roomStore.ts` — call `api.startRoom(this.state.room.code)`, call `this.setRoomSnapshot(room)` on success
- [ ] T015 [US4] Add host-only "Start Game" button to `frontend/src/pages/LobbyPage.tsx`:
  - Access state via `const state = useRoomState()` (returns `RoomState` with `room`, `participantId`, etc.)
  - Render only when `state.participantId === state.room?.hostId`
  - Disabled when `(state.room?.participants.length ?? 0) < 2`
  - On click: call `roomStore.startRoom()` then `navigate("/game")`

> T013 and T014 touch different files — run in parallel. T015 depends on both T014 (action available) and T009 (polling/navigation logic in same component).

**Checkpoint**: Full user story 4 flow works. Host starts game, all players transition to `/game` via polling.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Test coverage for new backend functions and frontend API surface.

- [ ] T016 [P] Add Vitest unit tests for `startRoom()` in `backend/src/services/roomStore.test.ts` — cover success case (status transitions to `"playing"`) and 404 case (unknown code throws)
- [ ] T017 [P] Add tests to `frontend/src/services/api.test.ts` — verify `startRoom()` calls the correct endpoint and the fixed base URL does not contain `/bug`
- [ ] T018 [P] [US1] Add pre-API validation guard to `frontend/src/pages/CreateRoomPage.tsx` — if `playerName.trim()` is empty, call `setError("Player name is required")` and return before any API call (covers FR-1 / US1-AC3 / Constitution IV)

---

## Dependencies

```
T001 (fix URL)           — no deps
T002 [P] (BE model)      — no deps
T003 [P] (FE model)      — no deps

T004 [US1]               — T002
T005 [P][US1]            — T004

T006 [US2]               — T002 (T004 not required; different function in same file)
T007 [P][US2]            — T006
T008 [P][US2]            — T001, T003

T009 [US3]               — T001, T003

T010 [US4]               — T002
T011 [US4]               — T002, T010
T012 [US4]               — T011
T013 [P][US4]            — T001, T003
T014 [P][US4]            — T013
T015 [US4]               — T009, T014

T016 [P]                 — T011
T017 [P]                 — T013
T018 [P][US1]            — no deps (only touches CreateRoomPage.tsx)
```

## Parallel Execution per Story

**Story US1** (after Phase 2 complete):

- T004 → T005 (sequential; T005 needs T004's implementation to test)

**Story US2** (after Phase 2 complete):

- T006 → T007 (sequential in test file)
- T008 runs in parallel with T006 (different file)

**Story US3** (after Phase 2 + T001 complete):

- T009 is a single task — no internal parallelism

**Story US4** (after Phase 3 complete + T009 done for the same file):

- T010 → T011 → T012 (sequential: schema → service → route)
- T013 ‖ T014 (parallel: different FE files)
- T015 (after T014 + T009)
- T016 ‖ T017 (parallel: different files)

## Implementation Strategy

**MVP** (deliver US1 alone — creates a testable room with host tracking):
T001 → T002 ‖ T003 → T004 → T005
= 5 tasks, ~2–3 hours

**Full P1 delivery** (add US2 — two-player rooms with rejection):

- T006 → T007 ‖ T008
  = 3 more tasks

**Full delivery** (add US3 + US4 — live lobby + start game):

- T009 → T010 → T011 → T012 → T013 ‖ T014 → T015 → T016 ‖ T017
  = 9 more tasks

**Total**: 18 tasks across 7 phases
