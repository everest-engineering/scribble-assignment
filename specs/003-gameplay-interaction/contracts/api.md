# API Contracts: Gameplay Interaction

## POST /api/rooms/:code/guess (new)

Submit a guess for an active round.

**Request**
```json
{
  "participantId": "<uuid>",
  "text": "ROCKET"
}
```

**Validation**:
- `text` is trimmed before comparison; empty or whitespace-only results in a 400 error.
- `participantId` must correspond to a participant in the room.
- Submitting while `status !== "active"` returns 400.

**Response 200 — Correct guess**
```json
{
  "guess": {
    "participantId": "<uuid>",
    "text": "ROCKET",
    "isCorrect": true,
    "submittedAt": "2026-06-09T12:00:00.000Z"
  },
  "scoreAwarded": 100,
  "room": { ...RoomSnapshot }
}
```

**Response 200 — Incorrect guess**
```json
{
  "guess": {
    "participantId": "<uuid>",
    "text": "pizza",
    "isCorrect": false,
    "submittedAt": "2026-06-09T12:00:01.000Z"
  },
  "scoreAwarded": 0,
  "room": { ...RoomSnapshot }
}
```

**Response 400 — Empty guess**
```json
{ "message": "Guess cannot be empty." }
```

**Response 404 — Room not found**
```json
{ "message": "Room not found." }
```

---

## GET /api/rooms/:code?participantId=<id> (extended)

This endpoint now returns `scores` and `guesses` in the snapshot for all viewers.

**Response 200 (extended)**
```json
{
  "room": {
    "code": "ABCD",
    "status": "active",
    "hostId": "<uuid>",
    "drawerId": "<uuid>",
    "secretWord": "rocket",
    "participants": [...],
    "availableWords": ["rocket","pizza","castle","guitar","sunflower"],
    "roles": ["drawer","guesser"],
    "scores": {
      "<drawer-uuid>": 0,
      "<guesser-uuid>": 100
    },
    "guesses": [
      {
        "participantId": "<guesser-uuid>",
        "text": "pizza",
        "isCorrect": false,
        "submittedAt": "2026-06-09T12:00:00.000Z"
      },
      {
        "participantId": "<guesser-uuid>",
        "text": "ROCKET",
        "isCorrect": true,
        "submittedAt": "2026-06-09T12:00:01.000Z"
      }
    ]
  }
}
```

**Key rules**:
- `scores` is always returned for all viewers.
- `guesses` is always returned in full for all viewers (not viewer-gated).
- `secretWord` remains viewer-gated (null for non-drawers), as in FG2.
