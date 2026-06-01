# Feature Group 1 — Room Setup & Lobby

## Requirements

- Host tracking: the player who creates a room is the host
- Join validation: empty/whitespace-only names are rejected; invalid room codes show clear feedback
- Invalid room feedback: attempting to join a non-existent room returns a 404 with a clear message
- Multi-room isolation: operations in one room do not affect another room
- Automatic polling: lobby refreshes every ~2 seconds automatically
- Host-only start game: only the host can start the game
- Minimum 2 players: host cannot start until at least 2 participants are present

## Acceptance Criteria

- AC1.1: Creating a room returns the creator's participant ID and marks them as host
- AC1.2: The lobby snapshot exposes the host's participant ID
- AC1.3: Joining a room with an empty/whitespace name returns a 400 error with message
- AC1.4: Joining a non-existent room returns a 404 error with message
- AC1.5: Participants in room A cannot see or affect participants in room B
- AC1.6: The lobby page polls GET /rooms/:code every ~2 seconds
- AC1.7: The "Start Game" button is only enabled for the host
- AC1.8: The "Start Game" button is disabled if fewer than 2 players are in the room
- AC1.9: Starting the game transitions room status from "lobby" to "drawing"

## Edge Cases

- Empty name string
- Whitespace-only name ("   ")
- Room code that doesn't exist
- Single player in room trying to start
