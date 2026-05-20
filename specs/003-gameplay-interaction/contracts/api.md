# API Contracts: Gameplay Interaction

Base URL: `http://localhost:3001`

All requests and responses use `Content-Type: application/json`.

## Changes from Phase 2

- `RoomSnapshot.currentRound` gains `strokes`, `guesses`, `scores`, `correctGuessers` fields
- `POST /rooms/:code/draw` — new endpoint for saving/clearing canvas strokes
- `POST /rooms/:code/guess` — new endpoint for submitting guesses
- `GET /rooms/:code` returns extended snapshot with gameplay state

---

## POST /rooms/:code/draw

Save (replace) the full canvas strokes array for the current round. Called by the drawer on each completed stroke or on canvas clear.

**URL parameters:**

| Field | Type | Constraints |
|-------|------|-------------|
| `code` | `string` | Room code. Case-insensitive. |

**Request body:**

```json
{
  "participantId": "uuid-of-drawer",
  "strokes": [
    {
      "points": [{ "x": 0.1, "y": 0.2 }, { "x": 0.3, "y": 0.4 }, { "x": 0.5, "y": 0.6 }],
      "color": "#000000",
      "width": 3
    }
  ]
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `participantId` | `string` | Yes | Must be the round's drawer |
| `strokes` | `CanvasStroke[]` | Yes | Each stroke has 2+ points. Empty array = clear canvas. |

**Response `200`:**

```json
{
  "room": {
    "code": "A3X9",
    "status": "active",
    "currentRound": {
      "number": 1,
      "drawerId": "uuid-of-alice",
      "secretWord": "rocket",
      "status": "drawing",
      "strokes": [
        {
          "points": [{ "x": 0.1, "y": 0.2 }, { "x": 0.3, "y": 0.4 }],
          "color": "#000000",
          "width": 3
        }
      ],
      "guesses": [],
      "scores": { "uuid-of-alice": 0, "uuid-of-bob": 0 },
      "correctGuessers": []
    },
    "participants": [
      { "id": "uuid-of-alice", "name": "Alice" },
      { "id": "uuid-of-bob", "name": "Bob" }
    ]
  }
}
```

**Errors:**

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Missing/invalid `participantId` | `{ "message": "Participant ID required" }` |
| 403 | Non-drawer tries to draw | `{ "message": "Only the drawer can update the canvas" }` |
| 404 | Room not found | `{ "message": "Room not found" }` |
| 400 | Stroke has fewer than 2 points | `{ "message": "Each stroke must have at least 2 points" }` |

---

## POST /rooms/:code/guess

Submit a guess for the current round. Validates, evaluates, and updates score if correct.

**URL parameters:**

| Field | Type | Constraints |
|-------|------|-------------|
| `code` | `string` | Room code. Case-insensitive. |

**Request body:**

```json
{
  "participantId": "uuid-of-bob",
  "text": "  rocket  "
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `participantId` | `string` | Yes | Must be a guesser (not the drawer) |
| `text` | `string` | Yes | Will be trimmed. 1-50 chars after trim. |

**Response `200` (incorrect guess):**

```json
{
  "guess": {
    "participantId": "uuid-of-bob",
    "guesserName": "Bob",
    "text": "rocket",
    "submittedAt": "2026-05-20T12:00:00.000Z",
    "isCorrect": false
  },
  "room": {
    "code": "A3X9",
    "status": "active",
    "currentRound": {
      "number": 1,
      "drawerId": "uuid-of-alice",
      "secretWord": "rocket",
      "status": "drawing",
      "strokes": [],
      "guesses": [
        {
          "participantId": "uuid-of-bob",
          "guesserName": "Bob",
          "text": "rocket",
          "submittedAt": "2026-05-20T12:00:00.000Z",
          "isCorrect": false
        }
      ],
      "scores": { "uuid-of-alice": 0, "uuid-of-bob": 0 },
      "correctGuessers": []
    }
  }
}
```

**Response `200` (correct guess — user gets 100 points, added to correctGuessers):**

```json
{
  "guess": {
    "participantId": "uuid-of-bob",
    "guesserName": "Bob",
    "text": "rocket",
    "submittedAt": "2026-05-20T12:00:01.000Z",
    "isCorrect": true
  },
  "room": {
    "code": "A3X9",
    "status": "active",
    "currentRound": {
      "number": 1,
      "drawerId": "uuid-of-alice",
      "secretWord": "rocket",
      "status": "drawing",
      "strokes": [],
      "guesses": [
        {
          "participantId": "uuid-of-bob",
          "guesserName": "Bob",
          "text": "rocket",
          "submittedAt": "2026-05-20T12:00:01.000Z",
          "isCorrect": true
        }
      ],
      "scores": { "uuid-of-alice": 0, "uuid-of-bob": 100 },
      "correctGuessers": ["uuid-of-bob"]
    }
  }
}
```

**Errors:**

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Missing `participantId` | `{ "message": "Participant ID required" }` |
| 400 | Empty guess after trimming | `{ "message": "Guess cannot be empty" }` |
| 400 | Guess exceeds 50 characters | `{ "message": "Guess must be 50 characters or fewer" }` |
| 403 | Drawer tries to guess | `{ "message": "Drawer cannot submit guesses" }` |
| 403 | Already guessed correctly | `{ "message": "You have already guessed the word correctly" }` |
| 404 | Room not found | `{ "message": "Room not found" }` |

---

## GET /rooms/:code

Fetch the current room snapshot. Extended to include gameplay state.

**URL parameters:**

| Field | Type | Constraints |
|-------|------|-------------|
| `code` | `string` | Room code. Case-insensitive. |

**Query parameters:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `participantId` | `string` | No | UUID of requesting participant |

**Response `200` (game active — full gameplay state):**

```json
{
  "room": {
    "code": "A3X9",
    "status": "active",
    "currentRound": {
      "number": 1,
      "drawerId": "uuid-of-alice",
      "secretWord": "rocket",
      "status": "drawing",
      "strokes": [
        {
          "points": [{ "x": 0.1, "y": 0.2 }, { "x": 0.3, "y": 0.4 }],
          "color": "#000000",
          "width": 3
        }
      ],
      "guesses": [
        {
          "participantId": "uuid-of-bob",
          "guesserName": "Bob",
          "text": "house",
          "submittedAt": "2026-05-20T12:00:00.000Z",
          "isCorrect": false
        },
        {
          "participantId": "uuid-of-charlie",
          "guesserName": "Charlie",
          "text": "rocket",
          "submittedAt": "2026-05-20T12:00:05.000Z",
          "isCorrect": true
        }
      ],
      "scores": { "uuid-of-alice": 0, "uuid-of-bob": 0, "uuid-of-charlie": 100 },
      "correctGuessers": ["uuid-of-charlie"]
    },
    "participants": [
      { "id": "uuid-of-alice", "name": "Alice", "role": "drawer" },
      { "id": "uuid-of-bob", "name": "Bob", "role": "guesser" },
      { "id": "uuid-of-charlie", "name": "Charlie", "role": "guesser" }
    ]
  }
}
```

**Errors:**

| Status | Condition | Body |
|--------|-----------|------|
| 404 | Room code not found | `{ "message": "Room not found" }` |

---

## Unchanged Endpoints

The following endpoints remain unchanged from Phase 2:
- `POST /rooms` — Create room
- `POST /rooms/:code/join` — Join room
- `POST /rooms/:code/start` — Start game
