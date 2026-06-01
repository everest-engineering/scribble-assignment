# Tasks: Active Round Drawing, Guessing, and Scoring

**Input**: Design documents from `/specs/003-round-draw-guess/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/gameplay-api.md, quickstart.md  
**Depends on**: `002-first-round-drawer` (active `drawing` round, drawer/guesser roles, `secretWord`)

**Tests**: Included per constitution Principle V (test-first for guess logic and role guards).

**Organization**: Tasks grouped by user story for independent implementation and verification.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify upstream features and gameplay constants.

- [ ] T001 Confirm `002-first-round-drawer` is complete (`drawing` status, `drawerParticipantId`, viewer `secretWord` for drawer only) in `backend/src/services/roomStore.ts`
- [ ] T002 [P] Add gameplay constants (`GAME_POLL_MS=2000`, `CORRECT_GUESS_POINTS=100`) in `backend/src/services/roomConstants.ts` (create file if missing from 001)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, pure guess logic, and snapshot fields for canvas/history/scores.

**⚠️ CRITICAL**: No user story work until this phase is complete.

- [ ] T003 Extend `Room` with `canvasStrokes`, `guesses`, and `Participant.score` in `backend/src/models/game.ts` per `data-model.md`
- [ ] T004 [P] Implement `trimGuess`, `isGuessEmpty`, `compareGuessToSecret` in `backend/src/services/guessLogic.ts`
- [ ] T005 [P] Add Zod schemas for `canvasStrokes` and guess body in `backend/src/api/schemas.ts`
- [ ] T006 [P] Extend `RoomSnapshot` types with `canvasStrokes`, `guesses`, and `participants[].score` in `frontend/src/services/api.ts`
- [ ] T007 Initialize `score: 0` and `guesses: []` and `canvasStrokes: []` when round starts in `backend/src/services/roomStore.ts` (`startGame` from 002)

**Checkpoint**: Types and guess helpers ready.

---

## Phase 3: User Story 1 - Drawer Creates and Clears the Drawing (Priority: P1) 🎯 MVP

**Goal**: Interactive canvas for drawer; immediate local render; guessers read-only; canvas sync via poll (US3 wires poll).

**Independent Test**: Drawer draws and clears—local screen updates; guesser cannot draw (quickstart steps 2, 4, 8 partial).

### Tests for User Story 1

- [ ] T008 [P] [US1] Add failing tests: drawer can update canvas; guesser `updateCanvas` rejected in `backend/src/services/roomStore.test.ts`
- [ ] T009 [P] [US1] Add failing contract test for `PUT /rooms/:code/canvas` 200/403 in `backend/src/api/rooms.test.ts`

### Implementation for User Story 1

- [ ] T010 [US1] Implement `updateCanvas(code, participantId, strokes)` replacing `room.canvasStrokes` in `backend/src/services/roomStore.ts`
- [ ] T011 [US1] Wire `PUT /rooms/:code/canvas` with drawer-only guard in `backend/src/api/rooms.ts`
- [ ] T012 [US1] Create `DrawingCanvas` with pointer draw and clear (full stroke list replace) in `frontend/src/components/DrawingCanvas.tsx`
- [ ] T013 [US1] Render strokes immediately on drawer client and debounce `PUT` to API in `frontend/src/components/DrawingCanvas.tsx`
- [ ] T014 [US1] Mount `DrawingCanvas` on `frontend/src/pages/GamePage.tsx` — interactive when `viewer.role === "drawer"`, read-only otherwise
- [ ] T015 [P] [US1] Replace canvas placeholder markup in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: Drawer can draw/clear locally; canvas persisted server-side.

---

## Phase 4: User Story 2 - Guessers Submit Valid Guesses (Priority: P1)

**Goal**: Trim guesses, reject empty, case-insensitive compare, +100/0 scoring, drawer cannot guess.

**Independent Test**: Valid/empty/case-variant guesses behave per spec; drawer blocked (quickstart steps 5–7, 9).

### Tests for User Story 2

- [ ] T016 [P] [US2] Add failing unit tests for trim, empty rejection, case-insensitive correct/incorrect in `backend/src/services/guessLogic.test.ts`
- [ ] T017 [P] [US2] Add failing tests for `submitGuess` scoring (+100/0) and drawer rejection in `backend/src/services/roomStore.test.ts`
- [ ] T018 [P] [US2] Add failing contract test for `POST /rooms/:code/guesses` 400/403 in `backend/src/api/rooms.test.ts`

### Implementation for User Story 2

- [ ] T019 [US2] Implement `submitGuess(code, participantId, text)` append history + update score in `backend/src/services/roomStore.ts`
- [ ] T020 [US2] Wire `POST /rooms/:code/guesses` with validation messages per contract in `backend/src/api/rooms.ts`
- [ ] T021 [US2] Wire `GuessForm` submit to `api.submitGuess` with client-side trim in `frontend/src/components/GuessForm.tsx`
- [ ] T022 [US2] Disable/hide `GuessForm` when `viewer.role === "drawer"` in `frontend/src/pages/GamePage.tsx`
- [ ] T023 [P] [US2] Show validation error for empty guess in `frontend/src/components/GuessForm.tsx`

**Checkpoint**: Guessing and scoring work; drawer cannot submit guesses.

---

## Phase 5: User Story 3 - Everyone Stays in Sync (Priority: P1)

**Goal**: ~2s poll syncs canvas, guess history, and scores; history ordered; no secret word leak.

**Independent Test**: Two browsers see canvas and guesses within ~2s; scores update (quickstart steps 1, 3, 6–9).

### Tests for User Story 3

- [ ] T024 [P] [US3] Add failing test: `toRoomSnapshot` includes `canvasStrokes`, `guesses`, scores; no `secretWord` for guesser in `backend/src/services/roomStore.test.ts`
- [ ] T025 [P] [US3] Add failing contract test guesser GET response omits `viewer.secretWord` during drawing in `backend/src/api/rooms.test.ts`

### Implementation for User Story 3

- [ ] T026 [US3] Include `canvasStrokes`, `guesses`, and participant `score` in `toRoomSnapshot` in `backend/src/services/roomStore.ts`
- [ ] T027 [US3] Remove `availableWords` from guesser-visible snapshot during drawing in `backend/src/services/roomStore.ts` (FR-014)
- [ ] T028 [US3] Add 2000ms game-state polling on `frontend/src/pages/GamePage.tsx` calling `api.fetchRoom`
- [ ] T029 [US3] Render remote `canvasStrokes` on read-only canvas for guessers in `frontend/src/components/DrawingCanvas.tsx`
- [ ] T030 [US3] Create `GuessHistory` list (name, guess text, correct/incorrect — no secret word) in `frontend/src/components/GuessHistory.tsx`
- [ ] T031 [US3] Wire `Scoreboard` to live `participants[].score` from room state in `frontend/src/components/Scoreboard.tsx`
- [ ] T032 [US3] Mount `GuessHistory` and updated `Scoreboard` on `frontend/src/pages/GamePage.tsx`
- [ ] T033 [P] [US3] Hydrate `roomStore` from poll responses in `frontend/src/state/roomStore.ts`

**Checkpoint**: Full multiplayer sync for canvas, history, and scores.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates; confirm round-end deferred to 004.

- [ ] T034 [P] Run `npm run build` and `npm test` in `backend/` and fix failures
- [ ] T035 [P] Run `npm run build` in `frontend/` and fix type errors
- [ ] T036 Execute two-browser checklist in `specs/003-round-draw-guess/quickstart.md`
- [ ] T037 Document in `specs/003-round-draw-guess/research.md` that first correct guess → `result` transition is implemented in `004-result-restart-lobby` (do not add in 003 unless coordinating both features)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** → **Phase 2** → **User Stories 3–5** → **Phase 6**
- Recommended: **US1 → US2 → US3** (poll integrates canvas + guesses)

### User Story Dependencies

| Story | Depends on | Can test alone after |
|-------|------------|----------------------|
| US1 | Phase 2 | Phase 3 checkpoint (local drawer + PUT) |
| US2 | Phase 2, US1 optional | Phase 4 checkpoint |
| US3 | US1 + US2 | Phase 5 checkpoint |

### Parallel Opportunities

- T002, T004, T005, T006 in parallel  
- Test batches per story  
- T015, T023, T033 parallel on frontend  
- T034 + T035 parallel  

---

## Parallel Example: User Story 2

```bash
T016: backend/src/services/guessLogic.test.ts
T017: backend/src/services/roomStore.test.ts
T018: backend/src/api/rooms.test.ts
```

---

## Implementation Strategy

### MVP First

1. Phase 1 + 2  
2. US1 (canvas PUT + drawer UI)  
3. US2 (guesses + scoring)  
4. US3 (poll + history + scoreboard)  

### Incremental Delivery

1. Drawer draws locally → server persists  
2. Guessers submit → scores/history update  
3. Poll ties both clients together  

---

## Notes

- **Total tasks**: 37 (T001–T037)  
- **Per story**: Setup 2 | Foundational 5 | US1 8 | US2 8 | US3 10 | Polish 4  
- **No** WebSockets, DB, or auth  
- **FR mapping**: US1 → FR-001–004; US2 → FR-005–011; US3 → FR-010–014, FR-012–013  
- **004**: First correct guess ends round — not in 003 scope (T037)
