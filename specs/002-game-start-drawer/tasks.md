---

description: "Task list for Game Start & Drawer Flow"
---

# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `specs/002-game-start-drawer/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/start-endpoint.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependency on incomplete tasks in the same phase)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths are included in every task description

## Path Conventions

```
backend/src/    — Express API (TypeScript)
frontend/src/   — Vite + React SPA (TypeScript)
```

---

## Phase 1: Setup (Baseline Verification)

**Purpose**: Confirm the current codebase builds cleanly before any changes are made.

- [x] T001 Verify TypeScript build passes in backend/ (`cd backend && npm run build`) and frontend/ (`cd frontend && npm run build`) with zero errors as a pre-change baseline

**Checkpoint**: Baseline green — no pre-existing build errors.

---

## Phase 2: Foundational (Type System — Blocks All User Stories)

**Purpose**: Expand the shared data model so every subsequent task has correct types. These changes are in different files and can be done in parallel.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 [P] In `backend/src/models/game.ts`: change `RoomStatus` from `"lobby"` to `"lobby" | "playing"`, add optional fields `drawerName?: string` and `secretWord?: string` to `Room`, and add optional fields `drawerName?: string` and `secretWord?: string` to `RoomSnapshot`
- [x] T003 [P] In `frontend/src/services/api.ts`: change the `status` field type in `RoomSnapshot` from `"lobby"` to `"lobby" | "playing"` and add optional fields `drawerName?: string` and `secretWord?: string` to `RoomSnapshot`

**Checkpoint**: Both projects build cleanly with the expanded types before proceeding.

---

## Phase 3: User Story 1 - Host Starts the Game (Priority: P1) 🎯 MVP

**Goal**: The host can click "Start Game"; the backend transitions the room to playing, assigns the first participant as drawer, and fixes the secret word. The host navigates immediately to `/game`; non-hosts auto-navigate within the next polling cycle.

**Independent Test**: Two browser tabs (host Alice + guest Bob) in the lobby. Alice clicks "Start Game" → Alice's tab navigates immediately to the Game screen. Within 2 seconds, Bob's tab auto-navigates to the Game screen. Both builds must pass.

### Implementation for User Story 1

- [x] T004 [US1] In `backend/src/services/roomStore.ts`: add `export function startGame(code: string)` that (a) looks up the room and throws `HttpError(404)` if not found, (b) throws `HttpError(409, "Game has already started")` if `room.status === "playing"`, (c) throws `HttpError(400, "At least 2 players are required to start")` if `room.participants.length < 2`, (d) sets `room.drawerName = room.participants[0].name`, (e) sets `room.secretWord = STARTER_WORDS[0]`, (f) sets `room.status = "playing"`, and (g) saves and returns the updated room via `saveRoom`
- [x] T005 [P] [US1] In `frontend/src/services/api.ts`: add `startRoom(code: string)` method to the `api` object that sends `POST /rooms/${encodeURIComponent(code)}/start` and returns `Promise<{ room: RoomSnapshot }>`
- [x] T006 [US1] In `backend/src/api/rooms.ts`: add `router.post("/:code/start", ...)` route that calls `startGame(code.toUpperCase())`, catches `HttpError`, and responds with `200 { room: toRoomSnapshot(room) }` on success — import `startGame` from `roomStore.js`
- [x] T007 [US1] In `frontend/src/state/roomStore.ts`: add `async startRoom()` method to the `RoomStore` class that calls `api.startRoom(this.state.room.code)` via `withLoading`, then calls `this.setRoomSnapshot(response.room)` on success; throw if room state is null
- [x] T008 [US1] In `frontend/src/pages/LobbyPage.tsx`: replace the `onClick={() => navigate("/game")}` on the Start Game button with a handler that calls `await roomStore.startRoom()` then `navigate("/game")`; in the polling effect (`scheduleNextPoll`), after `roomStore.pollRoom()` resolves, guard against null — only call `navigate("/game")` if `room !== null && room.status === "playing"`

**Checkpoint**: US1 fully functional. Host clicks "Start Game" → immediate navigation. Guest tab auto-navigates within 2 s. Both TypeScript builds pass. Verify with two browser tabs before moving to US2.

---

## Phase 4: User Story 2 - Drawer Receives the Secret Word (Priority: P2)

