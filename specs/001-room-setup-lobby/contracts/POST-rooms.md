# Contract: POST /rooms

**Creates a new room and returns the host's session.**

## Request

```
POST /rooms
Content-Type: application/json
```

### Body

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `playerName` | `string` | No | Trimmed value must be non-empty; 400 if whitespace-only |

```json
{ "playerName": "Alice" }
```

## Response — 201 Created

```json
{
  "participantId": "uuid-of-alice",
  "room": {
    "code": "A3KZ",
    "status": "lobby",
    "participants": [
      { "id": "uuid-of-alice", "name": "Alice", "joinedAt": "2026-06-04T10:00:00.000Z" }
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
| 500 | Unexpected server error | `{ "message": "Unexpected server error" }` |

## Notes

- `hostId` in the snapshot equals `participantId` — the creator is always the host.
- `code` is a 4-character uppercase alphanumeric string (ambiguous characters I, O, 1, 0 excluded).
