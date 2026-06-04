# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | data-model.md ✅ | contracts/rooms-api.md ✅ | research.md ✅

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Paths use `backend/src/` and `frontend/src/` conventions

---

## Phase 1: Foundational — Backend Model & Store

**Purpose**: Extend the data model and store service. All user stories depend on this.

- [ ] T001 Extend `RoomStatus` union from `"lobby"` to `"lobby" | "playing" | "finished"` in `backend/src/models/game.ts`
- [ ] T002 Add `hostId: string` field to `Room` interface in `backend/src/models/game.ts`
- [ ] T003 Add `hostId: string` field to `RoomSnapshot` interface in `backend/src/models/game.ts`
- [ ] T004 Set `hostId = participant.id` (first participant) in `createRoom()` in `backend/src/services/roomStore.ts`
- [ ] T005 Forward `hostId` from `Room` to `RoomSnapshot` in `toRoomSnapshot()` in `backend/src/services/roomStore.ts`
- [ ] T006 Keep `displayName()` in `backend/src/services/roomStore.ts` as a passive fallback (existing `name || "Player"` behaviour); Zod schemas (T007/T008) are the sole validation gate — do not add a throw here to avoid double-failure paths with mismatched error shapes (FR-002)

---

## Phase 2: Foundational — Backend Schemas & Route

**Purpose**: Tighten validation and add the Start Game endpoint. Depends on Phase 1.

- [ ] T007 Update `createRoomSchema` in `backend/src/api/schemas.ts` to require `playerName` as a trimmed non-empty string (`z.string().trim().min(1)`)
- [ ] T008 Update `joinRoomSchema` in `backend/src/api/schemas.ts` to require `playerName` as a trimmed non-empty string (`z.string().trim().min(1)`)
- [ ] T009 Add `startGameSchema` to `backend/src/api/schemas.ts`: `z.object({ participantId: z.string().uuid() })`
- [ ] T010 Add `POST /:code/start` route handler in `backend/src/api/rooms.ts` that: normalises `:code` to uppercase via `code.toUpperCase()` (FR-003, matching existing `join` pattern in rooms.ts:32), validates `participantId === room.hostId` (403 if not), validates `participants.length >= 2` (400 if not), sets `room.status = "playing"` via `saveRoom()`, returns `{ room: toRoomSnapshot(room, participantId) }`

---

## Phase 3: US1 — Host Creates a Room

**Story goal**: Player creates a room, is recorded as host, name is validated.

**Independent test**: Create a room with a valid name → lobby shows host; create with empty name → error, no navigation.

- [ ] T011 [US1] Update `frontend/src/services/api.ts`: extend `RoomSnapshot` type to add `hostId: string` and expand `status` union to `"lobby" | "playing" | "finished"`
- [ ] T012 [P] [US1] Add client-side name validation in `frontend/src/pages/CreateRoomPage.tsx`: trim `playerName` before submit; if empty after trim, set error state and abort fetch
- [ ] T013 [P] [US1] Add `api.startGame(code: string, participantId: string)` method to `frontend/src/services/api.ts` calling `POST /rooms/:code/start`

---

## Phase 4: US2 — Player Joins a Room by Code

**Story goal**: Second player joins by code; name and code are validated; player appears in lobby.

**Independent test**: Join with valid code + name → lobby; join with invalid code → error on Join screen; join with empty name → error; join with lowercase code → normalised and succeeds.

- [ ] T014 [US2] Add client-side name validation in `frontend/src/pages/JoinRoomPage.tsx`: trim `playerName` before submit; if empty after trim, set error state and abort fetch
- [ ] T015 [P] [US2] Add client-side code validation in `frontend/src/pages/JoinRoomPage.tsx`: if `roomCode.trim()` is empty, set error state and abort fetch (no network call)

---

## Phase 5: US3 — Lobby Refreshes Automatically

**Story goal**: Participants list updates every ~2s; polling stops on unmount; poll errors shown inline.

**Independent test**: Open lobby in two tabs; join from a third; first two tabs update within 2s without manual action. Navigate away; confirm no further requests.

- [ ] T016 [US3] Add `pollError: string | null` field to `RoomState` interface in `frontend/src/state/roomStore.ts`
- [ ] T017 [US3] Add private `pollTimerId: ReturnType<typeof setInterval> | null` field to `RoomStore` class in `frontend/src/state/roomStore.ts`
- [ ] T018 [US3] Add `startPolling(intervalMs: number): void` method to `RoomStore` in `frontend/src/state/roomStore.ts`: sets `setInterval` calling `fetchRoom()` silently; on fetch error sets `pollError` in state without stopping the interval
- [ ] T019 [US3] Add `stopPolling(): void` method to `RoomStore` in `frontend/src/state/roomStore.ts`: calls `clearInterval(this.pollTimerId)` and resets `pollTimerId` to `null`
- [ ] T020 [US3] Replace manual refresh `useEffect` in `frontend/src/pages/LobbyPage.tsx` with a polling `useEffect`: call `roomStore.startPolling(2000)` on mount; return cleanup calling `roomStore.stopPolling()`
- [ ] T021 [US3] Display `pollError` inline in `frontend/src/pages/LobbyPage.tsx` Status card when non-null (non-blocking; does not replace existing status message)

