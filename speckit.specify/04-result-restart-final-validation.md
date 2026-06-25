# Specify Iteration 4: Result, Restart, and Final Validation

## Requirement

After a correct guess ends the round, all participants see the result state with the correct word, final scores, and complete guess history. The host can restart to lobby while preserving players and clearing round state.

## Acceptance Criteria

1. A correct guess changes room status to `result`.
2. Result snapshots expose the correct word to every participant.
3. Result UI shows final scores and full guess history.
4. Only the host sees and can use restart.
5. Restart returns the room to `lobby`.
6. Restart preserves participants and host identity.
7. Restart clears drawer id, secret word, drawing data, guesses, result data, and score state.

## Edge Cases

- Guest attempting to restart.
- Restart before result state.
- Polling clients returning from result to lobby after restart.
