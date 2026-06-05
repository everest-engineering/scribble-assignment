# Contract: POST /rooms/:code/join

**Adds a player to an existing room.**

## Request

```
POST /rooms/:code/join
Content-Type: application/json
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `code` | `string` | Room code (case-insensitive; normalised to uppercase) |

### Body

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `playerName` | `string` | No | Trimmed value must be non-empty; 400 if whitespace-only |

```json
{ "playerName": "Bob" }
```

## Response — 200 OK

```json
{
  "participantId": "uuid-of-bob",
  "room": {
    "code": "A3KZ",
    "status": "lobby",
    "participants": [
      { "id": "uuid-of-alice", "name": "Alice", "joinedAt": "2026-06-04T10:00:00.000Z" },
      { "id": "uuid-of-bob",   "name": "Bob",   "joinedAt": "2026-06-04T10:01:00.000Z" }
    ],
    "hostId": "uuid-of-alice",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

## Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 400 | `playerName` is empty or whitespace-only | `{ "message": "Player name is required" }` |
| 400 | Malformed JSON body | `{ "message": "Invalid request payload" }` |
| 404 | Room code not found | `{ "message": "Unable to join room" }` |
| 500 | Unexpected server error | `{ "message": "Unexpected server error" }` |

## Notes

- `hostId` remains the creating player's ID; joining does not change the host.
- The code is normalised to uppercase before lookup, so `a3kz` and `A3KZ` resolve identically.
