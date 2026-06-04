# Scenario 4 — Result, Restart & Final Validation

## Acceptance Criteria
4.1 When the round ends (correct guess), all players see the result screen
4.2 The result screen shows: the correct word, final scores for all players, and the full guess history
4.3 The host sees a "Restart Game" button on the result screen
4.4 Clicking "Restart Game" calls POST /rooms/:code/restart
4.5 The restart transitions the room to "lobby" status, preserves all participants, and clears all round state (drawerId, secretWord, guesses, scores, drawStrokes)
4.6 After restart, all players see the lobby (auto-polling brings them there)

## Edge Cases
- Non-host tries to restart → 403 "Only the host can restart the game"
- Restart called on a room in "lobby" → 400 "Game has not started yet"
- Restart preserves participant list exactly (no players are removed)
- After restart, the scoreboard, guess history, and drawing canvas are fully cleared
