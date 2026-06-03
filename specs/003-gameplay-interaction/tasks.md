# Tasks — Feature Group 3 (Gameplay Interaction)

Ordered, with dependencies. Each task is a small commit.

## Backend

- [x] T1. Add `score` to `Participant`, the `Guess` type, and `guesses` to `Room`
      and `RoomSnapshot` (`models/game.ts`). _(no deps)_
- [x] T2. Init `score: 0` and `guesses: []`; include `guesses` in
      `toRoomSnapshot`; add `submitGuess(code, participantId, text)` with
      playing/participant/drawer checks and 100-point scoring
      (`services/roomStore.ts`). _(needs T1)_
- [x] T3. Add `guessSchema`; add `POST /:code/guess` route with error mapping
      (`api/schemas.ts`, `api/rooms.ts`). _(needs T2)_
- [x] T4. Unit tests: correct (case/space-insensitive) scores 100, incorrect
      scores 0, empty rejected, drawer cannot guess, not-playing rejected, history
      accumulates (`services/roomStore.test.ts`). _(needs T2, T3)_

## Frontend

- [x] T5. Update `Participant`/`RoomSnapshot` types; add `Guess`; add
      `submitGuess(code, id, text)` and a store action
      (`services/api.ts`, `state/roomStore.ts`). _(needs T1)_
- [x] T6. Interactive `DrawingCanvas` with clear, for the drawer
      (`components/DrawingCanvas.tsx`). _(no deps)_
- [x] T7. Wire `GuessForm` to submit (trim + empty guard + error), disabled for
      the drawer (`components/GuessForm.tsx`). _(needs T5)_
- [x] T8. Render `Scoreboard` from participants/scores; render guess history in
      `ResultPanel` (`components/Scoreboard.tsx`, `components/ResultPanel.tsx`).
      _(needs T5)_
- [x] T9. `GamePage`: ~2s polling; canvas for drawer / placeholder for guesser;
      wire guess submit; pass data to scoreboard and history
      (`pages/GamePage.tsx`). _(needs T5, T6, T7, T8)_

## Validation

- [x] T10. `npm run build` + `npm test` green on both sides.
- [x] T11. Manual two-tab check of AC1–AC6; record result.

## Dependency order

T1 → T2 → T3 → T4; T1 → T5 → {T7, T8}; T6 independent; {T5,T6,T7,T8} → T9;
then T10 → T11.

## Validation result

- T10: builds green; backend 23 tests (incl. 6 submitGuess cases), frontend 2.
- T11: backend ACs validated via API — AC1 correct guess (uppercase + surrounding
  spaces) → score 100; AC2 incorrect → recorded, score 0; AC3 whitespace guess →
  400; AC4 drawer guess → 403; AC5/AC6 GET returns full synced history and
  scoreboard (Bob=100). Canvas, clear, ~2s game polling, and drawer-disabled
  guessing implemented in the game screen and verified in-browser.
