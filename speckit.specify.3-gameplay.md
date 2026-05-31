# Specification: Scenario 3 — Gameplay Interaction

## Story
Given a round is active with a drawer and guessers (all scores start at 0),
When the drawer draws/clears the canvas and guessers submit their guesses,
Then the drawing is visible on all players' screens via polling; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0).

---

## Acceptance Criteria

### AC3.1: Canvas — Drawer Can Draw
- **Given** the game is in `"playing"` state,
- **When** the drawer uses the mouse on the canvas,
- **Then** lines appear on the canvas in real-time on the drawer's screen.
- **And** the canvas is only interactive for the drawer (guessers see a read-only view).

### AC3.2: Canvas — Clear Canvas
- **Given** the drawer has drawn on the canvas,
- **When** they click a "Clear Canvas" button,
- **Then** all drawing is erased from the canvas.
- **And** the cleared state is synced to all guessers via the next poll.

### AC3.3: Canvas — Drawing Synced via Polling
- **Given** the drawer has drawn something,
- **When** guessers poll `GET /rooms/:code`,
- **Then** they receive the drawing data in the response.
- **And** the drawing is rendered on the guessers' canvases.

### AC3.4: Guess Submission — Trimming
- **Given** a guesser submits a guess with leading/trailing whitespace,
- **When** the guess is processed,
- **Then** it is trimmed server-side before comparison.

### AC3.5: Guess Submission — Empty Rejection
- **Given** a guesser submits an empty or whitespace-only guess,
- **When** the request reaches the API,
- **Then** the API returns 400 with message `"Guess cannot be empty"`.
- **And** the frontend also blocks submission client-side with `"Please enter a guess"`.

### AC3.6: Guess Comparison — Case-Insensitive
- **Given** a guesser submits a guess,
- **When** compared to the secret word,
- **Then** the comparison is case-insensitive (e.g., "Rocket" matches "rocket").

### AC3.7: Scoring — Correct Guess
- **Given** a guesser submits a guess matching the secret word,
- **When** the comparison succeeds,
- **Then** the guesser's score increases by 100.
- **And** the guess is marked as correct in the history.

### AC3.8: Scoring — Incorrect Guess
- **Given** a guesser submits a guess NOT matching the secret word,
- **When** the comparison fails,
- **Then** the guesser's score stays unchanged (adds 0).
- **And** the guess is still recorded in the history as incorrect.

### AC3.9: Guess History — Synced via Polling
- **Given** guesses have been submitted,
- **When** any player polls `GET /rooms/:code`,
- **Then** the response includes the full guess history: `[{ participantId, participantName, guess, isCorrect }]`.

### AC3.10: Scoreboard — Shows All Scores
- **Given** scores have changed,
- **When** the game page polls the room snapshot,
- **Then** the Scoreboard component displays each participant name and their current score.
- **And** all scores start at 0.

### AC3.11: Drawer Cannot Guess
- **Given** the drawer is viewing the game page,
- **When** they look at the guess input area,
- **Then** it is hidden or disabled with the message "You are the drawer — keep drawing!".
- **And** submitting guesses as the drawer is rejected by the API with 403.

---

## Edge Cases

| Edge Case | Expected Behaviour |
|-----------|-------------------|
| Rapid guesses from multiple guessers | Each guess is processed and recorded independently |
| Guesser guesses correctly twice | Only the first correct guess scores 100; subsequent guesses are recorded but score 0 |
| Drawing data size | Canvas data is an array of strokes; each stroke is an array of `{x, y}` points |
| Canvas cleared mid-guess | Cleared canvas is reflected on next poll; existing guesses are unaffected |
| No drawing yet | Canvas shows a blank white area with no placeholder text |
