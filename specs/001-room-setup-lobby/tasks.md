---
description: "Task list for Room Setup & Lobby (Scenario 1)"
---

# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api.md ✅

**Tests**: Unit tests included for backend service and schema changes. Frontend tests
included for the API client and store additions.

**Organization**: Tasks are grouped by user story to enable independent implementation
and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Fix the starter bug and extend shared types before any story work begins.
These tasks have zero story dependencies and unblock all subsequent phases.

- [x] T001 Fix `API_BASE_URL` typo in `frontend/src/services/api.ts` — change `"http://localhost:3001/bug"` to `"http://localhost:3001"`
- [x] T002 [P] Extend `RoomStatus` in `backend/src/models/game.ts` to `"lobby" | "active"`
- [x] T003 [P] Add `hostId: string` to `Room` interface in `backend/src/models/game.ts`
- [x] T004 [P] Add `hostId: string` to `RoomSnapshot` interface in `backend/src/models/game.ts`
- [x] T005 [P] Widen `status` to `"lobby" | "active"` and add `hostId: string` to `RoomSnapshot` in `frontend/src/services/api.ts`

**Checkpoint**: Types compile; all existing tests still pass (`npm test` in both `backend/` and `frontend/`).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend schema validation tightening blocks all story work that touches
the API boundary. Must be complete before any story endpoint or UI changes.

**⚠️ CRITICAL**: US1, US2, US3, and US4 all rely on the Zod schemas and `roomStore`
service being updated.

- [x] T006 Tighten `createRoomSchema` in `backend/src/api/schemas.ts` — change `playerName` from `z.string().optional()` to `z.string().trim().min(1, "Player name is required")`
- [x] T007 Tighten `joinRoomSchema` in `backend/src/api/schemas.ts` — same change as T006 for the join schema
- [x] T008 [P] Add `startRoomSchema` to `backend/src/api/schemas.ts` — `z.object({ participantId: z.string().uuid("Invalid participant ID") })`
- [x] T009 Update `createRoom()` in `backend/src/services/roomStore.ts` — store `hostId: participant.id` on the `Room` object
- [x] T010 Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` — include `hostId: room.hostId` in the returned `RoomSnapshot`

**Checkpoint**: `npm test` in `backend/` passes; POST `/rooms` with a blank name returns 400.

---

## Phase 3: User Story 1 — Create Room & Become Host (Priority: P1) 🎯 MVP

**Goal**: Creator is assigned as host; `hostId` flows through to the snapshot; empty
names are rejected before room creation.

**Independent Test**: Single browser tab — create a room with a valid name, observe
the Lobby with a Start Game button (visible for creator). Try submitting an empty name
and confirm an inline error appears.

- [x] T011 [US1] Add client-side empty/whitespace name guard to `CreateRoomPage.tsx` — trim `playerName`, set inline error and return early if blank (no API call made)
- [x] T012 [P] [US1] Add unit test to `backend/src/services/roomStore.test.ts` — assert that the `Room` returned by `createRoom("Alice")` has `hostId === participants[0].id`
- [x] T013 [P] [US1] Add schema test to `backend/src/api/schemas.test.ts` — assert `createRoomSchema.safeParse({ playerName: "" })` fails and `createRoomSchema.safeParse({ playerName: "  " })` fails

**Checkpoint**: `createRoom("Alice")` returns a room with `hostId` set; `createRoom("")` throws a Zod error; UI shows inline error for blank name.

---

## Phase 4: User Story 2 — Join Room via Code (Priority: P2)

**Goal**: Joiner can enter a code and name to join; empty code or name is rejected
client-side; unknown code returns a friendly error from the server.

**Independent Test**: Two tabs — Tab A creates, Tab B joins using the room code. Tab B
lands on Lobby. Submitting blank name or blank code on Tab B shows inline errors.

- [x] T014 [US2] Add client-side empty/whitespace name guard to `JoinRoomPage.tsx` — trim `playerName`, set inline error and return early if blank
- [x] T015 [US2] Add client-side empty/whitespace code guard to `JoinRoomPage.tsx` — trim `roomCode`, set inline error and return early if blank (no API call)
- [x] T016 [P] [US2] Add schema test to `backend/src/api/schemas.test.ts` — assert `joinRoomSchema.safeParse({ playerName: "" })` fails and `joinRoomSchema.safeParse({ playerName: "  " })` fails
- [x] T017 [P] [US2] Add unit test to `backend/src/services/roomStore.test.ts` — assert `joinRoom("XXXX", "Bob")` returns `null` (unknown code) and `joinRoom(validCode, "Bob")` adds Bob to participants with host still set to Alice's id

**Checkpoint**: Two tabs can join the same room; blank inputs on both Create and Join pages show errors without API calls.

---

## Phase 5: User Story 3 — Lobby Auto-Polling (Priority: P3)

**Goal**: Lobby refreshes participant list automatically every ~2 s without any user
interaction.

**Independent Test**: Tab A on Lobby; Tab B joins the same room; within ~2 s Tab A's
participant list shows Tab B's player without Tab A clicking anything.

- [x] T018 [US3] Replace manual Refresh button in `LobbyPage.tsx` with `useEffect` auto-poll — add `setInterval(() => roomStore.fetchRoom(), 2000)` inside a `useEffect` that depends on `[room?.code]`; clear the interval on unmount with the returned cleanup function
- [x] T019 [US3] Remove the manual `handleRefresh` function and Refresh button from `LobbyPage.tsx`
- [x] T020 [P] [US3] Add `startRoom(code: string, participantId: string)` method to `frontend/src/services/api.ts` — `POST /rooms/:code/start` with body `{ participantId }`
- [x] T021 [P] [US3] Add `startRoom()` method to `frontend/src/state/roomStore.ts` — calls `api.startRoom(room.code, participantId)` inside `withLoading`, then calls `setRoomSnapshot` with the returned room

**Note**: T020 and T021 are placed here (not Phase 4) because they are needed before the Start button in Phase 5/US4, but can be built in parallel while polling is wired up.

**Checkpoint**: Tab A Lobby auto-refreshes participants; manual Refresh button is gone; no memory leaks (interval cleared on navigate away).

---

## Phase 6: User Story 4 — Host-Only Start Game (Priority: P4)

**Goal**: Start Game button visible only to host; disabled when <2 players; clicking it
transitions room to `"active"` and navigates to Game screen.

**Independent Test**: Host (Tab A) sees Start button disabled with 1 player, enabled
with 2+. Non-host (Tab B) sees no Start button. Clicking Start on Tab A transitions
the room; Tab B sees the update on next poll.

- [x] T022 [US4] Add `POST /rooms/:code/start` route handler to `backend/src/api/rooms.ts` — parse `startRoomSchema`, look up room (404 if missing), check `participantId === room.hostId` (403 if not), check `participants.length >= 2` (409 if not), call new `startRoom()` service function, return `{ room: toRoomSnapshot(...) }`
- [x] T023 [US4] Add `startRoom(code: string)` function to `backend/src/services/roomStore.ts` — set `room.status = "active"`, call `saveRoom(room)`, return updated snapshot
- [x] T024 [P] [US4] Update `LobbyPage.tsx` to derive `isHost` — compute `const isHost = room.hostId === participantId` using state from `useRoomState()` (which already exposes `participantId`)
- [x] T025 [US4] Update `LobbyPage.tsx` Start Game button area — render the Start Game button only when `isHost`; disable it when `room.participants.length < 2`; on click call `roomStore.startRoom()` then `navigate("/game")`; render a "Waiting for host to start…" message for non-hosts
- [x] T026 [P] [US4] Add host indicator to participant list in `LobbyPage.tsx` — append `" (host)"` or a badge to the participant whose `id === room.hostId`
- [x] T027 [P] [US4] Add unit test to `backend/src/services/roomStore.test.ts` — assert `startRoom()` transitions status to `"active"`; assert calling it on a 1-player room throws (or returns appropriate error)
- [x] T028 [P] [US4] Add API test to `backend/src/api/rooms.ts` (or integration test) — assert `POST /rooms/:code/start` with non-host `participantId` returns 403; with <2 players returns 409

**Checkpoint**: Full two-tab flow: create room, join from second tab, host clicks Start Game, both tabs navigate to Game screen via polling.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Tighten edge cases, improve error messages, and ensure room isolation is
verifiable.

- [x] T029 Verify room code comparison is case-insensitive end-to-end — confirm `toUpperCase()` normalization in `rooms.ts` (`/:code/join` and `/:code` routes) handles lower-case input from clients
- [x] T030 [P] Confirm polling does not navigate away on a failed fetch cycle in `LobbyPage.tsx` — add error boundary / try-catch around `roomStore.fetchRoom()` in the polling effect so a single 404/network error is swallowed and retried on next tick
- [x] T031 [P] Ensure the `fetchRoom` call in `roomStore.ts` (frontend) does not throw through to the polling interval — wrap `api.fetchRoom(...)` in a try/catch; on error, keep existing `room` state intact

---

## Dependencies

```
T001–T005  (Setup)
    │
    ▼
