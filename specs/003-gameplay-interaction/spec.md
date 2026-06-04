# Gameplay Interaction

## Acceptance Criteria
1. Drawer can draw on a canvas and clear it.
2. Drawing state is saved server-side and synced via polling.
3. Guessers submit guesses; empty/whitespace rejected.
4. Guess comparison: trimmed, case-insensitive.
5. Correct guess = +100 points. Incorrect = +0.
6. Guess history synced to all players via polling.

## Edge Cases
- Drawer cannot submit guesses.
- Multiple correct guessers all score 100 (round ends on first correct guess).
- Canvas state reset on new game.
