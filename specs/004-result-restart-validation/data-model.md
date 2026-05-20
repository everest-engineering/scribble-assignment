# Data Model: Result, Restart And Final Validation

## Room (extended)

| Field | Type | Change |
|-------|------|--------|
| `status` | `"lobby" \| "active" \| "result"` | Added `"result"` to existing union |
| `timerDuration` | `number` | NEW. Seconds (default 300). 0 = no timer. Set at game start. |

## Round (unchanged, but new usage)

| Field | Type | Notes |
|-------|------|-------|
| `number` | `number` | Always 1 (no multi-round in v1) |
| `drawerId` | `string` | |
| `secretWord` | `string` | Visible to ALL in result state |
| `status` | `"drawing"` | No new round statuses; endRound clears the round entirely |
| `strokes` | `CanvasStroke[]` | Visible in result state |
| `guesses` | `Guess[]` | Visible in result state |
| `scores` | `Record<string, number>` | Cumulative scores preserved across rounds |
| `correctGuessers` | `string[]` | Used to detect "all guessers correct" trigger |

## Timer

| Concept | Details |
|---------|---------|
| Start time | `startGame` sets `timerStartedAt = Date.now()` |
| Duration | `room.timerDuration` (seconds). Convert to ms for comparison. |
| Check | `Date.now() - timerStartedAt >= timerDuration * 1000` |
| 0 = disabled | If `timerDuration === 0`, timer check is skipped |

## State Transitions

```
lobby --[startGame]--> active
active --[allGuessersCorrect OR timerExpiry]--> result
result --[host.restart]--> lobby
```

## Validation Rules

- Only host can restart (same host check as startGame)
- All guessers correct: `currentRound.correctGuessers.length === guesserCount` (all non-drawer participants)
- Timer check: requires `room.timerDuration > 0` and `Date.now() - timerStartedAt >= timerDuration * 1000`

## RoomSnapshot (extended)

| Field | Type | Change |
|-------|------|--------|
| `status` | `"lobby" \| "active" \| "result"` | Added `"result"` |
| `currentRound.secretWord` | `string` | Always visible in result state (not drawer-only) |
