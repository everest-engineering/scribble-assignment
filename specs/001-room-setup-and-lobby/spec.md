# Room Setup & Lobby

## Acceptance Criteria
1. Room creator is marked as host. Only host can start the game.
2. Joining with an invalid/empty code shows a clear error message.
3. Rooms are fully isolated (players in room A cannot see room B).
4. Lobby auto-polls every ~2 seconds.
5. Start Game button visible, enabled only when host + 2+ players present.

## Edge Cases
- Player name empty/whitespace-only: trimmed, rejected with message.
- Room code case-insensitive.
- Duplicate participant names allowed.