**Goal**: After game start, the drawer's room snapshot includes `secretWord: "rocket"`. The Game screen displays this word visibly to the drawer.

**Independent Test**: Alice (drawer) polls the room after game start → response contains `secretWord: "rocket"`. Alice's Game screen shows "rocket" in the Player Info section. Bob's snapshot has no `secretWord` field (US3 coverage).

### Implementation for User Story 2

- [x] T009 [US2] In `backend/src/services/roomStore.ts`: update `toRoomSnapshot()` to (a) look up the viewer participant by `viewerParticipantId` in `room.participants`, (b) include `drawerName: room.drawerName` in the snapshot whenever `room.status === "playing"`, and (c) include `secretWord: room.secretWord` only when the viewer's `name === room.drawerName`; remove the `void viewerParticipantId` stub
- [x] T010 [P] [US2] In `frontend/src/pages/GamePage.tsx`: in the Player Info `<dl>`, add a conditional row that renders `<dt>Secret Word</dt><dd>{room.secretWord}</dd>` only when `room.secretWord` is defined; use a truthy check (`{room.secretWord && ...}`) so the row is absent entirely when the field is missing — this also covers the guesser case (US2 acceptance scenario 4)

**Checkpoint**: Drawer's Game screen shows "rocket"; guesser's Game screen has no "Secret Word" row. Alice's API snapshot contains `secretWord`; Bob's does not. Both TypeScript builds pass. Verify with two tabs (drawer tab + guesser tab) before moving to US3.

---

## Phase 5: User Story 3 - Guessers Do Not Receive the Secret Word (Priority: P3)

**Goal**: Explicitly verify that non-drawer players never receive `secretWord` in their snapshot and see no secret word in the UI. No new code is written in this phase if T009 and T010 were implemented correctly — this phase is a dedicated acceptance verification pass.

**Independent Test**: Bob's (guesser) room snapshot after game start contains `drawerName: "Alice"` but no `secretWord` property. Bob's Game screen Player Info section has no "Secret Word" row.

### Verification for User Story 3

- [x] T011 [US3] Verify `toRoomSnapshot()` (updated in T009): using the two-tab setup, call `GET /rooms/<code>?participantId=<bob's-id>` and confirm the response JSON has no `secretWord` key — the field must be absent from the object, not `null` or `undefined`; if the field is present, fix the condition in `backend/src/services/roomStore.ts` until it is absent
- [x] T012 [P] [US3] Verify `GamePage.tsx` (updated in T010): on Bob's (guesser) Game screen confirm the Player Info section has no "Secret Word" row and no empty label; if the row appears for guessers, fix the truthy check in `frontend/src/pages/GamePage.tsx` until it is absent

**Checkpoint**: Bob's API snapshot has no `secretWord` key. Bob's Game screen has no "Secret Word" row. Both TypeScript builds pass. Verify with two tabs.

---

## Phase 6: User Story 4 - Invalid Names Block Game Start (Priority: P4)

**Goal**: If any participant's name is empty or whitespace-only when game start is requested, the endpoint returns HTTP 400 with a descriptive message and the room remains in lobby state.

**Independent Test**: Direct `POST /rooms/:code/start` on a room that contains a participant with a whitespace-only name → HTTP 400, room status still `"lobby"`. A room with all valid names → HTTP 200, room status `"playing"`.

### Implementation for User Story 4

- [x] T013 [US4] In `backend/src/services/roomStore.ts`: in `startGame()` (created in T004), add a validation loop before the state transition that iterates `room.participants` and throws `HttpError(400, "All player names must be non-empty")` if any `participant.name.trim() === ""`; this guard runs after the 404/409/min-players checks already in T004

**Checkpoint**: `POST /rooms/:code/start` with a whitespace-name participant returns HTTP 400 and the room stays in `"lobby"`. Both TypeScript builds pass.

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end validation and build confirmation before marking the feature complete.

