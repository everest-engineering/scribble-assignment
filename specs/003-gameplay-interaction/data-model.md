# Data Model: Gameplay Interaction

## Entity: Room

Represents an isolated in-memory game room.

### Fields Added or Extended

- `scores`: Record keyed by participant ID with numeric score values.
- `currentRound`: Extended active-round object containing drawing and guessing state.
- `updatedAt`: Updated whenever drawing, clearing, accepted guessing, or scoring changes room state.

### Validation Rules

- Room code must remain a normalized 4-character room code.
- Gameplay mutations require the room to exist and have `status` set to `playing`.
- State changes must only affect the addressed room.

## Entity: CurrentRound

Represents the one active round created by the existing game-start flow.

### Fields

- `roundNumber`: Number, remains `1` for this feature.
- `drawerParticipantId`: Participant ID for the assigned drawer.
- `secretWord`: Backend-only answer used for guess comparison and drawer-only visibility.
- `startedAt`: ISO timestamp when the round started.
- `canvas`: Canvas state for the current drawing.
- `guesses`: Ordered guess history for accepted non-empty guesses.
- `correctGuessParticipantIds`: Participant IDs that have already received the correct-guess award this round.

### Validation Rules

- Drawer ID must match an existing room participant before drawer actions are accepted.
- Secret word must never be included in guesser snapshots.
- Correct-guess award can be applied only once per guesser in this active round.

## Entity: CanvasState

Represents drawer-created visual content for a room.

### Fields

- `strokes`: Ordered array of `DrawingStroke` objects.
- `updatedAt`: ISO timestamp of the latest drawing or clear action.

### Validation Rules

- Only the active round drawer can change canvas state.
- Clearing the canvas replaces `strokes` with an empty array.
- Stroke payloads must be bounded and contain at least two valid points.
- Coordinates should be normalized to the current canvas dimensions so clients can redraw consistently.

## Entity: DrawingStroke

Represents one continuous drawing gesture.

### Fields

- `id`: Generated stroke ID for stable rendering.
- `color`: Supported drawing color; default can remain a single dark color for this feature.
- `size`: Brush size in pixels.
- `points`: Ordered array of normalized `DrawingPoint` values.

### Validation Rules

- `points` must contain finite numeric `x` and `y` values.
- `x` and `y` must be within the normalized canvas bounds.
- Brush size must be within a small supported range.
- Stroke arrays and point arrays must have practical upper bounds to protect in-memory state.

## Entity: DrawingPoint

Represents a single point in a stroke path.

### Fields

- `x`: Normalized horizontal coordinate.
- `y`: Normalized vertical coordinate.

## Entity: Guess

Represents one accepted non-empty guess submission.

### Fields

- `id`: Generated guess ID.
- `participantId`: Guessing participant ID.
- `participantName`: Display name captured at submission time.
- `text`: Trimmed guess text displayed in history.
- `isCorrect`: Whether the trimmed guess matches the secret word case-insensitively.
- `pointsAwarded`: `100` for first correct guess by that guesser, otherwise `0`.
- `createdAt`: ISO timestamp when accepted.

### Validation Rules

- Only guessers can submit guesses.
- Guess text is trimmed before validation.
- Empty trimmed guesses are rejected and not recorded.
- Comparison uses lowercase forms of the trimmed guess and secret word.
- Incorrect guesses award `0`.

## Entity: ScoreEntry

Represents a participant score in a room snapshot.

### Fields

- `participantId`: Participant ID.
- `participantName`: Current participant display name.
- `score`: Numeric score.

### Validation Rules

- All participants start at `0` when the active round starts.
- Correct first guess by a guesser adds exactly `100`.
- Repeated correct guesses by the same guesser do not add more points.

## Snapshot Changes

`RoomSnapshot` should include:

- `currentRound.canvas` for all players.
- `currentRound.guesses` for all players.
- `scores` for all players.
- Existing drawer identity and role fields.
- Existing drawer-only `secretWord` behavior.

## State Transitions

1. `lobby` -> `playing`: Existing start flow initializes scores, blank canvas, empty guesses, and empty correct-guesser tracking.
2. Drawer draw: Valid drawer appends a stroke to the active round canvas and updates room timestamp.
3. Drawer clear: Valid drawer replaces canvas strokes with an empty array and updates room timestamp.
4. Guesser submits empty guess: No state change; return validation error.
5. Guesser submits incorrect guess: Append guess with `isCorrect: false`, `pointsAwarded: 0`; scores unchanged.
6. Guesser submits first correct guess: Append guess with `isCorrect: true`, `pointsAwarded: 100`; increment guesser score by `100`; track participant as awarded.
7. Guesser repeats correct guess: Append or reject consistently as an accepted duplicate with `pointsAwarded: 0`; score remains unchanged.
