# Data Model: Gameplay Interaction

## Entities

### CanvasStroke

Represents a single continuous line drawn by the drawer.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `points` | `Array<{x: number, y: number}>` | Ordered list of points along the stroke | Minimum 2 points. Each point is relative to canvas dimensions (0-1 normalized). |
| `color` | `string` | Stroke color (future use) | For v1, always `"#000000"` (black). |
| `width` | `number` | Stroke width in pixels (future use) | For v1, always `3`. |

### Guess

A single guess submission by a guesser.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `participantId` | `string` (UUID) | The guesser who submitted this | Must be a participant in the room. Cannot be the drawer. |
| `text` | `string` | The guessed text | Trimmed of leading/trailing whitespace. 1-50 characters after trim. |
| `submittedAt` | `string` (ISO 8601) | Timestamp of submission | Set server-side on receipt. |
| `isCorrect` | `boolean` | Whether this guess matches the secret word | Evaluated server-side as `trim().toLowerCase() === secretWord.trim().toLowerCase()`. |

### GuessSnapshot

Public-facing view of a guess sent to clients.

| Field | Type | Description | Visibility |
|-------|------|-------------|------------|
| `participantId` | `string` (UUID) | Who submitted this guess | All players |
| `guesserName` | `string` | Participant's display name | All players |
| `text` | `string` | The guessed text | All players |
| `submittedAt` | `string` (ISO 8601) | When submitted | All players |
| `isCorrect` | `boolean` | Whether correct | All players (correct guesses highlighted) |

### Score

Per-participant cumulative score within a round.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `participantId` | `string` (UUID) | The player | Every participant has an entry. |
| `total` | `number` | Cumulative points | Starts at 0. Incremented by 100 per correct guess. |

### Round (extended)

Existing Round entity gains drawing and guessing state.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `strokes` | `CanvasStroke[]` | All strokes drawn this round | Append-only. Cleared to `[]` on clear action. Syncs via polling. |
| `guesses` | `Guess[]` | All guesses submitted this round | Append-only. Ordered by submission time. |
| `scores` | `Record<string, number>` | Map of participantId → score | All participants start at 0. Updated atomically on correct guess. |
| `correctGuessers` | `string[]` | Participant IDs who have guessed correctly | Used to reject further guesses from correct guessers. |

All existing Round fields (`number`, `drawerId`, `secretWord`, `status`) remain unchanged from Phase 2.

### Room (extended)

Existing Room entity gains no new top-level fields. All gameplay state lives on `currentRound`.

### RoomSnapshot (extended)

Public-facing view extended with gameplay state.

| Field | Type | Description | Visibility |
|-------|------|-------------|------------|
| `currentRound.strokes` | `CanvasStroke[]` | All current strokes | All players |
| `currentRound.guesses` | `GuessSnapshot[]` | All guesses this round | All players |
| `currentRound.scores` | `Record<string, number>` | Per-player scores | All players |
| `currentRound.correctGuessers` | `string[]` | IDs of correct guessers | All players (so frontend can disable input) |

## State Transitions

```
Round: drawing ──[guesser submits correct guess]──▶ still drawing (input disabled for that guesser only)
                                      │
                                      ├── scores[guesserId] += 100
                                      ├── correctGuessers.push(guesserId)
                                      └── guess marked as `isCorrect: true`
                                      └── Other guessers continue guessing

Round: drawing ──[drawer clears canvas]──▶ drawing (strokes = [])
Round: drawing ──[drawer draws stroke]──▶ drawing (strokes.push(newStroke))
Round: drawing ──[round ends — external]──▶ (out of scope for this feature)
```

## Validation Rules

| Rule | Source |
|------|--------|
| Guesses must be 1-50 characters after trimming whitespace | FR-009 |
| Empty/whitespace-only guesses rejected | FR-008 |
| Guesses compared case-insensitively after trim | FR-007 |
| Drawer cannot submit guesses (no input visible) | FR-017 |
| Already-correct guesser cannot submit more guesses | FR-013 |
| Stroke array holds 2+ points per stroke | FR-001 |
| Scores init to 0 for all participants at round start | FR-011 |
