---
description: "Task list for Result, Restart & Final Validation (004)"
---

# Tasks: Result, Restart & Final Validation

**Input**: Design documents from `specs/004-result-restart-flow/`

**Prerequisites**: [plan.md](./plan.md) · [spec.md](./spec.md) · [research.md](./research.md) · [data-model.md](./data-model.md) · [contracts/api.md](./contracts/api.md) · [quickstart.md](./quickstart.md)

**Tests**: Not explicitly requested in the spec — no test tasks generated.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No new project structure needed. All changes are additive within the existing `backend/` and `frontend/` directories.

- [X] T001 Verify both dev servers start cleanly: `cd backend && npm run dev` and `cd frontend && npm run dev`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type and schema changes that every user story depends on. MUST be complete before any US phase begins.

**⚠️ CRITICAL**: US1, US2, and US3 all depend on `RoomStatus` including `"ended"` and `RoomSnapshot` including `revealedWord`.

- [X] T002 Add `"ended"` to `RoomStatus` union and add `revealedWord?: string` to `Room` interface in `backend/src/models/game.ts`
- [X] T003 Add `revealedWord?: string` to `RoomSnapshot` interface in `backend/src/models/game.ts` _(sequential after T002 — same file)_
- [X] T004 [P] Add `"ended"` to `RoomStatus` and `revealedWord?: string` to `RoomSnapshot` in `frontend/src/services/api.ts`
- [X] T005 Add `endRoundSchema` and `restartRoomSchema` (each `z.object({ participantId: z.string() })`) to `backend/src/api/schemas.ts`
- [X] T006 Extend `toRoomSnapshot()` in `backend/src/services/roomStore.ts`: expose `currentDrawerId`, `strokes`, `guesses`, `scores` when `status === "playing" || status === "ended"`; expose `revealedWord` only when `status === "ended"`; keep `currentWord` masking for `"playing"` only

**Checkpoint**: Types compile cleanly; `toRoomSnapshot` handles all three statuses; schemas exist — US phases can begin.

---

## Phase 3: User Story 2 — Host Ends the Round Manually (Priority: P1) 🎯 MVP

**Goal**: Add `POST /rooms/:code/end` so the host can manually transition a playing room to `"ended"`, making the result screen reachable.

> US2 is implemented before US1 because US1's auto-end is a modification to the existing `submitGuess` function, and the manual end-round route is the simpler of the two P1 paths. Both stories depend on the `"ended"` state (Phase 2) and are independently testable.

**Independent Test**: Start a game in two tabs. In the host tab, call `POST /rooms/:code/end` with the host's `participantId`. Confirm `room.status` is `"ended"` and `room.revealedWord` is set. Confirm a non-host call returns 403. Confirm calling it again (already `"ended"`) returns 409.

- [X] T007 [US2] Implement `endRound(code, participantId)` service function in `backend/src/services/roomStore.ts`: validate room exists (404), status is `"playing"` (409), participantId equals hostId (403); set `room.status = "ended"` and `room.revealedWord = room.currentWord ?? ""`; return `toRoomSnapshot(room)`
- [X] T008 [US2] Add `POST /:code/end` route to `backend/src/api/rooms.ts`: parse body with `endRoundSchema`, call `endRound()`, return `{ room: snapshot }`
- [X] T009 [P] [US2] Add `endRound(code, participantId)` to the `api` object in `frontend/src/services/api.ts`: `POST /rooms/:code/end` with `{ participantId }` body, returns `{ room: RoomSnapshot }`
- [X] T023 [US2] Add `endRound(code: string, participantId: string)` wrapper method to `frontend/src/state/roomStore.ts`: call `api.endRound(code, participantId)`, update internal room state from the returned snapshot, notify subscribers _(depends on T009; follows established `createRoom`/`startRoom` pattern)_

**Checkpoint**: `POST /rooms/:code/end` works end-to-end; 403/404/409 guards verified; store method updates UI state.

---

## Phase 4: User Story 1 — Result Screen Displayed to All Players (Priority: P1)

