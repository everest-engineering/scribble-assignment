# Contract: GET /rooms/:code (playing status — role-filtered response)

**Fetches the room snapshot during an active game. Response varies by viewer role.**

This contract extends the Scenario 1 definition to document the role-filtered behaviour
introduced in Scenario 2. The endpoint and path are unchanged.

## Request

```
GET /rooms/:code?participantId=<uuid>
```

`participantId` MUST be provided when the room is in `"playing"` status so that the server
can determine whether to include `secretWord`.

## Response — 200 OK (drawer's view)

```json
{
  "room": {
    "code": "A3KZ",
    "status": "playing",
    "participants": [
      { "id": "uuid-alice", "name": "Alice", "joinedAt": "..." },
      { "id": "uuid-bob",   "name": "Bob",   "joinedAt": "..." }
    ],
    "hostId": "uuid-alice",
    "drawerId": "uuid-alice",
    "secretWord": "rocket",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

## Response — 200 OK (guesser's view)

```json
{
  "room": {
    "code": "A3KZ",
    "status": "playing",
    "participants": [
      { "id": "uuid-alice", "name": "Alice", "joinedAt": "..." },
      { "id": "uuid-bob",   "name": "Bob",   "joinedAt": "..." }
    ],
    "hostId": "uuid-alice",
    "drawerId": "uuid-alice",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

Note: `secretWord` is **absent** from the guesser's response — not `null`, not an empty string.

## Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 404 | Room not found | `{ "message": "Unable to load room" }` |
| 500 | Unexpected error | `{ "message": "Unexpected server error" }` |

## Notes

- `drawerId` is always present in the snapshot when `status === "playing"`.
- `secretWord` is present **only** when `participantId === drawerId`.
- If `participantId` is omitted and the room is playing, `secretWord` will be absent
  (safe default — no accidental word leakage).
