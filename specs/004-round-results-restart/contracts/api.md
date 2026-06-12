# API Contracts: Round Results and Game Restart

## Base URL

`http://localhost:3001` (backend dev server)

## Endpoints

### Create Room

`POST /rooms`

Unchanged from feature 001. See `specs/001-create-join-room/contracts/api.md`.

---

### Join Room

`POST /rooms/:code/join`

**Behavior update**: Join is now rejected when `room.status === "results"` (same as `"playing"`).

**Error Responses**:
- `409` — Room is not in lobby state (includes `results` now).

---

### Get Room

`GET /rooms/:code?participantId={id}`

**Path Params**:
- `code`: room code.

**Query Params**:
- `participantId`: optional opaque player ID; used to derive viewer context and control `currentWord` visibility.

**Validation**:
- `code`: must exist. Missing/invalid → `404`.

**Response 200** (viewer in `results` state):
```json
{
  "room": {
    "code": "ABCD",
    "status": "results",
    "participants": [
      { "id": "550e8400-e29b-41d4-a716-446655440000", "name": "Alice", "joinedAt": "2026-06-12T09:00:00.000Z", "score": 100 },
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
          { "x": 150, "y": 150 }
        ],
        "color": "#000000",
        "width": 4
      }
    ]
  }
}
```

**Notes**:
- When `status === "results"`, `currentWord` is revealed to **all** viewers, not just the drawer.
- `canvasStrokes` remains visible in `results` state.
- Polling continues at the same ~2-second interval.

---

### Start Game

`POST /rooms/:code/start`

Unchanged from feature 002. See `specs/002-game-start-drawer/contracts/api.md`.

**Note**: On successful start, room transitions from `lobby` to `playing`.

---

### Submit Guess

`POST /rooms/:code/guess`

Unchanged from feature 003. See `specs/003-draw-guess-score/contracts/api.md`.

**Behavior update**: When the first correct guess is submitted, the room automatically transitions to `results` state. The returned `RoomSnapshot` will have `status: "results"`.

---

### Update Canvas

`POST /rooms/:code/canvas`

Unchanged from feature 003. See `specs/003-draw-guess-score/contracts/api.md`.

**Behavior update**: Rejected with `409` when `room.status !== "playing"` (includes `results` state).

---

### Clear Canvas

`POST /rooms/:code/canvas/clear`

Unchanged from feature 003. See `specs/003-draw-guess-score/contracts/api.md`.

**Behavior update**: Rejected with `409` when `room.status !== "playing"` (includes `results` state).

---

### End Round

`POST /rooms/:code/end`

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
- `participantId`: required, non-empty string. Must match a participant in the room; otherwise → `404`.
- Caller must be the host (`participantId === room.hostParticipantId`). Otherwise → `403`.
- Room must have `status === "playing"`. Otherwise → `409`.

**Response 200**:
```json
{
  "room": {
    "code": "ABCD",
    "status": "results",
    "participants": [ /* ... */ ],
    "hostId": "550e8400-e29b-41d4-a716-446655440000",
    "drawerId": "550e8400-e29b-41d4-a716-446655440000",
    "currentWord": "rocket",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "scores": { /* ... */ },
    "guessHistory": [ /* ... */ ],
    "canvasStrokes": [ /* ... */ ]
  }
}
```

**Error Responses**:
- `400` — Invalid request payload.
- `403` — Only the host can end the round.
- `404` — Room or participant not found.
- `409` — Room is not in an active playing state.

---

### Restart Game

`POST /rooms/:code/restart`

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
- `participantId`: required, non-empty string. Must match a participant in the room; otherwise → `404`.
- Caller must be the host (`participantId === room.hostParticipantId`). Otherwise → `403`.
- Room must have `status === "results"`. Otherwise → `409`.

**Response 200**:
```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": [
      { "id": "550e8400-e29b-41d4-a716-446655440000", "name": "Alice", "joinedAt": "2026-06-12T09:00:00.000Z", "score": 0 },
      { "id": "660e8400-e29b-41d4-a716-446655440001", "name": "Bob", "joinedAt": "2026-06-12T09:00:01.000Z", "score": 0 }
    ],
    "hostId": "550e8400-e29b-41d4-a716-446655440000",
    "drawerId": null,
    "currentWord": null,
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "scores": {},
    "guessHistory": [],
    "canvasStrokes": []
  }
}
```

**Notes**:
- On restart, all round-specific state is cleared: `drawerId`, `currentWord`, `scores`, `guessHistory`, `canvasStrokes`.
- Participant list and host are preserved.
- All participant `score` values are reset to `0`.

**Error Responses**:
- `400` — Invalid request payload.
- `403` — Only the host can restart the game.
- `404` — Room or participant not found.
- `409` — Room is not in results state.

---

## Error Format

All errors return JSON:
```json
{
  "message": "Human-readable description"
}
```

- `400` — Invalid request payload (Zod validation failure).
- `403` — Forbidden action (e.g., non-host ending/restarting).
- `404` — Room or route not found.
- `409` — Conflict (room not in expected state).
- `500` — Unexpected server error.
