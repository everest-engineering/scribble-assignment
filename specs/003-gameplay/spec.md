# Feature Group 3 — Gameplay Interaction

## Requirements

- Interactive drawing canvas: the drawer can draw on a canvas
- Clear canvas: the drawer can clear the canvas
- Guess validation: empty/whitespace guesses are rejected
- Guess history synchronization: all players see the same guess history
- Polling updates: game state refreshes via ~2s polling
- Case-insensitive matching: guesses match the word regardless of case
- Deterministic scoring: correct guess = 100 points, incorrect = 0 points

## Acceptance Criteria

- AC3.1: The drawer sees a drawing canvas they can draw on
- AC3.2: The drawer can clear the canvas
- AC3.3: All guesses are trimmed before validation
- AC3.4: Empty/whitespace-only guesses return a 400 error
- AC3.5: Correct guesses are case-insensitively matched (e.g., "Rocket" matches "rocket")
- AC3.6: A correct guess awards exactly 100 points
- AC3.7: An incorrect guess awards 0 points
- AC3.8: Guess history is synced to all players via polling
- AC3.9: Multiple correct guesses by different players are all tracked

## Edge Cases

- Guess with leading/trailing spaces
- Guess in different case
- Empty guess submission
- Whitespace-only guess