**Goal**: Modify `submitGuess` to auto-end the round on first correct guess, add "End Round" button to `GamePage`, add automatic navigation to `/result` when status is `"ended"`, and build the `ResultPage`.

**Independent Test**: Start a game in two tabs. Submit the correct word in the guesser tab (or click "End Round" in host tab). Both tabs must automatically navigate to `/result` within ≤2 s. `ResultPage` shows the revealed word, full guess list with names, and ranked scoreboard. "Restart Game" button is visible only in the host tab.

- [X] T010 [US1] Modify `submitGuess()` in `backend/src/services/roomStore.ts`: after recording a correct guess and awarding 100 pts, set `room.status = "ended"` and `room.revealedWord = room.currentWord ?? ""`
- [X] T011 [US1] Add `"End Round"` button (host-only, visible when `participantId === room.hostId`) to `frontend/src/pages/GamePage.tsx`; on click call `roomStore.endRound(room.code, participantId ?? "").catch(() => {})` _(uses store wrapper from T023, consistent with `startRoom` pattern)_
- [X] T012 [US1] Add poll-driven navigation in `GamePage.tsx` `useEffect`: when `room.status === "ended"` navigate to `/result` with `{ replace: true }`
- [X] T013 [US1] Create `frontend/src/pages/ResultPage.tsx`: poll `roomStore.fetchRoom()` every 2 s (clear on unmount); navigate to `/` if no room; navigate to `/lobby` with `{ replace: true }` when `room.status === "lobby"`; render `revealedWord` (display `"(unknown)"` if absent), `ResultPanel` (guesses + participant names), `Scoreboard` (scores ranked descending); show "Restart Game" button only when `participantId === room.hostId`; on "Restart Game" click call `roomStore.restartRoom(room.code, participantId ?? "")` _(store wrapper added in T024; wire the call in T013, button will error until T024/T016/T017 are complete)_
- [X] T014 [US1] Register `/result` route in `frontend/src/routes/index.tsx`: `<Route path="/result" element={<ResultPage />} />`
- [X] T015 [P] [US1] Add result page layout CSS to `frontend/src/styles/app.css`: `.result-page`, `.result-page__word`, `.result-page__word-label`, `.result-page__word-value`

**Checkpoint**: Both tabs auto-navigate to `/result` on round end; result screen shows word, guesses, scores; "Restart Game" host-only; all within ≤2 s.

---

## Phase 5: User Story 3 — Host Restarts and All Players Return to Lobby (Priority: P2)

**Goal**: Implement `POST /rooms/:code/restart` so the host can reset the room to `"lobby"`, preserving participants and clearing all round state. The existing `ResultPage` poll then detects `status === "lobby"` and navigates back.

**Independent Test**: From the result screen, click "Restart Game" in the host tab. Both tabs navigate to `/lobby` within ≤2 s. All participant names are present. `room.strokes`, `room.guesses`, `room.scores`, `room.revealedWord` are all absent/empty. Confirm a non-host call returns 403 and a call from `"playing"` returns 409.

- [X] T016 [US3] Implement `restartRoom(code, participantId)` service function in `backend/src/services/roomStore.ts`: validate room exists (404), status is `"ended"` (409 `"Game has not ended"`), participantId equals hostId (403); clear `currentWord`, `currentDrawerId`, `roundNumber`, `strokes`, `guesses`, `scores`, `revealedWord`; set `room.status = "lobby"`; return `toRoomSnapshot(room)`
- [X] T017 [US3] Add `POST /:code/restart` route to `backend/src/api/rooms.ts`: parse body with `restartRoomSchema`, call `restartRoom()`, return `{ room: snapshot }`
- [X] T018 [P] [US3] Add `restartRoom(code, participantId)` to the `api` object in `frontend/src/services/api.ts`: `POST /rooms/:code/restart` with `{ participantId }` body, returns `{ room: RoomSnapshot }`
- [X] T024 [US3] Add `restartRoom(code: string, participantId: string)` wrapper method to `frontend/src/state/roomStore.ts`: call `api.restartRoom(code, participantId)`, update internal room state from the returned snapshot, notify subscribers _(depends on T018; follows established `createRoom`/`startRoom` pattern)_

