# Contract: POST /rooms/:code/start (extended for Scenario 2)

**Starts the game. Now also assigns the drawer and selects the secret word.**

This contract extends the Scenario 1 definition. The request shape is unchanged; the
response now includes `drawerId` and `secretWord` in the snapshot.

## Request

```
POST /rooms/:code/start
Content-Type: application/json

{ "participantId": "uuid-alice" }
```

## Response — 200 OK

The calling participant is always the host (and therefore the drawer), so `secretWord`
is always included in this response.

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

## Error Responses

Unchanged from Scenario 1 (403 non-host, 409 insufficient players, 404 room not found).

## Notes

- `drawerId` is always `hostId` for this lab scope.
- `secretWord` is always `STARTER_WORDS[0]` ("rocket") — deterministic selection.
- The word is returned in the start response because the caller (host) is the drawer.
