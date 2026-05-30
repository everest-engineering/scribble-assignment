# Tasks: Gameplay Interaction (Scenario 3)

**Input**: Design documents from `specs/003-gameplay-interaction/`  
**Prerequisites**: plan.md, spec.md; Scenarios 1–2 complete (`specs/001-room-setup-lobby/`, `specs/002-game-start-drawer-flow/`)  
**Branch**: `scribble-lab`

**Organization**: Tasks grouped by user story (P1→P5) for independent implementation and two-tab validation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete-task dependencies)
- **[Story]**: User story label (US1–US5) on story-phase tasks only
- Every task includes an exact file path

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm brownfield starter and Scenarios 1–2 prerequisites are ready.

- [ ] T001 Confirm Scenarios 1–2 game flow works and starter files listed in `specs/003-gameplay-interaction/plan.md` exist under `backend/src/` and `frontend/src/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No cross-story foundational slice — types are introduced per user story phase per plan.

**Checkpoint**: Proceed to Phase 3 (US1) after T001.

---

## Phase 3: User Story 1 — Scores Start at Zero (Priority: P1) 🎯 MVP

**Goal**: Every participant's score initializes to 0 at round start and displays on the scoreboard.

**Independent Test**: After game start, all tabs show every participant at score 0 on the scoreboard.

**Maps to**: FR-001, FR-002, SC-001

### Implementation for User Story 1

- [ ] T002 [US1] Add `scores` map on `Room` and `score` on `ParticipantSnapshot` in `backend/src/models/game.ts`
- [ ] T003 [US1] Initialize `scores[id] = 0` for each participant in `startGame` and expose `score` in `toRoomSnapshot` in `backend/src/services/roomStore.ts`
- [ ] T004 [US1] Add all-scores-zero-after-start tests in `backend/src/services/roomStore.test.ts`
- [ ] T005 [P] [US1] Mirror `score` on `ParticipantSnapshot` in `frontend/src/services/api.ts`
- [ ] T006 [US1] Render participant names and scores from `room.participants` in `frontend/src/components/Scoreboard.tsx`
- [ ] T007 [US1] Pass `room` into `Scoreboard` from `frontend/src/pages/GamePage.tsx`

**Checkpoint**: User Story 1 independently testable — scoreboard shows 0 for all players after start.

---

## Phase 4: User Story 2 — Drawer Draws and Clears the Canvas (Priority: P2)

**Goal**: Drawer draws and clears an interactive canvas; strokes sync to all clients via polling.

**Independent Test**: Drawer tab draws and clears; guesser tab sees the same drawing within one poll cycle.

**Maps to**: FR-003–FR-007, SC-002

### Implementation for User Story 2

- [ ] T008 [US2] Add `DrawingStroke` type and `strokes` on `Room`/`RoomSnapshot` in `backend/src/models/game.ts`
- [ ] T009 [US2] Add `strokeSchema`, `addStrokeSchema`, and `clearCanvasSchema` in `backend/src/api/schemas.ts`
- [ ] T010 [P] [US2] Add stroke and clear schema tests in `backend/src/api/schemas.test.ts`
- [ ] T011 [US2] Implement `addStroke` and `clearCanvas` with drawer-only guards in `backend/src/services/roomStore.ts`
- [ ] T012 [US2] Add drawer stroke/clear and guesser-rejection tests in `backend/src/services/roomStore.test.ts`
- [ ] T013 [US2] Add `POST /:code/strokes` and `POST /:code/canvas/clear` routes in `backend/src/api/rooms.ts`
- [ ] T014 [P] [US2] Mirror `strokes` on snapshot and add `addStroke`/`clearCanvas` API methods in `frontend/src/services/api.ts`
- [ ] T015 [US2] Add `addStroke` and `clearCanvas` store actions in `frontend/src/state/roomStore.ts`
- [ ] T016 [US2] Create interactive/read-only `DrawingCanvas` with normalized coords in `frontend/src/components/DrawingCanvas.tsx`
- [ ] T017 [US2] Replace canvas placeholder with `DrawingCanvas`, drawer Clear button, and stroke POST on pointer up in `frontend/src/pages/GamePage.tsx`
- [ ] T018 [P] [US2] Add canvas layout styles in `frontend/src/styles/app.css`

**Checkpoint**: User Stories 1 and 2 work — drawing syncs to guessers via poll.

---

## Phase 5: User Story 3 — Guessers Submit Validated Guesses (Priority: P3)

**Goal**: Guessers submit trimmed guesses; empty rejected; case-insensitive evaluation; drawer blocked.

**Independent Test**: Empty guess rejected; `Rocket` matches `rocket`; drawer cannot submit.

**Maps to**: FR-008–FR-011, SC-003, SC-004

### Implementation for User Story 3

- [ ] T019 [P] [US3] Implement `evaluateGuess` case-insensitive logic in `backend/src/services/guessScoring.ts`
- [ ] T020 [P] [US3] Add case-insensitivity and +100/0 unit tests in `backend/src/services/guessScoring.test.ts`
- [ ] T021 [US3] Add `Guess`, `GuessSnapshot`, and `guesses` on `Room`/`RoomSnapshot` in `backend/src/models/game.ts`
- [ ] T022 [US3] Add `submitGuessSchema` with trim/min(1) in `backend/src/api/schemas.ts`
- [ ] T023 [US3] Implement `submitGuess` with guesser-only guard and guess recording in `backend/src/services/roomStore.ts`
- [ ] T024 [US3] Add empty-guess, case-insensitive, and drawer-blocked tests in `backend/src/services/roomStore.test.ts`
- [ ] T025 [US3] Add `POST /:code/guesses` route in `backend/src/api/rooms.ts`
- [ ] T026 [US3] Add `submitGuess` API method and `guesses` snapshot type in `frontend/src/services/api.ts`
- [ ] T027 [US3] Add `submitGuess` store action in `frontend/src/state/roomStore.ts`
- [ ] T028 [US3] Wire trim, empty validation, submit handler, and drawer `disabled` in `frontend/src/components/GuessForm.tsx`
- [ ] T029 [US3] Pass `disabled={isDrawer}` to `GuessForm` in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: User Stories 1–3 work — validated guess submission with drawer blocked.

---

## Phase 6: User Story 4 — Guess History Syncs via Polling (Priority: P4)

**Goal**: Shared guess history visible to all participants, kept consistent via ~2s polling.

**Independent Test**: Guess in Tab B appears in Tab A history within one poll cycle.

**Maps to**: FR-012, FR-013, SC-007

### Implementation for User Story 4

- [ ] T030 [US4] Include ordered `guesses` in `toRoomSnapshot` when `status === "playing"` in `backend/src/services/roomStore.ts`
- [ ] T031 [US4] Render ordered guess history with name, text, and correct/incorrect indicator in `frontend/src/components/ResultPanel.tsx`
- [ ] T032 [P] [US4] Add guess history list styles in `frontend/src/styles/app.css`

**Checkpoint**: User Stories 1–4 work — guess history syncs across tabs on poll.

---

## Phase 7: User Story 5 — Correct Guesses Score 100 Points (Priority: P5)

**Goal**: Correct guesses award +100, incorrect +0; scoreboard updates on all clients via polling.

**Independent Test**: Correct guess → +100 on scoreboard; incorrect → +0; both tabs match within one poll cycle.

**Maps to**: FR-014–FR-016, SC-005, SC-006, SC-008

### Implementation for User Story 5

- [ ] T033 [US5] Apply `evaluateGuess` points to `scores[participantId]` in `submitGuess` in `backend/src/services/roomStore.ts`
- [ ] T034 [US5] Add +100 correct, +0 incorrect, and repeat-correct scoring tests in `backend/src/services/roomStore.test.ts`
- [ ] T035 [US5] Ensure `Scoreboard` re-renders updated `participants[].score` after submit and poll in `frontend/src/components/Scoreboard.tsx`

**Checkpoint**: All five user stories complete — full Scenario 3 acceptance criteria.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Automated checks and manual validation before Scenario 4.

- [ ] T036 [P] Update test mocks for extended snapshot fields and new API methods in `frontend/src/services/api.test.ts`
- [ ] T037 Run `npm test` in `backend/` and `frontend/`
- [ ] T038 Run `npm run build` in `backend/` and `frontend/`
- [ ] T039 Manual two-tab validation per `specs/003-gameplay-interaction/plan.md` Testing Strategy (P1–P5 flows)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies
- **Phase 3 (US1)**: Depends on Phase 1 — Scenarios 1–2 prerequisite
- **Phase 4 (US2)**: Depends on Phase 3 (scores visible while testing canvas)
- **Phase 5 (US3)**: Depends on Phase 4 (active game with drawer/guesser roles)
- **Phase 6 (US4)**: Depends on Phase 5 (`guesses` recorded server-side)
- **Phase 7 (US5)**: Depends on Phase 5–6 (scoring + history in place)
- **Phase 8 (Polish)**: Depends on Phases 3–7

### User Story Dependencies

| Story | Depends on | Can test alone after |
|-------|------------|----------------------|
| US1 (P1) | Setup + Scenarios 1–2 | Phase 3 complete |
| US2 (P2) | US1 | Phase 4 complete |
| US3 (P3) | US2 | Phase 5 complete |
| US4 (P4) | US3 | Phase 6 complete |
| US5 (P5) | US3–US4 | Phase 7 complete |

Stories are **sequential by priority** — each builds on prior gameplay capability.

### Within Each User Story

1. Backend models/services before API routes
2. Backend before matching frontend consumer
3. Vitest alongside or immediately after service changes
4. Story checkpoint before next priority

### Parallel Opportunities

- **Phase 3**: T005 `[P]` after T002–T003
- **Phase 4**: T010 `[P]` with T009; T014 `[P]` after T011; T018 `[P]` with T017
- **Phase 5**: T019 `[P]` and T020 `[P]` together before T023
- **Phase 6**: T032 `[P]` with T031
- **Phase 8**: T036 `[P]` anytime after API types stable

---

## Parallel Example: User Story 2

```bash
# After T011 completes:
Task T014: "Mirror strokes and API methods in frontend/src/services/api.ts"
Task T018: "Add canvas styles in frontend/src/styles/app.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 3: User Story 1 (T002–T007)
3. **STOP and VALIDATE**: Scoreboard shows 0 for all players after start
4. Proceed to US2 only after P1 passes

### Incremental Delivery

1. Setup → confirm Scenarios 1–2 prerequisite
2. US1 → validate zero scores on scoreboard (MVP)
3. US2 → validate drawer draw/clear + guesser sync
4. US3 → validate guess submission and validation
5. US4 → validate guess history via polling
6. US5 → validate +100/0 scoring on scoreboard
7. Polish → Vitest + build + two-tab sign-off

### Suggested Commit Slices

- Commit after US1 (scores)
- Commit after US2 (canvas)
- Commit after US3–US5 (guesses, history, scoring)
- Commit after Polish (T037–T039)

---

## Notes

- Do **not** implement round end, result reveal, or restart (Scenario 4)
- Do **not** add WebSockets, DB, auth, or new canvas npm dependencies
- Use native `<canvas>` API; normalized 0–1 stroke coordinates
- Scores mutated server-side only; clients refresh via submit response + `useGamePolling`
- Drawer cannot guess; guessers cannot draw — enforce client- and server-side
- `submitGuess` in US3 records guesses; US4 exposes them in snapshot/UI; US5 applies scoring
