---
description: "Task list for Gameplay Interaction (Scenario 3)"
---

# Tasks: Gameplay Interaction

**Input**: Design documents from `/specs/003-gameplay-interaction/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rooms-api.md

**Tests**: Unit tests ARE included — required by Constitution Principle VI and plan.md Testing
Strategy (guess validation, case-insensitive match, scoring, word secrecy, history order).

**Organization**: Tasks grouped by user story. Priorities from spec.md — P1: US1, US2, US3;
P2: US4.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1–US4 maps to spec.md user stories

## Path Conventions

Web app monorepo: `backend/src/`, `frontend/src/` (per plan.md Structure Decision).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm a clean, runnable baseline before changing behavior.

- [X] T001 [P] Confirm backend baseline is green: `cd backend && npm test && npm run build`
- [X] T002 [P] Confirm frontend baseline is green: `cd frontend && npm test && npm run build`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared guess/score data model that the user stories read. No story work can begin
until this is complete.

**⚠️ CRITICAL**: Blocks all user stories.

- [X] T003 [P] Add a `Guess` type (`id`, `participantId`, `participantName`, `correct`, `text`, `createdAt`); add `guesses: Guess[]` and `scores: Record<string, number>` to `Room`; add `guesses: GuessView[]` (where `text: string | null`) and `scores: ScoreView[]` to `RoomSnapshot` in `backend/src/models/game.ts`
- [X] T004 [P] Mirror the new `guesses`/`scores` snapshot fields (and `GuessView`/`ScoreView` shapes) on the frontend `RoomSnapshot` in `frontend/src/services/api.ts`
- [X] T005 In `startRound` (`backend/src/services/roomStore.ts`), initialize `guesses = []` and `scores` with every participant at `0`; ensure `createRoom`/`joinRoom` keep these consistent (depends on T003)

**Checkpoint**: Rooms carry an empty history and zeroed scores once a round starts.

---

## Phase 3: User Story 1 - Submit a guess with validation (Priority: P1) 🎯 MVP

**Goal**: A guesser can submit a guess that is trimmed, validated (non-empty), guesser-only, and
evaluated case-insensitively against the secret word.

**Independent Test**: As a guesser, submit blank/whitespace (rejected), a correct word in odd
casing (correct), a wrong word (incorrect); confirm the drawer has no guess control.

### Tests for User Story 1

- [X] T006 [US1] Unit tests in `backend/src/services/roomStore.test.ts`: `submitGuess` rejects empty/whitespace text, rejects the drawer, rejects when status is not `playing`; "  CASTLE " matches "castle" (correct); a wrong word records incorrect; history reflects submission order
- [X] T007 [US1] Unit test in `backend/src/api/schemas.test.ts`: `guessSchema` rejects empty/whitespace `text`, requires `participantId`, and trims valid text

### Implementation for User Story 1

- [X] T008 [US1] Add `guessSchema` (`{ participantId: z.string().min(1), text: z.string().trim().min(1) }`) in `backend/src/api/schemas.ts`
- [X] T009 [US1] Add `submitGuess(code, participantId, text)` to `backend/src/services/roomStore.ts`: require `status === "playing"`, the participant to exist and not be the drawer, and non-empty trimmed text; compute `correct` via `normalize = trim + toLowerCase`; append a `Guess`; return a discriminated result for not-found / not-playing / not-guesser / invalid (depends on T005)
- [X] T010 [US1] Add `POST /rooms/:code/guess` in `backend/src/api/rooms.ts` mapping outcomes to `200` / `400` / `403 "Only guessers can submit guesses"` / `404 "Room not found"` / `409 "The round is not active"` (depends on T008, T009)
- [X] T011 [US1] Add `api.submitGuess(code, participantId, text)` in `frontend/src/services/api.ts` (depends on T004 — same file)
- [X] T012 [US1] Add `submitGuess(text)` to the store (calls `api.submitGuess`, stores returned snapshot) in `frontend/src/state/roomStore.ts`
- [X] T013 [US1] Wire `handleSubmit` to submit via a prop and show a clear empty-guess message in `frontend/src/components/GuessForm.tsx`
- [X] T014 [US1] In `frontend/src/pages/GamePage.tsx`, render the guess form for guessers only (the drawer has no guess input) and submit through `store.submitGuess`

**Checkpoint**: Guessers can submit validated guesses; the drawer cannot guess.

---

## Phase 4: User Story 2 - Synced guess history for everyone (Priority: P1)

**Goal**: Every valid guess is recorded and synced to all players via polling, without a correct
guess revealing the word to other guessers.

**Independent Test**: Submit guesses from two guesser tabs; all tabs converge on the same ordered
history within ~2s, and a correct guess shows as correct without exposing the word to the other
guesser.

### Tests for User Story 2

- [X] T015 [US2] Unit test in `backend/src/services/roomStore.test.ts`: the guess history preserves submission order; a guesser's snapshot has another player's correct-guess `text === null` while the drawer's snapshot shows the text; incorrect guesses always show text (depends on T006 — same file)

### Implementation for User Story 2

- [X] T016 [US2] Extend `toRoomSnapshot` (`backend/src/services/roomStore.ts`) to include `guesses` as `GuessView[]`, setting `text = (correct && !isDrawer && viewer !== author) ? null : text` (depends on T009 — same file)
- [X] T017 [US2] In `frontend/src/pages/GamePage.tsx`, render the synced guess history (guesser name, correct/incorrect, and text when present) (depends on T014 — same file)

**Checkpoint**: Shared, ordered history syncs to all; the word stays hidden from guessers.

---

## Phase 5: User Story 3 - Deterministic scoring (Priority: P1)

**Goal**: Scores start at 0; a first correct guess awards 100; incorrect awards 0; a guesser
scores at most once; scores sync to all.

**Independent Test**: Confirm all scores 0 at start; a wrong guess keeps 0; a correct guess →
100; a repeat correct → still 100; a second guesser independently reaches 100.

### Tests for User Story 3

- [X] T018 [US3] Unit test in `backend/src/services/roomStore.test.ts`: scores start at 0 for all participants; first correct guess → 100; repeat correct → still 100; incorrect → unchanged; a second guesser can reach 100 independently (depends on T015 — same file)

### Implementation for User Story 3

- [X] T019 [US3] In `submitGuess` (`backend/src/services/roomStore.ts`), award `100` when `correct` and the guesser's score is `< 100`; otherwise leave it unchanged (depends on T016 — same file)
- [X] T020 [US3] Extend `toRoomSnapshot` (`backend/src/services/roomStore.ts`) to include `scores` as `ScoreView[]` (`participantId`, `name`, `score`) for every participant (depends on T019 — same file)
- [X] T021 [US3] Render the scoreboard from a `scores` prop in `frontend/src/components/Scoreboard.tsx`
- [X] T022 [US3] In `frontend/src/pages/GamePage.tsx`, pass the snapshot `scores` to `Scoreboard` (depends on T017 — same file)

**Checkpoint**: Deterministic scoring (100/0, once) syncs to all players.

---

## Phase 6: User Story 4 - Interactive drawing and clear canvas (Priority: P2)

**Goal**: The drawer can draw freehand and clear the canvas on their own screen; guessers have no
drawing tools.

**Independent Test**: As the drawer, draw strokes (they appear) and clear (canvas empties); as a
guesser, confirm there are no drawing or clear controls.

### Implementation for User Story 4

- [X] T023 [US4] Create a drawer-only `DrawingCanvas` component (HTML5 canvas with pointer-based freehand strokes and a Clear button; no backend/network) in `frontend/src/components/DrawingCanvas.tsx`
- [X] T024 [US4] In `frontend/src/pages/GamePage.tsx`, render `DrawingCanvas` for the drawer and a non-interactive "waiting for the drawing" panel for guessers (depends on T022 — same file)

**Checkpoint**: Drawer draws/clears locally; guessers have no drawing controls.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation and traceability across all stories.

- [X] T025 [P] Run the full quickstart two-tab walkthrough in `specs/003-gameplay-interaction/quickstart.md` and confirm every row passes — backend API paths verified via smoke test (empty 400, drawer 403, case-insensitive correct, score 100-once, correct-guess text hidden from other guessers, shown to drawer); **browser two-tab UI pass (incl. canvas drawing) completed by human ✓**
- [X] T026 [P] Run both builds and full test suites (`cd backend && npm run build && npm test`, `cd frontend && npm run build && npm test`); confirm green
- [X] T027 [P] Update `REFLECTION.md` "What I added" with the Scenario 3 changes (guess submission + validation, synced history, scoring, drawer-local canvas)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup. BLOCKS all user stories. T003 ‖ T004; T005 needs T003.
- **User Stories (Phases 3–6)**: Depend on Foundational. Ordered by priority (P1: US1, US2, US3; then P2: US4).
- **Polish (Phase 7)**: Depends on all desired stories.

### Cross-file sequencing (same-file = not parallel)

- `backend/src/services/roomStore.ts`: T005 → T009 → T016 → T019 → T020
- `backend/src/services/roomStore.test.ts`: T006 → T015 → T018
- `frontend/src/services/api.ts`: T004 → T011
- `frontend/src/pages/GamePage.tsx`: T014 → T017 → T022 → T024

### User Story Dependencies

- **US1 (P1)**: After Foundational. MVP — guess submission + validation.
- **US2 (P1)**: After US1 (reads guesses recorded by `submitGuess`; extends `toRoomSnapshot`/GamePage).
- **US3 (P1)**: After US2 (extends the same `submitGuess`/`toRoomSnapshot`/GamePage with scoring).
- **US4 (P2)**: After Foundational; mostly independent (new component + GamePage canvas slot).

### Parallel Opportunities

- T001 ‖ T002; T003 ‖ T004.
- T006 ‖ T007 (different test files); T021 and T023 are independent of the backend chain.
- T025 ‖ T026 ‖ T027.

---

## Parallel Example: Foundational Phase

```bash
# T003 and T004 touch different files and can run together:
Task: "Add Guess type + Room.guesses/scores + snapshot views in backend/src/models/game.ts"
Task: "Mirror guesses/scores snapshot fields in frontend/src/services/api.ts"
# Then T005 (roomStore startRound init) once T003 is done.
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1 → **STOP & validate**: a guesser
   submits a validated guess judged correct/incorrect; the drawer cannot guess.

