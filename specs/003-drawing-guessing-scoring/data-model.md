# Data Model: Drawing, Guessing, and Scoring

## Entities

### Stroke
Represented as a list of points and drawing metadata.

```typescript
export interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}
```

### Guess
Tracking individual player attempts and correctness.

```typescript
export interface Guess {
  participantId: string;
  playerName: string;
  text: string;
  isCorrect: boolean;
  timestamp: string; // ISO string
}
```

### Room (Updated)
Extended to hold game data.

```typescript
export interface Room {
  // ... existing fields
  strokes: Stroke[];
  guesses: Guess[]; // Limited to last 50
  // ...
}
```

### Participant (Updated)
Tracking score.

```typescript
export interface Participant {
  // ... existing fields
  score: number;
  hasGuessedCorrectly: boolean; // Tracking for EC-02
}
```

## State Transitions

- **Lobby -> Playing**: All participants initialize with `score: 0` and `hasGuessedCorrectly: false`. Strokes and guesses are empty.
- **Stroke Added**: Drawer sends full stroke list; backend overwrites/persists.
- **Guess Submitted**: 
  - If matches `secretWord`: set `guess.isCorrect = true`, add `100` to `participant.score`, set `participant.hasGuessedCorrectly = true`.
  - Add to `room.guesses`, keeping only the last 50.
- **Clear Canvas**: `room.strokes` is reset to `[]`.
