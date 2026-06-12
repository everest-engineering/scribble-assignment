# Data Model: Round Results and Game Restart

## Entities

### Room (updated)

Represents an isolated game session.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `code` | `string` | 4 chars, uppercase alphanumeric, unique | Shareable room identifier |
| `status` | `RoomStatus` | `"lobby" \| "playing" \| "results"` | Current phase of the session |
| `participants` | `Participant[]` | ordered by `joinedAt` | Players currently in the room |
| `hostParticipantId` | `string` | must match a participant `id` | Reference to the current host |
| `drawerId` | `string \| null` | must match a participant `id` when set | Current drawer (null in lobby) |
| `currentWord` | `string \| null` | non-empty when set | Secret word for the active round (null in lobby) |
| `scores` | `Map<string, number>` | keys are participant IDs; values default to 0 | Per-player score for the current round |
| `guessHistory` | `GuessEntry[]` | ordered by `submittedAt` | Chronological list of all guesses submitted |
| `canvasStrokes` | `Stroke[]` | ordered by draw time, max 500 total | Current drawing strokes on the canvas |
| `createdAt` | `ISO string` | — | Room creation timestamp |
| `updatedAt` | `ISO string` | — | Last mutation timestamp |

### Participant (unchanged)

Represents a player inside a room.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `string` | UUID v4, opaque | Unique player session identifier |
| `name` | `string` | non-empty after trim | Display name (stored trimmed) |
| `joinedAt` | `ISO string` | — | When the participant entered the room |
| `score` | `number` | integer, defaults to 0 | Current round score (derived from `room.scores`) |

### GuessEntry (unchanged)

Represents a single submitted guess.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `participantId` | `string` | must match a participant `id` | Who submitted the guess |
| `guess` | `string` | non-empty after trim, max 100 chars | The trimmed guess text |
| `isCorrect` | `boolean` | — | Whether the guess matched the secret word |
| `submittedAt` | `ISO string` | — | When the guess was received |

### Stroke (unchanged)

Represents a single freehand stroke on the canvas.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `points` | `Point[]` | at least 2 points, max 500 | Ordered points forming the stroke line |
| `color` | `string` | CSS color string | Stroke color (default: `"#000000"`) |
| `width` | `number` | positive integer | Stroke width in logical units (default: `4`) |

### RoomSnapshot (updated)

Public view of a room returned to clients.

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` | Room code |
| `status` | `RoomStatus` | Current status (now includes `"results"`) |
| `participants` | `Participant[]` | Visible player list (includes `score`) |
| `hostId` | `string` | ID of the current host |
| `drawerId` | `string \| null` | ID of the current drawer (null in lobby) |
| `currentWord` | `string \| null` | Secret word if viewer is drawer **OR** if `status === "results"`; otherwise `null` |
| `availableWords` | `string[]` | Fixed word list for the game |
| `scores` | `Record<string, number>` | Map of participant ID to current score |
| `guessHistory` | `GuessEntry[]` | All guesses submitted in this round |
| `canvasStrokes` | `Stroke[]` | Current canvas drawing state |

## Relationships

- One **Room** contains many **Participant** (1:N).
- A **Room** maintains one ordered list of **GuessEntry** (1:N).
- A **Room** maintains one ordered list of **Stroke** (1:N).
- A **GuessEntry** belongs to exactly one **Participant**.

## Validation Rules

1. `currentWord` is visible to all viewers when `room.status === "results"`; otherwise only the drawer sees it.
2. New player joins are rejected when `room.status === "results"` (same restriction as `"playing"`).
3. Guess submissions are rejected when `room.status !== "playing"`.
4. Only the host may trigger `endRound` or `restartGame`; otherwise rejected with `403`.
5. `endRound` is only accepted when `room.status === "playing"`; otherwise rejected with `409`.
6. `restartGame` is only accepted when `room.status === "results"`; otherwise rejected with `409`.
7. On restart, `scores`, `guessHistory`, `canvasStrokes`, `drawerId`, and `currentWord` are all cleared; `participants` and `hostParticipantId` are preserved.

## State Transitions

```
lobby ──[host starts, >=2 players]──> playing
playing ──[first correct guess]──> results
playing ──[host manually ends]──> results
playing ──[drawer leaves]──> lobby
playing ──[host leaves]──> lobby
results ──[host restarts]──> lobby
```

- **lobby**: `scores` empty, `guessHistory` empty, `canvasStrokes` empty, `drawerId` null, `currentWord` null.
- **playing**: `scores` initialized to 0, `guessHistory` and `canvasStrokes` accumulate.
- **results**: Round state is preserved (`scores`, `guessHistory`, `canvasStrokes`, `currentWord`, `drawerId`) so it can be displayed. No new guesses accepted.
- **lobby (after restart)**: All round state cleared; players and host preserved.

## Lifecycle

- **Creation**: `POST /rooms` → room created with empty round state.
- **Join**: `POST /rooms/:code/join` → rejected if `status !== "lobby"`.
- **Start**: `POST /rooms/:code/start` → `status = "playing"`.
- **End Round**: `POST /rooms/:code/end` → `status = "results"`.
- **Restart**: `POST /rooms/:code/restart` → `status = "lobby"`; round state cleared.
- **Cleanup**: Room deleted when `participants.length === 0`. Idle `lobby` rooms cleaned up after 10 minutes. `results` rooms also eligible for 10-minute idle cleanup.
