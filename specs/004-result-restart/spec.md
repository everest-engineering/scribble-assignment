# Feature Group 4 — Result & Restart

## Requirements

- Shared result state: all players see the same result after the round ends
- Reveal correct word: the secret word is shown to all players
- Show final scores: scores for all participants are displayed
- Show full guess history: all guesses from the round are displayed
- Restart returns everyone to lobby: host triggers restart, all players navigate to lobby
- Preserve players: the participant list and host are preserved after restart
- Clear round state: drawing data, guesses, and scores are reset

## Acceptance Criteria

- AC4.1: After the round ends (word guessed), room status transitions to "results"
- AC4.2: All players see the correct word in the result state
- AC4.3: All players see final scores for every participant
- AC4.4: All players see the full guess history
- AC4.5: The host can trigger a restart
- AC4.6: On restart, room status transitions back to "lobby"
- AC4.7: On restart, all participants remain in the room
- AC4.8: On restart, round-specific data (word, guesses, scores, drawing) is cleared
- AC4.9: Non-host players see a "Waiting for host to restart" message
- AC4.10: Restart returns all players to the lobby screen

## Edge Cases

- Restart with only 2 players (should still work)
- Multiple restarts in sequence
- Player who joined after game started
