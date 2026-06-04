# Data Model: Gameplay Interaction

## Entities

### GuessLog
- `id`: string (UUID)
- `playerName`: string
- `text`: string
- `isCorrect`: boolean
- `timestamp`: string

### Participant (Updated)
- `id`: string
- `name`: string
- `score`: number (default: 0)
- `hasGuessedCorrectly`: boolean (default: false)

### Room (Updated)
- `drawingData`: string (JSON-serialized path array or canvas image representation)
- `guesses`: GuessLog[]
