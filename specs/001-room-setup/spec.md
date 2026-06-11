# Group 1 — Room Setup & Lobby (Scenario 1)

## Acceptance Criteria
1.1. Room creator is automatically the host (stored as `hostId` on the room).
1.2. Invalid/empty room codes are rejected when joining, with clear error feedback.
1.3. Rooms are fully isolated — players in one room cannot see data from another room.
1.4. Lobby auto-refreshes via polling every ~2 seconds (not manual button).
1.5. Only the host can start the game; the "Start Game" button is disabled for non-host players.
1.6. At least 2 players must be present before the game can start; "Start Game" is disabled when < 2 players.

## Edge Cases
- Empty room code in join form → inline error message.
- Non-existent room code → "Unable to join room" error displayed.
- Player name is trimmed; empty/whitespace-only names → default to "Player".
- Host leaves the room — host remains the original host (no transfer).
- Multiple rooms with same participant names — fully isolated by room code.
