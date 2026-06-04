---
description: "Task list for Room Setup & Lobby — Scenario 1"
---

# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | data-model.md ✅ | contracts/ ✅ | research.md ✅ | quickstart.md ✅

**Tests**: Not explicitly requested — test tasks omitted. Validation is via quickstart.md manual procedure.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

---

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared state dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Each task includes an exact file path

---

## Phase 1: Setup

**Purpose**: Confirm the baseline builds clean before any changes.

- [ ] T001 Verify baseline — run `npm run build` in `backend/` and `frontend/`; confirm zero errors before starting

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type-level contract changes that every user story depends on. MUST be complete before any user story work begins.

**⚠️ CRITICAL**: No user story implementation can start until T002–T004 pass.

- [ ] T002 Expand `RoomStatus` to `"lobby" | "playing" | "result"` and add `hostId: string` to `Room` and `RoomSnapshot` interfaces in `backend/src/models/game.ts`
- [ ] T003 Mirror type changes in `frontend/src/services/api.ts` — export `type RoomStatus = "lobby" | "playing" | "result"`, add `hostId: string` to `RoomSnapshot`, change `status` field from literal `"lobby"` to `RoomStatus`
- [ ] T004 Verify TypeScript builds pass in both `backend/` and `frontend/` after T002–T003 (`npm run build` in each directory)

**Checkpoint**: Both builds pass with the expanded types — user story work can now begin.

---

## Phase 3: User Story 1 — Host Creates a Room (Priority: P1) 🎯 MVP

**Goal**: Player creates a room, is set as host, and the snapshot includes `hostId`. Empty names are rejected.

**Independent Test**: One browser tab — enter a name, click "Create and Continue", confirm the lobby shows the room code, the player's name, and a "Start Game" button. Also confirm an empty name shows an error and does not create a room.

### Implementation for User Story 1

- [ ] T005 [US1] Add name validation to `createParticipant()` in `backend/src/services/roomStore.ts` — trim the name and throw `HttpError(400, "Player name is required")` if the trimmed value is empty
- [ ] T006 [US1] Set `room.hostId = participant.id` in `createRoom()` in `backend/src/services/roomStore.ts` (depends on T002)
- [ ] T007 [US1] Return `hostId` from `toRoomSnapshot()` in `backend/src/services/roomStore.ts` — include `room.hostId` in the returned `RoomSnapshot` object
- [ ] T008 [P] [US1] Add client-side name validation in `frontend/src/pages/CreateRoomPage.tsx` — trim `playerName` before submit; if empty after trim, set an error message and return without calling the API

**Checkpoint**: Create a room with a valid name → lobby loads with `hostId` in the snapshot. Create with blank/whitespace name → inline error shown, no navigation.

---

## Phase 4: User Story 2 — Player Joins an Existing Room (Priority: P1)

**Goal**: Player joins by code, lands in the lobby with the full participant list. Empty names and invalid codes are rejected.

**Independent Test**: Two tabs — Tab 1 creates a room, Tab 2 joins using the code. Both land in the lobby. Tab 2 with an empty name or invalid code stays on the Join screen with an error.

**Note**: Backend name validation for join is already covered by T005 (shared `createParticipant`). Only frontend validation is added here.

### Implementation for User Story 2

- [ ] T009 [US2] Add client-side validation in `frontend/src/pages/JoinRoomPage.tsx` — trim both `playerName` and `roomCode` before submit; if either is empty after trim, show an error and return without calling the API

**Checkpoint**: Join with valid code and name → lobby. Join with empty name or empty code → inline error. Join with a non-existent code → error from backend ("Unable to join room").

---

## Phase 5: User Story 3 — Lobby Auto-Refreshes Participant List (Priority: P2)

**Goal**: The lobby polls for updates every 2 seconds. New players appear without manual interaction. The manual refresh button is removed. Transient errors appear inline and polling continues.

**Independent Test**: Two tabs both in the lobby — Tab 2 joins; without any clicks on Tab 1, Tab 2's name appears within 3 seconds. Backend restart → inline error on Tab 1 → backend restarts → error clears.

### Implementation for User Story 3

- [ ] T010 [US3] Remove the `handleRefresh` function and the "Refresh Room" `<button>` from `frontend/src/pages/LobbyPage.tsx`
- [ ] T011 [US3] Add `const POLL_INTERVAL_MS = 2000` constant and a `useEffect` with `setInterval(() => store.fetchRoom(), POLL_INTERVAL_MS)` and a `clearInterval` cleanup return in `frontend/src/pages/LobbyPage.tsx` (depends on T010)
- [ ] T012 [US3] Handle poll outcomes in the polling `useEffect` in `frontend/src/pages/LobbyPage.tsx`: on success, if `room.status !== "lobby"` clear the interval and navigate to `/game`; on 404, clear the interval and navigate to `/` with an error message; on any other error, show the error inline and continue polling (depends on T011)

**Checkpoint**: Lobby auto-updates within ~3 s. No manual refresh button. Stopping the backend shows an inline error without crashing or redirecting. Restarting the backend clears the error.

---

## Phase 6: User Story 4 — Host Starts the Game (Priority: P2)

**Goal**: The host can start the game once 2+ players are present. Non-host players cannot trigger start. All players navigate to the game screen after start.

**Independent Test**: Two tabs — host tab shows "Start Game" disabled with correct label when alone; enabled after second player joins; non-host tab has no start button; clicking start navigates both tabs to `/game` within ~2 s.

