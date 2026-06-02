# Data Model: Gameplay Interaction

## New Types

### Point
```typescript
interface Point {
  x: number;  // relative to canvas element (0–width)
  y: number;  // relative to canvas element (0–height)
}
```

### Stroke
```typescript
type Stroke = Point[];  // one continuous drawn line
```

### Guess
```typescript
interface Guess {
  participantId: string;
  participantName: string;
  text: string;          // trimmed guess text
  isCorrect: boolean;
  timestamp: string;     // ISO 8601
}
```

## Updated Types

### Room (additions)
```typescript
interface Room {
  // ... existing fields ...
  scores: Record<string, number>;   // participantId → cumulative score
  guesses: Guess[];                  // current round guesses (ordered)
  correctGuessers: string[];         // participantIds who scored this round
  canvasStrokes: Stroke[];           // current canvas drawing
}
```

### RoomSnapshot (additions)
```typescript
interface RoomSnapshot {
  // ... existing fields ...
  scores: Record<string, number>;
  guesses: Guess[];
}
```

## Validation Rules

| Field | Rule | Source |
|-------|------|--------|
| Guess text | Must not be empty after trim | FR-007 |
| Guess text | Must not exceed 100 characters | FR-007b |
| Guess comparison | Case-insensitive, exact match after trim | FR-008 |
| Scoring | +100 for first correct guess per round per participant | FR-009, FR-010 |
| Secret word | Never included in snapshot for guessers | FR-013 |

## State Transitions

- **Drawer draws** → `canvasStrokes` replaced with new strokes array (server)
- **Drawer clears** → `canvasStrokes` set to `[]`
- **Guesser submits guess** → Guess appended to `guesses`; if correct, participantId added to `correctGuessers` and score incremented by 100
