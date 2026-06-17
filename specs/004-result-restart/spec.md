# Group 4 — Result, Restart & Final Validation (Scenario 4)

## Acceptance Criteria
4.1. All players see the correct secret word on the result screen.
4.2. All players see final scores for all participants.
4.3. All players see the complete guess history for the round.
4.4. Only the host can restart the game.
4.5. On restart, all players return to the lobby with participants preserved.
4.6. On restart, all round state (drawing, guesses, scores, secret word) is cleared.

## Edge Cases
- Non-host tries to restart → button disabled / error.
- Restart clears game state but keeps participants and host intact.
- Result screen is visible to all players simultaneously (shared state via polling).
