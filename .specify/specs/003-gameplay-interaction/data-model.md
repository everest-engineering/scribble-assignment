# Data Model: Gameplay Interaction

## Entities

### Round
Represents the state of an active round.
- `roomId`: string (UUID)
- `drawerId`: string
- `canvasData`: JSON object (serialized drawing events)
- `guessHistory`: Array<Guess>
- `scoreboard`: Scoreboard

### Guess
- `playerId`: string
- `text`: string
- `isCorrect`: boolean
- `timestamp`: Date

### Scoreboard
Map of player ID to score.
- `[playerId: string]`: number

## Validation Rules
- `Guess.text`: Must be trimmed and non-empty.
- `Guess.text` vs `SecretWord`: Case-insensitive comparison.
- `Scoreboard` points: Correct guess (+100), Incorrect guess (+0).
