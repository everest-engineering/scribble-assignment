# Data Model: Scribble Game Completion

## Room

Represents one in-memory game room.

Fields:

- `code`: unique four-character room code
- `status`: `lobby`, `active`, or `result`
- `hostParticipantId`: participant id of the room creator
- `participants`: ordered participant list
- `round`: current round state or `null`
- `createdAt`: ISO timestamp
- `updatedAt`: ISO timestamp

Validation and rules:

- `code` is unique among active in-memory rooms.
- Room state is isolated by `code`.
- A room can start only from `lobby`.
- A room can restart only from `result`.

## Participant

Represents a player in a room.

Fields:

- `id`: unique participant id
- `name`: trimmed display name
- `joinedAt`: ISO timestamp

Validation and rules:

- `name` must be non-empty after trimming.
- Host status is derived from `Room.hostParticipantId`.
- Drawer role is derived from `Round.drawerParticipantId`.

## Round

Represents the single active or completed game round.

Fields:

- `drawerParticipantId`: participant id of the drawer
- `secretWord`: deterministic starter word
- `drawing`: drawing state
- `guesses`: ordered guess history
- `scores`: participant id to score map
- `startedAt`: ISO timestamp
- `endedAt`: ISO timestamp or `null`

Validation and rules:

- Scores initialize to `0` for every participant when the game starts.
- Secret word is visible only in snapshots viewed by the drawer or in result
  state.
- Correct guess sets `endedAt` and moves room status to `result`.
- Restart clears the entire round object.

## Drawing

Represents shared canvas state.

Fields:

- `strokes`: ordered list of strokes

Stroke fields:

- `id`: stroke id
- `points`: ordered list of `{ x, y }` coordinates

Validation and rules:

- Only the drawer can update or clear drawing during `active` state.
- Clear replaces drawing with an empty stroke list.

## Guess

Represents one guess attempt.

Fields:

- `id`: guess id
- `participantId`: guessing participant id
- `participantName`: display name at guess time
- `text`: trimmed submitted guess text
- `isCorrect`: boolean
- `scoreDelta`: `100` for correct, `0` for incorrect
- `createdAt`: ISO timestamp

Validation and rules:

- Guess text must be non-empty after trimming.
- Drawer cannot submit guesses.
- Guesses are accepted only during `active` state.
- Comparison with `secretWord` is case-insensitive.

## Room Snapshot

Viewer-specific state returned to the frontend.

Fields:

- room code and status
- participants with host/drawer indicators
- viewer role
- polling-visible drawing state
- guess history
- scores
- `secretWord` only when viewer is drawer or room is in result state
- result state when available

