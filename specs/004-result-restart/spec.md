# Feature: Result, Restart & Final Validation

## Overview
When a correct guess ends the round, the room enters `round_end` status. All players see a result screen showing the correct secret word, final scores for every participant, and the complete guess history from the round. Only the host can initiate a restart, which returns everyone to the lobby with the participant list preserved and all round state cleared.

## Acceptance Criteria
1. When a correct guess is submitted, the backend transitions the room status from `"playing"` to `"round_end"` atomically as part of the guess processing logic.
2. All players detect the `round_end` status change via their regular polling interval (every ~2 seconds). No separate notification mechanism is needed.
3. In the `round_end` state, all players see the correct secret word displayed prominently. The word that was hidden from guessers during gameplay is now revealed to everyone.
4. Final scores for all participants are displayed in a table or list format. Each player's name and their score (0 or 100) is shown.
5. The complete guess history from the round is displayed, including each guesser's name, the word they guessed, whether it was correct, and when they submitted it.
6. Only the host can see and click the "Restart Game" or "Back to Lobby" button. Non-host players see a message such as "Waiting for the host to restart..." instead.
7. When the host clicks restart, the frontend sends a POST to `/rooms/:code/restart` with the host's participant ID.
8. On successful restart, the backend resets the room: status becomes `"lobby"`, `drawerId` is set to `null`, `secretWord` is set to `null`, `round` is reset to `0`, `guesses` is emptied, `scores` is reset to `{}` (or all zeros), and `canvasData` is set to `null`.
9. The participant list is fully preserved across the restart. All players who were in the room before the restart remain in the room after.
10. After restart, the frontend navigates to the lobby page. The auto-polling mechanism continues to fetch the now-reset room state, showing all players back in the lobby.

## Edge Cases
- If a non-host player attempts to call the restart API, the backend returns a 403 Forbidden response with a clear error message.
- Restarting a room that is already in `"lobby"` status is a no-op — the backend returns the current snapshot without making changes. This prevents errors from race conditions during polling.
- If the host closes their browser tab or disconnects, there is no mechanism to transfer host status. This is intentionally out of scope. The game remains in its current state until the host returns or the room expires.
- The restart does not generate a new room code or change any room identity. The same `code` is used for the entire room lifecycle.
- After restart, all player scores are zeroed. There is no persistent score tracking across rounds (multiple rounds are out of scope per the lab constraints).