**Checkpoint**: `POST /rooms/:code/restart` works; lobby snapshot has no round fields; both tabs navigate to `/lobby` on restart; non-host/wrong-status calls rejected correctly; store method updates UI state.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, manual testing, and any final cross-cutting adjustments.

- [X] T019 [P] Run backend unit tests: `cd backend && npm test` — confirm all existing tests still pass (no regression from `submitGuess` and `toRoomSnapshot` changes)
- [X] T020 [P] Run frontend unit tests: `cd frontend && npm test` — confirm all existing tests still pass
- [X] T021 Run full quickstart.md scenario end-to-end in two browser tabs: auto-end on correct guess (Story 1), manual "End Round" (Story 2), restart back to lobby (Story 3)
- [X] T022 Verify failure cases from quickstart.md: non-host end-round → 403, non-host restart → 403, end when not playing → 409, restart when not ended → 409

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user story phases
- **US2 (Phase 3)**: Depends on Phase 2 — can start immediately after Foundational
- **US1 (Phase 4)**: Depends on Phase 2 — can start in parallel with US2 (different files for most tasks)
- **US3 (Phase 5)**: Depends on Phase 2 — can start in parallel with US1 and US2
- **Polish (Phase 6)**: Depends on all desired user stories complete

### User Story Dependencies

- **US2 (Phase 3)**: Independent after Phase 2; no dependency on US1 or US3
- **US1 (Phase 4)**: Independent after Phase 2; T013 (`ResultPage`) calls `api.restartRoom` which is added in US3 (T018) — wire the call in T013 but the button will return an error until T016/T017 are done; functionally testable before US3
- **US3 (Phase 5)**: Independent after Phase 2; `ResultPage` navigation (T013) already handles the `"lobby"` poll; only needs the backend endpoint and api method from this phase

### Within Each Phase

- T002 and T003 within Phase 2 must complete before T004 is wired in the frontend
- Within Phase 3: T007 → T008 (service before route); T009 is independent; T023 depends on T009
- Within Phase 4: T010 → T011/T012 (backend change before frontend wires it); T011 depends on T023; T013 and T014 → T015 (page before styles)
- Within Phase 5: T016 → T017 (service before route); T018 is independent; T024 depends on T018

### Parallel Opportunities

- T004 and T005 can run in parallel with T002/T003 (different files — `api.ts` and `schemas.ts` vs `game.ts`); T003 is sequential after T002 (same file)
- T009 (Phase 3) can run in parallel with T007/T008 (different files — api.ts vs roomStore/rooms)
- T015 (CSS) can run in parallel with any Phase 4 task
- T018 (Phase 5) can run in parallel with T016/T017 (api.ts vs roomStore/rooms)
- T019 and T020 (Phase 6 tests) can run in parallel

---

## Parallel Example: Phase 2

```
# Run concurrently — different files, no shared dependencies:
T002→T003: backend/src/models/game.ts   (T002 first: RoomStatus + Room; T003 next: RoomSnapshot)
T004:      frontend/src/services/api.ts  (RoomStatus + RoomSnapshot frontend types)
T005:      backend/src/api/schemas.ts    (endRoundSchema + restartRoomSchema)
```

---

## Implementation Strategy

### MVP First (US1 + US2 only — result screen fully functional)

1. Phase 1: Verify dev servers
2. Phase 2: Foundational — type and schema changes
3. Phase 3 (US2): `POST /rooms/:code/end` backend endpoint
4. Phase 4 (US1): Auto-end on correct guess + `ResultPage` + navigation
5. **STOP and VALIDATE**: Two-tab manual test — round ends, result screen appears, word/scores/guesses shown
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US2 (Phase 3) → manual end-round works → test independently
3. Add US1 (Phase 4) → auto-end + result screen → full result flow testable
4. Add US3 (Phase 5) → restart → full game loop testable (lobby → play → result → lobby)
5. Polish (Phase 6) → full regression + quickstart validation
