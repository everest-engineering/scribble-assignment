# Tasks: Round Results and Lobby Restart

**Input**: Design documents from `/specs/004-result-restart-lobby/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/result-restart-api.md, quickstart.md  
**Depends on**: `001-host-join-rooms`, `002-first-round-drawer`, `003-round-draw-guess`

**Tests**: Included per constitution Principle V (test-first).

**Organization**: Tasks grouped by user story for independent implementation and verification.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify upstream gameplay and extend join/status enums.

- [x] T001 Confirm `003-round-draw-guess` delivers `submitGuess`, scores, and `drawing` status in `backend/src/services/roomStore.ts`
- [x] T002 [P] Add `RESULT_POLL_MS=2000` alongside existing poll constants in `backend/src/services/roomConstants.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: `result` status, revealed word field, result snapshot shape, join guard update.

**⚠️ CRITICAL**: No user story work until this phase is complete.

- [x] T003 Extend `RoomStatus` with `"result"` and `Room.revealedWord` in `backend/src/models/game.ts` per `data-model.md`
- [x] T004 [P] Extend `RoomSnapshot` with `revealedWord` and result-phase fields in `backend/src/models/game.ts` and `frontend/src/services/api.ts`
- [x] T005 [P] Add Zod schemas for restart route in `backend/src/api/schemas.ts`
- [x] T006 Update `joinRoom` to allow `status === "result"` and reject only `status === "drawing"` in `backend/src/services/roomStore.ts` (FR-014, 001 alignment)

**Checkpoint**: Models and join rules ready.

---

## Phase 3: User Story 1 - Shared Round Results (Priority: P1) 🎯 MVP

**Goal**: First correct guess ends round; all players see revealed word, session scores, and full guess history (including late joiners).

**Independent Test**: Correct guess → `status: result`; drawer and guesser see identical word, scores, history; late join sees same (quickstart 1–2, 4).

### Tests for User Story 1

- [x] T007 [P] [US1] Add failing tests: first correct guess sets `status` to `result` and `revealedWord`; second guess rejected in `backend/src/services/roomStore.test.ts`
- [x] T008 [P] [US1] Add failing tests: join during `result` succeeds; join during `drawing` still fails in `backend/src/services/roomStore.test.ts`
- [x] T009 [P] [US1] Add failing contract tests for result snapshot shape in `backend/src/api/rooms.test.ts`

### Implementation for User Story 1

- [x] T010 [US1] Implement `endRound(room)` setting `status: "result"` and `revealedWord` from `secretWord` in `backend/src/services/roomStore.ts`
- [x] T011 [US1] Call `endRound` from `submitGuess` when guess is correct and room is `drawing` in `backend/src/services/roomStore.ts`
- [x] T012 [US1] Return 409 for guesses when `status !== "drawing"` in `backend/src/services/roomStore.ts` and `backend/src/api/rooms.ts`
- [x] T013 [US1] Include `revealedWord`, `guesses`, and session scores in `toRoomSnapshot` when `status === "result"` in `backend/src/services/roomStore.ts`
- [x] T014 [US1] Wire join route to allow `result` rooms in `backend/src/api/rooms.ts`
- [x] T015 [US1] Create `ResultPage` showing revealed word, scoreboard, and guess history in `frontend/src/pages/ResultPage.tsx`
- [x] T016 [P] [US1] Replace placeholder content in `frontend/src/components/ResultPanel.tsx` or use dedicated sections on `ResultPage`
- [x] T017 [US1] Add `/results` route in `frontend/src/routes/index.tsx`

**Checkpoint**: Result screen shows complete summary for all participants.

---

## Phase 4: User Story 2 - Result State Stays in Sync (Priority: P2)

**Goal**: All clients auto-reach result screen within ~2s via polling; content stays consistent.

**Independent Test**: Guest did not submit winning guess but still lands on `/results` with same data (quickstart 1).

### Tests for User Story 2

- [x] T018 [P] [US2] Add failing test: two viewer snapshots in `result` share same word, scores, guess count in `backend/src/services/roomStore.test.ts`

### Implementation for User Story 2

