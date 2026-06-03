# Data Model: Gameplay Interaction

## Entities

### `Player`
- `id`: string (unique)
- `name`: string
- `score`: number
- `isDrawer`: boolean
- `lastPolledAt`: number (timestamp to track disconnects)

### `Guess`
- `id`: string
- `playerId`: string
- `playerName`: string
- `text`: string (max 50 chars)
- `isCorrect`: boolean
- `timestamp`: number

### `DrawingAction`
- `type`: 'DRAW' | 'CLEAR'
- `data`: any (coordinates, color, line width)
- `timestamp`: number

### `RoomState`
- `id`: string
- `players`: Array<Player>
- `guesses`: Array<Guess>
- `drawingState`: Array<DrawingAction>
- `targetWord`: string
- `status`: 'WAITING' | 'PLAYING' | 'ENDED'

## Validation Rules
- Guesses must be <= 50 characters, non-empty, and trimmed.
- Case-insensitive comparison with `targetWord`.
- HTTP endpoints must validate these constraints using Zod.
