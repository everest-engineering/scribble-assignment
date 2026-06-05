---
description: "Task list for Gameplay Interaction (Group 3)"
---

# Tasks: Gameplay Interaction

**Input**: Design documents from `/specs/003-gameplay-interaction/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rooms-api.md, quickstart.md

**Tests**: Included — the plan's testing strategy and constitution Principle III (deterministic,
unit-tested game rules) require automated tests for guess evaluation, scoring, and store behavior.

**Organization**: Grouped by user story (US1–US4). US1/US2/US3 are all P1; US4 is P2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 (draw/clear), US2 (guess validation), US3 (scoring/history), US4 (polling)
- All paths are repo-relative.

## Path Conventions

Web app: `backend/src/`, `frontend/src/` (per plan.md).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the Group 2 baseline is in place before extending it.

- [X] T001 Verify Groups 1–2 baseline builds/tests: run `npm test` and `npm run build` in `backend/`, and `npm run build` in `frontend/` (must pass before changes).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared model, pure rules, round-state init, and snapshot projection that US1–US3 all depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Extend the game model in `backend/src/models/game.ts`: add `StrokePoint`, `Stroke`, and `GuessRecord` types; extend `RoundState` with `strokes: Stroke[]`, `guesses: GuessRecord[]`, `scores: Record<string, number>`, `ended: boolean`; extend `RoomSnapshot` with `strokes: Stroke[]`, `guesses: GuessRecord[]`, `roundEnded: boolean`, and add `score: number` to `SnapshotParticipant`.
- [X] T003 [P] Create pure game rules in `backend/src/services/gameRules.ts`: `normalizeGuess(text)` (trim + lowercase), `isCorrectGuess(guess, secret)` (normalized equality), and exported `CORRECT_SCORE = 100` / `INCORRECT_SCORE = 0`.
- [X] T004 [P] Add `backend/src/services/gameRules.test.ts`: `normalizeGuess` trims + lowercases; `isCorrectGuess` is case-insensitive and trimmed (e.g. `"  CASTLE "` vs `castle`); score constants are 100/0.
- [X] T005 Update `initializeRound` in `backend/src/services/roomStore.ts` to initialize `strokes: []`, `guesses: []`, `ended: false`, and `scores` with every participant set to `0` (depends on T002).
- [X] T006 Extend `toRoomSnapshot` in `backend/src/services/roomStore.ts` to include `strokes`, `guesses`, `roundEnded` (from `round?.ended ?? false`), and per-participant `score` (from `round.scores`, default 0); keep `secretWord` drawer-only (depends on T002, T005).
- [X] T007 Mirror the snapshot type in `frontend/src/services/api.ts`: extend `RoomSnapshot` with `strokes`, `guesses`, `roundEnded`, and add `score` to the participant type (depends on T002).

**Checkpoint**: Model, pure rules, round init, and snapshot projection ready — user stories can begin.

---

## Phase 3: User Story 1 - Drawer draws and clears the canvas (Priority: P1) 🎯 MVP

**Goal**: Drawer can draw strokes and clear the canvas; strokes sync to all tabs via the snapshot; non-drawers and ended rounds cannot draw/clear.

**Independent Test**: In two tabs (drawer + guesser), the drawer draws a stroke and the guesser sees it within ~2s; Clear empties both; the guesser has no draw/clear controls.

### Tests for User Story 1

- [X] T008 [P] [US1] Add `addStroke`/`clearCanvas` tests in `backend/src/services/roomStore.test.ts`: drawer append succeeds; non-drawer rejected (`forbidden`); after `ended` rejected (`round-ended`); clear empties strokes; clear on empty canvas is idempotent; drawing in room A leaves room B's strokes unchanged.
- [X] T009 [P] [US1] Add `strokeSchema`/`clearCanvasSchema` tests in `backend/src/api/schemas.test.ts`: stroke requires ≥1 point, rejects oversized point arrays and bad shapes; clear requires non-empty `participantId`.

### Implementation for User Story 1

- [X] T010 [US1] Add `strokeSchema` and `clearCanvasSchema` to `backend/src/api/schemas.ts` (point `{x,y}` numbers; `stroke.points` length 1..max; `participantId` non-empty).
- [X] T011 [US1] Implement `addStroke(code, participantId, stroke)` and `clearCanvas(code, participantId)` in `backend/src/services/roomStore.ts` returning discriminated results (`not-found` / `forbidden` / `round-ended` / `ok`); drawer-only and only while `!round.ended` (depends on T005).
- [X] T012 [US1] Add `POST /:code/strokes` and `POST /:code/canvas/clear` routes in `backend/src/api/rooms.ts`, mapping results to 200/400/403/404/409 per `contracts/rooms-api.md` (depends on T010, T011).
- [X] T013 [P] [US1] Add `submitStroke` and `clearCanvas` methods to `frontend/src/services/api.ts` (POST to the new endpoints, return snapshot) (depends on T007).
- [X] T014 [US1] Add `submitStroke` and `clearCanvas` actions to `frontend/src/state/roomStore.ts` (call api, store returned snapshot) (depends on T013).
- [X] T015 [US1] Create `frontend/src/components/DrawingCanvas.tsx`: native `<canvas>` that redraws from `snapshot.strokes`; drawer captures pointer strokes and calls `submitStroke` on stroke end; "Clear" button for drawer; read-only for guessers and when `roundEnded` (depends on T014).
- [X] T016 [US1] Wire `DrawingCanvas` into `frontend/src/pages/GamePage.tsx`, passing drawer/round-ended state (depends on T015).

**Checkpoint**: Drawing and clearing work drawer-only and sync via snapshot.

---

## Phase 4: User Story 2 - Guessers submit guesses with validation (Priority: P1)

**Goal**: Guessers submit trimmed, non-empty guesses (case-insensitive match); drawer cannot guess; ended round rejects guesses.

**Independent Test**: Guesser submits `"  Rocket  "` vs secret `rocket` → accepted; `"   "` → rejected with no history entry; drawer has no guess control.

### Tests for User Story 2

- [X] T017 [P] [US2] Add `guessSchema` tests in `backend/src/api/schemas.test.ts`: rejects empty/whitespace guess (400) and trims valid guesses; requires non-empty `participantId`.
- [X] T018 [P] [US2] Add `submitGuess` gating tests in `backend/src/services/roomStore.test.ts`: drawer rejected (`forbidden`); unknown participant/room handled; submission after `ended` rejected (`round-ended`).

### Implementation for User Story 2

- [X] T019 [US2] Add `guessSchema` to `backend/src/api/schemas.ts` (`participantId` non-empty; `guess` trimmed then `min(1)`).
- [X] T020 [US2] Implement `submitGuess(code, participantId, guessText)` in `backend/src/services/roomStore.ts` using `gameRules`; guesser-only, only while `!round.ended`; returns discriminated result (`not-found` / `forbidden` / `round-ended` / `ok` with `correct`) (depends on T003, T005). *(Scoring/history side effects completed in US3 T025.)*
- [X] T021 [US2] Add `POST /:code/guess` route in `backend/src/api/rooms.ts`, mapping results to 200/400/403/404/409 per `contracts/rooms-api.md` (depends on T019, T020).
- [X] T022 [P] [US2] Add `submitGuess` method to `frontend/src/services/api.ts` and `submitGuess` action to `frontend/src/state/roomStore.ts` (depends on T007).
- [X] T023 [P] [US2] Add `api.submitGuess` URL/body test in `frontend/src/services/api.test.ts`.
- [X] T024 [US2] Wire `frontend/src/components/GuessForm.tsx` to call `submitGuess`; block empty/whitespace client-side with a clear message; disable for the drawer and when `roundEnded` (depends on T022).

**Checkpoint**: Guess submission validated at edge and gated by role/round state.

---

## Phase 5: User Story 3 - Deterministic scoring and shared guess history (Priority: P1)

**Goal**: Scores start at 0; correct +100 and ends round; incorrect +0; ordered history visible to all; scoreboard and history render from snapshot.

**Independent Test**: Two guessers submit one wrong + one right; scoreboard shows 0 and 100; history lists both in order; round ends after the correct guess.

### Tests for User Story 3

- [X] T025 [P] [US3] Extend `backend/src/services/roomStore.test.ts`: incorrect guess appends history (correct=false) and adds 0; correct guess appends history (correct=true), adds 100, and sets `round.ended = true`; new round starts all scores at 0; history preserves submission order.

### Implementation for User Story 3

- [X] T026 [US3] Complete scoring/history side effects in `submitGuess` (`backend/src/services/roomStore.ts`): append `GuessRecord` (participantId, name, guess, correct, at); add `CORRECT_SCORE`/`INCORRECT_SCORE` to `scores`; set `round.ended = true` on first correct guess (depends on T020).
- [X] T027 [P] [US3] Render per-participant scores from the snapshot in `frontend/src/components/Scoreboard.tsx` (replace hard-coded placeholder) (depends on T007).
- [X] T028 [P] [US3] Render the ordered guess history from `snapshot.guesses` in `frontend/src/components/ResultPanel.tsx` (name, guess, correct/incorrect) (depends on T007).
- [X] T029 [US3] Ensure `GamePage.tsx` passes `guesses`/scores to `Scoreboard` and `ResultPanel` and disables guessing/drawing once `roundEnded` (depends on T016, T024, T027, T028).

**Checkpoint**: Scoring, round-end, and shared history fully functional from authoritative state.

---

## Phase 6: User Story 4 - Game screen stays in sync via polling (Priority: P2)

**Goal**: Game screen auto-refreshes ~2s; polling stops on unmount; transient failures don't crash.

**Independent Test**: Drawer draws in tab 1; tab 2 reflects it within ~2s. Guesser submits; drawer tab updates within ~2s. Navigating away stops requests.

### Implementation for User Story 4

- [X] T030 [US4] Add ~2s polling in `frontend/src/pages/GamePage.tsx` calling `fetchRoom` on an interval, cleared on unmount, with transient errors surfaced but non-fatal (mirror `LobbyPage.tsx`) (depends on T029).

**Checkpoint**: Strokes, scores, and history converge across tabs without manual refresh.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T031 Run full automated suite: `npm test` and `npm run build` in `backend/`, `npm run build` in `frontend/`; fix any type/lint failures.
- [ ] T032 Execute `specs/003-gameplay-interaction/quickstart.md` two-tab validation (steps 1–10) and confirm SC-001…SC-006. *(manual — pending user run)*
- [X] T033 Add a brief "Implementation Notes & Deviations (post-execution)" section to `specs/003-gameplay-interaction/plan.md` recording any decisions made during implementation.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories (shared model/rules/snapshot).
- **US1 (Phase 3)**: After Foundational.
- **US2 (Phase 4)**: After Foundational. US3 completes `submitGuess` side effects.
- **US3 (Phase 5)**: After US2 (extends `submitGuess` + renders snapshot data).
- **US4 (Phase 6)**: After US3 (polls the wired game screen).
- **Polish (Phase 7)**: After all desired stories.

### Within Each User Story

- Tests written first and expected to fail before implementation.
- Schemas/model before store; store before routes; api before state; state before components.

### Parallel Opportunities

- T003/T004 (gameRules + test) parallel with each other.
- US1 tests T008/T009 parallel; frontend api method T013 parallel with backend route work.
- US3 UI tasks T027/T028 parallel (different files).
- Backend (US1/US2 routes) and frontend (api/state) can progress in parallel once Foundational is done.

---

## Parallel Example: User Story 1

```bash
# Tests together:
Task: "addStroke/clearCanvas tests in backend/src/services/roomStore.test.ts"
Task: "stroke/clear schema tests in backend/src/api/schemas.test.ts"

# Frontend api method in parallel with backend route:
Task: "submitStroke/clearCanvas in frontend/src/services/api.ts"
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US3)

1. Phase 1 Setup → Phase 2 Foundational.
2. US1 (drawing) → US2 (guessing) → US3 (scoring/history). These three P1 stories are the playable core.
3. Validate the core in two tabs.

### Incremental Delivery

1. Foundational ready → US1 draw/clear demo.
2. Add US2 → guess validation demo.
3. Add US3 → scoring + history demo.
4. Add US4 → live cross-tab sync.
5. Polish → quickstart validation + notes.

---

## Notes

- [P] = different files, no incomplete dependencies.
- `submitGuess` is intentionally split: US2 builds gating/validation; US3 adds scoring/history/round-end.
- Keep `secretWord` drawer-only (Group 2 projection untouched).
- Out of scope (Group 4): word reveal to all, final results layout, restart-to-lobby (FR-048).
- Commit after each task or logical group.
