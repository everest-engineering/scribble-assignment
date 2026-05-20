# API Contracts: Result, Restart And Final Validation

## POST /:code/restart

Host restarts the game, returning all players to the lobby.

**Request body**:
```json
{
  "participantId": "string (uuid)"
}
```

**Success response** (200):
```json
{
  "room": {
    "code": "string",
    "status": "lobby",
    "hostId": "string",
    "participants": [ { "id": "string", "name": "string", "joinedAt": "string (ISO)" } ],
    "currentRound": null,
    "availableWords": ["string"],
    "roles": ["string"]
  }
}
```

**Error responses**:
- 404: Room not found
- 403: Only the host can restart
- 400: No round to restart (room is not in result state)

## Room Status Flow (GET /:code)

The `status` field in `RoomSnapshot` now has three values:

| Value | Meaning |
|-------|---------|
| `"lobby"` | Room created, waiting to start |
| `"active"` | Game in progress, round active |
| `"result"` | Round ended, showing results |

In `"result"` status:
- `currentRound.secretWord` is visible to ALL viewers (not just drawer)
- `currentRound.strokes`, `guesses`, `scores`, `correctGuessers` are all populated
- Frontend shows `ResultView` instead of game UI
- Restart button shown only if viewer is host
