# Data Model: Gameplay Interaction

## Extended Types

### RoundStatus (new)

```
"lobby" | "playing" | "round_ended"
```

Extends the existing `RoomStatus` by replacing the original `"playing"` terminal. Original flow was `lobby → playing`. New flow is `lobby → playing → round_ended`.

### DrawingStroke (new)

```typescript
interface DrawingStroke {
  color: string;    // Hex color e.g. "#000000"
  width: number;    // Pixel width e.g. 3
  points: Point[];  // Ordered array of points in the stroke
}

interface Point {
  x: number;
  y: number;
}
```

- Stored on `Room` as `strokes: DrawingStroke[]` — append-only ordered list
- Clear action resets to empty array and increments a `clearVersion` counter
- Polling clients compare `clearVersion` to detect clears vs incremental additions

### Guess (new)

```typescript
interface Guess {
  participantId: string;
  text: string;           // Original submitted text
  isCorrect: boolean;     // true if matched secretWord (case-insensitive)
  timestamp: string;      // ISO 8601
}
```

- Stored on `Room` as `guesses: Guess[]` — append-only ordered list
- Guesses from a participant who has already guessed correctly are not appended
- Drawer's guesses are never appended (rejected at API level)

### PlayerScore (new)

```typescript
interface PlayerScore {
  participantId: string;
  name: string;
  score: number;   // Always 0 or 1 (since single-round)
}
```

- Stored on `Room` as `scores: Map<string, number>` (participantId → score)
- Score goes from 0 to 1 when a correct guess is submitted
- Computed on-the-fly from guesses OR stored as derived field

### Room Extension

```typescript
interface Room {
  // Existing fields...
  code: string;
  status: RoundStatus;       // Extended: lobby → playing → round_ended
  drawerId: string | null;
  secretWord: string | null;
  participants: Participant[];
  hostId: string;

  // New fields
  strokes: DrawingStroke[];
  clearVersion: number;      // Incremented on clear
  guesses: Guess[];
  scores: Map<string, number>; // participantId → score
}
```

### RoomSnapshot Extension

The role-aware projection is extended:

```typescript
interface RoomSnapshot {
  // Existing fields...
  code: string;
  status: RoundStatus;
  drawerId: string | null;
  secretWord?: string;       // Only for drawer
  participants: Participant[];

  // New fields — available to ALL roles
  strokes: DrawingStroke[];          // Always included
  clearVersion: number;
  guesses: Guess[];                  // Always included (drawer sees all)
  scores: { participantId: string; name: string; score: number }[];

  // Round state
  allGuessersCorrect: boolean;       // True when every non-drawer has guessed correctly
}
```

## State Transitions

```
lobby ──[startGame]──→ playing ──[allGuessersCorrect OR drawerReveal]──→ round_ended
```

- **lobby → playing**: Existing `startGame` logic. `strokes`, `guesses`, `scores` initialized.
- **playing → round_ended**: Triggered when all guessers have a correct guess, or when drawer hits "reveal".
- **round_ended**: Terminal state. Strokes/guesses/scores still readable. No new strokes, guesses, or clears accepted. No new round starts (out of scope).

## Validation Rules

| Field | Rule |
|-------|------|
| Guess text | Must be trimmed, 1-200 chars, not empty/whitespace |
| Guess text match | Case-insensitive exact match to `secretWord` |
| Guess submitter | Must not be the drawer |
| Guess timing | Must be during `"playing"` status |
| Guess duplicate | Guesser who already guessed correctly: subsequent guesses ignored (not stored, no error returned) |
| Stroke data | Array of strokes. Max 1 MB serialized JSON. |
| Clear action | Only drawer can clear |
| Reveal action | Only drawer can reveal (manual round end) |
