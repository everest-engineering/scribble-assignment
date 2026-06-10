# Tasks: Result, Restart, and Final Validation

**Input**: Design documents from `specs/004-result-restart-validation/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | data-model.md ✅ | contracts/api.md ✅ | research.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on each other)
- **[Story]**: Which user story this task belongs to (US1–US4)

---

## Phase 1: Setup (Baseline Verification)

**Purpose**: Confirm the codebase is in a clean, buildable state before any changes.

- [x] T001 Confirm both TypeScript builds pass clean: run `npm run build` in `backend/` and `frontend/` with zero errors (baseline for constitution gate V)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the `RoomStatus` type in both backend and frontend. This unblocks all user story phases — neither backend service nor frontend polling logic can correctly reference `"result"` state until this is done.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 Extend `RoomStatus` union type from `"lobby" | "playing"` to `"lobby" | "playing" | "result"` in `backend/src/models/game.ts`
- [x] T003 [P] Extend `RoomSnapshot.status` union from `"lobby" | "playing"` to `"lobby" | "playing" | "result"` in `frontend/src/services/api.ts`

**Checkpoint**: Type system reflects the new state — backend and frontend compile with the extended union.

---

## Phase 3: User Story 1 — Host Ends the Game (Priority: P1) 🎯 MVP

**Goal**: The host can click "End Game" on the Game screen, transitioning the room to `"result"` state. All polling clients detect the new state and navigate to `/result` (stub page sufficient at this checkpoint).

**Independent Test**: In a two-tab session (host + guesser), host clicks "End Game" on the Game screen. Both tabs navigate to `/result` within 2 seconds. A direct `curl` call with a non-host `playerName` returns HTTP 403.

### Backend — US1

- [x] T004 [US1] Add `endGameSchema` (validates `playerName` string, trimmed, non-empty) to `backend/src/api/schemas.ts` (depends on T002)
- [x] T005 [US1] Add `endGame(code: string, playerName: string)` function to `backend/src/services/roomStore.ts`: look up room (404 if missing), assert `status === "playing"` (409 if not), assert `playerName === room.participants[0].name` (403 if not host), set `room.status = "result"`, call `saveRoom()`, return snapshot (depends on T002, T004)
- [x] T006 [US1] Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts`: when `room.status === "result"` always include `secretWord` and `drawerName` in the snapshot (no viewer filtering — round is over) (depends on T002)
- [x] T007 [US1] Add `POST /:code/end` route to `backend/src/api/rooms.ts`: parse params with `roomCodeParamsSchema`, parse body with `endGameSchema`, call `endGame()`, respond with `{ room: toRoomSnapshot(room) }` (depends on T005, T006)

### Frontend — US1

- [x] T008 [P] [US1] Add `api.endGame(code, playerName)` method to `frontend/src/services/api.ts`: POST to `/rooms/:code/end` with `{ playerName }` body, return `{ room: RoomSnapshot }` (depends on T003)
- [x] T009 [P] [US1] Create stub `ResultPage` component in `frontend/src/pages/ResultPage.tsx`: renders a placeholder `<section>` with heading "Results" so the `/result` route resolves without error (no dependencies — can start immediately after T001)
- [x] T010 [US1] Add `/result` route pointing to `ResultPage` in `frontend/src/routes/index.tsx` (depends on T009)
- [x] T011 [US1] Add `endGame()` action to `frontend/src/state/roomStore.ts`: call `api.endGame(room.code, viewerName)`, update room snapshot in store (depends on T008)
- [x] T012 [US1] Update `GamePage` polling loop in `frontend/src/pages/GamePage.tsx` to detect `room.status === "result"` and `navigate("/result")` (depends on T003, T010, T011)
- [x] T013 [US1] Add "End Game" button (visible only when `isHost === true`) to `frontend/src/pages/GamePage.tsx`: on click calls `store.endGame()` (depends on T011, T012)