- [x] T014 [P] Verify TypeScript build passes in `backend/` with zero errors (`cd backend && npm run build`)
- [x] T015 [P] Verify TypeScript build passes in `frontend/` with zero errors (`cd frontend && npm run build`)
- [x] T016 Run through all scenarios in `specs/002-game-start-drawer/quickstart.md` end-to-end with two browser tabs; for Scenario 7 (3-player secret-word exclusion) open a third tab and confirm all three players' outcomes; mark complete only after all scenarios pass with human verification

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Baseline)**: No dependencies — run immediately
- **Phase 2 (Types)**: Depends on Phase 1 passing — **BLOCKS all user story phases**
- **Phase 3 (US1)**: Depends on Phase 2 completion
- **Phase 4 (US2)**: Depends on Phase 3 completion (needs startGame() and playing status)
- **Phase 5 (US3)**: Depends on Phase 4 completion (verifies the absence branch of T009/T010)
- **Phase 6 (US4)**: Can be done in parallel with Phase 4 or 5 (T013 adds to T004 in the same function, depends on Phase 3)
- **Final Phase**: Depends on Phases 3–6 complete

### User Story Dependencies

- **US1 (P1)**: Requires foundational types (Phase 2). No dependency on other stories.
- **US2 (P2)**: Requires US1 complete (needs `startGame()` and `"playing"` state to exist in order to test toRoomSnapshot filtering).
- **US3 (P3)**: Requires US2 complete (verifies the other branch of the same toRoomSnapshot change).
- **US4 (P4)**: Requires US1's T004 complete (adds a guard to the same `startGame()` function); can be done before or after US2/US3.

### Within Each User Story

- Backend service before backend route (T004 before T006)
- Frontend api method before frontend store action (T005 before T007)
- Backend and frontend tasks within each story can be done in parallel across the stack

### Parallel Opportunities

- T002 and T003 (foundational types): different files, fully parallel
- T004 (backend service) and T005 (frontend api method): different codebases, fully parallel
- T006 (backend route) and T007 (frontend store): different codebases, parallel after their respective prerequisites
- T009 (backend toRoomSnapshot) and T010 (frontend GamePage): different codebases, parallel
- T011 and T012: different codebases, parallel
- T014 and T015: independent build commands, parallel

---

## Parallel Example: User Story 1

```
# T004 and T005 can start simultaneously (different codebases):
Task A: "Implement startGame() in backend/src/services/roomStore.ts"
Task B: "Add api.startRoom() in frontend/src/services/api.ts"

# After T004 completes:
Task: "Add POST /rooms/:code/start route in backend/src/api/rooms.ts"

# After T005 completes:
Task: "Add startRoom() action to RoomStore in frontend/src/state/roomStore.ts"

# After both route and store action complete:
Task: "Wire LobbyPage.tsx with startRoom() call + navigation logic"
```

## Parallel Example: User Story 2

```
# T009 and T010 can start simultaneously after US1 is complete:
Task A: "Update toRoomSnapshot() in backend/src/services/roomStore.ts"
Task B: "Add secretWord display in frontend/src/pages/GamePage.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Baseline verification
2. Complete Phase 2: Type system (CRITICAL — blocks everything)
3. Complete Phase 3: US1 — game start, endpoint, LobbyPage wiring
4. **STOP and VALIDATE**: Two browser tabs confirm game start and navigation work
5. Proceed to US2 once US1 acceptance criteria are met

### Incremental Delivery

1. Phase 1 + 2 → Foundation green
2. Phase 3 (US1) → Game can start; host + guests navigate → **MVP**
3. Phase 4 (US2) → Drawer sees secret word on Game screen
4. Phase 5 (US3) → Confirmed guessers do not see secret word
5. Phase 6 (US4) → Invalid-name guard returns HTTP 400
6. Final Phase → Full quickstart validation passes, both builds clean

---

## Notes

- `[P]` tasks touch different files and have no incomplete dependencies — safe to run in parallel
- `[Story]` label maps each task to its user story for traceability
- Each phase ends with a checkpoint — verify the acceptance criteria for that user story before advancing
- No tests are included (not requested in spec); validation is via two-browser-tab manual testing per quickstart.md
- Never skip a checkpoint; constitution requires two-tab verification before marking a story complete
- T013 (US4 validation) modifies the same `startGame()` function as T004 (US1) — implement T004 first, then add the guard in T013
- **GamePage polling deferred**: The constitution requires game state to be polled at ~2-second intervals. `GamePage.tsx` has no polling in this feature (secret word is static post-start). This is an accepted deferral — polling on the GamePage is in scope for the next feature (guessing/scoring).