T006–T010  (Foundational — schemas + hostId on service)
    │
    ├──► T011–T013  US1 (Create Room) — independent after Foundation
    │
    ├──► T014–T017  US2 (Join Room)   — independent after Foundation
    │        depends on US1 for create-then-join test flow
    │
    ├──► T018–T021  US3 (Polling + startRoom client) — independent after Foundation
    │
    └──► T022–T028  US4 (Start Game endpoint + UI)
             depends on: T018–T021 (startRoom client methods T020–T021)
                         T009–T010 (hostId on service)
    │
    ▼
T029–T031  (Polish) — after all US phases
```

## Parallel Execution Opportunities

| Group | Tasks | What runs in parallel |
|-------|-------|-----------------------|
| Setup | T002, T003, T004, T005 | All model/type additions across backend+frontend files |
| Foundation | T008 | `startRoomSchema` alongside T006–T007 tightening |
| US1 | T012, T013 | Backend tests alongside UI guard (T011) |
| US2 | T016, T017 | Backend tests alongside UI guards (T014–T015) |
| US3 | T020, T021 | API client + store methods alongside polling effect |
| US4 | T024, T026, T027, T028 | Host indicator, tests, and API tests run in parallel with T022–T023 |

## Implementation Strategy

1. **MVP (Phase 1 + 2 + Phase 3)**: Fix the bug, add `hostId`, tighten schemas →
   verifiable with a single tab; creator's `participantId` matches `room.hostId`.

2. **Increment 2 (Phase 4 — US2)**: Join flow validation → verifiable with two tabs.

3. **Increment 3 (Phase 5 — US3)**: Auto-polling + client `startRoom` prep →
   verifiable by watching Tab A update when Tab B joins.

4. **Increment 4 (Phase 6 — US4)**: Start endpoint + host-gated UI → verifiable with
   two tabs clicking Start and observing navigation.

5. **Polish (Phase 7)**: Edge case hardening after all increments pass.
