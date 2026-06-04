# Scenario 4 — Result, Restart & Final Validation

**Given** a round has ended,
**When** the result state is displayed and the host restarts,
**Then** all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared.

## Acceptance Criteria
1. When a correct guess is made, the room transitions to `result` status.
2. All players see the correct word, final scores, and full guess history.
3. The host sees a "Play Again" button that restarts to lobby.
4. Restart preserves all participants but clears round state (drawer, word, guesses, scores, canvas).
5. Room code remains the same after restart.

## Edge Cases
- Non-host cannot trigger restart (403).
- Restart resets scores to 0.
