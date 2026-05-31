# Tasks: Round End — Results Display and Lobby Restart

**Input**: Design documents from `specs/005-round-end-restart/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api.md ✅

**Tests**: Not requested in spec — no test tasks generated.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no conflict with concurrent tasks)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Exact file paths are included in every description

## Path Conventions (Web application — per plan.md)

- Backend: `backend/src/`
- Frontend: `frontend/src/`

---

## Phase 1: Foundational (Shared Type Extension)

**Purpose**: Extend `RoomStatus` with the `"ended"` value in both backend and frontend. These two files are independent — both tasks run in parallel.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T001 [P] Add `"ended"` to the `RoomStatus` union in `backend/src/models/game.ts`: change `export type RoomStatus = "lobby" | "active"` to `export type RoomStatus = "lobby" | "active" | "ended"`
- [x] T002 [P] Add `"ended"` to the `status` union in the frontend `RoomSnapshot` interface in `frontend/src/services/api.ts`: change `status: "lobby" | "active"` to `status: "lobby" | "active" | "ended"`

**Checkpoint**: Both type definitions updated — all three user story tasks can now proceed.

---

## Phase 2: User Story 1 — All Players See the Round Results (Priority: P1) 🎯 MVP

**Goal**: The host ends the active round; all players' screens automatically transition to a result screen showing the correct word, final scores, and the full guess history within 2 seconds (next poll cycle).

**Independent Test**: Tab A (host) and Tab B (guesser) are on the game screen. Tab B has submitted "rocket" (correct). Host clicks "End Round" on Tab A. Within 2 seconds, both tabs show a result screen with: "The word was: rocket", Tab B at 100 points, Tab A at 0 points, and the guess history entry "rocket ✓". Calling `POST /rooms/:code/end` directly returns 200 with `room.status === "ended"`.

Backend and frontend streams are independent (different files) and can be worked simultaneously.

- [x] T003 [P] [US1] Add `endRoundBodySchema` to `backend/src/api/schemas.ts`: `export const endRoundBodySchema = z.object({ participantId: z.string().uuid() })`
- [x] T004 [P] [US1] Add `endRound(code: string, requestingParticipantId: string)` to `backend/src/services/roomStore.ts`: get room from `rooms.get(code)`; return `{ error: "not_found" }` if absent; return `{ error: "forbidden" }` if `room.hostId !== requestingParticipantId`; return `{ error: "not_active" }` if `room.status !== "active"`; set `room.status = "ended"`; call `saveRoom(room)`; return `{ room: toRoomSnapshot(cloneRoom(room)) }` (depends on T001)
- [x] T005 [US1] Add `POST /:code/end` handler to `backend/src/api/rooms.ts`: import `endRoundBodySchema` and `endRound`; parse params via `roomCodeParamsSchema`, body via `endRoundBodySchema`; call `endRound(code.toUpperCase(), participantId)`; respond 200 `{ room }` on success; throw `HttpError(404, "Room not found")` for `not_found`, `HttpError(403, "Only the host can end the round")` for `forbidden`, `HttpError(409, "Round is not active")` for `not_active` (depends on T003, T004)
- [x] T006 [P] [US1] Add `endRound(code: string, participantId: string): Promise<{ room: RoomSnapshot }>` to `frontend/src/services/api.ts`: POST to `/rooms/${encodeURIComponent(code)}/end` with body `{ participantId }` (depends on T002)
- [x] T007 [US1] Add `endRound()` method to the `RoomStore` class in `frontend/src/state/roomStore.ts`: returns `null` if `this.state.room` or `this.state.participantId` are missing; calls `api.endRound(room.code, participantId)` via `this.withLoading()`; calls `this.setRoomSnapshot(response.room)` on success; returns updated room (depends on T006)
- [x] T008 [US1] Update `frontend/src/pages/GamePage.tsx` — two additions: (1) Add an "End Round" `<button>` inside the existing `<div className="button-row">` at the bottom, visible only when `isDrawer && room.status === "active"`, that calls `store.endRound()` on click; (2) Add a result-screen block: before the main `return` JSX, check `if (room.status === "ended")` and return a result layout showing the correct word (`room.availableWords[0]`), the full sorted scoreboard (`room.scores` sorted descending, with participant name lookups), and the full guess history (`room.guesses` in order, with guesser name, text, and ✓/✗) — all data is already available in the room snapshot (depends on T007)

**Checkpoint**: US1 complete. Verify "End Round" button appears only for host, result screen shows on both tabs within 2 seconds.

---

## Phase 3: User Story 2 — Host Restarts; Everyone Returns to Lobby (Priority: P1)

**Goal**: On the result screen, the host sees "Play Again"; non-hosts see "Waiting for host to start a new round…". When the host clicks "Play Again", all players are redirected to the lobby within 2 seconds, with players preserved and guesses cleared.

**Independent Test**: After the result screen from US1 is active: Tab B (guesser) sees "Waiting for host to start a new round…" and no restart button. Tab A (host) sees "Play Again". Host clicks "Play Again". Within 2 seconds, both tabs display the lobby with all prior players listed. Starting a new game: scores show 0, activity panel is empty.

Note: These tasks touch the same files as US1 tasks — they must run sequentially after their US1 counterparts in the same file.

- [x] T009 [US2] Add `restartRoomBodySchema` to `backend/src/api/schemas.ts`: `export const restartRoomBodySchema = z.object({ participantId: z.string().uuid() })` (after T003 — same file)
- [x] T010 [US2] Add `restartRoom(code: string, requestingParticipantId: string)` to `backend/src/services/roomStore.ts`: get room from `rooms.get(code)`; return `{ error: "not_found" }` if absent; return `{ error: "forbidden" }` if `room.hostId !== requestingParticipantId`; return `{ error: "not_ended" }` if `room.status !== "ended"`; set `room.status = "lobby"` and `room.guesses = []`; call `saveRoom(room)`; return `{ room: toRoomSnapshot(cloneRoom(room)) }` (after T004 — same file; depends on T001)
- [x] T011 [US2] Add `POST /:code/restart` handler to `backend/src/api/rooms.ts`: import `restartRoomBodySchema` and `restartRoom`; parse params via `roomCodeParamsSchema`, body via `restartRoomBodySchema`; call `restartRoom(code.toUpperCase(), participantId)`; respond 200 `{ room }` on success; throw `HttpError(404)` for `not_found`, `HttpError(403, "Only the host can restart the game")` for `forbidden`, `HttpError(409, "Round is not ended")` for `not_ended` (depends on T009, T010; after T005 — same file)
- [x] T012 [US2] Add `restartRoom(code: string, participantId: string): Promise<{ room: RoomSnapshot }>` to `frontend/src/services/api.ts`: POST to `/rooms/${encodeURIComponent(code)}/restart` with body `{ participantId }` (after T006 — same file; depends on T002)
- [x] T013 [US2] Add `restartRoom()` method to the `RoomStore` class in `frontend/src/state/roomStore.ts`: returns `null` if `this.state.room` or `this.state.participantId` are missing; calls `api.restartRoom(room.code, participantId)` via `this.withLoading()`; calls `this.setRoomSnapshot(response.room)` on success; returns updated room (after T007 — same file; depends on T012)
- [x] T014 [US2] Update `frontend/src/pages/GamePage.tsx` — two additions to the result screen block added in T008: (1) For the host (`isDrawer === true`): render a "Play Again" `<button>` that calls `store.restartRoom()` on click; (2) For non-hosts: render `<p>Waiting for host to start a new round…</p>`; (3) Add a new `useEffect` that watches `room?.status` and calls `navigate("/lobby", { replace: true })` when the status is `"lobby"` — this fires automatically when the next poll detects the restart (depends on T013, T008 — same file)

**Checkpoint**: US2 complete. Verify "Play Again" button works for host, non-host sees waiting message, both tabs redirect to lobby within 2 seconds.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, build gate, and spec alignment check.

- [x] T015 Run full two-tab manual verification per constitution Principle IV: (1) Tab A = host (drawer), Tab B = guest (guesser); (2) verify "End Round" button visible only on Tab A while game is active; (3) click "End Round" — both tabs show result screen within 2 seconds with correct word, scores, history; (4) Tab B shows "Waiting for host…", Tab A shows "Play Again"; (5) host clicks "Play Again" — both tabs redirect to lobby within 2 seconds; (6) lobby shows both players; (7) run `cd backend && npm run build` and `cd frontend && npm run build` — both must pass with 0 errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — T001 ‖ T002 in parallel.
- **US1 (Phase 2)**: Depends on T001 (for backend) and T002 (for frontend).
  - Backend stream: T003 + T004 → T005 (sequential within backend).
  - Frontend stream: T006 → T007 → T008 (sequential within frontend).
  - Backend and frontend streams are independent — run concurrently.
- **US2 (Phase 3)**: Depends on US1 completion in the same file. Each US2 task runs after its corresponding US1 task in the same file.
  - T009 after T003 (schemas.ts); T010 after T004 (roomStore.ts); T011 after T005 (rooms.ts).
  - T012 after T006 (api.ts); T013 after T007 (roomStore.ts); T014 after T008+T013 (GamePage.tsx).
- **Polish (Phase 4)**: Depends on all prior phases complete.

### Within Each User Story

- Backend functions before their endpoint handlers (T004 before T005; T010 before T011).
- Frontend api method before store method before page (T006 → T007 → T008; T012 → T013 → T014).
- US2 tasks append to the same files as US1 — strictly sequential in each file.

---

## Parallel Example: US1

```bash
# After T001 + T002 complete, run these two streams concurrently:

