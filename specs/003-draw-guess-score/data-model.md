# Data Model: Round Drawing, Guessing, and Scoring

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

### Participant (updated)

Represents a player inside a room.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `string` | UUID v4, opaque | Unique player session identifier |
| `name` | `string` | non-empty after trim | Display name (stored trimmed) |
| `joinedAt` | `ISO string` | — | When the participant entered the room |
| `score` | `number` | integer, defaults to 0 | Current round score (derived from `room.scores` for convenience) |

### GuessEntry (new)

Represents a single submitted guess.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `participantId` | `string` | must match a participant `id` | Who submitted the guess |
| `guess` | `string` | non-empty after trim, max 100 chars | The trimmed guess text |
| `isCorrect` | `boolean` | — | Whether the guess matched the secret word |
| `submittedAt` | `ISO string` | — | When the guess was received |

### Stroke (new)

Represents a single freehand stroke on the canvas.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `points` | `Point[]` | at least 2 points, max 500 | Ordered points forming the stroke line |
| `color` | `string` | CSS color string | Stroke color (default: `"#000000"`) |
| `width` | `number` | positive integer | Stroke width in logical units (default: `4`) |

### Point (new)

A single coordinate in logical canvas space.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `x` | `number` | `0 <= x <= 1000` | Horizontal position in logical units |
| `y` | `number` | `0 <= y <= 1000` | Vertical position in logical units |

### RoomSnapshot (updated)

Public view of a room returned to clients.

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` | Room code |
| `status` | `RoomStatus` | Current status |
| `participants` | `Participant[]` | Visible player list (includes `score`) |
| `hostId` | `string` | ID of the current host |
| `drawerId` | `string \| null` | ID of the current drawer (null in lobby) |
| `currentWord` | `string \| null` | Secret word if viewer is drawer; otherwise `null` |
| `availableWords` | `string[]` | Fixed word list for the game |
| `scores` | `Record<string, number>` | Map of participant ID to current score |
| `guessHistory` | `GuessEntry[]` | All guesses submitted in this round |
| `canvasStrokes` | `Stroke[]` | Current canvas drawing state |

## Relationships

- One **Room** contains many **Participant** (1:N).
- A **Room** maintains one ordered list of **GuessEntry** (1:N).
- A **Room** maintains one ordered list of **Stroke** (1:N).
- A **GuessEntry** belongs to exactly one **Participant**.
- A **Stroke** belongs to exactly one **Room**.

## Validation Rules

1. `guess` text must be non-empty after trimming; otherwise rejected with `400` and clear message.
2. Only participants whose `id` does NOT match `room.drawerId` may submit guesses; otherwise rejected with `403`.
3. Guesses are only accepted when `room.status === "playing"` and `room.currentWord !== null`; otherwise rejected with `409`.
4. Correctness is determined by `guess.toLowerCase() === currentWord.toLowerCase()`.
5. A participant receives 100 points for their first correct guess only; subsequent correct guesses award 0.
6. Canvas strokes are only accepted from the participant matching `room.drawerId`; otherwise rejected with `403`.
7. Canvas clear is only accepted from the drawer; otherwise rejected with `403`.
8. `canvasStrokes` is only mutable when `room.status === "playing"`.

## State Transitions

```
lobby ──[host starts, >=2 players]──> playing
playing ──[first correct guess]──> results
playing ──[drawer leaves]──> lobby
playing ──[host leaves (also drawer)]──> lobby
```

- **lobby**: `scores` is empty, `guessHistory` is empty, `canvasStrokes` is empty.
- **playing**: `scores` initialized to 0 for all participants, `guessHistory` and `canvasStrokes` accumulate.
- **lobby (after reset)**: All round state (`scores`, `guessHistory`, `canvasStrokes`, `drawerId`, `currentWord`) is cleared.

## Lifecycle

- **Creation**: `POST /rooms` → room created with empty round state.
- **Join**: `POST /rooms/:code/join` → participant added; no round state changes.
- **Start**: `POST /rooms/:code/start` → `status = "playing"`; `scores` initialized to `0` for each participant; `guessHistory` and `canvasStrokes` set to empty arrays.
- **Draw**: `POST /rooms/:code/canvas` → append new `Stroke` to `canvasStrokes`.
- **Clear Canvas**: `POST /rooms/:code/canvas/clear` → `canvasStrokes` set to empty array.
- **Guess**: `POST /rooms/:code/guess` → validate, append `GuessEntry` to `guessHistory`, update `scores` if first correct guess. On the first correct guess, room `status` transitions to `"results"`.
- **Reset**: When drawer leaves during `playing`, all round state is cleared and room returns to `lobby`.
- **Cleanup**: Room deleted when `participants.length === 0`. Idle rooms still cleaned up after 10 minutes.
