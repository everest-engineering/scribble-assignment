# Quickstart: Gameplay Interaction

## Validation Scenarios

### Scenario 1: Canvas Syncing
- Drawer draws a stroke on the canvas.
- Verify that a POST request is sent to `/:code/canvas` with the updated drawing data.
- Verify that Guessers' next poll retrieves the same drawing data and renders it.

### Scenario 2: Guesses
- Guesser submits `"  RoCkEt  "` when secret word is `"rocket"`.
- Verify the guess is processed as correct, score updates to 100, and a guess log is added.
- Guesser submits empty guess.
- Verify validation rejection response is shown.
