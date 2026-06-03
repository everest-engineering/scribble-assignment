# Tasks — Feature Group 4 (Result, Restart & Final Validation)

Ordered, with dependencies. Each task is a small commit.

## Backend

- [ ] T1. Widen `RoomStatus` to `"lobby" | "playing" | "ended"`
      (`models/game.ts`). _(no deps)_
- [ ] T2. End the round on a correct guess in `submitGuess`; reveal the word to
      all viewers when `ended` in `toRoomSnapshot`; add `restartGame(code, id)`
      that resets round state and preserves participants (`services/roomStore.ts`).
      _(needs T1)_
- [ ] T3. Add `POST /:code/restart` route with host/not-found error mapping
      (`api/rooms.ts`). _(needs T2)_
- [ ] T4. Unit tests: correct guess → `ended`; word revealed to all when ended;
      restart resets scores/guesses/drawer/word and keeps players; non-host
      restart rejected (`services/roomStore.test.ts`). _(needs T2, T3)_

## Frontend

- [ ] T5. Widen `RoomStatus`; add `restartGame(code, id)` and a store action
      (`services/api.ts`, `state/roomStore.ts`). _(needs T1)_
- [ ] T6. `GamePage`: result view when `ended` (word + final scores + history);
      host restart control; navigate to `/lobby` on `status==="lobby"`; gate the
      guess form to `playing` (`pages/GamePage.tsx`). _(needs T5)_

## Validation

- [ ] T7. `npm run build` + `npm test` green on both sides.
- [ ] T8. Manual two-tab full play-through: join → start → guess → shared result
      → host restart → back to lobby with cleared state; record result.

## Dependency order

T1 → T2 → T3 → T4; T1 → T5 → T6; then T7 → T8.
