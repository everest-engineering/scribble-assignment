---
description: "Task list for Result, Restart & Final Validation (Scenario 4)"
---

# Tasks: Result, Restart & Final Validation

**Input**: Design documents from `specs/004-result-restart/`

**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/api.md ✅

**Scenario prerequisites**: `001-scribble-game`, `002-game-start-drawer`, `003-gameplay-interaction`
all fully implemented and validated.

**Tests**: Not requested — manual two-tab validation per `quickstart.md`.

**Organization**: Tasks follow the state machine: extend status → end-round endpoint → result
navigation + display (US1) → restart endpoint → restart navigation (US2).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: US1 or US2
- Exact file paths in every description

---

## Phase 1: Setup

**Purpose**: Confirm Scenarios 1–3 pass as baseline.

- [x] T001 Start both servers, complete a full Scenario 3 flow (draw, guess, check scores) — all prior scenarios must pass before Scenario 4 work begins

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend `RoomStatus` to include `"result"` — required before any story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 [P] Add `"result"` to the `RoomStatus` union type in `backend/src/models/game.ts`: change `"lobby" | "active"` to `"lobby" | "active" | "result"`
- [x] T003 [P] Widen the `status` field in the `RoomSnapshot` interface in `frontend/src/services/api.ts` to `"lobby" | "active" | "result"`

**Checkpoint**: Both ends compile; existing polls see "result" as a valid status.

---

## Phase 3: User Story 1 — End Round & Show Results (Priority: P1) 🎯 MVP

**Goal**: The host clicks End Round during an active game; all players see a result screen
showing the secret word, all scores, and the full guess history.

**Independent Test**: With an active game (some guesses submitted), click End Round in the
host tab. Both tabs navigate to the result screen. Confirm the secret word, all scores, and
all guesses are visible.

### Implementation for User Story 1

- [x] T004 [US1] Add `endRoundSchema = z.object({ participantId: z.string().min(1) })` to `backend/src/api/schemas.ts`
- [x] T005 [US1] Add `endRound(code, participantId)` to `backend/src/services/roomStore.ts`: get room (404), validate `room.status === "active"` (400 "Game is not active"), validate `participantId === room.hostId` (403 "Only the host can end the round"), set `room.status = "result"`, call `saveRoom`, return `{ ok: true }`; also in `toRoomSnapshot()`, extend the `currentWord` spread to include `room.status === "result"` as an additional condition: `...(room.currentWord && (viewerParticipantId === room.drawerId || room.status === "result") && { currentWord: room.currentWord })`
- [x] T006 [US1] Add `POST /rooms/:code/end` route to `backend/src/api/rooms.ts`: parse with `roomCodeParamsSchema` and `endRoundSchema`, call `endRound(code.toUpperCase(), participantId)`, respond 200 `{ ok: true }`
- [x] T007 [P] [US1] Add `endRound(code, participantId)` method to the `api` object in `frontend/src/services/api.ts`: POST to `/rooms/:code/end` with `{ participantId }`, return `{ ok: boolean }`
- [x] T008 [US1] Add `async endRound()` method to `RoomStore` class in `frontend/src/state/roomStore.ts`: call `api.endRound(room.code, participantId)` inside `withLoading`, then call `fetchRoom()` to update the snapshot
- [x] T009 [US1] In `frontend/src/pages/GamePage.tsx`: (a) add an "End Round" button visible only when `isHost && room.status === "active"` — on click call `roomStore.endRound()`; (b) add a `useEffect` watching `room?.status` that calls `navigate("/result")` when `room?.status === "result"`, so all players navigate automatically
- [x] T010 [US1] Add `/result` route to `frontend/src/routes/index.tsx` importing `ResultPage`; create `frontend/src/pages/ResultPage.tsx`: redirect to `/` if no room; render the secret word (`room.currentWord`), the scoreboard (all participants with their scores from `room.scores`), and the full guess history (`room.guesses`); poll every ~2 000 ms calling `roomStore.fetchRoom()` to stay in sync; show no Restart button yet (added in US2)

**Checkpoint**: End Round transitions both tabs to the result screen showing word, scores,
and history.

---

## Phase 4: User Story 2 — Restart to Lobby (Priority: P1)

**Goal**: From the result screen, the host restarts. All players return to the lobby with
participants preserved. A new game starts clean (scores 0, canvas blank, no guesses).

