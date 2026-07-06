# API Contracts — Result, Restart, and Final Validation

## End Game

```http
POST /rooms/:code/end-game?participantId=<drawerId>
Content-Type: application/json
```

**Response** `200`:
```json
{
  "room": { /* RoomSnapshot with status: "result", secretWord, scores, guesses preserved */ }
}
```

**Error** `403`:
```json
{
  "message": "Only the drawer can end the game"
}
```

**Error** `400`:
```json
{
  "message": "Game is not in progress"
}
```

**Validations**:
- `participantId` query parameter required
- Room must exist (404)
- Room must be in "drawing" status (400)
- Requester must be the current drawer (403)

**Business Rules**:
- Transitions room status to "result"
- Preserves `secretWord`, `scores`, `guesses`, `canvasStrokes` as-is for result display
- No new fields are added — existing room data serves as the result snapshot
- All gameplay endpoints reject requests while in result status

---

## Restart Game

```http
POST /rooms/:code/restart?participantId=<hostId>
Content-Type: application/json
```

**Response** `200`:
```json
{
  "room": { /* RoomSnapshot with status: "lobby", scores reset to 0, guesses/canvas cleared */ }
}
```

**Error** `403`:
```json
{
  "message": "Only the host can restart the game"
}
```

**Error** `400`:
```json
{
  "message": "Game is not in result state"
}
```

**Validations**:
- `participantId` query parameter required
- Room must exist (404)
- Room must be in "result" status (400)
- Requester must be the host (403)

**Business Rules**:
- Transitions room status to "lobby"
- Clears: `scores` to `{}`, `guesses` to `[]`, `canvasStrokes` to `[]`, `currentRound` to 0, `currentDrawerId` to `""`, `secretWord` to `null`, `correctGuessersInRound` to `[]`
- Preserves `participants` array unchanged
- Room is ready for a new game via existing start game flow