---

## Phase 6: US4 — Host Starts the Game

**Story goal**: Host-only Start Game button gated on 2-player minimum; host navigates immediately; non-host detects via poll.

**Independent test**: With 2 players, only host's button is enabled; host clicks → host navigates immediately; second tab navigates on next poll. With 1 player, host button disabled. Non-host sees "Only the host can start".

- [ ] T022 [US4] Add `startGame(): Promise<RoomSnapshot>` method to `RoomStore` in `frontend/src/state/roomStore.ts`: calls `api.startGame(room.code, participantId)`, updates room snapshot via `setRoomSnapshot`
- [ ] T023 [US4] Compute `isHost` and `canStart` in `frontend/src/pages/LobbyPage.tsx`: `isHost = room.hostId === participantId`; `canStart = isHost && room.participants.length >= 2`
- [ ] T024 [US4] Replace the existing unconditional Start Game button in `frontend/src/pages/LobbyPage.tsx` with a button that: is `disabled` when `!canStart`; shows label `"Only the host can start"` when `!isHost` (FR-013); shows `"Need at least 2 players"` when `isHost && participants.length < 2` (FR-009 — implementation extension not contradicting any FR); calls `handleStartGame()` when enabled
- [ ] T025 [US4] Add `handleStartGame()` async handler in `frontend/src/pages/LobbyPage.tsx`: calls `roomStore.startGame()`; on success calls `navigate("/game")`; on error sets local error state
- [ ] T026 [US4] In `frontend/src/pages/LobbyPage.tsx` polling `useEffect` (T020), add a `useEffect` (or inline check after `roomStore.startPolling` snapshot update) that watches `room.status`: when `room.status === "playing"` and `!isHost`, call `navigate("/game")` — this check runs in `LobbyPage` where `isHost` is available, NOT inside `RoomStore.startPolling` which has no access to `participantId` (FR-012)

---

## Phase 7: Polish & Cross-Cutting

**Purpose**: Cleanup, type safety verification, and manual validation pass.

- [ ] T027 [P] Verify no `any` types introduced across all modified files: `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`, `backend/src/api/schemas.ts`, `backend/src/api/rooms.ts`, `frontend/src/services/api.ts`, `frontend/src/state/roomStore.ts`, `frontend/src/pages/LobbyPage.tsx`, `frontend/src/pages/CreateRoomPage.tsx`, `frontend/src/pages/JoinRoomPage.tsx`
- [ ] T031 [P] Verify no code path mutates `room.hostId` after `createRoom()` in `backend/src/services/roomStore.ts`: confirm `joinRoom()`, `saveRoom()`, and `toRoomSnapshot()` never overwrite `hostId`; confirm `POST /:code/start` handler does not alter `hostId` (FR-015)
- [ ] T028 [P] Run `cd backend && npm run build` and confirm zero TypeScript errors
- [ ] T029 [P] Run `cd frontend && npm run build` and confirm zero TypeScript errors
- [ ] T030 Manual two-tab acceptance test per plan.md Testing Strategy: create room (Tab A), join (Tab B), verify polling, verify Start Game gates, verify navigation for both host and non-host

---

## Dependencies

```
T001 → T002 → T003           (model chain — must be sequential)
T004 → T005 → T006           (store mutations — depend on T001-T003)
T007, T008, T009             (schemas — depend on T001-T003, parallel with each other)
T010                         (route — depends on T007-T009)
T011                         (frontend types — depends on T001-T003)
T012, T013                   (US1 tasks — depend on T011, parallel with each other)
T014, T015                   (US2 tasks — depend on T011, parallel with each other)
T016 → T017 → T018 → T019   (US3 store additions — sequential)
T020 → T021                  (US3 lobby changes — depend on T018-T019)
T022                         (US4 store — depends on T013, T016-T019)
T023 → T024 → T025           (US4 lobby — depend on T022)
T026                         (US4 poll detection — depends on T020, T023)
T027, T028, T029, T030, T031 (polish — depend on all preceding tasks)
```

## Parallel Execution Opportunities

| Group | Tasks | Notes |
|-------|-------|-------|
| Schema updates | T007, T008, T009 | All different schema objects in same file — write sequentially but can be reviewed in parallel |
| US1 client | T012, T013 | Different files |
| US2 validations | T014, T015 | Same file — write sequentially |
| Build checks | T027, T028, T029 | Fully independent |
| Host-immutability guard | T031 | Fully independent |

## Implementation Strategy

**MVP (unblock 2-player test)**: Complete Phases 1–2 (T001–T010) + Phase 3 (T011–T013).
This gives a runnable app where a host can create a room with validated name and the frontend
knows the host identity.

**Increment 2**: Phase 4 (T014–T015) — join validation.

**Increment 3**: Phase 5 (T016–T021) — automatic lobby polling.

**Increment 4**: Phase 6 (T022–T026) — full Start Game flow.

**Final**: Phase 7 (T027–T030) — build clean, acceptance test.
