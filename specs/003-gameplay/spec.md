# Feature: Gameplay Interaction

## Overview
Once the game is in `playing` status, the drawer can draw on an interactive HTML5 Canvas and guessers can submit text guesses. The guess history is synced to all players via polling. Correct guesses score 100 points and trigger the round to end. The canvas drawing is synced to guessers as a rendered image via the same polling mechanism.

## Acceptance Criteria
1. The drawer sees a functional HTML5 Canvas element with a drawing surface. The canvas has a white background and a black brush (2-3px stroke width by default).
2. The drawing surface responds to mouse input: pressing the mouse button starts a stroke, moving the mouse draws a continuous line, and releasing the mouse button ends the stroke.
3. A "Clear Canvas" button is visible to the drawer. Clicking it resets the canvas to a blank white state.
4. The canvas state (as a data URL) is uploaded to the backend via `PUT /rooms/:code/canvas` and made available in the room snapshot. All players receive the latest canvas image through the polling mechanism and render it as an `<img>` tag on non-drawer screens.
5. The drawer does not see or have access to the guess input form. Only guessers can submit guesses.
6. Guessers see a text input field and a "Submit" button. Submitting a guess sends a POST to `/rooms/:code/guess` with the participant ID and the guessed word.
7. Submitted guesses are trimmed of leading/trailing whitespace before validation and comparison. Empty or whitespace-only guesses are rejected with a 400 status and descriptive message.
8. The guess comparison is case-insensitive. "PIZZA", "pizza", and "Pizza" all match the secret word "pizza".
9. A correct guess awards exactly 100 points to the guessing participant's score. An incorrect guess awards 0 points.
10. When a correct guess is submitted, the room status transitions from `"playing"` to `"round_end"` immediately. No further guesses are accepted after this transition.
11. The guess history is synced to all players via polling. Each guess entry includes: participant name, the guessed word, whether it was correct, and a timestamp.
12. All players start with a score of 0 at the beginning of the game. Scores are stored as a `Record<string, number>` keyed by participant ID.

## Edge Cases
- If the drawer somehow submits a guess (e.g., via direct API call), the backend silently ignores it with a 200 response but does not process or score it.
- If a guess is submitted after the round has already ended (status is `round_end`), the backend returns a 400 error indicating the round is over.
- Multiple guessers may submit at the same time. The first correct guess processed by the backend triggers `round_end`. Subsequent correct guesses receive 0 points because the round has ended.
- The same guesser cannot score multiple times in the same round. If they already guessed correctly, subsequent guesses from the same participant (even if correct) score 0.
- The canvas data URL is stored as a string on the Room object. It is reset to `null` when a new round starts or the game restarts.
- If a guesser has not yet submitted any guess, their name still appears in the scoreboard with a score of 0.
