# Data Model — Result, Restart, and Final Validation

**Feature**: 008-result-restart-validation (Result & Restart)

## RoomStatus Extension

```typescript
type RoomStatus = "lobby" | "drawing" | "result";
```

The `"result"` status is a terminal read-only state. No gameplay actions are permitted — participants can only view the results and (host only) restart.

## State Transitions

```
lobby → drawing → result → lobby (restart)
```

| From | To | Trigger | Side Effects |
|------|----|---------|--------------|
| drawing | result | Drawer clicks "End Game" | Room becomes read-only; secretWord, scores, guesses preserved for display |
| result | lobby | Host clicks "Restart" | Scores → 0, guesses → [], canvas → [], currentRound → 0, currentDrawerId → "", secretWord → null, correctGuessersInRound → []; participants preserved unchanged |

## Validation Rules

- Only the current drawer can trigger end game (403 otherwise)
- Only the host can trigger restart (403 otherwise)
- While in result status, all gameplay actions (draw, clear canvas, submit guess, Next Word) are rejected with 400
- End game and restart are only valid from their respective source statuses (400 otherwise)

## Existing Entity Reuse

No new entities are introduced. The following existing `Room` fields serve the result display:

| Field | Role in Result State |
|-------|---------------------|
| `secretWord` | Displays the final round's word |
| `scores` | Displays final cumulative scores |
| `guesses` | Displays the final round's guess history |
| `participants` | Preserved across restart |
