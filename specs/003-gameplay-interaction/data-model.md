# Data Model: Gameplay Interaction

## StrokePoint

| Field | Type | Description |
|-------|------|-------------|
| `x` | `number` | X coordinate of the point |
| `y` | `number` | Y coordinate of the point |

## Stroke

| Field | Type | Description |
|-------|------|-------------|
| `points` | `StrokePoint[]` | Ordered array of points forming one continuous stroke |

## Guess

| Field | Type | Description |
|-------|------|-------------|
| `participantId` | `string` | ID of the guesser who submitted |
| `text` | `string` | The trimmed guess text |
| `result` | `"correct" \| "incorrect"` | Whether the guess matched the secret word |
| `timestamp` | `string` | ISO 8601 timestamp of submission |

## Round (extended)

New fields added to the existing Round model:

| Field | Type | Description |
|-------|------|-------------|
| `strokes` | `Stroke[]` | Array of strokes drawn by the drawer this round |
| `guesses` | `Guess[]` | Array of guesses submitted this round |

**Validation rules**:
- `strokes` is appended to, never mutated in place
- `guesses` is appended to, never mutated in place
- `strokes` MUST be empty when round begins (no pre-drawn canvas)
- `guesses` MUST not contain duplicate participantId for correct guesses (a guesser can only be correct once per round)

## RoomSnapshot (extended)

New fields added to the existing RoomSnapshot response:

| Field | Type | Description |
|-------|------|-------------|
| `strokes` | `Stroke[]` | Current round's strokes for canvas rendering |
| `guesses` | `Guess[]` | Current round's guess history |
| `scores` | `Record<string, number>` | Map of participantId to total score (sum of correct guesses × 100) |

**Validation rules**:
- `strokes` MUST match the current round's strokes
- `guesses` MUST match the current round's guesses
- `scores` MUST equal `correct guess count × 100` per participant
- All fields MUST be `[]` or `{}` when round is not active (lobby)

## Data Flow

```
Drawer draws → Stroke created on mouseup → POST /strokes → appended to round.strokes
                                                              ↓
Guesser sees drawing ← snapshot.strokes ← polling GET /rooms/:code
                                                              ↓
Guesser submits guess → POST /guess → trim → case-insensitive compare → appended to round.guesses
                                                                         ↓
All see feedback ← snapshot.guesses + snapshot.scores ← polling GET /rooms/:code
```