### Incremental Delivery

Foundation → US1 (guess + validation) → US2 (synced history + secrecy) → US3 (scoring) → US4
(drawer canvas) → Polish. Each story is independently testable per its Independent Test.

### Notes

- Commit after each task or logical group (Constitution Principle V).
- Verify each new unit test fails before implementing, then passes after.
- The secret word MUST stay hidden from guessers in the history (T016) — verify via the guesser
  snapshot in T015, not only the UI.
- Drawing sync was amended on 2026-06-05 (see Phase 8): the drawing is shared with guessers via
  polled canvas snapshots, not drawer-local. T023 built the drawer canvas; Phase 8 adds the sync.
- Run the two-tab walkthrough (quickstart.md) before declaring Scenario 3 done.

---

## Phase 8: Drawing Sync (Amendment 2026-06-05 — US4 extension)

**Why**: A `/speckit-clarify` decision changed US4 from "drawer-local" to "the drawing is shared
with guessers via polled canvas snapshots (~2s)". T001–T027 are already complete under the old
decision; the tasks below add the sync delta. Maps to spec FR-021 / SC-009 and the amended US4.

**Goal**: The drawer's canvas is sent to the backend (~2s and on clear) and every guesser renders
it read-only from the snapshot they already poll, within ~2s.

**Independent Test**: With a drawer and a guesser tab, the drawer draws — the guesser sees the
drawing appear/update within ~2s; the drawer clears — the guesser's view clears within ~2s; the
guesser still has no drawing controls.

