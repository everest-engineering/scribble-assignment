# Data Model

## Room

- `code`: 4-character room code.
- `status`: `lobby`, `game`, or `result`.
- `hostParticipantId`: participant who created the room.
- `currentDrawerId`: participant currently assigned to draw during the active round.
- `currentWord`: secret word for the round.
- `participants`: ordered list of participants.
- `drawing`: ordered list of strokes for the active round.
- `guessHistory`: ordered list of server-accepted guess entries.
- `createdAt`, `updatedAt`: lifecycle timestamps.

### Rules

- A room starts in `lobby` with empty `drawing` and `guessHistory`.
- When the first correct guess is accepted, the room transitions from `game` to `result`.
- While in `result`, the final word, final scores, and guess history remain visible to every viewer.
- Restart returns the room to `lobby`, keeps the existing participants, and clears round-specific state.

## Participant

- `id`: stable participant identifier.
- `name`: trimmed display name.
- `joinedAt`: timestamp.
- `role`: `drawer` or `guesser`.
- `score`: numeric score, starts at `0`.
- `hasGuessedCorrectly`: boolean flag used to reject repeat guesses after a correct attempt.

### Rules

- Participants remain in the room across restart.
- Scores reset to `0` on restart.
- `hasGuessedCorrectly` resets to `false` on restart.

## GuessEntry

- `participantId`: participant who submitted the guess.
- `participantName`: display name at submission time.
- `guess`: trimmed submitted word.
- `isCorrect`: boolean.

### Rules

- Only server-accepted guesses are appended.
- The guess history remains permanent for the round until restart.
- On restart, the full round guess history is cleared.

## RoundResult

- `secretWord`: the final revealed word.
- `guessHistory`: ordered list of accepted guesses for the completed round.
- `finalScores`: per-participant score view at round end.
- `isVisibleToAll`: always `true` during the result state.

### Rules

- The result view is derived from room state, not stored separately as a database record.
- The same result snapshot is returned to reconnecting players and existing players alike.

## State Transitions

- `lobby -> game` when the host starts the round and there are at least two players.
- `game -> result` when a correct guess ends the round.
- `result -> lobby` when the host restarts the room.
- On restart, drawing, guess history, current word, current drawer, and score state are reset together.
