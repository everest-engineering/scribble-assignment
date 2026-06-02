# Guess API

## POST /rooms/:code/guess

Submit a guess. Called by guessers only.

**Request**:
```json
{
  "participantId": "uuid",
  "text": "  rocket  "
}
```

**Response** `200 OK`:
```json
{
  "result": "correct",
  "guesses": [
    {
      "participantId": "uuid",
      "participantName": "Alice",
      "text": "rocket",
      "isCorrect": true,
      "timestamp": "2026-06-01T12:00:00.000Z"
    }
  ],
  "scores": {
    "uuid": 100
  }
}
```

**Response** `200 OK` (incorrect):
```json
{
  "result": "incorrect",
  "guesses": [
    {
      "participantId": "uuid",
      "participantName": "Alice",
      "text": "wrong",
      "isCorrect": false,
      "timestamp": "2026-06-01T12:00:00.000Z"
    }
  ],
  "scores": {}
}
```

**Errors**:
- `400` — empty guess ("Guess cannot be empty"), too long ("Guess is too long (max 100 characters)"), or round not active
- `403` — drawer cannot guess, or already guessed correctly this round
- `404` — room not found