**Checkpoint**: Host clicks "End Game" → room transitions to `"result"` → all polling clients navigate to `/result` stub. Non-host `curl` returns 403. Both builds pass.

---

## Phase 4: User Story 2 — All Players View the Result Screen (Priority: P2)

**Goal**: The Result screen displays the correct secret word, final scores for all participants, and the full ordered guess history. Empty-state message shown when no guesses were submitted.

**Independent Test**: After ending a game, every tab shows the secret word, each participant's score, and the ordered guess history. A game with zero guesses shows an empty-state message in the guess history section.

- [x] T014 [P] [US2] Build out `ResultPage` in `frontend/src/pages/ResultPage.tsx`: read `room` from store, display secret word (`room.secretWord`) prominently (depends on T010)
- [x] T015 [P] [US2] Add scores section to `ResultPage` in `frontend/src/pages/ResultPage.tsx`: list every participant's name and their score from `room.scores`; show 0 for participants absent from the scores map (depends on T014)
- [x] T016 [US2] Add guess history section to `ResultPage` in `frontend/src/pages/ResultPage.tsx`: render `room.guesses` in submission order showing guesser name, guess text, and points; show "No guesses yet" empty-state message when `room.guesses` is empty (depends on T014)

**Checkpoint**: All tabs show complete, correct result data. Empty-state and populated-state both render correctly. Both builds pass.

---

## Phase 5: User Story 3 — Host Restarts the Game (Priority: P3)

**Goal**: The host can click "Play Again" on the Result screen, transitioning the room back to `"lobby"` state with all game data cleared and participants preserved. All polling clients navigate back to `/lobby`.

**Independent Test**: Host clicks "Play Again". Both tabs navigate to `/lobby` within 2 seconds, showing the same participants with no game data. A direct `curl` call with a non-host `playerName` returns HTTP 403.

### Backend — US3

- [x] T017 [P] [US3] Add `restartSchema` (validates `playerName` string, trimmed, non-empty) to `backend/src/api/schemas.ts` (depends on T002)
- [x] T018 [US3] Add `restartGame(code: string, playerName: string)` function to `backend/src/services/roomStore.ts`: look up room (404 if missing), assert `status === "result"` (409 if not), assert `playerName === room.participants[0].name` (403 if not host), clear `secretWord`, `drawerName`, `guesses`, `scores`, `strokes`, set `status = "lobby"`, call `saveRoom()`, return snapshot (depends on T002, T017)
- [x] T019 [US3] Add `POST /:code/restart` route to `backend/src/api/rooms.ts`: parse params with `roomCodeParamsSchema`, parse body with `restartSchema`, call `restartGame()`, respond with `{ room: toRoomSnapshot(room) }` (depends on T018)

### Frontend — US3

- [x] T020 [P] [US3] Add `api.restartGame(code, playerName)` method to `frontend/src/services/api.ts`: POST to `/rooms/:code/restart` with `{ playerName }` body, return `{ room: RoomSnapshot }` (depends on T003)
- [x] T021 [US3] Add `restartGame()` action to `frontend/src/state/roomStore.ts`: call `api.restartGame(room.code, viewerName)`, update room snapshot in store (depends on T020)
- [x] T022 [US3] Add polling loop to `ResultPage` in `frontend/src/pages/ResultPage.tsx`: poll `store.pollRoom()` every 2 seconds; when `room.status === "lobby"` navigate to `/lobby` (mirrors `LobbyPage` polling pattern) (depends on T016, T021)
- [x] T023 [US3] Add "Play Again" button (visible only when viewer `isHost === true`) to `ResultPage` in `frontend/src/pages/ResultPage.tsx`: on click calls `store.restartGame()` (depends on T021, T022)
- [x] T024 [US3] Update `LobbyPage` polling in `frontend/src/pages/LobbyPage.tsx` to handle `"result"` state: if `polled.status === "result"` navigate to `/result` (covers edge case where player is in lobby when host ends game) (depends on T010)

