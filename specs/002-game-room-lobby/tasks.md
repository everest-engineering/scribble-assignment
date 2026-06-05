# Tasks: Game Room Lobby

**Input**: Design documents from `specs/002-game-room-lobby/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api.md ✅

**Tests**: Existing tests updated in Polish phase only. No new test files — spec does not request TDD.

**Organization**: Tasks are grouped by user story. Each story is independently testable after its phase completes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (touches different files, no unresolved dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- File paths are relative to the repository root

---

## Phase 1: Setup

**Purpose**: Verify the starter scaffold builds cleanly before any changes are made.

- [x] T001 Confirm baseline — run `npm run build` in both `backend/` and `frontend/` and fix any pre-existing TypeScript errors before proceeding

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core type and store changes that every user story depends on. Must be complete before any user story work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 Fix `API_BASE_URL` in `frontend/src/services/api.ts` — change `http://localhost:3001/bug` to `http://localhost:3001` (without this fix all API calls return 404)
- [x] T003 [P] Extend `backend/src/models/game.ts` — add `hostId: string` field to the `Room` interface, add `hostId: string` to the `RoomSnapshot` interface, and extend `RoomStatus` from `"lobby"` to `"lobby" | "active"`
- [x] T004 [P] Mirror type changes in `frontend/src/services/api.ts` — add `hostId: string` to the `RoomSnapshot` interface and add `"active"` to the `status` union type
- [x] T005 Update `backend/src/services/roomStore.ts` — in `createRoom()` set `room.hostId = participant.id` when constructing the room object; in `toRoomSnapshot()` include `hostId: room.hostId` in the returned snapshot (depends on T003)

**Checkpoint**: Foundation complete — all API responses now include `hostId`, types are consistent across backend and frontend, and the frontend can reach the backend.

---

## Phase 3: User Story 1 — Host Creates a Room (Priority: P1) 🎯 MVP

**Goal**: A player creates a room, receives a unique code, and lands in the lobby as the designated host.

**Independent Test**: Open the app → Create Room → enter a name → submit. Verify: (1) you land on `/lobby`, (2) your name appears in the Participants list, (3) a 4-character room code is displayed. Submitting with an empty name shows an inline error and does not navigate away.

### Implementation

- [x] T006 [US1] Require non-empty `playerName` in `backend/src/api/schemas.ts` — change `createRoomSchema` from `z.string().optional()` to `z.string().min(1).trim()` so the API rejects blank names with HTTP 400
- [x] T007 [P] [US1] Add client-side validation to `frontend/src/pages/CreateRoomPage.tsx` — in `handleSubmit`, check that `playerName.trim()` is non-empty before calling `roomStore.createRoom()`; display an inline error message (using the existing `<p className="form__error">` pattern) if the check fails; do not navigate

**Checkpoint**: User Story 1 complete — room creation works end-to-end; blank name is rejected both server-side (400) and client-side (inline message).

---

## Phase 4: User Story 2 — Player Joins an Existing Room (Priority: P1)

**Goal**: A second player enters a valid room code and joins the lobby; invalid or empty codes are rejected with clear, inline feedback.

**Independent Test**: Tab A creates a room and copies the code. Tab B opens Join Room, enters the code and a name → both names appear in the lobby. Then: (1) submit with empty name → inline error; (2) submit with empty code → inline error; (3) submit with a wrong-length or lowercase code → inline error; (4) submit a correctly-formatted but non-existent code → error "Unable to join room".

### Implementation

- [x] T008 [US2] Tighten `joinRoomSchema` in `backend/src/api/schemas.ts` — change `playerName` from `z.string().optional()` to `z.string().min(1).trim()` (same pattern as T006)
- [x] T009 [US2] Add code format validation to `roomCodeParamsSchema` in `backend/src/api/schemas.ts` — append `.regex(/^[A-Z2-9]{4}$/, "Room code must be 4 uppercase characters")` so malformed codes return HTTP 400 instead of a 404
- [x] T010 [P] [US2] Add client-side validation to `frontend/src/pages/JoinRoomPage.tsx` — before calling `roomStore.joinRoom()`, check: (1) `playerName.trim()` non-empty; (2) `roomCode.trim()` non-empty; (3) `/^[A-Z2-9]{4}$/.test(roomCode)` is true; display a specific inline error message for each failing case using the existing `<p className="form__error">` pattern

**Checkpoint**: User Story 2 complete — valid join works; each invalid input (empty name, empty code, malformed code, unknown code) shows a distinct, correct error without a page reload.

