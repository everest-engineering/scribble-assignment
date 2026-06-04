# Specification

## Feature Group 1 — Room Setup & Lobby (Scenario 1)

### Acceptance Criteria
1.1 Creating a room marks the creator as host (stored as `hostId` on the room)
1.2 Joining a room with a valid code adds the player to the participants list
1.3 Joining a room with an invalid/nonexistent code returns a 404 error with a clear message
1.4 Empty/whitespace-only player names are rejected with a "Name cannot be empty" message on create and join
1.5 Rooms are fully isolated — participants in one room cannot see data from another room
1.6 The lobby auto-polls the room snapshot every ~2 seconds (no manual refresh needed)
1.7 The "Start Game" button is only shown to the host and is disabled until ≥2 players are in the room
1.8 Clicking "Start Game" calls POST /rooms/:code/start and navigates to /game

### Edge Cases
- Player creates room with empty name → error shown, form not submitted
- Player joins with whitespace-only name → error shown, form not submitted
- Player joins with non-existent room code → error message "Room not found"
- Host tries to start game with only 1 player → button disabled with tooltip "Need at least 2 players"
- Non-host sees "Start Game" button as hidden, not disabled
- Room code is case-insensitive (ABCD and abcd are the same room)

---

## Feature Group 2 — Game Start & Drawer Flow (Scenario 2)

### Acceptance Criteria
2.1 POST /rooms/:code/start validates the requester is the host (returns 403 if not)
2.2 POST /rooms/:code/start validates at least 2 players are present (returns 400 if not)
2.3 On start, the room status transitions from "lobby" to "playing"
2.4 The first participant (index 0) is assigned as the drawer
2.5 The secret word is deterministically selected using `STARTER_WORDS[roomCode.charCodeAt(0) % STARTER_WORDS.length]`
2.6 The snapshot returned to the drawer includes the `secretWord` field
2.7 The snapshot returned to guessers does NOT include the `secretWord`
2.8 Each participant's snapshot includes their role ("drawer" or "guesser")

### Edge Cases
- Non-host calls start → 403 "Only the host can start the game"
- Start called with < 2 players → 400 "Need at least 2 players to start"
- Start called on already-playing room → 400 "Game has already started"
- Player name trimming: leading/trailing whitespace is stripped; if result is empty, reject

---

## Feature Group 3 — Gameplay Interaction (Scenario 3)

### Acceptance Criteria
3.1 The drawer sees an interactive canvas where they can draw with mouse
3.2 The drawer can clear the canvas with a "Clear Canvas" button
3.3 The drawer sees the secret word displayed prominently on their screen
3.4 Guessers see a guess input form (disabled for the drawer)
3.5 Empty/whitespace-only guesses are rejected with inline error "Guess cannot be empty"
3.6 Guesses are compared case-insensitively (e.g., "Rocket" matches "rocket")
3.7 A correct guess scores 100 points for the guesser; incorrect guesses add 0
3.8 Guess history (all guesses: who guessed what) is synced to all players via polling
3.9 When a guesser guesses correctly, the round transitions to "finished" status
3.10 All players start with score 0

### Edge Cases
- Drawer submits a guess → guess input hidden or disabled
- Guesser submits empty guess → inline error, no API call
- Guesser submits "  rocket  " (whitespace-padded) → trimmed to "rocket", matched against "rocket", scored as correct
- Multiple correct guesses in same round → only first guesser scores 100 (round ends immediately)
- Guesses submitted after round is finished → rejected with 400 "Round is over"

---

## Feature Group 4 — Result, Restart & Final Validation (Scenario 4)

### Acceptance Criteria
4.1 When the round ends (correct guess or manual end), all players see the result screen
4.2 The result screen shows: the correct word, final scores for all players, and the full guess history
4.3 The host sees a "Restart Game" button on the result screen
4.4 Clicking "Restart Game" calls POST /rooms/:code/restart
4.5 The restart transitions the room to "lobby" status, preserves all participants, and clears all round state (drawerId, secretWord, guesses, scores)
4.6 After restart, all players see the lobby (auto-polling brings them there)

### Edge Cases
- Non-host tries to restart → 403 "Only the host can restart the game"
- Restart called on a room that is in "lobby" → 400 "Game has not started yet"
- Restart preserves participant list exactly (no players are removed)
- After restart, the scoreboard and guess history are fully cleared