### Tests

- [X] T028 [US4] Unit test in `backend/src/api/schemas.test.ts`: `drawingSchema` requires `participantId` and accepts a string or `null` for `drawing`, and rejects a missing `participantId`
- [X] T029 [US4] Unit test in `backend/src/services/roomStore.test.ts`: `updateDrawing` stores the image only for the drawer; rejects a non-drawer (`not_drawer`) and a non-playing room (`not_playing`); the stored value (and a later `null` clear) appears in the snapshot `drawing` for all viewers

### Implementation — Backend

- [X] T030 [US4] Add `drawing: string | null` to `Room` and `drawing: string | null` to `RoomSnapshot` in `backend/src/models/game.ts`
- [X] T031 [US4] Mirror `drawing: string | null` on the frontend `RoomSnapshot` in `frontend/src/services/api.ts`
- [X] T032 [US4] Add `drawingSchema` (`{ participantId: z.string().min(1), drawing: z.string().nullable() }`) in `backend/src/api/schemas.ts`
- [X] T033 [US4] In `backend/src/services/roomStore.ts`: initialize `drawing: null` in `createRoom` and reset to `null` in `startRound`; add `updateDrawing(code, participantId, drawing)` (require `playing` + requester is the drawer); include `drawing` in `toRoomSnapshot` (depends on T030)
- [X] T034 [US4] Add `PUT /rooms/:code/drawing` in `backend/src/api/rooms.ts` mapping outcomes to `200` / `400` / `403 "Only the drawer can update the drawing"` / `404 "Room not found"` / `409 "The round is not active"` (depends on T032, T033)

### Implementation — Frontend

- [X] T035 [US4] Add `api.updateDrawing(code, participantId, drawing)` (`PUT /rooms/:code/drawing`) in `frontend/src/services/api.ts` (depends on T031 — same file)
- [X] T036 [US4] Add `updateDrawing(drawing)` to the store in `frontend/src/state/roomStore.ts` (fire-and-forget; do not surface transient errors as fatal)
- [X] T037 [US4] Update `frontend/src/components/DrawingCanvas.tsx`: for the drawer, serialize the canvas (`toDataURL`) and push via `updateDrawing` on a ~2s interval and immediately on Clear (with `null`); for guessers, render the polled `drawing` image read-only (no pointer/clear controls)
- [X] T038 [US4] In `frontend/src/pages/GamePage.tsx`, render `DrawingCanvas` for both roles (drawer = interactive, guesser = read-only image) and pass the snapshot `drawing` + role

### Polish

- [X] T039 [P] Re-run the quickstart two-tab walkthrough (incl. rows 3/3b — guesser sees the drawing) in `specs/003-gameplay-interaction/quickstart.md` — drawing-sync API verified via smoke test (drawer push 200 → guesser GET shows image; clear → null; guesser draw 403); **browser two-tab canvas pass completed by human ✓**
- [X] T040 [P] Run both builds and full test suites; confirm green
- [X] T041 [P] Update `REFLECTION.md` to note the drawing now syncs to guessers via polled snapshots

### Phase 8 sequencing

- `backend/src/services/roomStore.ts`: prior Scenario 3 chain → T033
- `backend/src/services/roomStore.test.ts`: prior chain → T029
- `frontend/src/services/api.ts`: T031 → T035
- `frontend/src/pages/GamePage.tsx`: prior chain → T038
- T030 ‖ T031 (different files); T039 ‖ T040 ‖ T041.
