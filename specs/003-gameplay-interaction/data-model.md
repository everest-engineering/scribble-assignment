# Data Model

## Types

```typescript
// Shared Types (Frontend & Backend)

type Point = {
  x: number;
  y: number;
};

type Stroke = {
  id: string; // Unique ID for the stroke (e.g., UUID or timestamp)
  color: string;
  brushSize: number;
  points: Point[];
  isComplete: boolean; // True if the drawer has lifted the pen
};

type Guess = {
  userId: string;
  text: string;
  timestamp: number;
  isCorrect: boolean;
};

type GameState = {
  roomId: string;
  currentDrawerId: string;
  currentWord: string; // Kept hidden from guessers in API responses
  strokes: Stroke[];
  guesses: Guess[];
  scores: Record<string, number>; // userId -> score
  roundEndTime: number; // Timestamp
};
```

## Backend In-Memory State
- Active rooms will store their `GameState`.
- Rate limiting store: `Record<string, number>` mapping `userId` to the timestamp of their last guess.
