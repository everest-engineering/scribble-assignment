# Specify Iteration 1: Room Setup and Lobby

## Requirement

Players can create or join isolated rooms by code. The creator is the host. Lobby membership updates through polling about every 2 seconds. Only the host can start once at least 2 players are present.

## Acceptance Criteria

1. Creating a room trims the player name, rejects empty names, creates a 4-character uppercase room code, and marks the creator as host.
2. Joining trims the player name, rejects empty names, rejects empty or malformed room codes, and returns a clear error for unknown rooms.
3. Rooms are isolated by code; participants and game state remain scoped to their own room.
4. Lobby snapshots poll every 2 seconds while the viewer remains in the lobby.
5. Start is disabled for non-hosts and for hosts with fewer than 2 players.
6. Backend start attempts from non-host participants fail with a 403 response.

## Edge Cases

- Whitespace-only player name.
- Room code shorter or longer than 4 characters.
- Unknown room code.
- Guest attempting to start the game.
- Host attempting to start alone.
