---
description: "Task list for Result, Restart & Final Validation"
---

# Tasks: Result, Restart & Final Validation

**Input**: Design documents from `specs/004-result-restart/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | data-model.md ✅ | contracts/api.md ✅ | research.md ✅

**Tests**: Not requested — no test tasks generated.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: User story this task belongs to (US1–US2)
- Exact file paths included in all descriptions

---

## Phase 1: Setup

**Purpose**: Confirm the project runs cleanly before making changes.

- [ ] T001 Start backend (`cd backend && npm run dev`) and confirm `GET /health` returns `{ "ok": true }`
- [ ] T002 Start frontend (`cd frontend && npm run dev`) and confirm the app loads at `http://localhost:5173`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the `Room` and `RoomSnapshot` status type to include `"ended"`, update the snapshot word-reveal logic, and update the frontend navigation guard. All user stories depend on this phase.

⚠️ **CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T003 In `backend/src/models/game.ts`, change the `status` field on both `Room` and `RoomSnapshot` from `"lobby" | "active"` to `"lobby" | "active" | "ended"`
- [ ] T004 In `backend/src/services/roomStore.ts`, update `toRoomSnapshot` so that when `room.status === "ended"`, `currentWord` is always set to `room.currentWord` for all viewers (not nulled out); preserve the existing null-for-non-drawers logic for `"active"` and `"lobby"` states
- [ ] T005 [P] In `frontend/src/services/api.ts`, extend the `RoomSnapshot.status` type from `"lobby" | "active"` to `"lobby" | "active" | "ended"`
- [ ] T006 In `frontend/src/pages/GamePage.tsx`, update the `useEffect` that guards navigation based on `room.status`: change it so `"active"` → stay on page (unchanged), `"ended"` → stay on page (new), `"lobby"` → `navigate("/lobby", { replace: true })` (new), anything else → `navigate("/", { replace: true })` (fallback)

**Checkpoint**: Run `npm run build` in `backend/` — TypeScript must compile with zero errors. Confirm the `status` type change is reflected in both model files before proceeding.

---

## Phase 3: User Story 1 — Result Screen (Priority: P1) 🎯 MVP

**Goal**: The host can end the active round. All players are then shown a result screen with the revealed word, final scoreboard, and full guess history — synced via polling.

**Independent Test**: With two tabs (Tab A = host, Tab B = guesser), Tab A clicks "End Round". Both tabs must transition to the result view within ~2 seconds showing the correct word, scores, and all guesses.

### Implementation for User Story 1

- [ ] T007 [US1] Add `endRoomSchema` (`{ participantId: z.string() }`) to `backend/src/api/schemas.ts`
- [ ] T008 [US1] Add `POST /:code/end` handler to `backend/src/api/rooms.ts`: parse with `endRoomSchema`; look up room (404 if missing); throw 403 if `participantId !== room.hostId`; throw 400 if `room.status !== "active"`; set `room.status = "ended"`; save; return `{ room: toRoomSnapshot(room, participantId) }`
- [ ] T009 [P] [US1] Add `endRoom(code: string, participantId: string): Promise<{ room: RoomSnapshot }>` method to `frontend/src/services/api.ts`
- [ ] T010 [P] [US1] Add `endRoom()` method to the `RoomStore` class in `frontend/src/state/roomStore.ts`: call `api.endRoom(code, participantId)`, update the room snapshot in store state with the response
- [ ] T011 [US1] In `frontend/src/pages/GamePage.tsx`, add an "End Round" button inside the active game UI: derive `isHost = participantId !== null && room.hostId === participantId`; render the button only when `isHost && room.status === "active"`; clicking calls `roomStore.endRoom()`
- [ ] T012 [US1] In `frontend/src/pages/GamePage.tsx`, add a result UI block rendered when `room.status === "ended"`: display a "Round Over" section header; show `room.currentWord` prominently (it is now non-null for all viewers); render `<Scoreboard scores={room.scores} participants={room.participants} />`; render `<ResultPanel guesses={room.guesses} participants={room.participants} />`

**Checkpoint**: Tab A clicks "End Round"; both tabs transition to the result view within ~2 seconds. Result view shows the correct word to Tab B (guesser), final scores, and all guesses. Tab B has no End Round button.

---

## Phase 4: User Story 2 — Restart to Lobby (Priority: P2)

**Goal**: From the result screen, the host can restart. All players are automatically redirected to the lobby (via polling), with participants preserved and all round state cleared.

