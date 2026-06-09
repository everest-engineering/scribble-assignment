# Data Model: Drawing & Guessing

**Feature**: Drawing & Guessing | **Date**: 2026-06-09 | **Plan**: `specs/003-drawing-and-guessing/plan.md`

## Entities

### Point

A single coordinate on the drawing canvas, normalized for resolution-independent rendering.

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `x` | `number` | `[0, 1]` | Horizontal position, normalized to canvas width |
| `y` | `number` | `[0, 1]` | Vertical position, normalized to canvas height |

**Validation**:
- `x` and `y` MUST be finite numbers within `[0, 1]`
- Multi-segment strokes MUST have at least 2 points

---

### Stroke

A single continuous drawing action (mouse-down to mouse-up), stored immutably once finalized.

| Field | Type | Description |
|-------|------|-------------|
| `points` | `Point[]` | Ordered array of points forming the stroke polyline. MUST have ≥ 2 points |
| `color` | `string` | Hex color string (e.g. `"#000000"`). Single fixed value for v1 |
| `width` | `number` | Normalized line width `(0, 1]`. Fixed at `0.008` for v1 |

**Validation**:
- `points` MUST be a non-empty array with ≥ 2 elements (a real stroke)
- `color` MUST match `/^#[0-9a-fA-F]{6}$/`
- `width` MUST be a finite number between `0.001` and `1`
- The entire strokes array per submission MUST have at most 20 strokes (rate-limiting safeguard)

**State transitions**: Strokes are append-only. Once added to RoundState, they are never mutated or removed.

---

### Guess

A text guess submitted by a guesser, validated against the secret word.

| Field | Type | Description |
|-------|------|-------------|
| `participantId` | `string` | UUID of the guesser who submitted |
| `participantName` | `string` | Display name of the guesser |
| `text` | `string` | The guessed word/phrase (trimmed) |
| `isCorrect` | `boolean` | Whether the guess matches the secret word (case-insensitive) |
| `guessedAt` | `string` | ISO 8601 timestamp of when the guess was submitted |

**Validation**:
- `text` MUST be non-empty after trimming
- `text` MUST be ≤ 100 characters
- `participantId` MUST belong to a guesser (not the drawer)
- The guesser MUST NOT have already submitted a correct guess

**State transitions**: Guesses are append-only. Once stored, they are never modified.

---

## State Transitions

### RoundState (extended)

The existing `RoundState` in `backend/src/models/game.ts` gains two new fields:

```typescript
interface RoundState {
  drawerId: string;
  guesserIds: string[];
  wordOptions: string[];
  secretWord: string | null;
  phase: RoundPhase;
  // NEW:
  strokes: Stroke[];     // accumulated strokes for this round
  guesses: Guess[];      // accumulated guesses for this round
}
```

### Phase Transitions

```text
word-selection ──[drawer selects word]──→ drawing ──[round ends]──→ finished
                                                 │
                                      drawer draws        guessers guess
                                      (appends strokes)   (appends guesses)
```

### Data Flow

```text
DRAWER:
  [Canvas pointer event] → local render (immediate)
                         → POST /:code/strokes (on mouse-up + periodic flush)
                         → server appends to RoundState.strokes[]

GUESSER:
  GET /:code (polling at 500ms)
  → server returns RoundState.strokes[]
  → frontend clear + redraw all strokes

GUESSER (guess submission):
  POST /:code/guess { participantId, text }
  → server validates, checks against secret word
  → appends to RoundState.guesses[]
  → returns { correct: boolean }

ALL PLAYERS:
  GET /:code (polling)
  → server returns RoundState.guesses[] (with isCorrect filtered per viewer)
```

---

## Validation Rules Summary

| Input | Zod Schema | Rules |
|-------|-----------|-------|
| Stroke submission | `strokesSchema` | Array of 1-20 strokes; each stroke has `points` (≥2), `color` (hex), `width` (0.001-1) |
| Guess submission | `guessSchema` | `participantId` (UUID), `text` (1-100 chars, trimmed) |
| Guess response | — | `{ correct: boolean }` |
| Room polling | — | Guesses returned with `isCorrect` filtered: `null` for drawer, own-correctness-only for guessers (others get `null`) |
