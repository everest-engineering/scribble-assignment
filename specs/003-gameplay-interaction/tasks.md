---
description: "Task list for Scenario 3 — Gameplay Interaction"
---

# Tasks: Gameplay Interaction

**Input**: Design documents from `specs/003-gameplay-interaction/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md); builds on Scenarios 1–2.

**Tests**: Included — Vitest unit tests for store.

## Format: `[ID] [P?] [Story] Description`

- **[Story]**: US1 (draw/clear), US2 (guess validation), US3 (sync history + scoring)

---

## Phase 1: Foundational (Model + Store)

- [ ] T001 [US1] In `backend/src/models/game.ts`, add `Point`, `Stroke`, `Guess`
      types; extend `Room` and `RoomSnapshot` with `strokes: Stroke[]`,
      `guesses: Guess[]`, `scores: Record<string, number>`.
- [ ] T002 [US3] In `backend/src/services/roomStore.ts`, initialize
      `strokes=[]`, `guesses=[]`, and `scores[participant.id]=0` in `createRoom`
      and on `joinRoom`; include the three fields in `toRoomSnapshot`.

**Checkpoint**: Snapshot carries empty strokes/guesses and zeroed scores.

---

## Phase 2: User Story 1 — Draw & clear (P1)

- [ ] T003 [US1] In `roomStore.ts`, add `addStroke(code, requesterId, stroke)`
      (drawer-only) and `clearCanvas(code, requesterId)` (drawer-only).
- [ ] T004 [US1] In `backend/src/api/schemas.ts`, add stroke + clear body schemas;
      in `backend/src/api/rooms.ts`, add `POST /:code/strokes` and
      `POST /:code/clear-canvas` with drawer-only 403 mapping.
- [ ] T005 [US1] Create `frontend/src/components/DrawingCanvas.tsx`: render
      `strokes` (normalized → pixels); if drawer, capture pointer strokes and call
      `onStrokeComplete(stroke)` on pointer-up; if not drawer, read-only.
- [ ] T006 [US1] In `frontend/src/services/api.ts` add `addStroke`/`clearCanvas`;
      in `frontend/src/state/roomStore.ts` add matching methods.

**Checkpoint**: Drawer draws + clears; guesser sees strokes read-only via poll.

---

## Phase 3: User Story 2 — Validated guessing (P1)

- [ ] T007 [US2] In `roomStore.ts`, add `submitGuess(code, requesterId, text)`:
      trim + reject empty; reject drawer and unknown participant; case-insensitive
      compare to `STARTER_WORDS[wordIndex]`; set score 100 once if correct; append
      to `guesses`. Return room or typed error.
- [ ] T008 [US2] In `schemas.ts` add a guess body schema; in `rooms.ts` add
      `POST /:code/guess` mapping validation/drawer errors to 4xx.
- [ ] T009 [US2] In `api.ts` add `submitGuess`; in `state/roomStore.ts` add a
      `submitGuess` method; wire `frontend/src/components/GuessForm.tsx` to trim,
      block empty with an inline message, and submit.

**Checkpoint**: Empty rejected; "  Rocket " matches `rocket`; drawer can't guess.

---

## Phase 4: User Story 3 — Synced history & scoring (P1)

- [ ] T010 [US3] Update `frontend/src/components/Scoreboard.tsx` to render
      `scores` joined with participant names, sorted descending.
- [ ] T011 [US3] Update `frontend/src/components/ResultPanel.tsx` to render the
      `guesses` history with ✓/✗ markers in submission order.
- [ ] T012 [US3] In `frontend/src/pages/GamePage.tsx`, use `DrawingCanvas`
      (drawer vs read-only) + a drawer-only Clear button, and pass real data to
      `Scoreboard`, `ResultPanel`, and `GuessForm`.

**Checkpoint**: Both tabs show identical history + scores within ~2s.

---

## Phase 5: Tests & Validation

- [ ] T013 [US2] In `backend/src/services/roomStore.test.ts`, add tests: scores
      init 0; correct guess → 100 (capped); incorrect → unchanged; "  Rocket "
      matches `rocket`; empty rejected; drawer rejected; `clearCanvas` empties
      strokes; `addStroke` drawer-only.
- [ ] T014 `cd backend && npm run build && npm test` — zero errors.
- [ ] T015 `cd frontend && npm run build && npm test` — zero errors.
- [ ] T016 Two-tab manual check of SC-001…SC-005.

---

## Dependencies & Execution Order

- Phase 1 (T001–T002) blocks all stories.
- US1 (T003–T006) and US2 (T007–T009) are largely independent; US3 (T010–T012)
  consumes data from both and the GamePage wiring depends on the new component
  (T005) and store methods (T006, T009).
- Tests/validation (Phase 5) last.

## Notes

- Normalized stroke coordinates (0–1) keep canvases aligned across sizes.
- Score guard: a repeat correct guess must remain 100, not 200.
- Commit in groups: (a) model+store init, (b) draw/clear, (c) guess+scoring,
  (d) UI wiring + tests. Short messages, no co-author line, after user approval.