---

## Phase 5: User Story 3 — Lobby Auto-Refresh (Priority: P2)

**Goal**: The lobby player list updates automatically for all participants every ~2 seconds; no manual refresh button is required.

**Independent Test**: Tab A creates a room. Tab B opens the join page. Tab A is on the lobby screen. Tab B joins. Within 2 seconds Tab A's lobby shows both names — without Tab A pressing any button. Leave Tab B open; Tab A's list remains stable with no flickering or errors.

### Implementation

- [x] T011 [US3] Replace the manual "Refresh Room" button with auto-polling in `frontend/src/pages/LobbyPage.tsx`:
  - Remove the `handleRefresh` function and the manual "Refresh Room" `<button>` from the JSX
  - Add a `useEffect` that starts a `setInterval` calling `roomStore.fetchRoom()` every 2000ms
  - Return a cleanup function from the `useEffect` that calls `clearInterval` on the interval ID to stop polling when the component unmounts
  - Wrap the `fetchRoom()` call in a try/catch that swallows errors silently (do not set error state on poll failure — a stale list is acceptable per spec assumptions)
  - Keep the loading indicator in the Status card tied to `isLoading` from `useRoomState()`

**Checkpoint**: User Story 3 complete — lobby refreshes automatically; no polling errors crash the UI; interval is properly cleaned up on navigation away.

---

## Phase 6: User Story 4 — Host Starts the Game (Priority: P2)

**Goal**: Once at least 2 players are present, the host can start the game for everyone; guests cannot start; fewer than 2 players keeps the button disabled.

**Independent Test**: Tab A (host, 2 players present) → "Start Game" button is enabled; click it → both Tab A and Tab B navigate to `/game`. Reset: Tab A with only 1 player → button is visible but disabled with an explanatory message. Reset: Tab B (guest) → no active "Start Game" control visible.

### Implementation

- [x] T012 [P] [US4] Add `startRoomBodySchema` to `backend/src/api/schemas.ts` — `z.object({ participantId: z.string().uuid() })` to validate the start request body
- [x] T013 [US4] Implement `startRoom(code: string, requestingParticipantId: string)` in `backend/src/services/roomStore.ts`:
  - Retrieve the room; return `{ error: "not_found" }` if absent
  - Return `{ error: "forbidden" }` if `requestingParticipantId !== room.hostId`
  - Return `{ error: "not_enough_players" }` if `room.participants.length < 2`
  - Set `room.status = "active"`, persist via `saveRoom()`, and return `{ room: toRoomSnapshot(updatedRoom) }`
  - (depends on T003 and T005)
- [x] T014 [US4] Add `POST /rooms/:code/start` route to `backend/src/api/rooms.ts` — parse body with `startRoomBodySchema`, call `startRoom()`, map error codes to HTTP 403 / 409 / 404, respond with `{ room }` on success (depends on T012, T013)
- [x] T015 [P] [US4] Add `startRoom(code: string, participantId: string)` to `frontend/src/services/api.ts` — `POST /rooms/${encodeURIComponent(code)}/start` with `{ participantId }` body, returning `Promise<{ room: RoomSnapshot }>`
- [x] T016 [US4] Add `startRoom()` action to `frontend/src/state/roomStore.ts` — calls `api.startRoom(room.code, participantId)` inside `withLoading()`, then calls `setRoomSnapshot()` with the returned room (depends on T015)
- [x] T017 [US4] Update `frontend/src/pages/LobbyPage.tsx` for host/guest roles and game-start detection (depends on T011 and T016):
  - Derive `isHost` from `state.participantId === room.hostId`
  - **Host view**: render "Start Game" `<button>` that calls `roomStore.startRoom()` then navigates to `/game`; disable the button with `disabled` attribute and add helper text when `room.participants.length < 2`
  - **Guest view**: render a `<p>` "Waiting for host to start the game." in place of the Start Game button
  - **Both roles**: inside the polling `useEffect` (T011), after `fetchRoom()` resolves, check if `room?.status === "active"` and navigate to `/game` if so

**Checkpoint**: User Story 4 complete — host can start with ≥ 2 players; both tabs transition to `/game`; host with 1 player sees disabled button; guests see no start control.

---

## Phase 7: Polish & Validation

**Purpose**: Update existing tests to match tightened schemas and new model fields; verify the build is clean.

