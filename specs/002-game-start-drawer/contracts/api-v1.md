# API v1: Game Start & Drawer Flow

## POST /rooms/:code/start

**Purpose**: Transition room from lobby to playing. Assigns drawer, selects word.

**Existing endpoint** — behavioral changes only:

### Request

```json
{
  "participantId": "uuid-string"
}
```

### Success Response (200)

```json
{
  "participantId": "uuid-string",
  "room": {
    "code": "ABCD",
    "status": "playing",
    "participants": [
      { "id": "uuid-1", "name": "Alice", "joinedAt": "...", "role": "drawer" },
      { "id": "uuid-2", "name": "Bob", "joinedAt": "...", "role": "guesser" }
    ],
    "hostId": "uuid-1",
    "secretWord": "rocket"
  }
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| 400 | Invalid participantId format |
| 403 | Participant is not the host |
| 403 | Room does not have at least 2 participants |
| 404 | Room not found |
| 409 | Room is not in "lobby" status |

### Behavior Changes

1. **Drawer assignment**: Drawer = host (participant matching `hostId`), not first non-host.
2. **Word selection**: `secretWord = STARTER_WORDS[charCodeSum(room.code) % 5]`, not `STARTER_WORDS[0]` always.

## GET /rooms/:code?participantId=...

**Existing endpoint** — no structural changes. Behavioral note:

- When `room.status === "playing"` and `participantId` matches the drawer's ID, `secretWord` is included in response.
- For all other `participantId` values, `secretWord` is `undefined` in the response.
