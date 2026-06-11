# Scenario 3 Plan

## Work Plan
1. Define the guess model in `backend/src/models/game.ts` with `id`, `participantId`, `text`, `normalizedText`, and `createdAt`.
2. Extend `backend/src/services/roomStore.ts` to store `guesses[]`, `scores`, and `roundWon`.
3. Add `POST /api/rooms/:code/guess` in `backend/src/api/rooms.ts` and validate requests in `backend/src/api/schemas.ts`.
4. Normalize guesses to trimmed lower-case on the backend and compare against `secretWord.toLowerCase()`.
5. Award 100 points only once per round to the first correct guesser, update `scores[participantId]`, and preserve game state.
6. Update `backend/src/services/roomStore.ts` `toRoomSnapshot()` to include guess history and scores.
7. Add `api.guess()` and `api.restartRoom()` in `frontend/src/services/api.ts`.
8. Update `frontend/src/state/roomStore.ts` to expose `submitGuess()` and `restartGame()`.
9. Update `frontend/src/components/GuessForm.tsx` to reject empty trimmed guesses and submit normalized input.
10. Update `frontend/src/components/ResultPanel.tsx` to show the activity log and restart button for the host.

## APIs
- `POST /api/rooms/:code/guess` → `RoomSessionResponse`
- `POST /api/rooms/:code/restart` → `RoomSessionResponse`
- `GET /api/rooms/:code` → `{ room: RoomSnapshot }`

## Verification
- Submit guesses from a non-drawer session and verify the history updates in both sessions within 2s.
- Confirm a correct guess awards exactly 100 points and later guesses do not award again.
- Confirm `GuessForm` rejects blank or whitespace-only text.
