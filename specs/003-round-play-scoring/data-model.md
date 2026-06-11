# Data Model: Round Play and Scoring

## Room

Represents one isolated drawing game room.

### Fields

- `code: string`
  - Unique normalized room code.
- `status: "lobby" | "playing"`
  - `playing` means active-round gameplay is available.
- `participants: Participant[]`
  - Stable list of room participants.
- `currentRound: ActiveRound | null`
  - Active round state after the game starts.
- `createdAt: string`
- `updatedAt: string`

### Validation Rules

- New participants cannot be added while `status` is `playing` and
  `currentRound` is active.
- Canvas state, guess history, and scores belong only to this room.

## Participant

Represents a player in the room.

### Fields

- `id: string`
- `name: string`
- `joinedAt: string`

### Validation Rules

- Participant ids used in draw, clear, and guess commands must reference a
  participant in the same room.

## Active Round

Represents the current playable drawing round.

### Fields

- `number: number`
  - Current round number.
- `drawerParticipantId: string`
  - Participant assigned to draw.
- `secretWord: string`
  - Word used to evaluate guesses.
- `rosterParticipantIds: string[]`
  - Fixed participant ids eligible for the active round.
- `canvas: CanvasState`
  - Current drawing state.
- `scores: PlayerScore[]`
  - One score record per roster participant.
- `guessHistory: Guess[]`
  - Ordered valid guesses.
- `correctGuessParticipantIds: string[]`
  - Participants who already earned the one-time correct-guess award.
- `startedAt: string`

### Validation Rules

- `drawerParticipantId` must be in `rosterParticipantIds`.
- Every roster participant must have exactly one `PlayerScore`.
- Scores initialize to `0` when round play begins.
- New players are not added to `rosterParticipantIds` after the round begins.

## Canvas State

Represents the current drawable state for the active round.

### Fields

- `marks: DrawingMark[]`
  - Ordered freehand drawing marks.
- `clearedAt?: string`
  - Timestamp of the most recent clear action, if any.

### Validation Rules

- Only the assigned drawer can add marks.
- Only the assigned drawer can clear the canvas.
- Clearing sets `marks` to an empty list and leaves scores and guess history
  unchanged.

## Drawing Mark

Represents one completed freehand drawing mark.

### Fields

- `id: string`
  - Unique mark identifier.
- `drawerParticipantId: string`
- `points: DrawingPoint[]`
  - Ordered points in the freehand mark.
- `color: string`
  - Selected drawing color.
- `strokeSize: number`
  - Selected stroke width.
- `createdAt: string`

### Validation Rules

- `points` must contain at least one point.
- `color` must be a supported color value.
- `strokeSize` must be within the supported drawing-control range.

## Drawing Point

Represents one coordinate in a freehand drawing mark.

### Fields

- `x: number`
- `y: number`

### Validation Rules

- Coordinates must be finite numbers.

## Player Score

Represents one participant's active-round score.

### Fields

- `participantId: string`
- `name: string`
- `score: number`

### Validation Rules

- Scores initialize to `0`.
- Incorrect guesses do not change scores.
- A first correct guess by a guesser adds exactly `100`.
- Later correct guesses by the same guesser do not add more points.

## Guess

Represents one valid submitted guess.

### Fields

- `id: string`
- `participantId: string`
- `participantName: string`
- `text: string`
  - Trimmed submitted guess.
- `isCorrect: boolean`
- `pointsAwarded: number`
  - `100` for a first correct guess; otherwise `0`.
- `submittedAt: string`

### Validation Rules

- Only guessers can submit guesses.
- Guess text is trimmed before validation, comparison, and display.
- Empty or whitespace-only guesses are rejected and not stored.
- Correctness is determined by case-insensitive comparison with the secret word.

## Room Snapshot

Represents the current room state sent to clients through polling.

### Fields

- `code: string`
- `status: "lobby" | "playing"`
- `participants: ParticipantSnapshot[]`
- `currentRound: ActiveRoundSnapshot | null`

### Validation Rules

- Snapshot data remains isolated to the requested room.
- Current canvas state, scores, and guess history are included for active rounds.
- Existing viewer-specific secret-word behavior from the round-start feature is
  preserved.

## Active Round Snapshot

Represents active-round state sent to clients.

### Fields

- `number: number`
- `drawerParticipantId: string`
- `canvas: CanvasState`
- `scores: PlayerScore[]`
- `guessHistory: Guess[]`
- `secretWord?: string`

### Validation Rules

- `secretWord` remains visible only to the assigned drawer.
- Non-drawers receive canvas state, scores, and guess history without receiving
  the secret word.

## Command Responses

Represents responses after draw, clear, or guess commands.

### Fields

- `room: RoomSnapshot`
  - Updated room snapshot from the command caller's perspective.
- `message?: string`
  - Optional clear feedback for accepted or rejected actions.

## Error States

- Late join attempt: clear "round already active" feedback.
- Non-drawer draw or clear attempt: clear "only the drawer can draw" feedback.
- Drawer guess attempt: clear "drawer cannot guess" feedback.
- Empty guess: clear "guess is required" feedback.
- Unknown participant: clear "participant not found" feedback.
