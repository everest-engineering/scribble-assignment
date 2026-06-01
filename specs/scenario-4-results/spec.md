# Scenario 4 - Results And Restart

## User Story

As a player, I want to see the round results and restart the game so that I can play again with the same group.

## Acceptance Criteria

### AC-01 Result Screen

Given a round has ended

When the result screen is shown

Then all players see the correct word, final scores, and full guess history.

### AC-02 Show Correct Word

Given the result screen is displayed

When a player views the results

Then the secret word from the round is visible to all players (not just the drawer).

### AC-03 Show Final Scores

Given the result screen is displayed

When a player views the results

Then each player's final score is shown.

### AC-04 Show Full Guess History

Given the result screen is displayed

When a player views the results

Then every guess from the round is listed with who guessed it and whether it was correct.

### AC-05 Restart Game

Given the result screen is displayed and the viewer is the host

When the host clicks restart

Then all players are returned to the lobby.

### AC-06 Players Stay In Room

Given the host restarts the game

When players return to the lobby

Then all players are still in the room and no one is removed.

### AC-07 Round Data Cleared On Restart

Given the host restarts the game

When the lobby reopens

Then the secret word, guesses, scores, and roles are all reset for a new round.

## Edge Cases

- Non-host players cannot restart the game. Only the host sees the restart button.
- If a player joins after the round ended, they see the result screen too.
- Restarting a second time also works. All round data is cleared each time.
- The room code stays the same after restart. Players rejoin using the same code.

## Clarifications

### C-01 Host-Only Restart

Only the host can restart. Non-host players see the result screen without the restart button.

### C-02 Result Is Shared

All players see the same result data. The correct word is no longer hidden on the result screen.

### C-03 Full Reset

Restart clears the current word, all guesses, all scores, and all roles. Players go back to the lobby with their original join data intact.

### C-04 End Of Round

This scenario assumes the round has ended. How the round ends (timer, host action, all correct) is defined in a future scenario if needed.

## Non-Goals

- Multiple rounds or drawer rotation within a single game session.
- Timer or countdown for the result screen.
- Persistent score tracking across restarts (scores reset to 0).
- Removing players or allowing new players to join during results.