# Backend stream (sequential within):
Task T003: "Add endRoundBodySchema to backend/src/api/schemas.ts"
Task T004: "Add endRound() to backend/src/services/roomStore.ts"   ← after T003
Task T005: "Add POST /:code/end to backend/src/api/rooms.ts"       ← after T003+T004

# Frontend stream (sequential within, parallel with backend stream):
Task T006: "Add endRound() to frontend/src/services/api.ts"
Task T007: "Add endRound() to frontend/src/state/roomStore.ts"     ← after T006
Task T008: "Update GamePage.tsx with result screen + End Round btn" ← after T007
```

---

## Implementation Strategy

### MVP First (US1 Only — End Round + Results)

1. Complete Phase 1: Foundational types (T001, T002)
2. Complete Phase 2: US1 — result display and end-round trigger (T003–T008)
3. **STOP and VALIDATE**: Two tabs, click "End Round", verify result screen
4. Add Phase 3: US2 — restart flow (T009–T014)
5. Final verification and builds (T015)

### Incremental Delivery

- After Phase 1: Type foundations ready.
- After Phase 2 (US1): Drawer can end the round; all players see results. Game loop nearly complete.
- After Phase 3 (US2): Full game loop — play, review results, restart, repeat.
- Each phase independently verifiable with two browser tabs.

---

## Notes

- No [P] markers in US2 because each task touches the same file as its US1 predecessor — same-file edits cannot safely run in parallel
- The lobby-redirect `useEffect` in T014 is the key mechanism that makes all players return to the lobby simultaneously — it fires on every polling cycle when `room.status === "lobby"`
- The result screen in T008 should render before the main game JSX (early return pattern) so existing game UI doesn't flash during the `"ended"` state
- The `"ended"` status check in `submitGuess()` (existing feature 004) already returns `"not_active"` for `"ended"` rooms — no change needed there
- Commit after each checkpoint (US1 complete, US2 complete) with a message referencing the spec scenario
