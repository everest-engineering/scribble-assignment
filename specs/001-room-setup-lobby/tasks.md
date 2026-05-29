---
description: "Task list for Feature Group 1 — Room Setup & Lobby"
---

# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`

**Prerequisites**: plan.md ✅ spec.md ✅ data-model.md ✅ contracts/ ✅

**Tests**: Extend existing test files only (no new test files). Test tasks included where existing files have coverage gaps.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extend existing type definitions that all stories depend on.

- [ ] T001 Extend `Room` model in `backend/src/models/game.ts` — add `hostId: string` field and expand `RoomStatus` to `"lobby" | "playing" | "result"`
- [ ] T002 Extend `RoomSnapshot` interface in `backend/src/models/game.ts` — add `hostId: string` field
- [ ] T003 Update `RoomSnapshot` type in `frontend/src/services/api.ts` — add `hostId: string` and expand `status` union to `"lobby" | "playing" | "result"`

**Checkpoint**: TypeScript compiles (`npm run build`) in both `backend/` and `frontend/` with the new types.

---

## Phase 2: Foundational (Backend Core — blocks all stories)

**Purpose**: Backend store and validation changes that all user stories depend on.

- [ ] T004 Update `createRoom()` in `backend/src/services/roomStore.ts` — set `room.hostId = participant.id` before storing
- [ ] T005 Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` — include `hostId` in the returned snapshot
- [ ] T006 [P] Tighten `createRoomSchema` in `backend/src/api/schemas.ts` — `playerName`: `z.string().trim().min(1, "Name cannot be empty")`
- [ ] T007 [P] Tighten `joinRoomSchema` in `backend/src/api/schemas.ts` — same trim + min(1) rule
- [ ] T008 Add `startGame()` to `backend/src/services/roomStore.ts` — validates `hostId === participantId` (403) and `participants.length >= 2` (403), sets `status = "playing"`, returns updated room
- [ ] T009 Add `POST /:code/start` route in `backend/src/api/rooms.ts` — parse `startRoomSchema` from body, call `startGame()`, return `{ room: toRoomSnapshot(...) }`; propagate `HttpError` for 403/404
- [ ] T010 Add `startRoomSchema` in `backend/src/api/schemas.ts` — `z.object({ participantId: z.string().min(1) })`
- [ ] T011 Extend `backend/src/services/roomStore.test.ts` — add tests: `hostId` is set on `createRoom`; `startGame` returns 403 for non-host; `startGame` returns 403 for <2 players; `startGame` sets status to "playing" and returns snapshot

**Checkpoint**: `npm run test` in `backend/` passes. `POST /rooms` and `GET /rooms/:code` responses include `hostId`.

---

## Phase 3: User Story 1 — Create a Room as Host (P1)

**Goal**: Host tracking visible on room creation; name validation enforced.

**Independent Test**: Create a room with a valid name — lobby shows room code and player name. Try empty name — inline error shown, no room created. Verify response body includes `hostId`.

- [ ] T012 [US1] Add client-side name validation in `frontend/src/pages/CreateRoomPage.tsx` — trim name, show inline error "Name cannot be empty" if empty, prevent API call; no other changes to existing form logic
- [ ] T013 [US1] Add `startRoom()` to `frontend/src/services/api.ts` — `POST /rooms/:code/start` with `{ participantId }`, returns `{ room: RoomSnapshot }`

**Checkpoint**: Creating a room with a valid name works; empty name shows error. Network response includes `hostId`.

---

## Phase 4: User Story 2 — Join a Room as Participant (P1)

**Goal**: Join validation enforced for name and code; room isolation verified.

**Independent Test**: Join with valid name + valid code — success. Join with empty name — error "Name cannot be empty". Join with empty code — error "Room code cannot be empty" (no network call). Join with non-existent code — error "Room not found".

- [ ] T014 [US2] Add client-side validation in `frontend/src/pages/JoinRoomPage.tsx` — trim name (error "Name cannot be empty" if empty); trim code (error "Room code cannot be empty" if empty, no API call); no other changes to existing join logic
- [ ] T015 [US2] Normalise code to uppercase in `frontend/src/pages/JoinRoomPage.tsx` before passing to `api.joinRoom()` (already uppercase-normalised on backend; belt-and-suspenders on frontend)

**Checkpoint**: All four join validation scenarios in spec pass in the browser.

---

## Phase 5: User Story 3 — Lobby Auto-Polling (P2)

**Goal**: Lobby refreshes participant list automatically every ~2 seconds without manual action. Non-hosts auto-navigate when status becomes "playing".

**Independent Test**: Tab 1 on Lobby. Tab 2 joins. Within 3 seconds Tab 1 shows both players — no manual click. Navigate Tab 1 away, confirm no further requests in DevTools Network tab.

- [ ] T016 [US3] Replace manual refresh with `useEffect` polling in `frontend/src/pages/LobbyPage.tsx` — `setInterval(fetchRoom, 2000)` on mount; `clearInterval` in cleanup; remove or keep the manual Refresh button as secondary action
- [ ] T017 [US3] Add auto-navigate to game in `frontend/src/pages/LobbyPage.tsx` — inside the poll callback, if `room.status === "playing"` call `navigate("/game")`
- [ ] T018 [US3] Add `startRoom()` action to `frontend/src/state/roomStore.ts` — calls `api.startRoom(code, participantId)`, calls `setRoomSnapshot(room)` on success

**Checkpoint**: Auto-polling works in two tabs; navigating away stops polling (verified via Network DevTools).

---

## Phase 6: User Story 4 — Host-Only Start Game (P2)

**Goal**: Start Game button visible/enabled only to host with ≥2 players; non-hosts see waiting message.

**Independent Test**: Tab 1 (host, 2 players present) — enabled Start Game button. Tab 2 (non-host) — no Start Game button, sees "Waiting for host to start". Tab 1 clicks Start Game — Tab 1 navigates to `/game`; Tab 2 auto-navigates via next poll.

- [ ] T019 [US4] Update `frontend/src/pages/LobbyPage.tsx` — derive `isHost = room.hostId === participantId`; render Start Game button (enabled) only when `isHost && participants.length >= 2`; render disabled button when `isHost && participants.length < 2`; render "Waiting for host to start" for non-hosts
- [ ] T020 [US4] Wire Start Game click in `frontend/src/pages/LobbyPage.tsx` — on click call `roomStore.startRoom(room.code, participantId)`; on success `navigate("/game")`; show inline error on failure

**Checkpoint**: Host/non-host button rendering correct in two tabs. Host can start, both tabs end up on `/game`.

---

## Phase 7: Polish & Cross-Cutting

- [ ] T021 [P] Run `npm run build` in `backend/` — confirm zero TypeScript errors
- [ ] T022 [P] Run `npm run build` in `frontend/` — confirm zero TypeScript errors
- [ ] T023 Two-tab manual validation against SC-001 through SC-005 in spec — document any deviations

---

## Dependencies & Execution Order

- **Phase 1** (T001–T003): No dependencies — start immediately
- **Phase 2** (T004–T011): Depends on Phase 1 (types must exist before store/route changes)
- **Phase 3** (T012–T013): Depends on Phase 2 (backend must return `hostId`)
- **Phase 4** (T014–T015): Depends on Phase 2; can run in parallel with Phase 3
- **Phase 5** (T016–T018): Depends on Phase 2 + T013 (needs `startRoom` in api.ts)
- **Phase 6** (T019–T020): Depends on Phase 5 (polling must exist before start-game wiring)
- **Phase 7** (T021–T023): Depends on all prior phases

### Within-Phase Parallel Opportunities

- T006 and T007 can run in parallel (different schemas, same file — coordinate)
- T012 and T014 can run in parallel (different page files)
- T021 and T022 can run in parallel (different directories)

---

## Implementation Strategy

### MVP (P1 Stories Only)

1. Complete Phase 1 (types)
2. Complete Phase 2 (backend)
3. Complete Phase 3 (create room validation)
4. Complete Phase 4 (join room validation)
5. **Validate**: One tab creates, one tab joins — both see each other in lobby

### Full Delivery (all stories)

Continue with Phase 5 (polling) → Phase 6 (start game) → Phase 7 (build + validate)

---

## Notes

- `[P]` = parallelisable (different files, no incomplete dependencies)
- `[USn]` maps each task to its user story for traceability
- Extend existing test files only — no new test files
- Commit after Phase 2 checkpoint and again after Phase 6 checkpoint
