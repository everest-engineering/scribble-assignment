# Contract: GET /rooms/:code

**Fetches the current snapshot of a room (used for lobby polling).**

## Request

```
GET /rooms/:code?participantId=<uuid>
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `code` | `string` | Room code (case-insensitive; normalised to uppercase) |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `participantId` | `string` | No | Viewer's participant ID (used in future scenarios for role-filtered responses) |

## Response — 200 OK

```json
{
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
| 404 | Room code not found | `{ "message": "Unable to load room" }` |
| 500 | Unexpected server error | `{ "message": "Unexpected server error" }` |

## Notes

- This endpoint is polled by the lobby at ~2-second intervals.
- A 404 response means the room no longer exists (e.g., backend restarted); the client
  MUST redirect to the Start screen with an error message.
- A transient error (5xx, network failure) MUST be shown inline; polling continues.
