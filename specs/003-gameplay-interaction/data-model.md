# Data Model: Gameplay Interaction

## Entities

### DrawingData

- `paths: DrawingPath[]` - current canvas paths.

### DrawingPath

- `points` - ordered drawing points.
- `color` - stroke color.
- `width` - stroke width.

### Guess

- `id: string` - unique guess id.
- `participantId: string` - guesser id.
- `playerName: string` - display name.
- `text: string` - trimmed guess text.
- `isCorrect: boolean` - whether guess matched the word.
- `createdAt: string` - timestamp.

### ScoreEntry

- `participantId: string`
- `playerName: string`
- `score: number`

## Validation Rules

- Only drawer can update or clear drawing.
- Drawer cannot submit guesses.
- Guesses are trimmed and must be non-empty.
- Guess comparison is case-insensitive.
- Scores start at 0; correct guesses add 100 and incorrect guesses add 0.
