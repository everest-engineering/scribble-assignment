# Contract: Play Again (Restart)

## POST `/api/rooms/:code/play-again`

Resets the room from `"results"` state back to `"lobby"`, preserving all players but clearing round data.

**Request Body**:

```json
{
  "participantId": "string"
}
```

**Validation**:
- `participantId` must be a participant in the room
- Room must exist

**Success Response** (200):

```json
{
  "room": {
    "code": "ABC1",
    "status": "lobby",
    "hostId": "uuid-1",
    "drawerId": null,
    "secretWord": null,
    "participants": [
      { "id": "uuid-1", "name": "Alice", "joinedAt": "..." },
      { "id": "uuid-2", "name": "Bob", "joinedAt": "..." }
    ],
    "strokes": [],
    "clearVersion": 0,
    "guesses": [],
    "scores": [],
    "allGuessersCorrect": false
  }
}
```

**Notes**:
- Idempotent: if room is already in `"lobby"`, returns current snapshot with no changes
- Any participant can trigger restart (not just host)
- Host reassignment follows existing rules if the host has left
- After restart, the host can start a new game via the existing `POST /:code/start` endpoint

**Error Responses**:
- 404: Room not found
- 404: Participant not found in room
