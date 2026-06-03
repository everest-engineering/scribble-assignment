# Data Model: Gameplay Interaction

**Feature**: Scenario 3 | **Date**: 2026-06-03

## New types

### Point

| Field | Type | Rules |
|-------|------|-------|
| `x` | number | 0–600 canvas space |
| `y` | number | 0–400 canvas space |

### Stroke

| Field | Type | Rules |
|-------|------|-------|
| `id` | string | UUID |
| `points` | Point[] | 2–250 points (cap enforced) |
| `color` | string | CSS color, default `#000000` |
| `width` | number | Line width, default `2` |

### Guess

| Field | Type | Rules |
|-------|------|-------|
| `id` | string | UUID |
| `participantId` | string | Guesser only |
| `text` | string | Trimmed submitted text |
| `isCorrect` | boolean | Case-insensitive compare to `secretWord` |
| `createdAt` | string | ISO timestamp |

### ScoreEntry

| Field | Type | Rules |
|-------|------|-------|
| `participantId` | string | Key |
| `score` | number | Integer; starts 0; +100 on correct |

## Extended CurrentRound

| Field | Type | Rules |
|-------|------|-------|
| `strokes` | Stroke[] | Append-only; clear → `[]` |
| `guesses` | Guess[] | Append-only |
| `scores` | Record<string, number> | participantId → score; init all 0 on start |
| `winnerParticipantId` | string \| undefined | Set on first correct guess |

## RoomStatus

```text
"lobby" | "playing" | "result"
```

## RoomSnapshot extensions

| Field | Type | Notes |
|-------|------|-------|
| `status` | includes `"result"` | Guess disabled when not `playing` |
| `currentRound.strokes` | Stroke[] | Visible to all |
| `currentRound.guesses` | GuessSnapshot[] | Includes name for display |
| `currentRound.scores` | ScoreSnapshot[] | `{ participantId, name, score }[]` |
| `currentRound.winnerParticipantId` | string \| null | Set in result state |

`secretWord` masking unchanged — drawer only.

## Service functions

### `appendStroke(code, participantId, strokeInput)`

- Requires `status === "playing"`
- Requires `participantId === drawerParticipantId`
- Rejects if `strokes.length >= 500` or `points.length > 250`
- Appends stroke with new id

### `clearStrokes(code, participantId)`

- Same auth as append
- Sets `strokes = []`

### `submitGuess(code, participantId, text)`

- Requires `status === "playing"`
- Rejects if caller is drawer
- Trim; reject empty
- Rejects if `guesses.length >= 200`
- Append guess; if correct: `scores[participantId] += 100`, `winnerParticipantId = participantId`, `status = "result"`

## State transitions

```text
playing --appendStroke/clearStrokes (drawer)--> playing
playing --submitGuess incorrect--> playing
playing --submitGuess correct--> result (+100)
result --submitGuess--> rejected 409
result --appendStroke--> rejected 409
```

## Validation messages

| Condition | HTTP | Message |
|-----------|------|---------|
| Empty guess | 400 | `"Guess is required"` |
| Not playing | 409 | `"Round is not active"` |
| Drawer guesses | 403 | `"Drawer cannot guess"` |
| Non-drawer stroke | 403 | `"Only the drawer can draw"` |
| Stroke cap | 409 | `"Stroke limit reached"` |
| Guess cap | 409 | `"Guess limit reached"` |
| Points cap | 409 | `"Stroke has too many points"` |
