# Tasks: Gameplay Interaction

**Feature**: Gameplay Interaction
**Branch**: 003-gameplay-interaction

## Phase 1 — Setup

- [x] T201 Create `specs/003-gameplay-interaction/tasks.md` and confirm feature metadata in `.specify/feature.json` (specs/003-gameplay-interaction/tasks.md)

## Phase 2 — Backend canvas & guess API

- [x] T202 Add `Point` and `Stroke` types (backend/src/models/game.ts)
- [x] T203 Add `updateCanvas(code, participantId, strokes)` to roomStore with drawer validation (backend/src/services/roomStore.ts)
- [x] T204 Add `submitGuess(code, participantId, text)` to roomStore with full validation + scoring + round-end (backend/src/services/roomStore.ts)
- [x] T205 Update `toRoomSnapshot()` to include `canvasState` in snapshot (backend/src/services/roomStore.ts)
- [x] T206 Add `POST /rooms/:code/canvas` route (backend/src/api/rooms.ts)
- [x] T207 Add `POST /rooms/:code/guess` route (backend/src/api/rooms.ts)
- [x] T208 Add backend tests: canvas update, correct guess, incorrect guess, round-end, error cases (backend/src/services/roomStore.test.ts)

## Phase 3 — Frontend canvas component

- [x] T209 Create interactive Canvas component with drawing + clear (frontend/src/components/Canvas.tsx)
- [x] T210 Implement read-only mode for guessers in Canvas component (frontend/src/components/Canvas.tsx)
- [x] T211 Add stroke rendering (redraw all strokes as polylines) (frontend/src/components/Canvas.tsx)

## Phase 4 — Frontend guess form

- [x] T212 Rewrite GuessForm to accept `onSubmit` callback, validate non-empty, show feedback (frontend/src/components/GuessForm.tsx)

## Phase 5 — Frontend scoreboard & result panel

- [x] T213 Rewrite Scoreboard to display participants, scores, drawer indicator (frontend/src/components/Scoreboard.tsx)
- [x] T214 Rewrite ResultPanel to render ordered guess history with correct/incorrect indicators (frontend/src/components/ResultPanel.tsx)

## Phase 6 — Wire into GamePage

- [x] T215 Add `api.submitGuess()`, `api.updateCanvas()` to API service (frontend/src/services/api.ts)
- [x] T216 Wire Canvas into GamePage — interactive for drawer, read-only for guessers, debounced sync (frontend/src/pages/GamePage.tsx)
- [x] T217 Wire GuessForm into GamePage — submit calls API, disable after correct guess (frontend/src/pages/GamePage.tsx)
- [x] T218 Wire Scoreboard and ResultPanel with live room data (frontend/src/pages/GamePage.tsx)

## Phase 7 — Testing

- [ ] T219 Add frontend tests: canvas renders, GuessForm validates, GamePage wires correctly — **GAP: not implemented** (frontend/src/components/Canvas.test.tsx, frontend/src/components/GuessForm.test.tsx)
- [x] T220 Manual verification: two browser tabs — drawer draws, guesser sees drawing, guess submits, all see history + scores

## Phase 8 — Polish

- [x] T221 Coverage: Add/adjust Vitest tests to reach 80% coverage for modified modules
- [x] T222 Bundle-size: Verify production client build is within 150KB budget — 59KB ✓
- [x] T223 Documentation: Update spec and plan with implementation notes
- [x] T224 Commit: Commit completed work and reference spec artifact

## Dependencies

- T202..T205 (backend store) block T206..T207 (API routes).
- T206 (canvas route) blocks T216 (GamePage canvas wiring).
- T207 (guess route) blocks T217 (GamePage guess wiring).
- T209..T211 (Canvas component) must be done before T216.
- T212 (GuessForm) must be done before T217.
- T213..T214 (Scoreboard/ResultPanel) must be done before T218.

## Parallel Work

- [P] T209..T211 (Canvas), T212 (GuessForm), T213..T214 (Scoreboard/ResultPanel) can be worked in parallel.
- [P] T208 (backend tests) and T219 (frontend tests) can be written in parallel.

## Acceptance / Done Criteria

- All tasks completed and tests passing.
- Manual verification: two browser tabs — drawer draws, guesser sees canvas, submit guesses, see history + scores update, round ends when all guessers correct.
- Vitest coverage for modified modules >= 80%.
