# Feature Group 3: Gameplay Interaction

**Scenario:** Gameplay Interaction

## Acceptance Criteria

### AC1: Drawing Canvas
- The drawer sees an interactive canvas where they can draw freeform strokes.
- The drawing appears in real-time on the drawer's own screen.
- The canvas uses mouse/touch events for drawing (client-side only).

### AC2: Clear Canvas
- The drawer has a "Clear Canvas" button that erases all strokes.
- Clearing the canvas resets the drawing area to blank.
- The button is only visible to the drawer.

### AC3: Guess Submission
- Guessers can type and submit guesses via the GuessForm.
- Submitted guesses are trimmed of whitespace.
- Empty guesses are rejected with "Guess cannot be empty".
- Guesses are case-insensitively compared to the secret word.
- A correct guess matches the secret word exactly (ignoring case).
- Guesses are submitted via `POST /rooms/:code/guess`.

### AC4: Guess History Sync
- All players see the guess history via polling (`GET /rooms/:code`).
- Each guess displays: the guesser's name, the guessed text, and whether it was correct.
- The history updates automatically within the polling interval (~2s).
- Empty/incorrect guesses are shown in the history as attempts.

### AC5: Scoring
- All players start with a score of 0.
- A correct guess awards 100 points to the guesser.
- An incorrect guess awards 0 points.
- Scores are included in the room snapshot and updated via polling.
- The scoreboard displays each player's name and current score.

### AC6: Drawing Visibility
- The drawing is visible on the drawer's own screen.

## Edge Cases
- Guesser submits the same correct word twice -> only first correct guess counts
- Case-insensitive match: "ROCKET" matches "rocket"
- Trimming: "  rocket  " matches "rocket"
- Drawer cannot submit guesses (GuessForm hidden)
- No guesses yet -> empty history list
