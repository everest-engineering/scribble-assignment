# Contract: POST /rooms/:code/start

**Starts the game. Host-only; requires at least 2 players.**

## Request

```
POST /rooms/:code/start
Content-Type: application/json
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `code` | `string` | Room code (case-insensitive; normalised to uppercase) |

### Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `participantId` | `string` | Yes | Must match `room.hostId` |

```json
{ "participantId": "uuid-of-alice" }
```

## Response — 200 OK

Returns the updated room snapshot with `status: "playing"`.

```json
{
  "room": {
    "code": "A3KZ",
    "status": "playing",
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
| 400 | Malformed JSON or missing `participantId` | `{ "message": "Invalid request payload" }` |
| 403 | `participantId` does not match `room.hostId` | `{ "message": "Only the host can start the game" }` |
| 409 | Fewer than 2 players in the room | `{ "message": "At least 2 players are required to start" }` |
| 404 | Room code not found | `{ "message": "Unable to load room" }` |
| 500 | Unexpected server error | `{ "message": "Unexpected server error" }` |

## Notes

- The room status MUST NOT change if any error is returned.
- Non-host players who receive a 403 on a direct API call confirms FR-010 is enforced server-side.
- After the host starts the game, non-host players detect the `"playing"` status on their next
  lobby poll and navigate to the game screen automatically.
