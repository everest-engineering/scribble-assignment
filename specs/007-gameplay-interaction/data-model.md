# Data Model — Gameplay Interaction

**Feature**: 007-gameplay-interaction (Drawing, Guessing, Scoring)

## Entities

### Point

```typescript
interface Point {
  x: number;   // pixel coordinate relative to canvas
  y: number;   // pixel coordinate relative to canvas
}
```

### Stroke

```typescript
interface Stroke {
  points: Point[];  // ordered array of points, min 2 for visible stroke
}
```

- A stroke with <2 points is invisible (not rendered).
- All strokes use a single black pen (color: `#1f2937`, width: 3px, round caps/joins).

### Guess

```typescript
interface Guess {
  participantId: string;    // UUID of the guesser
  participantName: string;  // display name (denormalized for history)
  text: string;             // trimmed guess text
  isCorrect: boolean;       // true if case-insensitively matches secret word
  pointsAwarded: number;    // 100 for first correct in round, 0 otherwise
  timestamp: string;        // ISO 8601
}
```

### ScoreMap

```typescript
type ScoreMap = Record<string, number>;  // participantId → cumulative score
```

## Room Extensions

Fields added to `Room` and `RoomSnapshot`:

| Field | Type | Description |
|-------|------|-------------|
| `scores` | `ScoreMap` | Per-participant cumulative scores |
| `guesses` | `Guess[]` | Ordered guess history for current round |
| `canvasStrokes` | `Stroke[]` | Current drawing state for the round |
| `correctGuessersInRound` | `string[]` | Participant IDs who have guessed correctly (dedup) |

## Validation Rules

### Guess
- Must be non-empty after `.trim()` — rejected on frontend AND backend
- Backend Zod schema: `z.string().trim().min(1)`
- Case-insensitive comparison: `guess.trim().toLowerCase() === secretWord.toLowerCase()`
- Drawer cannot submit guesses (returned 400)
- Already-correct guesser cannot submit again (returned 400 with message)

### Canvas Stroke
- Must contain at least 1 point
- Only the current drawer can add strokes or clear canvas
- Clear action resets `canvasStrokes` to `[]`

## State Transitions

```
Room.status: "lobby" → "drawing"  (via startGame)
```

While in `"drawing"` status:
- Drawer can add strokes / clear canvas / advance to next word
- Guessers can submit guesses
- Scores accumulate (correct = +100 for first correct guess, +0 for subsequent; incorrect = +0)

### Next Word (while in `"drawing"`)

The `nextWord` action does not change room status. It mutates the following fields atomically:

| Field | Effect |
|-------|--------|
| `currentRound` | Incremented by 1 |
| `secretWord` | Re-selected: `words[(currentRound - 1) % words.length]` |
| `canvasStrokes` | Reset to `[]` |
| `guesses` | Reset to `[]` |
| `correctGuessersInRound` | Reset to `[]` |
| `scores` | **Preserved** (cumulative across rounds) |

No new status transitions introduced by this feature.
