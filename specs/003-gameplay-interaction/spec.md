## Scenario 3 — Gameplay Interaction

### Problem

The game screen currently has no real interactivity. The canvas is a static placeholder — neither the drawer nor any guesser can do anything on it. There is no mechanism for submitting a guess, no backend storage for guesses, and no way for players to see what others have guessed. Scores do not exist on any player record. The game is in a running state but nothing actually happens once it starts.

---

### Requirements

#### Drawing Canvas
- The game screen must provide an interactive drawing surface for the drawer.
- The drawer can draw freely on the canvas using pointer or mouse events.
- The canvas is visible to all players on the game screen.
- Only the drawer can draw; guessers see the canvas as read-only.
- The canvas renders the same drawing for the drawer and guessers (drawing state is not synced via WebSockets — the canvas is local to the drawer's screen; guessers see a static or placeholder view until Scenario 3 polling is wired).

#### Clear Canvas
- The drawer has access to a "Clear Canvas" button.
- Clicking it wipes the canvas back to a blank state.
- Guessers do not see the clear button.
- Clearing is a local action on the drawer's canvas — it does not sync to other players.

#### Guess Submission
- Guessers can submit a guess using the existing `GuessForm` component.
- The drawer cannot submit a guess — the guess form is not shown or is disabled for the drawer.
- A submitted guess is sent to the backend and stored against the room.
- The backend stores the guesser's participant id, their name, the submitted text, whether it was correct, and the timestamp.

#### Guess Validation
- A guess must be trimmed of leading and trailing whitespace before processing.
- A guess that is empty or whitespace-only after trimming is rejected with a clear inline error. No API call is made.
- These rules are enforced on both the frontend (before the API call) and the backend (schema validation).

#### Guess Comparison
- The backend compares the trimmed, lowercased guess against the trimmed, lowercased `currentWord`.
- Comparison is case-insensitive: `"PIZZA"`, `"pizza"`, and `"Pizza"` all match if the word is `"pizza"`.
- The correct/incorrect result is determined by the backend — the frontend does not apply any comparison logic.

#### Scoring
- Every participant starts with a score of zero.
- A correct guess awards the guesser 100 points.
- An incorrect guess awards the guesser 0 points (score unchanged).
- Scores are stored on each participant on the backend.
- The drawer does not receive points for this scenario.
- A player who guesses correctly can still submit further guesses; additional correct guesses do not award additional points (score stays at 100 once reached).

#### Guess History Synchronisation
- All players (drawer and guessers) see a live guess history on the game screen.
- The guess history is fetched via the existing polling mechanism on the game screen (same ~2-second cadence as the lobby).
- Each entry in the history shows the guesser's name, their guess text, and whether it was correct or incorrect.
- The history is ordered by submission time, oldest first.
- All players see the same complete history — there is no per-viewer filtering of guesses.

---

### Edge Cases

- A whitespace-only guess (e.g. `"   "`) must be rejected the same way as an empty guess — after trimming the result is empty.
- A guess with surrounding spaces (e.g. `"  pizza  "`) must be trimmed before comparison; `"  pizza  "` must match `"pizza"`.
- Guess comparison is case-insensitive in both directions: the guess is lowercased, the stored word is lowercased, and only then compared.
- A guesser who has already guessed correctly may continue submitting guesses. Subsequent correct guesses do not increase their score beyond 100.
- The drawer must not be able to submit a guess — the guess form must not be present or must be disabled on the drawer's view.
- An empty canvas cleared by the drawer remains blank — it does not restore any previous drawing state.
- If the backend is temporarily unavailable during polling, the guess history does not disappear — it retains the last successfully fetched state until the next successful poll.
- Scores shown in the Scoreboard are read from the room snapshot, not computed on the frontend — the backend is the single source of truth for scores.
- Submitting a guess after the game has ended (Scenario 4 state) is out of scope for this scenario.

---

### Acceptance Criteria

**Drawing canvas**
- [ ] The drawer's game screen shows an interactive canvas element (not a static placeholder).
- [ ] The drawer can draw on the canvas using a mouse or pointer device.
- [ ] The guesser's game screen shows the canvas area but cannot interact with it.

**Clear canvas**
- [ ] The drawer's game screen has a "Clear Canvas" button.
- [ ] Clicking "Clear Canvas" resets the canvas to a blank state.
- [ ] The clear button is not visible on a guesser's game screen.

**Guess submission**
- [ ] The guess form is visible and active for guessers.
- [ ] The guess form is not shown (or is disabled) for the drawer.
- [ ] Submitting a valid guess sends a request to the backend.
- [ ] After a successful submission, the guess appears in the guess history.

**Guess validation**
- [ ] Submitting an empty guess shows an inline error and does not call the API.
- [ ] Submitting a whitespace-only guess shows the same error and does not call the API.
- [ ] A guess with surrounding spaces is trimmed and submitted as the trimmed value.
- [ ] Sending an empty or whitespace-only guess directly to the backend returns a 400 error.

**Guess comparison**
- [ ] Submitting the exact secret word (same case) is marked as correct by the backend.
- [ ] Submitting the secret word in a different case (e.g. all caps) is also marked as correct.
- [ ] Submitting a wrong word is marked as incorrect.
- [ ] The correct/incorrect result is determined by the backend, not the frontend.

**Scoring**
- [ ] All participants start with a score of 0 visible in the Scoreboard.
- [ ] A correct guess updates the guesser's score to 100.
- [ ] An incorrect guess does not change the guesser's score.
- [ ] Scores are visible in the Scoreboard for all players after each poll.
- [ ] A second correct guess by the same player does not increase their score beyond 100.

**Guess history synchronisation**
- [ ] The guess history on the game screen updates within ~2 seconds of a guess being submitted by any player.
- [ ] Each history entry shows the guesser's name, their guess, and whether it was correct or incorrect.
- [ ] All players (drawer and guessers) see the same history.
- [ ] The history is ordered oldest-first.
