# Data Model: Gameplay Interaction

## Entities

### Round

- `id`: string (room code or internal round identifier)
- `status`: "waiting" | "playing" | "finished"
- `drawerId`: string
- `secretWord`: string
- `canvasState`: object | null
- `guessHistory`: Guess[]
- `scores`: Record<string, number>

### Guess

- `id`: string
- `participantId`: string
- `playerName`: string
- `text`: string
- `normalizedText`: string
- `correct`: boolean
- `timestamp`: string
- `scoreImpact`: number

### Participant

- `id`: string
- `name`: string
- `isHost`: boolean
- `role`: "drawer" | "guesser"
- `score`: number

## Relationships

- A `Room` contains one active `Round` while the game is playing.
- A `Round` has one `drawerId` and many guess submissions in `guessHistory`.
- Each `Guess` references a `participantId` and the player’s display name.
- `scores` maps each participant ID to the current numeric score.

## Validation Rules

- `secretWord` must be present when `status === "playing"`.
- `guessHistory` may be empty but must be an array.
- `scores` must initialize each participant to `0` at round start and update only on correct guesses.
- `Guess.text` is stored trimmed; `Guess.normalizedText` is lowercase.
- Empty or whitespace-only guesses are rejected and do not enter `guessHistory`.

## Snapshot Contract

`RoomSnapshot` should expose:
- `code`: string
- `status`: string
- `participants`: Participant[]
- `isDrawer`: boolean
- `isHost`: boolean
- `secretWord`: string | undefined
- `canvasState`: object | null
- `guessHistory`: Guess[]
- `scores`: Record<string, number>
- `playerCount`: number

This contract ensures both the drawer and guessers can synchronize game state through polling while maintaining viewer-specific fields like `secretWord` only for the drawer.