- [x] T019 [US2] Add 2000ms poll on `frontend/src/pages/GamePage.tsx` — navigate to `/results` when `room.status === "result"`
- [x] T020 [US2] Add 2000ms poll on `frontend/src/pages/ResultPage.tsx` to refresh result snapshot in `frontend/src/pages/ResultPage.tsx`
- [x] T021 [P] [US2] Hydrate room state from poll on result page in `frontend/src/state/roomStore.ts`

**Checkpoint**: Auto-navigation and synced result view without manual refresh.

---

## Phase 5: User Story 3 - Host Restarts to a Clean Lobby (Priority: P1)

**Goal**: Host-only restart clears round state, resets scores to 0, preserves roster; all auto-navigate to lobby.

**Independent Test**: Host restarts from result → lobby with 0 scores, no word/canvas/history; guest cannot restart (quickstart 5–7).

### Tests for User Story 3

- [x] T022 [P] [US3] Add failing tests for `restartGame`: host-only, clears round fields, scores zeroed, roster preserved in `backend/src/services/roomStore.test.ts`
- [x] T023 [P] [US3] Add failing contract tests for `POST /rooms/:code/restart` 200/403/400 in `backend/src/api/rooms.test.ts`

### Implementation for User Story 3

- [x] T024 [US3] Implement `restartGame(code, hostParticipantId)` in `backend/src/services/roomStore.ts` per `data-model.md`
- [x] T025 [US3] Wire `POST /rooms/:code/restart` host-only in `backend/src/api/rooms.ts`
- [x] T026 [US3] Add `api.restartGame` in `frontend/src/services/api.ts`
- [x] T027 [US3] Add host-only Restart button on `frontend/src/pages/ResultPage.tsx` calling restart API
- [x] T028 [P] [US3] Show non-host message when restart unavailable on `frontend/src/pages/ResultPage.tsx`
- [x] T029 [US3] Poll on `ResultPage` and `GamePage` — navigate to `/lobby` when `status === "lobby"` after restart in `frontend/src/pages/ResultPage.tsx`
- [x] T030 [US3] Verify `LobbyPage` shows empty canvas/word/history and scores 0 after restart in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: Full lifecycle `lobby → drawing → result → lobby` works.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates and end-to-end validation.

- [x] T031 [P] Run `npm run build` and `npm test` in `backend/` and fix failures
- [x] T032 [P] Run `npm run build` in `frontend/` and fix type errors
- [x] T033 Execute full checklist in `specs/004-result-restart-lobby/quickstart.md`
- [x] T034 [P] Align error messages (“Round has ended”, host-only restart) in `backend/src/api/rooms.ts` and `frontend/src/pages/ResultPage.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** → **Phase 2** → **User Stories** → **Phase 6**
- Recommended: **US1 → US2 → US3** (navigation builds on result state; restart last)

### User Story Dependencies

| Story | Depends on | Can test alone after |
|-------|------------|----------------------|
| US1 | Phase 2, 003 guess flow | Phase 3 checkpoint |
| US2 | US1 (`result` exists) | Phase 4 checkpoint |
| US3 | US1 | Phase 5 checkpoint |

### Parallel Opportunities

- T002, T004, T005 in parallel  
- T007–T009 test batch  
- T016, T021, T028 parallel on frontend  
- T031 + T032 parallel  

---

## Parallel Example: User Story 1

```bash
T007: backend/src/services/roomStore.test.ts
T008: backend/src/services/roomStore.test.ts
T009: backend/src/api/rooms.test.ts
```

---

## Implementation Strategy

### MVP First

1. Phase 1 + 2  
2. US1 T010–T013 (end round + snapshot)  
3. US1 T015–T017 (minimal result page)  

### Incremental Delivery

1. End round + result display  
2. Auto-navigate to results  
3. Host restart + lobby reset  

---

## Notes

- **Total tasks**: 34 (T001–T034)  
- **Per story**: Setup 2 | Foundational 4 | US1 11 | US2 4 | US3 9 | Polish 4  
- **Lifecycle**: `lobby → drawing → result → lobby` (constitution)  
- **FR mapping**: US1 → FR-001–005, FR-014; US2 → FR-006, FR-015; US3 → FR-007–013  
- **003 integration**: T011 hooks into existing `submitGuess` — coordinate if implementing 003 and 004 together
