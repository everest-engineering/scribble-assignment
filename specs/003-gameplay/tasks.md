# Scenario 3 Tasks

- [ ] Add `Guess` type to `backend/src/models/game.ts` and extend `Room`/`RoomSnapshot`.
- [ ] Initialize `room.guesses` and `room.scores` in `backend/src/services/roomStore.ts`.
- [ ] Add `guessSchema` validation in `backend/src/api/schemas.ts`.
- [ ] Implement `POST /api/rooms/:code/guess` in `backend/src/api/rooms.ts`.
- [ ] Normalize guess text to lower-case and trim whitespace before scoring.
- [ ] Award 100 points to the first correct guesser and set `room.roundWon = true`.
- [ ] Add `api.guess()` to `frontend/src/services/api.ts`.
- [ ] Implement `submitGuess()` or equivalent in `frontend/src/state/roomStore.ts`.
- [ ] Ensure `GuessForm.tsx` trims the input and prevents empty submissions.
- [ ] Add guess history rendering to `frontend/src/components/ResultPanel.tsx`.
- [ ] Confirm the host restart action retains existing participants.