**Independent Test**: After US1 completes and the result screen is visible, Tab A clicks "Restart". Both tabs must be redirected to the lobby within ~2 seconds with the same participant list and zeroed/cleared round state.

### Implementation for User Story 2

- [ ] T013 [US2] Add `restartRoomSchema` (`{ participantId: z.string() }`) to `backend/src/api/schemas.ts`
- [ ] T014 [US2] Add `POST /:code/restart` handler to `backend/src/api/rooms.ts`: parse with `restartRoomSchema`; look up room (404 if missing); throw 403 if `participantId !== room.hostId`; throw 400 if `room.status !== "ended"`; reset `room.status = "lobby"`, `room.currentWord = null`, `room.drawerId = null`, `room.strokes = []`, `room.guesses = []`, `room.scores = {}`; save; return `{ room: toRoomSnapshot(room, participantId) }`
- [ ] T015 [P] [US2] Add `restartRoom(code: string, participantId: string): Promise<{ room: RoomSnapshot }>` method to `frontend/src/services/api.ts`
- [ ] T016 [P] [US2] Add `restartRoom()` method to the `RoomStore` class in `frontend/src/state/roomStore.ts`: call `api.restartRoom(code, participantId)`, update the room snapshot in store state with the response
- [ ] T017 [US2] In `frontend/src/pages/GamePage.tsx`, add a "Restart" button inside the result UI block (from T012): render it only when `isHost`; clicking calls `roomStore.restartRoom()`; after calling, the polling will detect `room.status === "lobby"` and the navigation guard (from T006) will redirect all players to `/lobby` automatically

**Checkpoint**: Tab A clicks "Restart"; both tabs are redirected to the lobby within ~2 seconds. Lobby shows both players still present; no round state (no word, no guesses, scores cleared). Host can start a new game.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Build validation and end-to-end acceptance check.

- [ ] T018 [P] Run `npm run build` in `backend/` and confirm zero TypeScript errors
- [ ] T019 [P] Run `npm run build` in `frontend/` and confirm zero TypeScript errors
- [ ] T020 Complete the full validation flow in `specs/004-result-restart/quickstart.md` using two browser tabs and confirm all 15 checks in the validation table pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **blocks all user stories**
- **US1 (Phase 3)**: Depends on Foundational
- **US2 (Phase 4)**: Depends on US1 (restart button lives inside the result UI added by US1)
- **Polish (Phase 5)**: Depends on all user stories

### Within Each User Story

- Backend schemas before backend handlers (T007 before T008; T013 before T014)
- Backend handler before frontend API method (T008 before T009; T014 before T015)
- Frontend API method before store method (T009 before T010; T015 before T016)
- Store method before component wiring (T010 before T011–T012; T016 before T017)

### Parallel Opportunities

- T005 (frontend status type) can run in parallel with T003–T004 (backend — different directories)
- T009 and T010 (endRoom API + store) can run in parallel — different files
- T015 and T016 (restartRoom API + store) can run in parallel — different files
- T018 and T019 (builds) can run in parallel

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — CRITICAL
3. Complete Phase 3: US1 (Result Screen)
4. **STOP and VALIDATE**: Result view visible to all players after host ends round

### Incremental Delivery

1. Setup + Foundational → status type extended, navigation guard updated
2. US1 → end-round endpoint + result UI live for all players via polling ✅
3. US2 → restart endpoint + restart button → lobby redirect ✅
4. Polish → builds clean, all 15 quickstart checks pass ✅

---

## Notes

- `[P]` tasks touch different files with no incomplete-task dependencies — safe to run in parallel
- T006 note: the current status guard navigates to `"/"` for any non-`"active"` status — the change must be surgical: add `"ended"` as a stay-on-page case AND add `"lobby"` as a navigate-to-`/lobby` case, preserving the else-navigate-to-`/` fallback
- T008 note: `toRoomSnapshot` now reveals `currentWord` for `"ended"` rooms (per T004), so the `/end` response automatically includes the word for all viewers without extra work in the handler
- T012 note: the result UI block replaces (conditionally) the active game layout — structure as `if (room.status === "ended") { return <result JSX> }` before the normal return, or use a conditional section inside the existing return; either approach is valid
- T017 note: after `restartRoom()` resolves, the store's room snapshot is updated to `"lobby"` status; on the very next render (or the next polling cycle), the T006 navigation guard fires and redirects all players — no manual `navigate()` call is needed inside the button handler