### Implementation for User Story 4

- [ ] T013 [US4] Add `startRoom(code: string, participantId: string)` to `backend/src/services/roomStore.ts` — validate room exists (404), `participantId === room.hostId` (403), `participants.length >= 2` (409), then set `room.status = "playing"` and return the updated snapshot
- [ ] T014 [US4] Add `startRoomSchema = z.object({ participantId: z.string() })` to `backend/src/api/schemas.ts` (depends on T013)
- [ ] T015 [US4] Add `POST /:code/start` route handler to `backend/src/api/rooms.ts` — parse params with `roomCodeParamsSchema`, parse body with `startRoomSchema`, call `startRoom`, return updated snapshot (depends on T013, T014)
- [ ] T016 [P] [US4] Add `startRoom(code: string, participantId: string)` API function to `frontend/src/services/api.ts` — `POST /rooms/:code/start` with `{ participantId }` body (depends on T003)
- [ ] T017 [US4] Add `async startRoom()` method to `RoomStore` class in `frontend/src/state/roomStore.ts` — calls `api.startRoom(room.code, participantId)` and updates snapshot (depends on T016)
- [ ] T018 [US4] Add host guard and Start Game button to `frontend/src/pages/LobbyPage.tsx` — derive `isHost = room.hostId === participantId`; derive `canStart = isHost && room.participants.length >= 2`; render the button only for the host, disabled with label "Need at least 2 players to start" when `!canStart`; on click call `store.startRoom()` then navigate to `/game` (depends on T012, T017)

**Checkpoint**: Host alone → button disabled with label. Two players → button enabled. Clicking start → host navigates immediately; non-host navigates on next poll. Non-host has no start button.

---

## Phase 7: User Story 5 — Multi-Room Isolation (Priority: P3)

**Goal**: Operations on one room do not affect any other room.

**Independent Test**: Three tabs — Tabs 1 and 2 create separate rooms; Tab 3 joins room 1. Room 2 participant list is unchanged.

**Note**: No code changes required. Isolation is a natural property of the per-code `rooms` Map. This phase is a validation checkpoint only.

### Validation for User Story 5

- [ ] T019 [US5] Verify multi-room isolation using quickstart.md Test 9 — open three browser tabs, create two separate rooms, join one room from a third tab, confirm the other room's participant list is unaffected

**Checkpoint**: Room B is unaffected by join events and start events in Room A.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and quality checks across all user stories.

- [ ] T020 [P] Run full quickstart.md validation — all 9 tests with two browser tabs open simultaneously
- [ ] T021 [P] Run `npm run build` in `backend/` and `frontend/` to confirm zero TypeScript errors post-implementation
- [ ] T022 [P] Review all changed files against the AI self-review checklist (constitution Section 3): type safety, scope, spec alignment, polling hygiene, error handling

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2
- **US2 (Phase 4)**: Depends on Phase 2; shares T005 with US1 (must complete T005 first)
- **US3 (Phase 5)**: Depends on Phase 2
- **US4 (Phase 6)**: Depends on Phase 2, US3 (T012 for poll-based navigation)
- **US5 (Phase 7)**: Depends on US1, US2 being complete (rooms must be creatable/joinable)
- **Polish (Phase 8)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — no dependency on other stories
- **US2 (P1)**: Can start after Foundational — shares T005 (backend name validation); US1 and US2 can be worked in parallel after T005 is done
- **US3 (P2)**: Can start after Foundational — independent of US1/US2
- **US4 (P2)**: Depends on US3 (T012 polling outcome handles post-start navigation); add T018 after T012
- **US5 (P3)**: Validation only; start after US1 and US2 are working

### Within Each User Story

- Backend changes before frontend changes that consume the new API shape
- Model changes (T002–T003) before service changes (T005–T007) before route changes (T013–T015)
- API client changes (T016) before store changes (T017) before page changes (T018)

### Parallel Opportunities

- T002 and T003 can overlap if backend and frontend developers work simultaneously
- T008 (CreateRoomPage) and T009 (JoinRoomPage) are in different files — fully parallel
- T013 (backend startRoom service) and T016 (frontend startRoom API) are in different codebases — parallel
- T020, T021, T022 (polish tasks) are independent — fully parallel

---

## Parallel Example: Phase 6 (US4)

```
Backend track:               Frontend track (after T003):
T013 startRoom service  →    T016 api.startRoom [P with T013]
T014 startRoomSchema    →    T017 store.startRoom (after T016)
T015 POST route         →    T018 LobbyPage host guard (after T017, T012)
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002–T004) — CRITICAL GATE
3. Complete Phase 3: US1 (T005–T008)
4. **STOP and VALIDATE**: Create a room, confirm `hostId` in snapshot, confirm empty name is rejected
5. Continue to US2

### Incremental Delivery

1. Setup + Foundational → type contract ready
2. US1 (create + host) → host identity working
3. US2 (join + validation) → two-player rooms working
4. US3 (polling) → lobby auto-updates
5. US4 (start game) → full game start flow
6. US5 (isolation) → verified correct
7. Polish → builds clean, quickstart passes

---

## Notes

- [P] tasks = different files, no blocking dependencies between them
- [USn] label maps task to the user story in spec.md
- Constitution Principle VI: validate each story manually before moving to the next
- Constitution Principle II: T002 and T003 MUST be committed together (type sync rule)
- Avoid: touching files outside the scope of the current story; adding unrequested abstractions
