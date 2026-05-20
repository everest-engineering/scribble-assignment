# Data Model: Result, Restart And Final Validation

## Room (extended)

| Field | Type | Change |
|-------|------|--------|
| `status` | `"lobby" \| "active" \| "result"` | Added `"result"` to existing union |
| `timerDuration` | `number` | NEW. Seconds (default 300). 0 = no timer. Set at game start. |
| `cumulativeScores` | `Record<string, number>` | NEW. Preserved across restarts; merged from Round.scores on restart |

## Round (extended)

| Field | Type | Change |
|-------|------|--------|
| `number` | `number` | Unchanged |
| `drawerId` | `string` | Unchanged |
| `secretWord` | `string` | Visible to ALL in result state |
| `status` | `"drawing"` | Unchanged |
| `strokes` | `CanvasStroke[]` | Unchanged |
| `guesses` | `Guess[]` | Unchanged |
| `scores` | `Record<string, number>` | Per-round scores; merged into cumulativeScores on restart |
| `correctGuessers` | `string[]` | Unchanged |
| `timerStartedAt` | `number` | NEW. `Date.now()` set when round starts; compared against timerDuration for expiry |

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
| `cumulativeScores` | `Record<string, number>` | NEW. Always present; total scores across all completed rounds |
