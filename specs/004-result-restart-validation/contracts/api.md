# API Contract: Result, Restart & Final Validation

## GET /rooms/:code

Returns `RoomSnapshot` including result fields when the room is in `finished`
state.

**Status: 200 OK**

```json
{
  "code": "ABC123",
  "status": "finished",
  "participants": [
    { "id": "p1", "name": "Alice", "isHost": true, "score": 100 },
    { "id": "p2", "name": "Bob", "isHost": false, "score": 0 }
  ],
  "secretWord": "rocket",
  "guessHistory": [
    {
      "id": "g1",
      "participantId": "p2",
      "playerName": "Bob",
      "text": "spaceship",
      "correct": false,
      "timestamp": "2026-06-12T10:00:00Z"
    },
    {
      "id": "g2",
      "participantId": "p2",
      "playerName": "Bob",
      "text": "rocket",
      "correct": true,
      "timestamp": "2026-06-12T10:00:05Z"
    }
  ],
  "scores": { "p1": 100, "p2": 0 },
  "endedAt": "2026-06-12T10:00:10Z",
  "playerCount": 2
}
```

**Notes**:
- `secretWord` is visible to ALL players when `status === "finished"` (unlike
  the `playing` state where it is drawer-only).
- `guessHistory` is the complete, chronological list from the round.
- `scores` reflects final values after all guesses in the round.

## POST /rooms/:code/restart

Initiates a restart, transitioning the room from `finished` back to `waiting`
(lobby). Clears all round state while preserving the participant list.

**Request body**:

```json
{
  "participantId": "p1"
}
```

**Status: 200 OK** — restart successful.

```json
{
  "code": "ABC123",
  "status": "waiting",
  "participants": [
    { "id": "p1", "name": "Alice", "isHost": true, "score": 0 },
    { "id": "p2", "name": "Bob", "isHost": false, "score": 0 }
  ],
  "playerCount": 2
}
```

**Status: 403 Forbidden** — non-host attempted restart.

```json
{
  "error": "Only the host can restart the game"
}
```

**Status: 409 Conflict** — room is not in `finished` state.

```json
{
  "error": "Room is not in a finished state"
}
```

**Validation rules**:
- `participantId` must match the room host.
- Room `status` must be `"finished"`.
- On success: scores reset to 0, round state cleared, participants preserved.
