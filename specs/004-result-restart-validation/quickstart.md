# Quickstart Validation Guide: Result, Restart & Final Validation

## Prerequisites

- Node.js 22 installed; `npm install` run in both `backend/` and `frontend/`.
- Backend running on `http://localhost:3001` (`npm run dev` in `backend/`).
- Frontend running on `http://localhost:5173` (`npm run dev` in `frontend/`).
- Two browser windows (or tabs) open — one acting as the host/drawer, one as a guesser.

---

## Scenario 1: Round Ends — All Players See Results

1. **Host window**: Create a room. Note the 4-letter room code.
2. **Guesser window**: Join the room with the same code using a different name.
3. **Host window**: Click **Start Game**.
   - Both windows should navigate to the game screen.
   - Host window shows the secret word (first word from the starter list).
4. **Guesser window**: Submit the correct word in the Guess form.
5. **Expected** (within ~3 s, next polling cycle):
   - Both windows navigate to `/results`.
   - Both show the correct word.
   - Both show the full guess history (at least the correct guess).
   - Both show scores: guesser has 100 pts, drawer has 0.

---

## Scenario 2: Round Ends by Wrong Guesses First, Then Correct

1. Repeat Steps 1–3 from Scenario 1.
2. **Guesser window**: Submit two wrong guesses.
3. **Guesser window**: Submit the correct word.
4. **Expected** (within ~3 s):
   - Results screen shows all three guesses in order (two wrong, one correct).
   - Score is 100 for the guesser (only correct guess scores).

---

## Scenario 3: Host Restarts — All Players Return to Lobby

1. Complete Scenario 1 so both windows are on `/results`.
2. **Host window**: Click **Restart** (visible only to the host).
3. **Expected** (within ~3 s):
   - Both windows navigate to `/lobby`.
   - Player list is the same as before the round (no players dropped).
   - No guess history visible in the lobby.
   - No secret word visible to either player.

---

## Scenario 4: Cumulative Scores Across Two Rounds

1. Complete Scenario 3 (both on lobby after restart).
2. **Host window**: Click **Start Game** again.
3. **Guesser window**: Guess correctly.
4. Both windows navigate to `/results`.
5. **Expected**:
   - Round scores show 100 for the guesser for this round.
   - Cumulative scores show 200 for the guesser (100 from each round).

---

## Scenario 5: Restart Button Not Visible to Non-Host

1. Complete a round so both windows are on `/results`.
2. **Guesser window**: Verify there is no Restart button visible.
3. **Host window**: Restart button is present and clickable.

---

## Unit Test Validation

Run backend tests to verify store logic:

```bash
cd backend && npm test
```

Expected: all existing tests pass plus new tests for:
- `submitGuess` with a correct guess sets `status` to `"completed"`
- `restartGame` clears round state and preserves cumulative scores
- `toRoomSnapshot` reveals `secretWord` to all when `status === "completed"`
- `startGame` preserves existing cumulative `scores` on re-start

Run frontend tests:

```bash
cd frontend && npm test
```

Expected: all existing tests pass plus new tests for:
- `RoomStore.restartGame()` calls the API and updates state
- `ResultsPage` renders correct word, guess list, and scores
- `GamePage` navigates to `/results` when `status === "completed"`

---

## References

- Data model changes: [data-model.md](data-model.md)
- API contract: [contracts/api.md](contracts/api.md)
