# Data Model: Guessing, Scoring & Game End

## Entities

### Guess

Represents a single guess submission by a participant during a round.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` (UUID) | Server-generated unique identifier |
| `participantId` | `string` | The participant who submitted the guess |
| `text` | `string` | The guess text, trimmed of leading/trailing whitespace |
| `isCorrect` | `boolean` | Whether this guess matches the secret word (case-insensitive) |
| `createdAt` | `string` (ISO 8601) | Timestamp when the guess was processed by the server |

**Validation**:
- `id` must be a valid UUID v4
- `participantId` must match a participant in the room
- `text` must be non-empty after trimming, max 100 characters
- `isCorrect` is determined by case-insensitive comparison to the secret word
- `createdAt` must be a valid ISO 8601 string

### Score

Represents a participant's accumulated score.

| Field | Type | Description |
|-------|------|-------------|
| `participantId` | `string` | The participant who earned the score |
| `total` | `number` | Total points earned (100 for correct guess, 0 otherwise) |

**Validation**:
- `participantId` must match a participant in the room
- `total` must be a non-negative integer

### RoundResult

Represents the final outcome of a completed round.

| Field | Type | Description |
|-------|------|-------------|
| `secretWord` | `string` | The secret word, revealed to all participants |
| `guessHistory` | `Guess[]` | All guesses made during the round, in submission order |
| `scores` | `Record<string, number>` | Final scores keyed by participant ID |
| `winnerId` | `string \| null` | Participant ID of the first correct guesser, or null if no one guessed correctly |
| `endedAt` | `string` (ISO 8601) | Timestamp when the round ended |

**Validation**:
- `secretWord` must match the word selected at game start
- `guessHistory` must contain all and only the guesses made this round
- `scores` must be consistent with guess outcomes
- `winnerId` is null if no correct guess was made

### Room — Extended Fields

The existing Room model gains the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `guesses` | `Guess[]` | Ordered list of guesses in the current round |
| `scores` | `Record<string, number>` | Scores keyed by participant ID |
| `roundResult` | `RoundResult \| null` | Result of the completed round; null while playing |

**Validation**:
- `guesses` is empty array in lobby, populated during play, preserved until restart
- `scores` includes entries for all participants (default 0)
- `roundResult` is null in lobby/playing, populated on round end, cleared on restart

## State Transitions

```
lobby → startGame → playing
                      │
                      ├── guess (incorrect) → guess appended, status stays playing
                      ├── guess (correct)   → guess appended, status → finished
                      │                       scores updated, roundResult created
                      │
                      ▼
           finished → restart → lobby (participants preserved)
```

### Key Transition Rules

1. **lobby → playing**: Existing `startGame` logic. Guesses and scores initialised as empty.
2. **playing** (incorrect guess): Guess appended to `guesses` array. Status remains `"playing"`.
3. **playing** (correct guess): Guess appended. Status set to `"finished"`. Score updated (100 pts). `roundResult` populated. No further guesses accepted.
4. **finished**: `GET /rooms/:code` returns `roundResult` including secret word, guess history, scores.
5. **finished → lobby**: `POST /rooms/:code/restart` by host. Resets round state, preserves participants.

## Backend Storage

Guesses, scores, and round result are stored as fields on the Room model:

```typescript
interface Room {
  // ... existing fields
  guesses: Guess[];
  scores: Record<string, number>;
  roundResult: RoundResult | null;
}
```

**Lifecycle**:
- **Created**: when game starts (`status → playing`), `guesses = []`, `scores = {}`
- **Mutated**: on guess submission (append to guesses, update scores on correct)
- **Frozen**: when correct guess received (`roundResult` populated)
- **Cleared**: on restart (all round fields reset, participants preserved)

## API Payloads

See [contracts/api.md](./contracts/api.md) for full request/response schemas.
