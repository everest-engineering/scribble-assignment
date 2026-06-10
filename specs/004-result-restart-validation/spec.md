# Feature Specification: Result, Restart, and Final Validation

**Feature Branch**: `004-result-restart-validation`

**Created**: 2026-06-10

**Status**: Draft

**Input**: User description: "Result, restart and final validation: add POST /rooms/:code/end that transitions room state to result, all polling clients detect the result state and navigate to a result screen showing the correct word, final scores for all players, and the full guess history, add POST /rooms/:code/restart that resets room state to lobby and clears secretWord, drawerName, and guesses while preserving the participants list and their names, all clients detect the lobby state on the next poll and navigate back to the lobby screen"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host Ends the Game (Priority: P1)

The host is on the Game screen. When the round is over, they click an "End Game" button
(visible only to the host). The system transitions the room to the result state. All
players — host, drawer, and guessers — are automatically navigated to the Result screen on
their next polling cycle (within 2 seconds).

**Why this priority**: Ending the game is the trigger that causes all other result-screen
behaviour. Without this action, no one can see the result screen.

**Independent Test**: In a two-tab session (host + guesser), the host clicks "End Game".
Within 2 seconds, both tabs show the Result screen. The guesser tab does not show the
"End Game" button.

**Acceptance Scenarios**:

1. **Given** a room is in playing state and the current player is the host, **When** the
   host triggers the end-game action, **Then** the room state transitions to "result".
1a. **Given** a room is in playing state, **When** a non-host player attempts to trigger
   end-game, **Then** the system rejects the action with an appropriate error.
2. **Given** the room is in result state, **When** any player's polling cycle completes,
   **Then** the player is navigated to the Result screen.
3. **Given** the room is in result state, **When** the Result screen is displayed, **Then**
   it shows the correct secret word, the final scores for all players, and the full ordered
   guess history.

---

### User Story 2 - All Players View the Result Screen (Priority: P2)

After the game ends, every player lands on the Result screen. They can see the word that
was being drawn, who guessed correctly (and for how many points), and the full list of
guesses in the order they were submitted.

**Why this priority**: The result screen is the payoff moment of the game — players need
to see the outcome before they can decide whether to play again.

**Independent Test**: With three tabs (drawer + two guessers), after ending the game,
every tab shows the correct word, each player's score, and the complete guess history in
submission order.

**Acceptance Scenarios**:

1. **Given** the room is in result state, **When** a player views the Result screen,
   **Then** the correct secret word is prominently displayed.
2. **Given** the room is in result state, **When** a player views the Result screen,
   **Then** the final score for every participant is shown (player name + points).
3. **Given** the room is in result state, **When** a player views the Result screen,
   **Then** the full guess history is displayed in the order guesses were submitted,
   including guesser name, guess text, and points awarded.
4. **Given** no guesses were submitted during the round, **When** a player views the Result
   screen, **Then** the guess history section shows an appropriate empty state message.

---

### User Story 3 - Host Restarts the Game (Priority: P3)

From the Result screen, the host (the first player to join the room) can trigger a restart.
The room resets to lobby state: the secret word, drawer name, and guess history are cleared,
but all participants remain in the room with their names intact. All players are automatically
navigated back to the Lobby screen on their next polling cycle.

**Why this priority**: Restart enables repeated play without everyone leaving and rejoining,
which is the core replayability mechanic.

**Independent Test**: After a completed round, the host clicks "Play Again". Within 2
seconds, all tabs return to the Lobby screen with the same player names and no game data
from the previous round. A non-host tab does not show the "Play Again" button.

**Acceptance Scenarios**:

1. **Given** the room is in result state and the current player is the host, **When** the
   host triggers the restart action, **Then** the room state transitions to "lobby".
1a. **Given** the room is in result state, **When** a non-host player attempts to trigger
   restart, **Then** the system rejects the action with an appropriate error.
2. **Given** the restart action is triggered, **When** the room resets, **Then** the secret
   word, drawer name, and all guesses are cleared from the room.
3. **Given** the restart action is triggered, **When** the room resets, **Then** the
   participants list and each player's name are preserved unchanged.
4. **Given** the room has returned to lobby state, **When** any player's polling cycle
   completes, **Then** the player is navigated back to the Lobby screen.
5. **Given** the room has returned to lobby state, **When** a player views the Lobby screen,
   **Then** all previously present participants are listed with their original names.

---

### User Story 4 - Full Round-Trip Validation (Priority: P4)

A complete game round can be played from lobby through drawing and guessing to the result
screen and back to the lobby, with all data consistent at every step. This validates the
end-to-end integration of all four features.

**Why this priority**: End-to-end validation confirms there are no regressions across the
previously implemented features when result and restart are added.

**Independent Test**: With two tabs, complete a full round: start game → draw → guess →
end game → verify result screen → restart → verify lobby with same players. All screens
show correct data throughout.

**Acceptance Scenarios**:

1. **Given** a full round has been played and the result screen is shown, **When** the
   correct word and scores are verified, **Then** they match exactly what occurred during
   the round.
2. **Given** the game is restarted from the result screen, **When** the new lobby is shown,
   **Then** player scores from the previous round are not carried over (scores reset).

---

### Edge Cases

