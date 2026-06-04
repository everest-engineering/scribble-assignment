# Scenario 1 — Room Setup & Lobby

## Acceptance Criteria
1.1 Creating a room marks the creator as host (stored as `hostId` on the room)
1.2 Joining a room with a valid code adds the player to the participants list
1.3 Joining a room with an invalid/nonexistent code returns a 404 error with a clear message
1.4 Empty/whitespace-only player names are rejected with a "Name cannot be empty" message on create and join
1.5 Rooms are fully isolated — participants in one room cannot see data from another room
1.6 The lobby auto-polls the room snapshot every ~2 seconds (no manual refresh needed)
1.7 The "Start Game" button is only shown to the host and is disabled until ≥2 players are in the room
1.8 Clicking "Start Game" calls POST /rooms/:code/start and navigates to /game

## Edge Cases
- Player creates room with empty name → error shown, form not submitted
- Player joins with whitespace-only name → error shown, form not submitted
- Player joins with non-existent room code → error message "Room not found"
- Host tries to start game with only 1 player → button disabled with tooltip "Need at least 2 players"
- Non-host sees "Start Game" button as hidden, not disabled
- Room code is case-insensitive (ABCD and abcd are the same room)
