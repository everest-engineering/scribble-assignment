# API Contract: Gameplay Interaction

**Phase 1 output** | **Date**: 2026-05-30

## Overview

Adds three new endpoints for the gameplay loop (guess submission, canvas update, canvas clear) and extends the existing `GET /rooms/:code` polling response with new fields. All existing endpoints remain unchanged.

## New Endpoints

### POST /rooms/:code/guess

**Purpose**: Submit a guess for the current round.

**Request**:

```json
{
  "participantId": "string",
  "text": "string"
}
```

**Validation** (Zod):
- `participantId`: non-empty string
- `text`: string, trimmed server-side (leading/trailing whitespace removed before processing)

**Response: Correct guess** — `200 OK`

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "participants": [ /* full participant list */ ],
    "roundNumber": 1,
    "drawerId": "participant-uuid",
    "currentWord": "rocket",
    "strokes": [ /* current canvas strokes */ ],
    "guesses": [
      {
        "participantId": "guesser-uuid",
        "guesserName": "Player1",
        "text": "rocket",
        "isCorrect": true,
        "timestamp": "2026-05-30T12:00:00.000Z"
      }
    ],
    "scores": {
      "guesser-uuid": 100
    }
  }
}
```

**Response: Incorrect guess** — `200 OK`

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "participants": [ /* full list */ ],
    "roundNumber": 1,
    "drawerId": "participant-uuid",
    "strokes": [ /* current canvas strokes */ ],
    "guesses": [
      {
        "participantId": "guesser-uuid",
        "guesserName": "Player1",
        "text": "wronganswer",
        "isCorrect": false,
        "timestamp": "2026-05-30T12:00:00.000Z"
      }
    ],
    "scores": {
      "guesser-uuid": 0
    }
  }
}
```

**Response: Drawer cannot guess** — `400 Bad Request`

```json
{
  "error": "Drawer cannot submit guesses"
}
```

**Response: Empty guess** — `400 Bad Request`

```json
{
  "error": "Guess cannot be empty"
}
```

**Response: Room not in playing state** — `400 Bad Request`

```json
{
  "error": "No active round to guess in"
}
```

**Response: Already guessed correctly** — `200 OK` (guess recorded but no score)

The same room snapshot is returned. The guess appears in `guesses` but the score does not increase.

**Processing logic (server-side)**:
1. Validate room exists and status is `"playing"`.
2. Validate submitter is a guesser (not the drawer).
3. Trim `text`.
4. If empty after trim → reject with 400.
5. Compare trimmed text against the round's `word` (case-insensitive).
6. If correct and the guesser hasn't already scored this round → add 100 points.
7. Append `Guess` object to `round.guesses[]`.
8. Return updated `RoomSnapshot`.

---

### POST /rooms/:code/canvas

**Purpose**: Submit new canvas strokes (drawn by the drawer).

**Request**:

```json
{
  "participantId": "string",
  "strokes": [
    {
      "points": [
        { "x": 10, "y": 20 },
        { "x": 30, "y": 40 }
      ],
      "color": "#000000",
      "width": 3
    }
  ]
}
```

**Validation** (Zod):
- `participantId`: non-empty string
- `strokes`: non-empty array of `Stroke` objects
  - `points`: non-empty array of `{ x: number, y: number }`
  - `color`: string
  - `width`: positive number

**Response: Success** — `200 OK`

```json
{
  "room": {
    /* full room snapshot with updated strokes */
  }
}
```

**Response: Not drawer** — `403 Forbidden`

```json
{
  "error": "Only the drawer can update the canvas"
}
```

**Processing logic**:
1. Validate room exists and status is `"playing"`.
2. Validate submitter is the drawer.
3. Append submitted strokes to `round.strokes[]`.
4. Return updated `RoomSnapshot`.

---

### POST /rooms/:code/canvas/clear

**Purpose**: Clear all canvas strokes (by the drawer).

**Request**:

```json
{
  "participantId": "string"
}
```

**Validation** (Zod):
- `participantId`: non-empty string

**Response: Success** — `200 OK`

```json
{
  "room": {
    /* full room snapshot with empty strokes array */
  }
}
```

**Response: Not drawer** — `403 Forbidden`

```json
{
  "error": "Only the drawer can clear the canvas"
}
```

**Processing logic**:
1. Validate room exists and status is `"playing"`.
2. Validate submitter is the drawer.
3. Set `round.strokes = []`.
4. Return updated `RoomSnapshot`.

---

## Extended Endpoint

### GET /rooms/:code (with `?participantId=`)

**Extended response** — new fields added to the existing `RoomSnapshot` when status is `"playing"`:

```json
{
  "code": "ABCD",
  "status": "playing",
  "participants": [ /* full list */ ],
  "roundNumber": 1,
  "drawerId": "participant-uuid",
  "currentWord": "rocket",           // ONLY when viewerParticipantId === drawerId
  "strokes": [ /* Stroke[] — current canvas state */ ],
  "guesses": [ /* Guess[] — full guess history */ ],
  "scores": {
    "participant-uuid-1": 100,
    "participant-uuid-2": 0,
    "participant-uuid-3": 0
  }
}
```

- `strokes`: Sent to ALL players (all need to see the canvas).
- `guesses`: Sent to ALL players (all need to see the guess history).
- `scores`: Sent to ALL players (scoreboard visibility).
- `currentWord`: Only the drawer sees this (existing behavior).

**When status is `"lobby"` or `"awaiting_rename"`**: `strokes`, `guesses`, and `scores` are absent or empty.

## Error Responses (all endpoints)

All errors follow the existing pattern:

```json
{
  "error": "Human-readable error message"
}
```

Error codes: 400 (validation), 403 (drawer-only action), 404 (room not found), 500 (server error).
