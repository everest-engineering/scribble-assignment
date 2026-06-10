# Data Model: Gameplay Interaction - Drawing, Guessing & Scoring

## Entities

### CanvasAction

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"stroke"` or `"clear"` | Discriminated union variant |
| `points` | `{ x: number, y: number }[]` | Array of 2D points defining the stroke (only for `"stroke"` type) |
| `color` | `string` (hex) | Stroke color, e.g. `"#000000"` (only for `"stroke"` type) |
| `width` | `number` | Stroke width in pixels (only for `"stroke"` type) |
| `timestamp` | `string` (ISO) | When the action was performed |

```typescript
type CanvasAction =
  | { type: "stroke"; points: { x: number; y: number }[]; color: string; width: number; timestamp: string }
  | { type: "clear"; timestamp: string };
```

### GuessEntry

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` (UUID) | Unique guess identifier |
| `participantId` | `string` (UUID) | Who submitted the guess |
| `text` | `string` | The submitted guess text (trimmed, as stored) |
| `correct` | `boolean` | Whether the guess matched the secret word |
| `timestamp` | `string` (ISO) | When the guess was submitted |

```typescript
interface GuessEntry {
  id: string;
  participantId: string;
  text: string;
  correct: boolean;
  timestamp: string;
}
```

### Room (modified — new fields)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `canvasActions` | `CanvasAction[]` | `[]` | Ordered list of drawing actions for the current round |
| `guessHistory` | `GuessEntry[]` | `[]` | Ordered list of all guesses for the current round |
| `scores` | `Record<string, number>` | `{}` | Participant ID → current score map |

### RoomSnapshot (modified — new fields)

| Field | Type | Description |
|-------|------|-------------|
| `canvasActions` | `CanvasAction[]` | Full drawing action list for the current round |
| `guessHistory` | `GuessEntry[]` | Full guess history for the current round |
| `scores` | `Record<string, number>` | Current scores keyed by participant ID |
| `roundOver` | `boolean` | Whether all guessers have guessed correctly (new) |

## Validation Rules

### Canvas Actions

| Rule | Source | Enforcement |
|------|--------|-------------|
| Only the drawer may submit canvas actions | FR-013 | Server checks `playerId === room.drawerId` |
| Stroke must contain at least 1 point | Implied | Zod validates `points` array `min(1)` |
| Clear action has no additional fields | FR-002 | Discriminated union — `clear` type requires no extra fields |
| Canvas state resets on clear | FR-002 | Server replaces `canvasActions` with `[{ type: "clear", timestamp }]` |

### Guess Submission

| Rule | Source | Enforcement |
|------|--------|-------------|
| Guess text trimmed of leading/trailing whitespace | FR-004 | Zod `.trim()` in schema |
| Empty/whitespace-only guess rejected | FR-005 | Zod `.min(1)` after trim |
| Max guess length 100 characters | Assumption | Zod `.max(100)` |
| Case-insensitive comparison against secret word | FR-006 | `guessText.toLowerCase() === secretWord.toLowerCase()` |
| Correct guess awards 100 points | FR-007 | `scores[participantId] = 100` |
| Incorrect guess awards 0 points | FR-008 | Score unchanged |
| Every guess recorded in history (except rejected) | FR-009 | Push `GuessEntry` to `guessHistory` after validation |
| Already-scored guesser rejected | FR-012 | Check `scores[participantId] >= 100` before processing |
| Drawer cannot submit guesses | FR-013 | Server checks `playerId !== room.drawerId` |
| Scores start at 0 for all non-drawer participants | FR-015 | Initialize `scores` on round start |

## State Transitions

```
[Round Active]
    │
    ├── Drawer draws ──→ CanvasAction("stroke") appended to canvasActions
    │                     │
    │                     └── Guessers see updated canvas on next poll
    │
    ├── Drawer clears ──→ CanvasAction("clear") appended to canvasActions
    │                     │
    │                     └── All players see blank canvas on next poll
    │
    ├── Guesser submits guess ──→ Server validates (trim, empty, length, duplicate, drawer check)
    │                            │
    │                            ├── Invalid ──→ 400/403 error
    │                            │
    │                            ├── Correct ──→ Record in history, scores[id] = 100
    │                            │              │
    │                            │              └── All guessers scored? → roundOver = true
    │                            │
    │                            └── Incorrect ──→ Record in history, score unchanged
    │
    └── All guessers scored 100 ──→ roundOver = true
                                    (round rotation out of scope)
```
