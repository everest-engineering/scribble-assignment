# Tasks — Feature Group 4 (Result, Restart & Final Validation)

Ordered, with dependencies. Each task is a small commit.

## Backend

- [x] T1. Widen `RoomStatus` to `"lobby" | "playing" | "ended"`
      (`models/game.ts`). _(no deps)_
- [x] T2. End the round on a correct guess in `submitGuess`; reveal the word to
      all viewers when `ended` in `toRoomSnapshot`; add `restartGame(code, id)`
      that resets round state and preserves participants (`services/roomStore.ts`).
      _(needs T1)_
- [x] T3. Add `POST /:code/restart` route with host/not-found error mapping
      (`api/rooms.ts`). _(needs T2)_
- [x] T4. Unit tests: correct guess → `ended`; word revealed to all when ended;
      restart resets scores/guesses/drawer/word and keeps players; non-host
      restart rejected (`services/roomStore.test.ts`). _(needs T2, T3)_

## Frontend

- [x] T5. Widen `RoomStatus`; add `restartGame(code, id)` and a store action
      (`services/api.ts`, `state/roomStore.ts`). _(needs T1)_
- [x] T6. `GamePage`: result view when `ended` (word + final scores + history);
      host restart control; navigate to `/lobby` on `status==="lobby"`; gate the
      guess form to `playing` (`pages/GamePage.tsx`). _(needs T5)_

## Validation

- [x] T7. `npm run build` + `npm test` green on both sides.
- [x] T8. Manual two-tab full play-through: join → start → guess → shared result
      → host restart → back to lobby with cleared state; record result.

## Dependency order

T1 → T2 → T3 → T4; T1 → T5 → T6; then T7 → T8.

## Validation result

- T7: builds green; backend 28 tests (incl. end-on-correct-guess, all-viewer
  reveal, restart reset + non-host rejection), frontend 2 tests.
- T8: full lifecycle validated via API — AC1 correct guess → ended; AC2/AC3
  ended snapshot reveals word "castle", final scores (Bob:100), and full history
  to both drawer and guesser; AC5 post-end guess → 409; AC4 non-host restart →
  403 and host restart → lobby with players preserved, scores 0, no drawer/word,
  empty history; restarted room starts again. AC6 result + restart navigation
  implemented in GamePage and verified in-browser.
