# Data Model: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-10

## Existing Entities (extended)

### Room (backend/src/models/game.ts)

**Current fields** (unchanged):

| Field | Type | Notes |
|---|---|---|
| `code` | `string` | 4-char unique room code |
| `status` | `"lobby" \| "playing"` | Room lifecycle state |
| `participants` | `Participant[]` | Ordered by join time |
| `createdAt` | `string` (ISO 8601) | |
| `updatedAt` | `string` (ISO 8601) | Updated on every mutation |
| `drawerName` | `string \| undefined` | Set on `startGame` |
| `secretWord` | `string \| undefined` | Set on `startGame` |

**New fields added by this feature**:

| Field | Type | Default | Notes |
|---|---|---|---|
| `guesses` | `Guess[]` | `[]` | Appended on each guess POST; initialised by `startGame` |
| `scores` | `Record<string, number>` | `{}` | Player name → cumulative points; initialised by `startGame` |
| `strokes` | `Point[][]` | `[]` | Each element is one drawn stroke; initialised by `startGame`; reset to `[]` on clear |

### RoomSnapshot (backend/src/models/game.ts + frontend/src/services/api.ts)

Both the backend `RoomSnapshot` interface and the matching frontend interface must be extended:

**New fields**:

| Field | Type | Included for | Notes |
|---|---|---|---|
| `guesses` | `Guess[]` | All viewers | Full ordered history |
| `scores` | `Record<string, number>` | All viewers | Running totals |
| `strokes` | `Point[][]` | All viewers | Full stroke list for canvas redraw |

---

## New Entities

### Point

```
Point {
  x: number   // canvas pixel offset (MouseEvent.offsetX)
  y: number   // canvas pixel offset (MouseEvent.offsetY)
}
```

Simple coordinate pair. No validation beyond being a finite number.

### Guess

```
Guess {
  playerName: string   // name of the guesser (trimmed, non-empty)
  text:       string   // trimmed guess text as submitted
  correct:    boolean  // true if text.toLowerCase() === room.secretWord.toLowerCase()
  points:     number   // 100 if correct, 0 if not
  submittedAt: string  // ISO 8601 timestamp
}
```

**Validation rules**:
- `text` after trim MUST be non-empty; otherwise endpoint rejects with HTTP 400
- `correct` computed server-side; client never sends it
- `points` computed server-side; client never sends it

---

## State Transitions

### Room.strokes

```
startGame() → strokes = []
drawer POSTs /rooms/:code/stroke → strokes.push(newStroke)
drawer POSTs /rooms/:code/clear  → strokes = []
```

### Room.guesses / Room.scores

```
startGame() → guesses = [], scores = {}
guesser POSTs /rooms/:code/guess (valid) →
  guesses.push(newGuess)
  scores[playerName] = (scores[playerName] ?? 0) + newGuess.points
```

---

## Backend API Schemas (additions to backend/src/api/schemas.ts)

```typescript
// POST /rooms/:code/stroke
export const strokeSchema = z.object({
  points: z.array(z.object({ x: z.number(), y: z.number() })).min(1)
});

// POST /rooms/:code/guess
export const guessSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required"),
  guess: z.string()  // trimmed and validated for emptiness in service layer
});
```

---

## Frontend Type Extensions (additions to frontend/src/services/api.ts)

```typescript
export interface Point { x: number; y: number }

export interface Guess {
  playerName: string;
  text: string;
  correct: boolean;
  points: number;
  submittedAt: string;
}

// RoomSnapshot extended:
export interface RoomSnapshot {
  // ... existing fields ...
  guesses: Guess[];
  scores: Record<string, number>;
  strokes: Point[][];
}
```
