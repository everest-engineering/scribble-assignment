## Scenario 3 — Gameplay Interaction

### Acceptance Criteria

**AC3.1 — Drawing canvas**
- The game page renders an interactive HTML5 `<canvas>` element.
- The canvas is only interactive for the drawer.
- Guessers see a read-only view of the canvas (latest drawing state).
- Drawing works via mouse: mousedown starts a stroke, mousemove draws, mouseup ends the stroke.
- Drawings are serialized and sent to the backend via POST /rooms/:code/draw.

**AC3.2 — Clear canvas**
- The drawer sees a "Clear Canvas" button.
- Clicking it sends POST /rooms/:code/clear.
- The canvas is wiped and the cleared state is synced to all players via polling.

**AC3.3 — Guess submission**
- Guessers can type a guess and click "Submit Guess".
- Empty/whitespace-only guesses are rejected with: "Guess cannot be empty."
- Guesses are trimmed before storage and comparison.
- The drawer cannot submit guesses (the form is hidden or disabled).
- Submitting a guess calls POST /rooms/:code/guess.

**AC3.4 — Case-insensitive comparison**
- A guess is correct if, after trimming and lowercasing, it matches the secret word (lowercased).
- Example: "Rocket", "ROCKET", " rocket " all match "rocket".

**AC3.5 — Scoring**
- A correct guess awards exactly 100 points.
- An incorrect guess awards 0 points.
- Scores are tracked per participant and persisted in the room state.
- The scoreboard reflects the latest scores from the room snapshot.

**AC3.6 — Guess history sync**
- All guesses (correct and incorrect) are stored in the room state.
- The full guess history is included in the room snapshot.
- All players see the same guess history via polling.

### Edge Cases

- The drawer cannot guess (their guess button is disabled/hidden).
- Multiple correct guesses: first correct guess ends the round.
- Guesses from the same player are all stored (history shows all attempts).
