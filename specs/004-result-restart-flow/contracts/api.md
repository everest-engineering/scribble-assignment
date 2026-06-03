# API Contracts: Result, Restart & Final Validation

Base URL: `http://localhost:3001`

---

## New: `POST /rooms/:code/end`

Ends the active round. Transitions the room from `"playing"` to `"ended"` and sets `revealedWord`. Only the host may call this endpoint.

### Request

```
POST /rooms/{code}/end
Content-Type: application/json
```

**Body** (`endRoundSchema`):

| Field           | Type     | Required | Notes                    |
| --------------- | -------- | -------- | ------------------------ |
| `participantId` | `string` | Yes      | Must equal `room.hostId` |

```json
{
  "participantId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

### Responses

| Status            | Body                                               | Condition                          |
| ----------------- | -------------------------------------------------- | ---------------------------------- |
| `200 OK`          | `{ "room": RoomSnapshot }`                         | Round ended; room is now `"ended"` |
| `400 Bad Request` | `{ "message": "string" }`                          | Zod validation failure             |
| `403 Forbidden`   | `{ "message": "Only the host can end the round" }` | `participantId` ≠ `room.hostId`    |
| `404 Not Found`   | `{ "message": "Room not found" }`                  | `code` does not match any room     |
| `409 Conflict`    | `{ "message": "Game is not in progress" }`         | `room.status` ≠ `"playing"`        |

### Response body — `RoomSnapshot` when `status === "ended"`

```json
{
  "code": "ABCD",
  "status": "ended",
  "hostId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "participants": [
    {
      "id": "3fa85f64-…",
      "name": "Alice",
      "joinedAt": "2026-06-04T10:00:00.000Z"
    },
    {
      "id": "b3fc2c96-…",
      "name": "Bob",
      "joinedAt": "2026-06-04T10:00:05.000Z"
    }
  ],
  "availableWords": ["elephant", "bicycle", "…"],
  "roles": ["drawer", "guesser"],
  "currentDrawerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "revealedWord": "elephant",
  "strokes": [
    [
      [
        { "x": 10, "y": 20 },
        { "x": 15, "y": 25 }
      ]
    ]
  ],
  "guesses": [
    {
      "id": "a1b2c3d4-…",
      "participantId": "b3fc2c96-…",
      "text": "elephant",
      "correct": true,
      "submittedAt": "2026-06-04T10:01:30.000Z"
    }
  ],
  "scores": {
    "3fa85f64-5717-4562-b3fc-2c963f66afa6": 0,
    "b3fc2c96-2c963f66afa6-…": 100
  }
}
```

> **Note**: `currentWord` is NOT included in `"ended"` snapshots. `revealedWord` is its replacement for result screen display — no per-viewer masking.

---

## New: `POST /rooms/:code/restart`

Restarts the game from the result screen. Transitions the room from `"ended"` back to `"lobby"`, preserving all participants and clearing all round-specific state. Only the host may call this endpoint.

### Request

```
POST /rooms/{code}/restart
Content-Type: application/json
```

**Body** (`restartRoomSchema`):

| Field           | Type     | Required | Notes                    |
| --------------- | -------- | -------- | ------------------------ |
| `participantId` | `string` | Yes      | Must equal `room.hostId` |

```json
{
  "participantId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

### Responses

| Status            | Body                                                  | Condition                       |
| ----------------- | ----------------------------------------------------- | ------------------------------- |
| `200 OK`          | `{ "room": RoomSnapshot }`                            | Room reset to `"lobby"`         |
| `400 Bad Request` | `{ "message": "string" }`                             | Zod validation failure          |
| `403 Forbidden`   | `{ "message": "Only the host can restart the game" }` | `participantId` ≠ `room.hostId` |
| `404 Not Found`   | `{ "message": "Room not found" }`                     | `code` does not match any room  |
| `409 Conflict`    | `{ "message": "Game has not ended" }`                 | `room.status` ≠ `"ended"`       |

### Response body — `RoomSnapshot` when `status === "lobby"` (after restart)

```json
{
  "code": "ABCD",
  "status": "lobby",
  "hostId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "participants": [
    {
      "id": "3fa85f64-…",
      "name": "Alice",
      "joinedAt": "2026-06-04T10:00:00.000Z"
    },
    {
      "id": "b3fc2c96-…",
      "name": "Bob",
      "joinedAt": "2026-06-04T10:00:05.000Z"
    }
  ],
  "availableWords": ["elephant", "bicycle", "…"],
  "roles": ["drawer", "guesser"]
}
```

> **Note**: All round fields (`currentDrawerId`, `revealedWord`, `strokes`, `guesses`, `scores`) are absent from the lobby snapshot.

---

## Modified: `POST /rooms/:code/guesses`

No change to request or response shape. A correct guess now triggers an internal side-effect: the room status transitions to `"ended"` and `revealedWord` is set. **The caller is not directly notified of the status change** — it propagates to all clients on the next `GET /rooms/:code` poll. The `{ "guess": Guess }` response body is unchanged.

```json
{
  "guess": {
    "id": "a1b2c3d4-…",
    "participantId": "b3fc2c96-…",
    "text": "elephant",
    "correct": true,
    "submittedAt": "2026-06-04T10:01:30.000Z"
  }
}
```

---

## Modified: `GET /rooms/:code`

No change to request. The response snapshot for `status === "ended"` now includes `currentDrawerId`, `revealedWord`, `strokes`, `guesses`, and `scores` in addition to the base lobby fields. See the `POST /rooms/:code/end` response body above for the full shape.

```
GET /rooms/{code}?participantId={participantId}
```

Existing query parameter (`participantId`) behaviour is unchanged — it is used to determine `currentWord` visibility, which is only relevant for `"playing"` status.
