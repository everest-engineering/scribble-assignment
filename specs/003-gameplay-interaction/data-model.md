# Data Model: Gameplay Interaction

## Key Entities

### Participant
A player connected to the room session.
- `id` (string): Unique identifier.
- `name` (string): Sanitized player name.
- `joinedAt` (string): ISO timestamp when the player joined.
- `score` (number): Cumulative points earned during the session.
  - **Initialization**: Starts at `0` when a player joins the room.

### GuessEntry
A guess submitted by a participant during the round.
- `id` (string): Unique identifier for the guess.
- `participantId` (string): The ID of the guesser.
- `playerName` (string): Display name of the guesser (captured at submission).
- `guessText` (string): The trimmed guess text.
- `isCorrect` (boolean): Whether the guess matched the secret word.
- `createdAt` (string): ISO timestamp when the guess was submitted.

### Room
The active in-memory game state on the backend.
- `code` (string): Unique 4-character room identifier.
- `status` (string): `"lobby"` or `"in-game"`.
- `hostParticipantId` (string): Host participant ID.
- `participants` (array of `Participant`): List of joined players.
- `createdAt` (string): ISO timestamp.
- `updatedAt` (string): ISO timestamp.
- `roundState` (optional `RoundState`): Active round details (drawer, secret word).
- `guessHistory` (array of `GuessEntry`): Chronological list of all guesses submitted.
  - **Initialization**: Starts as an empty array `[]` when the room is created.

### RoomSnapshot
The state payload returned to the client (filtered based on the viewer).
- `code` (string): Room code.
- `status` (string): `"lobby"` or `"in-game"`.
- `hostParticipantId` (string): Host ID.
- `participants` (array of `Participant`): List of players and their scores.
- `availableWords` (array of string): Standard list of words.
- `roles` (array of string): List of assigned roles.
- `roundState` (optional `RoundState`): Filtered round state (secret word is omitted for guessers).
- `guessHistory` (array of `GuessEntry`): Chronological list of all guesses submitted in submission order.

## State Transitions & Validation Rules

1. **State Validation**:
   - Guesses are accepted only when the room status is `"in-game"`.
   - If a guess is submitted while the room is in the `"lobby"` state:
     - The backend MUST reject the request with error code `GAME_NOT_STARTED`.
     - No `GuessEntry` record is created.
     - No player score is affected.

2. **Drawer Guess Restriction**:
   - The participant whose ID matches `roundState.drawerId` is the drawer and MUST NOT be permitted to submit guesses.
   - If a guess is submitted by the drawer:
     - The backend MUST reject the request with error code `DRAWER_CANNOT_GUESS`.
     - No `GuessEntry` record is created.
     - No player score is affected.

3. **Score Update Rule**:
   - Match condition: `guessText.trim().toLowerCase() === secretWord.toLowerCase()`.
   - If correct:
     - Check if there is already a `GuessEntry` in `guessHistory` for the same `participantId` where `isCorrect === true`.
     - If yes (already guessed correctly this round): do not increment score (award `0` additional points).
     - If no (first correct guess): increment the participant's `score` by `100` points.
   - If incorrect: do not increment score (award `0` points).

4. **Order Preservation**:
   - Every accepted guess entry is appended to `room.guessHistory` at submission time, ensuring it is stored and returned in exact chronological submission order.

5. **Scoreboard Display Order**:
   - The scoreboard is a derived view displaying all participants sorted by their `score` in descending order.
