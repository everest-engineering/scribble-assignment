## Scenario 1 — Room Setup & Lobby

### Acceptance Criteria

**AC1.1 — Host tracking**
- The player who creates a room is automatically designated as the host.
- The host is identified by `hostId` on the room.
- The lobby displays a host badge next to the host's name.

**AC1.2 — Create room with empty name**
- If the player submits an empty or whitespace-only name, the form shows an inline error: "Player name is required."
- No API call is made.
- The room is not created.

**AC1.3 — Join room with empty name**
- Same validation as AC1.2.
- No API call is made.

**AC1.4 — Join room with invalid/missing code**
- If the code is empty or whitespace, the form shows an inline error: "Room code is required."
- No API call is made.
- If the code does not match any room, the API returns 404 and the form shows: "Room not found. Check the code and try again."

**AC1.5 — Room isolation**
- Each room has a unique 4-character code.
- Participants in one room cannot see or interact with participants in another room.
- GET /rooms/:code for room A only returns data for room A.

**AC1.6 — Lobby auto-polling**
- The lobby automatically polls the backend every ~2 seconds.
- The participant list updates without manual intervention.
- The polling stops when the user navigates away from the lobby.
- A loading indicator shows during each poll request.

**AC1.7 — Host-only start game**
- Only the host can start the game.
- Non-host participants see a "Waiting for host to start..." message.
- A minimum of 2 participants (including host) is required to start.
- If fewer than 2 participants, the start button is disabled with the message: "Need at least 2 players to start."
- Starting the game calls POST /rooms/:code/start.

### Edge Cases

- Room code is case-insensitive (already handled: uppercased before lookup).
- Multiple rapid create requests generate unique codes (existing guard).
- Player can join the same room from multiple tabs (each gets a unique participantId).
- Polling continues to work after a failed request (the interval is not stopped).
