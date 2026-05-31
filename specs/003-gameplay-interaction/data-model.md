# Data Model: Gameplay Interaction

## New Types

```typescript
type Point = [number, number];       // [x, y] coordinate
type Stroke = Point[];               // One continuous line
type Drawing = Stroke[];             // Full canvas state

interface Guess {
  participantId: string;
  text: string;
  isCorrect: boolean;
  timestamp: string;                 // ISO timestamp
}
```

## Round (updated)

```typescript
interface Round {
  number: number;
  drawerId: string;
  secretWord: string;
  status: "drawing" | "guessing" | "revealed";
  guesses: Guess[];
  drawing: Drawing;
  hasCorrectGuess: boolean;          // true once someone guesses correctly
}
```

## RoomSnapshot (updated)

```typescript
interface RoomSnapshot {
  // ... existing fields
  guesses: Guess[];
  drawing: Drawing;
}
```

## Score Calculation

- Guesser score += 100 on first correct guess in a round (per round, only first correct counts)
- `hasCorrectGuess` prevents multiple score awards per round
- Scores stored on `Participant.score`
