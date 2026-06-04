# Data Model

## Room

- `code`: 4-character room code.
- `status`: `lobby` or `game`.
- `hostParticipantId`: participant who created the room.
- `currentDrawerId`: participant currently allowed to draw.
- `currentWord`: secret word, visible only to the drawer in snapshots.
- `participants`: ordered list of participants.
- `drawing`: ordered list of strokes for the active round.
- `guessHistory`: ordered list of server-accepted guess entries.
- `createdAt`, `updatedAt`: timestamps for lifecycle tracking.

### Rules

- A new room starts with empty `drawing` and `guessHistory`.
- When the drawer clears the canvas, `drawing` resets to an empty list.
- Room snapshots returned through polling must include the current drawing, guess history, and participant scores.

## Participant

- `id`: stable participant identifier.
- `name`: trimmed display name.
- `joinedAt`: timestamp.
- `role`: `drawer` or `guesser`.
- `score`: numeric score, starts at `0`.
- `hasGuessedCorrectly`: boolean flag used to reject repeat guesses after a correct attempt.

### Rules

- Everyone starts with score `0`.
- A correct guess adds `100` points exactly once.
- Participants with `hasGuessedCorrectly = true` cannot submit another guess.

## Stroke

- `points`: ordered list of `{ x, y }` coordinates.
- `color`: optional style metadata.
- `lineWidth`: optional style metadata.

### Rules

- Strokes are appended in order.
- Guessers render the same stroke list onto their local canvas.

## GuessEntry

- `participantId`: participant who submitted the guess.
- `participantName`: display name at submission time.
- `guess`: trimmed submitted word.
- `isCorrect`: boolean.

### Rules

- Only server-accepted guesses are appended.
- Rejected, duplicate, drawer, and empty submissions are not recorded.
- Correct guesses are stored in plaintext so every player sees the same feed.

## RoomSnapshot

- Derived view returned by polling.
- Includes room identity, participants, drawing, guess history, and scores.
- Includes `currentWord` only for the drawer.

## State Transitions

- `lobby` -> `game` when the host starts the round and there are at least two players.
- `drawing`: append stroke or reset to empty on clear.
- `guessHistory`: append valid guess entries only.
- `participant.score`: increment on correct guess only.
