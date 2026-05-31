# Feature Specification: Result, Restart & Final Validation

This feature specification details the requirements, validation rules, edge cases, and acceptance criteria for showing game results and managing the restart lifecycle back to the lobby.

## 1. Description and Goal
The goal of this feature is to manage the post-game experience. Once a player guesses the correct word, the game transitions to a shared result state. This screen must show the correct secret word, final player standings, and the guess log. The host must then be able to restart the game, sending all players back to the lobby while resetting round state but keeping the participant list intact.

## 2. Detailed Requirements

### 2.1 Shared Result View
* When the game transitions to `"result"`, all players must see the post-game results screen.
* The screen must display:
  * The correct secret word (revealed to all players, including guessers who failed to guess it).
  * The final scoreboard containing the names and scores of all participants.
  * The complete list of guesses submitted during the round.

### 2.2 Game Restart Lifecycle
* Only the room host is permitted to restart the game. The restart control is hidden or disabled for non-host players.
* Initiating the restart triggers a transition back to the `"lobby"` phase.
* **State Reset**: Upon restart, the following room values must be cleared or reset:
  * Reset participant scores to `0`.
  * Clear drawing coordinate data (`drawingData = ""`).
  * Empty the list of guesses.
  * Clear current drawer and word properties (`drawerId = null`, `secretWord = null`).
* **Participant Preservation**: The current list of participants must be preserved. Players do not have to re-enter their names or reconnect.

## 3. Edge Cases
* **Host Leaving**: If the host player leaves during the result page, the server must select a new host from the remaining participants to ensure the room can be restarted.
* **Late Joining**: New players cannot join a room that is currently in the result state. They must wait for the game to restart to the lobby.

## 4. Acceptance Criteria
* **AC 1**: All players transition to the result state when a correct guess is processed.
* **AC 2**: The result screen reveals the secret word and shows scores and guesses.
* **AC 3**: Only the host can trigger a restart.
* **AC 4**: Restarting returns all players to the lobby with their names preserved.
* **AC 5**: All game state (scores, drawings, guesses, roles, secret word) is cleared on restart.
