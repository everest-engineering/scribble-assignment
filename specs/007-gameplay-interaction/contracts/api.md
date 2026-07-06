# API Contracts — Gameplay Interaction

## Submit Guess

```http
POST /rooms/:code/guess
Content-Type: application/json

{
  "participantId": "uuid-string",
  "guess": "trimmed guess text"
}
```

**Response** `200`:
```json
{
  "room": { /* RoomSnapshot with updated guesses and scores */ }
}
```

**Error** `400`:
```json
{
  "message": "You already guessed correctly!"
}
```

**Validations** (Zod):
- `participantId`: non-empty string
- `guess`: `.trim().min(1)` — empty/whitespace-only rejected with 400

**Business Rules**:
- Drawer cannot submit guesses → 400
- Already-correct guesser cannot submit again → 400
- Case-insensitive comparison against `room.secretWord`
- Correct guess: +100 to `room.scores[participantId]`, added to `correctGuessersInRound`
- Incorrect guess: +0, guess recorded in history

---

## Canvas Stroke

```http
POST /rooms/:code/canvas?participantId=uuid-string
Content-Type: application/json

{
  "type": "stroke",
  "stroke": {
    "points": [{ "x": 10, "y": 20 }, { "x": 15, "y": 25 }]
  }
}
```

**Alternative (Clear)**:
```json
{
  "type": "clear"
}
```

**Response** `200`:
```json
{
  "room": { /* RoomSnapshot with updated canvasStrokes */ }
}
```

**Error** `403`:
```json
{
  "message": "Only the drawer can draw"
}
```

**Validations**:
- `participantId` query parameter required
- Stroke: `type: "stroke"` + `stroke.points` array (min 1 point)
- Clear: `type: "clear"`

**Business Rules**:
- Only the current drawer can add strokes or clear canvas
- Stroke is appended to `room.canvasStrokes[]`
- Clear resets `room.canvasStrokes` to `[]`

---

## Next Word

```http
POST /rooms/:code/next-word
Content-Type: application/json

{
  "participantId": "uuid-string"
}
```

**Response** `200`:
```json
{
  "room": { /* RoomSnapshot with incremented round, new word, reset canvas/guesses */ }
}
```

**Error** `403`:
```json
{
  "message": "Only the drawer can advance the word"
}
```

**Validations**:
- `participantId`: non-empty string

**Business Rules**:
- Only the current drawer can advance to the next word
- Increments `room.currentRound` by 1
- Selects new secret word: `words[(room.currentRound - 1) % words.length]`
- Resets `room.canvasStrokes` to `[]`
- Resets `room.guesses` to `[]`
- Resets `room.correctGuessersInRound` to `[]`
- Cumulative `room.scores` are preserved