- What happens if the end-game action is called when the room is not in playing state? →
  The request is rejected with an appropriate error (e.g., room not in the required state).
- What happens if the restart action is called when the room is not in result state? →
  The request is rejected with an appropriate error.
- What happens if the room code does not exist for either endpoint? → Rejected with a
  "room not found" error.
- What happens if a player joins mid-round and polls after end-game has been triggered? →
  They see result state and are navigated to the Result screen on their next polling cycle.
- What happens to scores after a restart? → Scores reset to zero for all participants;
  they are not carried across rounds.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose a POST `/rooms/:code/end` endpoint that transitions a
  room from "playing" state to "result" state; only the host may trigger this action.
- **FR-001a**: The end-game endpoint MUST accept a `playerName` field in the request body
  and reject requests where `playerName` does not match the room's host (the first
  participant), returning an appropriate error.
- **FR-002**: The end-game endpoint MUST reject requests when the room is not in "playing"
  state, returning an appropriate error.
- **FR-003**: The end-game endpoint MUST reject requests for a non-existent room code.
- **FR-004**: All clients polling the room MUST detect the "result" state and navigate to
  the Result screen without requiring any manual user action.
- **FR-005**: The Result screen MUST display the secret word that was used in the round.
- **FR-006**: The Result screen MUST display the final score for every participant (player
  name paired with their points total).
- **FR-007**: The Result screen MUST display the full guess history in submission order,
  including for each guess: the guesser's name, the guess text, and the points awarded.
- **FR-008**: The system MUST expose a POST `/rooms/:code/restart` endpoint that transitions
  a room from "result" state to "lobby" state; only the host may trigger this action.
- **FR-008a**: The restart endpoint MUST accept a `playerName` field in the request body
  and reject requests where `playerName` does not match the room's host (the first
  participant), returning an appropriate error.
- **FR-009**: The restart endpoint MUST clear the secret word, drawer name, guess history,
  and player scores from the room when transitioning to lobby.
- **FR-010**: The restart endpoint MUST preserve the participants list and each player's
  name when transitioning to lobby.
- **FR-011**: The restart endpoint MUST reject requests when the room is not in "result"
  state, returning an appropriate error.
- **FR-012**: The restart endpoint MUST reject requests for a non-existent room code.
- **FR-013**: All clients polling the room MUST detect the "lobby" state (following a
  restart) and navigate back to the Lobby screen without requiring any manual user action.
- **FR-014**: The Lobby screen shown after a restart MUST display all participants who were
  present before the restart, with their original names.

### Key Entities

- **Room**: Extended with "result" as a valid state value. In result state it retains
  `secretWord`, `drawerName`, `guesses`, and `scores` for display. On restart, those fields
  are cleared and state reverts to "lobby". The host is always the first entry in the
  room's participants list and does not change during the room's lifetime.
- **Host**: The player who created the room (first to join). Identified by matching
  `playerName` against the first participant. Controls end-game and restart actions.
- **Result Screen**: A new client view rendered when room state is "result". Displays
  secret word, per-player scores, and ordered guess history.
- **Restart Action**: The action (triggered from the Result screen) that calls the restart
  endpoint and causes the room to return to lobby state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of clients detect the "result" state and display the Result screen
  within one 2-second polling cycle after the end-game action is triggered.
- **SC-002**: The Result screen shows the correct word, all player scores, and the complete
  guess history for every completed round, with zero data omissions.
- **SC-003**: 100% of clients detect the "lobby" state and return to the Lobby screen
  within one 2-second polling cycle after the restart action is triggered.
- **SC-004**: After a restart, 100% of participant names are preserved and visible on the
  Lobby screen; no game data (word, guesses, scores) from the previous round is visible.
- **SC-005**: End-game and restart endpoints each reject invalid-state and unknown-room
  requests 100% of the time with a clear error; no state corruption occurs on invalid calls.

## Assumptions

- Only the host (the first player to join the room) can trigger the end-game action; the
  "End Game" button is shown exclusively on the host's Game screen view.
- Only the host (the first player to join the room) can trigger the restart action; the
  "Play Again" button is shown exclusively on the host's Result screen view.
- Player scores reset to zero on restart; cumulative scoring across rounds is out of scope.
- The Result screen is a new, dedicated client view distinct from the Game and Lobby screens.
- Navigation from the Result screen back to the Lobby (after restart) uses the same
  polling-based state detection already established for lobby-to-game and game transitions.
- The "result" state is added to the existing room state machine alongside "lobby" and
  "playing"; no other states are introduced.
- All existing polling clients already poll GET `/rooms/:code` every 2 seconds; they only
  need to handle the new "result" state branch to navigate to the Result screen.
- The full guess history and scores required for the Result screen are already present in
  the room object from the gameplay-interaction feature (FR-011 of spec 003).

## Clarifications

### Session 2026-06-10

- Q: Who can trigger the end-game action? → A: Host only — only the host (first player to join) sees and can use the "End Game" button.
- Q: Who can trigger the restart action? → A: Host only — only the host sees and can use the "Play Again" button.
- Q: How does the server identify the host caller for end/restart? → A: Player name in request body — caller sends `playerName`; server validates it matches the first participant in the room.
