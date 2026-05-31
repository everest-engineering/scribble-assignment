# Contract: End Round

## `POST /rooms/:code/end-round`

Transitions a room from `"in-progress"` to `"finished"`. Host-only.

---

### Request

**Path parameter**: `code` — the 4-character room code

**Headers**: `Content-Type: application/json`

**Body**:
```json
{
  "participantId": "<uuid>"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `participantId` | string (UUID) | Yes | Caller's participant ID; must match `room.hostId` |

---

### Responses

#### 200 OK — Round ended successfully
```json
{
  "room": {
    "code": "ABCD",
    "status": "finished",
    "hostId": "<uuid>",
    "participants": [
      { "id": "<uuid>", "name": "Alice", "joinedAt": "<iso-date>" }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "currentDrawerId": "<uuid>",
    "secretWord": "pizza",
    "result": {
      "revealedWord": "pizza",
      "scores": { "<uuid>": 100, "<uuid2>": 0 },
      "guesses": [
        {
          "guesserName": "Bob",
          "guessText": "pizza",
          "isCorrect": true,
          "submittedAt": "<iso-date>"
        }
      ]
    }
  }
}
```

#### 403 Forbidden — Caller is not the host
```json
{ "error": "Only the host can end the round" }
```

#### 404 Not Found — Room does not exist
```json
{ "error": "Room not found" }
```

#### 409 Conflict — Room is not in-progress
```json
{ "error": "Round can only be ended from in-progress state" }
```

---

### Side Effects

- `room.status` changes from `"in-progress"` to `"finished"`
- `room.updatedAt` is refreshed
- `room.currentRound` is preserved (not cleared); it is the source of truth for result data
- All participants polled by `GET /rooms/:code` will receive the `"finished"` snapshot
  with `secretWord` and `result` fields populated