**Independent Test**: On result screen, host clicks Restart. Both tabs land on lobby with
all participants listed. Start a new game — confirm scores are 0, canvas blank, no guesses.

### Implementation for User Story 2

- [x] T011 [US2] Add `restartRoomSchema = z.object({ participantId: z.string().min(1) })` to `backend/src/api/schemas.ts`
- [x] T012 [US2] Add `restartRoom(code, participantId)` to `backend/src/services/roomStore.ts`: get room (404), validate `room.status === "result"` (400 "Round has not ended"), validate host (403), clear `room.canvasStrokes = []`, `room.guesses = []`, `delete room.scores`, `delete room.currentWord`, `delete room.drawerId`, set `room.status = "lobby"`, call `saveRoom`, return `{ ok: true }`
- [x] T013 [US2] Add `POST /rooms/:code/restart` route to `backend/src/api/rooms.ts`: parse with `roomCodeParamsSchema` and `restartRoomSchema`, call `restartRoom(code.toUpperCase(), participantId)`, respond 200 `{ ok: true }`
- [x] T014 [P] [US2] Add `restartGame(code, participantId)` to the `api` object in `frontend/src/services/api.ts`
- [x] T015 [US2] Add `async restartGame()` method to `RoomStore` in `frontend/src/state/roomStore.ts`: call `api.restartGame(room.code, participantId)` inside `withLoading`, then call `fetchRoom()`
- [x] T016 [US2] In `frontend/src/pages/ResultPage.tsx`: (a) add a `useEffect` watching `room?.status` that calls `navigate("/lobby")` when `room?.status === "lobby"`; (b) add a Restart button visible only when `isHost` (`participantId === room?.hostId`) — on click call `roomStore.restartGame()`; non-host players see no Restart button

**Checkpoint**: Restart lands all players on the lobby; a new game starts with clean state.

---

## Phase 5: Polish & Validation

**Purpose**: End-to-end verification and build confirmation.

- [x] T017 Walk through both scenarios in `specs/004-result-restart/quickstart.md` with two browser tabs — full game loop from room creation through restart must pass
- [x] T018 [P] Run `cd backend && npm run build` — must exit 0 with no TypeScript errors
- [x] T019 [P] Run `cd frontend && npm run build` — must exit 0 with no TypeScript errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Scenarios 1–3 green — blocks all
- **Foundational (Phase 2)**: T002+T003 parallel; block all story work
- **US1 (Phase 3)**: Depends on Phase 2; T004→T006 backend, T007→T010 frontend (T007 [P] alongside T004–T006)
- **US2 (Phase 4)**: Depends on Phase 2; independent of US1 (different endpoint + page section); T011→T013 backend, T014→T016 frontend (T014 [P] alongside T011–T013)
- **Polish (Phase 5)**: All phases complete

### Parallel Opportunities

```bash
# Phase 2
T002  # backend/src/models/game.ts
T003  # frontend/src/services/api.ts

# Within US1: frontend api method alongside backend work
T007  # frontend/src/services/api.ts  [P] with T004–T006

# Within US2: frontend api method alongside backend work
T014  # frontend/src/services/api.ts  [P] with T011–T013

# Phase 5: both builds
T018  # backend build
T019  # frontend build
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1: Verify Scenarios 1–3
2. Phase 2: Status type extension
3. T004–T010 (US1): End round → result screen visible with full data
4. **STOP and VALIDATE**: End round in host tab, both tabs show result screen

### Full Delivery

1. Phases 1–2 → baseline + type extension
2. US1 (Phase 3) → end round + result screen
3. US2 (Phase 4) → restart + clean slate
4. Phase 5 → full quickstart + builds pass

---

## Notes

- T005 modifies both `endRound()` and `toRoomSnapshot()` in the same file — a single
  focused edit covering both the new function and the word-reveal rule
- T009 adds both the End Round button AND the status-watching `useEffect` in `GamePage` —
  these are one logical unit (end trigger + navigation response)
- T010 combines route registration and `ResultPage` creation — split if ResultPage becomes
  large; the polling in ResultPage follows the exact same pattern as LobbyPage
- T016 completes ResultPage with the Restart button and navigation useEffect for US2
- The `delete` operator on optional Room fields (`scores`, `currentWord`, `drawerId`) is
  valid TypeScript for optional fields and keeps the snapshot clean after restart