**Checkpoint**: Full restart flow works end-to-end. Host clicks "Play Again" → room returns to lobby → all tabs navigate back to `/lobby` with original participants. Both builds pass.

---

## Phase 6: User Story 4 — Full Round-Trip Validation (Priority: P4)

**Goal**: End-to-end validation of all four features integrated together, with no regressions.

**Independent Test**: Two-tab session completes a full round: lobby → start game → draw → guess → end game → result screen (correct data) → restart → lobby (same players) → start again → end → result screen (fresh data only from second round).

- [x] T025 [US4] Run all 7 validation scenarios from `specs/004-result-restart-validation/quickstart.md` with two browser tabs; confirm all acceptance criteria from spec.md US1–US4 pass (depends on T024)

**Checkpoint**: Full round-trip validated end-to-end. All four features work together with no regressions.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T026 [P] Remove the `ResultPanel` placeholder component import and usage from `frontend/src/pages/GamePage.tsx` sidebar (the dedicated `ResultPage` replaces it)
- [x] T027 [P] Verify TypeScript build passes in `backend/` with zero errors: `npm run build`
- [x] T028 [P] Verify TypeScript build passes in `frontend/` with zero errors: `npm run build`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS** all user story work
- **US1 (Phase 3)**: Depends on Phase 2 — no dependencies on other stories
- **US2 (Phase 4)**: Depends on Phase 3 (needs `/result` route and `ResultPage` stub from T009–T010)
- **US3 (Phase 5)**: Depends on Phase 4 (needs complete `ResultPage` to add "Play Again" button)
- **US4 (Phase 6)**: Depends on all prior phases
- **Polish (Phase 7)**: Depends on Phase 6

### User Story Dependencies

- **US1 (P1)**: Can start immediately after Foundational
- **US2 (P2)**: Requires US1 complete (`/result` route exists, `ResultPage` stub exists)
- **US3 (P3)**: Requires US2 complete (`ResultPage` fully rendered before adding buttons/polling)
- **US4 (P4)**: Requires US3 complete

### Within Each User Story

- Backend schemas → backend service → backend route (sequential)
- Frontend API method and stub page can be built in parallel with backend
- Frontend store action → page wiring (sequential)

### Parallel Opportunities

- T002 and T003: Backend and frontend type extensions (different files)
- T008 and T009: `api.endGame()` and stub `ResultPage` (different files)
- T014 and T015: Secret word display and scores display in ResultPage (same file but additive sections — coordinate carefully)
- T017 and T020: `restartSchema` and `api.restartGame()` (different files)
- T027 and T028: Backend and frontend final build checks (independent)

---

## Parallel Example: User Story 1

```bash
# After Phase 2, these can start in parallel:
Task T004: "Add endGameSchema to backend/src/api/schemas.ts"
Task T008: "Add api.endGame() to frontend/src/services/api.ts"
Task T009: "Create stub ResultPage in frontend/src/pages/ResultPage.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002–T003)
3. Complete Phase 3: User Story 1 (T004–T013)
4. **STOP and VALIDATE**: Confirm host can end game and all clients navigate to `/result` stub
5. Proceed to US2 only after US1 checkpoint passes

### Incremental Delivery

1. Setup + Foundational → type system ready
2. US1 → end-game endpoint + polling detection + stub result screen *(MVP checkpoint)*
3. US2 → full result screen with data display
4. US3 → restart endpoint + Play Again button + polling back to lobby *(replayability complete)*
5. US4 → full round-trip validation *(all four spec features integrated)*

---

## Notes

- [P] tasks = different files, no dependencies on each other within the phase
- Each user story phase is independently completable and testable
- Constitution gate V requires two browser tabs for end-to-end validation at each checkpoint
- Both `npm run build` must pass before any task is marked done (constitution gate)
- `strokes` must be cleared in `restartGame()` — this is specified in `data-model.md` even though not listed in spec FR-009 (CHK011 gap resolved: include `strokes` in the clear)
- The `ResultPanel` placeholder in `GamePage` (T026) should be removed in polish, not mid-story
