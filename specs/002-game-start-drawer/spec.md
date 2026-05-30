# Feature Specification: Game Start & Drawer Flow

This feature specification details the requirements, validation rules, edge cases, and acceptance criteria for starting a game round and managing the drawer role assignment in Scribble.

## 1. Description and Goal
The goal of this feature is to allow the host to transition the room from the lobby to an active game state. When the game begins, the system must assign roles to all participants: one player becomes the drawer, while all other players become guessers. Additionally, a secret word must be chosen deterministically from the starter word list, and its visibility must be restricted strictly to the drawer.

## 2. Detailed Requirements

### 2.1 Game Start Preconditions
* Only the room host can initiate the game start.
* The "Start Game" action must be blocked unless there are at least 2 participants in the lobby.
* Attempting to start the game as a non-host player must be rejected by the backend.

### 2.2 Player Name Validation
* All player usernames must be trimmed.
* Empty usernames or names containing only whitespace characters must be rejected during the lobby phase.
* The system must strip leading and trailing spaces from the inputs before saving.

### 2.3 Drawer Assignment
* When the room transitions from `"lobby"` to `"game"`, the host (who is usually the first player in the room list) is assigned as the drawer (`drawerId` is set to their participant ID).
* All other players in the room are classified as guessers.
* The drawer's identity must be visible to all participants in the game (e.g., highlighted in the player sidebar scoreboard).

### 2.4 Secret Word Selection and Visibility Rules
* The secret word for the round must be selected deterministically from the predefined list of starter words: `rocket`, `pizza`, `castle`, `guitar`, `sunflower`.
* The secret word must be delivered *only* to the drawer.
* The backend must strip the secret word from the room snapshot sent to any participant who is not the current drawer (setting it to `null` or hiding it in the JSON response). Guessers must not receive the word in the API response.

## 3. Edge Cases and Custom Scenarios
* **Player Disconnection during Start**: If a player disconnects before the game starts, the participant list updates. If the host leaves, another player must be promoted to host.
* **Insufficient Players**: If the player count drops below 2 while in the lobby, the host's start capability is disabled.

## 4. Acceptance Criteria
* **AC 1**: Only the host can start the game. Start action is disabled with < 2 players.
* **AC 2**: Starting the game changes the room status to `"game"`.
* **AC 3**: The host is designated as the drawer, and other players are designated as guessers.
* **AC 4**: The secret word is selected deterministically from the list.
* **AC 5**: The secret word is visible *only* to the drawer and is filtered out of the API response for guessers.
