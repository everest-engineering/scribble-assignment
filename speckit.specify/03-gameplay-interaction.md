# Specify Iteration 3: Gameplay Interaction

## Requirement

During an active round, the drawer can draw or clear the canvas. Guessers can submit guesses. Guesses are trimmed, empty guesses are rejected, matching is case-insensitive, and guess history is synchronized through polling.

## Acceptance Criteria

1. Only the drawer can update or clear drawing data.
2. Drawing updates are stored as a PNG data URL and included in room snapshots.
3. Guessers can submit non-empty guesses.
4. Drawer guess attempts fail.
5. Incorrect guesses are recorded with `correct: false` and `scoreDelta: 0`.
6. Correct guesses are recorded with `correct: true`, add 100 points, and end the round.
7. Guess history appears for all participants through room polling.

## Edge Cases

- Guess with leading or trailing whitespace.
- Guess with different letter casing.
- Empty or whitespace-only guess.
- Non-drawer attempting to modify drawing.
