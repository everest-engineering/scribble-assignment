# Data Model: Gameplay Interaction

**Phase 1 output** | **Date**: 2026-05-30 | **Spec**: [spec.md](spec.md)

## Overview

Adds canvas stroke tracking, guess history, and per-player scoring to the existing round model. All changes extend existing types in `backend/src/models/game.ts` without creating new top-level stores.

## Entity Changes

### Round (extended)

| Field | Type | Description |
|-------|------|-------------|
| `roundNumber` | `number` | (existing) Starts at 1 |
| `drawerId` | `string` | (existing) participant.id of the drawing player |
| `word` | `string` | (existing) The secret word for this round |
| `strokes` | `Stroke[]` | **NEW** Ordered array of canvas strokes drawn this round. Empty array initially. |
| `guesses` | `Guess[]` | **NEW** Ordered array of guesses submitted this round. Empty array initially. |
| `scores` | `Record<string, number>` | **NEW** Map of participantId → cumulative score. All start at 0. |

### Stroke (new)

| Field | Type | Description |
|-------|------|-------------|
| `points` | `{ x: number, y: number }[]` | Ordered array of points forming the stroke path |
| `color` | `string` | CSS color string (e.g., `"#000000"`, `"red"`) |
| `width` | `number` | Stroke width in pixels |

- Strokes are stored in draw order. Appending a stroke adds to the end. Clearing replaces with empty array.
- A stroke represents a single continuous mouse/finger movement (mousedown → mousemove → mouseup).

### Guess (new)

| Field | Type | Description |
|-------|------|-------------|
| `participantId` | `string` | The guesser's participant ID |
| `guesserName` | `string` | The guesser's display name (snapshot at time of guess) |
| `text` | `string` | The trimmed guess text |
| `isCorrect` | `boolean` | Whether this guess matched the secret word |
| `timestamp` | `string` | ISO 8601 timestamp of when the guess was processed |

- Every processed (non-rejected) guess is recorded once.
- Rejected guesses (empty after trim, or from the drawer) are not recorded.
- `guesserName` is captured at guess time to preserve historical accuracy even if the player renames later.

### RoomSnapshot (extended)

| Field | Type | Visibility |
|-------|------|------------|
| `roundNumber` | `number \| null` | All players (existing) |
| `drawerId` | `string \| null` | All players (existing) |
| `currentWord` | `string \| undefined` | Only the drawer (existing) |
| `strokes` | `Stroke[]` | **NEW** All players — the current canvas state |
| `guesses` | `Guess[]` | **NEW** All players — full guess history for the round |
| `scores` | `Record<string, number>` | **NEW** All players — per-player scores |

- `strokes` is sent to ALL players (they all need to see the canvas).
- `guesses` is sent to ALL players (they all need to see the guess history).
- Empty arrays are sent instead of null/undefined to simplify frontend handling.

## State Transitions

```text
Round starts (roundNumber=1, drawerId=host, word=secret, strokes=[], guesses=[], scores={})

  ┌─────────────────────────────────────────────────────────────┐
  │                                                             │
  │  Drawer draws → stroke appended to strokes[]                │
  │  Drawer clears → strokes set to []                          │
  │  Guesser guesses → guess processed → appended to guesses[]  │
  │                       → score updated if correct             │
  │                                                             │
  │  Polling: GET /rooms/:code returns current state             │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘
```

- **Canvas updates**: Strokes are appended incrementally. The frontend replaces its local canvas state with the full `strokes[]` on each poll.
- **Guess processing**: Each guess is independently evaluated. Correct guesses update the score; all processed guesses are appended to `guesses[]`.
- **After correct guess**: The guesser's score increases by 100. Their `guesses[]` continue to be recorded but without additional score increments (FR-010).
- **Canvas clear**: Sets `strokes = []`, removing all existing strokes. Frontend redraws from empty array.

## Validation Rules (from spec FRs)

- **FR-003**: All guess text trimmed (leading/trailing whitespace) before processing.
- **FR-004**: Guess compared against secret word case-insensitively.
- **FR-005**: Empty/whitespace-only after trim → rejected; not recorded in `guesses[]`.
- **FR-006**: Correct guess → +100 to that guesser's `scores[participantId]`.
- **FR-007**: Incorrect guess → score unchanged.
- **FR-008**: `guesses[]` includes guesser name, text, correct/incorrect flag.
- **FR-009**: `guesses[]` available via polling to all players.
- **FR-010**: After first correct guess, subsequent guesses from same guesser do not score.
- **FR-011**: Drawer's guess submissions rejected server-side.
