# Scenario 2 — Game Start & Drawer Flow

## Acceptance Criteria
2.1 POST /rooms/:code/start validates the requester is the host (returns 403 if not)
2.2 POST /rooms/:code/start validates at least 2 players are present (returns 400 if not)
2.3 On start, the room status transitions from "lobby" to "playing"
2.4 The first participant (index 0) is assigned as the drawer
2.5 The secret word is deterministically selected using `STARTER_WORDS[roomCode.charCodeAt(0) % STARTER_WORDS.length]`
2.6 The snapshot returned to the drawer includes the `secretWord` field
2.7 The snapshot returned to guessers does NOT include the `secretWord`
2.8 Each participant's snapshot includes their role ("drawer" or "guesser")

## Edge Cases
- Non-host calls start → 403 "Only the host can start the game"
- Start called with < 2 players → 400 "Need at least 2 players to start"
- Start called on already-playing room → 400 "Game has already started"
- Player name trimming: leading/trailing whitespace is stripped; if result is empty, reject