- [x] T018 [P] Update `backend/src/api/schemas.test.ts` — add test cases: `createRoomSchema` rejects empty `playerName`; `joinRoomSchema` rejects empty `playerName`; `roomCodeParamsSchema` rejects codes shorter than 4 chars, lowercase codes, and codes with special characters; `startRoomBodySchema` rejects missing `participantId`
- [x] T019 [P] Update `backend/src/services/roomStore.test.ts` — assert that `createRoom("Alice")` returns a room where `room.hostId === result.participantId`; add a test for `startRoom` happy path (sets `status = "active"`) and for the forbidden case (non-host caller returns forbidden error)
- [x] T020 [P] Update `frontend/src/services/api.test.ts` — add `hostId: "p1"` to all mock `RoomSnapshot` responses so TypeScript strict mode is satisfied
- [x] T021 Run `npm run build` in both `backend/` and `frontend/`; run `npm test` in both packages; fix any TypeScript or test failures before raising a PR

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user story phases
- **Phase 3 (US1)**: Depends on Phase 2 — can start as soon as Foundational completes
- **Phase 4 (US2)**: Depends on Phase 2 — can start in parallel with Phase 3
- **Phase 5 (US3)**: Depends on Phase 2 — can start in parallel with Phases 3 and 4
- **Phase 6 (US4)**: Depends on Phases 2, 5 (T011) — start after US3 lobby polling is in place
- **Phase 7 (Polish)**: Depends on all implementation phases

### User Story Dependencies

- **US1 (P1)**: Foundational only — no dependency on US2, US3, US4
- **US2 (P1)**: Foundational only — no dependency on US1, US3, US4
- **US3 (P2)**: Foundational only — no dependency on US1, US2, US4
- **US4 (P2)**: Foundational + US3 (T011) — the lobby polling logic from US3 is extended in T017 to detect `status === "active"`

### Within Each Phase

- T003 and T004 can run in parallel (different files, same concept)
- T006 and T007 can run in parallel (backend schema vs. frontend page)
- T008, T009, and T010 can run in parallel (T008/T009 are in the same file but non-conflicting additions; T010 is a different file)
- T012, T013, T014 are sequential (schema → service → route)
- T015, T016 are sequential (api client → store action); T015 can run in parallel with T013
- T018, T019, T020 can all run in parallel (different test files)

---

## Parallel Execution Examples

### Phase 2 (Foundational)

```
Parallel group A (can start together after T001):
  Task T002: Fix API_BASE_URL in frontend/src/services/api.ts
  Task T003: Extend backend/src/models/game.ts
  Task T004: Update frontend/src/services/api.ts types

Sequential after T003:
  Task T005: Update backend/src/services/roomStore.ts (createRoom + toRoomSnapshot)
```

### Phase 3 + 4 + 5 (can all run in parallel after Phase 2)

```
Stream A (US1):
  T006 → T007 (backend schema, then frontend page)

Stream B (US2):
  T008 + T009 in parallel → T010 (backend schemas, then frontend page)

Stream C (US3):
  T011 (standalone lobby polling change)
```

### Phase 6 (US4 — sequential pipeline)

```
T012 (schema) + T015 (api client) — parallel start
  ↓
T013 (service — needs T012)
  ↓
T014 (route — needs T013)
T016 (store action — needs T015)
  ↓
T017 (lobby UI — needs T014, T016, T011)
```

---

## Implementation Strategy

### MVP Scope (US1 Only — Phases 1–3)

1. Complete Phase 1: verify baseline build
2. Complete Phase 2: foundational types + URL fix
3. Complete Phase 3: room creation with name validation
4. **Stop and validate**: create a room in the browser, confirm code appears and name shows in lobby

### Incremental Delivery

1. Phases 1–3: Room creation works → **demo-able**
2. Add Phase 4 (US2): Joining works, errors are clear → **two-player lobby demo-able**
3. Add Phase 5 (US3): Lobby refreshes automatically → **live multi-tab demo-able**
4. Add Phase 6 (US4): Host can start game → **full feature complete**
5. Phase 7: Polish and build verification → **PR-ready**

---

## Notes

- `[P]` tasks touch different files and have no unresolved dependencies — safe to run concurrently
- `[Story]` label maps each task to the spec user story for traceability and grading
- Each story phase ends with a Checkpoint — verify acceptance scenarios from `spec.md` in two browser tabs before advancing
- The API base URL fix (T002) is a prerequisite for _everything_ — do not skip it
- `any` is prohibited in TypeScript strict mode; do not use it to work around the new `hostId` field
- Commit granularly: one commit per task or per logical group, with the task ID in the commit message
