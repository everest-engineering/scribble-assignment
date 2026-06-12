# API Contracts: Round Drawing, Guessing, and Scoring

## Base URL

`http://localhost:3001` (backend dev server)

## Endpoints

### Create Room

`POST /rooms`

Unchanged from feature 002. See `specs/002-game-start-drawer/contracts/api.md`.

---

### Join Room

`POST /rooms/:code/join`

Unchanged from feature 002. See `specs/002-game-start-drawer/contracts/api.md`.

---

### Get Room

`GET /rooms/:code?participantId={id}`

**Path Params**:
- `code`: room code.

**Query Params**:
- `participantId`: optional opaque player ID; used to derive viewer context and control `currentWord` visibility.

**Validation**:
- `code`: must exist. Missing/invalid → `404`.

**Response 200** (viewer is drawer, round ended with correct guess):
```json
{
  "room": {
    "code": "ABCD",
    "status": "results",
    "participants": [
      { "id": "550e8400-e29b-41d4-a716-446655440000", "name": "Alice", "joinedAt": "2026-06-12T09:00:00.000Z", "score": 0 },
      { "id": "660e8400-e29b-41d4-a716-446655440001", "name": "Bob", "joinedAt": "2026-06-12T09:00:01.000Z", "score": 100 }
    ],
    "hostId": "550e8400-e29b-41d4-a716-446655440000",
    "drawerId": "550e8400-e29b-41d4-a716-446655440000",
    "currentWord": "rocket",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "scores": {
      "550e8400-e29b-41d4-a716-446655440000": 0,
      "660e8400-e29b-41d4-a716-446655440001": 100
    },
    "guessHistory": [
      {
        "participantId": "660e8400-e29b-41d4-a716-446655440001",
        "guess": "Rocket",
        "isCorrect": true,
        "submittedAt": "2026-06-12T09:01:00.000Z"
      }
    ],
    "canvasStrokes": [
      {
        "points": [
          { "x": 100, "y": 100 },
          { "x": 150, "y": 150 },
          { "x": 200, "y": 100 }
        ],
        "color": "#000000",
        "width": 4
      }
    ]
  }
}
```

**Response 200** (viewer is guesser):
- Same structure, but `currentWord` is `null`.

---

### Start Game

`POST /rooms/:code/start`

Unchanged from feature 002. See `specs/002-game-start-drawer/contracts/api.md`.

**Note**: On successful start, the returned `RoomSnapshot` now includes `scores` (initialized to `0` for all participants), `guessHistory` (empty), and `canvasStrokes` (empty).

---

### Submit Guess

`POST /rooms/:code/guess`

**Path Params**:
- `code`: room code.

**Request Body** (JSON):
```json
{
  "participantId": "660e8400-e29b-41d4-a716-446655440001",
  "guess": "  Rocket  "
}
```

**Validation**:
- `code`: must exist. Missing/invalid → `404`.
- `participantId`: required, non-empty string. Must match a participant in the room; otherwise → `404`.
- `guess`: required, non-empty after trim, max 100 characters. Empty/whitespace-only or over 100 chars → `400`.
- Room must have `status === "playing"` and `currentWord !== null`. Otherwise → `409`.
- Caller must NOT be the drawer (`participantId !== room.drawerId`). Otherwise → `403`.

**Response 200**:
```json
{
  "guess": {
    "participantId": "660e8400-e29b-41d4-a716-446655440001",
    "guess": "Rocket",
    "isCorrect": true,
    "submittedAt": "2026-06-12T09:01:00.000Z"
  },
  "scoreAwarded": 100,
  "room": { /* updated RoomSnapshot */ }
}
```

**Response 200** (incorrect guess):
```json
{
  "guess": {
    "participantId": "660e8400-e29b-41d4-a716-446655440001",
    "guess": "pizza",
    "isCorrect": false,
    "submittedAt": "2026-06-12T09:01:00.000Z"
  },
  "scoreAwarded": 0,
  "room": { /* updated RoomSnapshot */ }
}
```

**Error Responses**:
- `400` — Empty or whitespace-only guess.
- `403` — Caller is the drawer.
- `404` — Room does not exist.
- `409` — Room is not in an active playing state.

---

### Update Canvas

`POST /rooms/:code/canvas`

**Path Params**:
- `code`: room code.

**Request Body** (JSON):
```json
{
  "participantId": "550e8400-e29b-41d4-a716-446655440000",
  "stroke": {
    "points": [
      { "x": 100, "y": 100 },
      { "x": 150, "y": 150 },
      { "x": 200, "y": 100 }
    ],
    "color": "#000000",
    "width": 4
  }
}
```

**Validation**:
- `code`: must exist. Missing/invalid → `404`.
- `participantId`: required, non-empty string.
- `stroke`: required object with `points` (array of `{x, y}`, min 2, max 500), `color` (string), `width` (number).
- Caller must match `room.drawerId`. Otherwise → `403`.
- Room must have `status === "playing"`. Otherwise → `409`.

**Response 200**:
```json
{
  "room": { /* updated RoomSnapshot */ }
}
```

**Error Responses**:
- `400` — Invalid stroke payload.
- `403` — Caller is not the drawer.
- `404` — Room does not exist.
- `409` — Room is not in an active playing state.

---

### Clear Canvas

`POST /rooms/:code/canvas/clear`

**Path Params**:
- `code`: room code.

**Request Body** (JSON):
```json
{
  "participantId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Validation**:
- `code`: must exist. Missing/invalid → `404`.
- `participantId`: required, non-empty string.
- Caller must match `room.drawerId`. Otherwise → `403`.
- Room must have `status === "playing"`. Otherwise → `409`.

**Response 200**:
```json
{
  "room": { /* updated RoomSnapshot with canvasStrokes: [] */ }
}
```

**Error Responses**:
- `400` — Invalid payload.
- `403` — Caller is not the drawer.
- `404` — Room does not exist.
- `409` — Room is not in an active playing state.

---

## Error Format

All errors return JSON:
```json
{
  "message": "Human-readable description"
}
```

- `400` — Invalid request payload (Zod validation failure or empty guess).
- `403` — Forbidden action (e.g., drawer trying to guess, non-drawer updating canvas).
- `404` — Room or route not found.
- `409` — Conflict (room not in playing state).
- `500` — Unexpected server error.
