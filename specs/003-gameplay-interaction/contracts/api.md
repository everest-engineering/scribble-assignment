# API Contracts: Gameplay Interaction

## POST /rooms/:code/guess — Submit Guess (NEW)

**Request:**
```json
{
  "participantId": "uuid-def-456",
  "text": "pizza"
}
```

**Response (200) — Incorrect guess:**
```json
{
  "guess": {
    "participantId": "uuid-def-456",
    "text": "pizza",
    "isCorrect": false,
    "timestamp": "2026-05-31T12:00:00.000Z"
  }
}
```

**Response (200) — Correct guess:**
```json
{
  "guess": {
    "participantId": "uuid-def-456",
    "text": "pizza",
    "isCorrect": true,
    "timestamp": "2026-05-31T12:00:00.000Z"
  },
  "scoreAwarded": 100
}
```

**Error (400):**
```json
{ "message": "Guess text is required" }
```

**Error (403):**
```json
{ "message": "Only guessers can submit guesses" }
```

## POST /rooms/:code/drawing — Save Drawing (NEW)

**Request:**
```json
{
  "participantId": "uuid-abc-123",
  "drawing": [
    [[10, 20], [30, 40], [50, 60]],
    [[100, 200], [150, 250]]
  ]
}
```

**Response (200):**
```json
{ "ok": true }
```

**Error (403):**
```json
{ "message": "Only the drawer can update the drawing" }
```

## GET /rooms/:code?participantId=... — Updated Snapshot

Adds `guesses` and `drawing` fields:
```json
{
  "room": {
    "...": "...",
    "guesses": [
      { "participantId": "uuid-def-456", "text": "pizza", "isCorrect": true, "timestamp": "..." }
    ],
    "drawing": [[[10, 20], [30, 40]]]
  }
}
```
