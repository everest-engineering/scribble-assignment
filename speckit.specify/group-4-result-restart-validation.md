# Feature Group 4: Result, Restart & Final Validation

**Scenario:** Result, Restart & Final Validation

## Acceptance Criteria

### AC1: Round End State
- When the correct word is guessed (or manually ended), the round transitions to a "result" state.
- The room status becomes "result" (or equivalent terminal state).
- All players see the result view automatically (via polling detecting status change).

### AC2: Shared Result Visibility
- All players see the correct secret word (revealed to everyone).
- All players see the final scores for all participants.
- All players see the full guess history from the completed round.
- The result snapshot includes: `correctWord`, `scores`, `guessHistory`.

### AC3: Host Restart
- Only the host can trigger a restart.
- The restart button is visible only on the host's result screen.
- On restart (`POST /rooms/:code/restart`):
  - All players return to the lobby.
  - Player list is preserved (no one is removed).
  - Round state is cleared: drawerId, secretWord, round, guesses, scores reset.
  - Room status returns to "lobby".
- Non-host attempting restart receives 403.

### AC4: Polling During Result
- Players still in the result view see updates via polling.
- When the host restarts, all players' polls detect the "lobby" status and redirect to the lobby page.

## Edge Cases
- Host refreshes the page during result → poll returns current state, result view preserved.
- Player joins after round ended → sees current result state.
- Only one player left → restart still works (no minimum player requirement for restart).
- Restarting multiple times in a row → each restart cleanly resets round state.
