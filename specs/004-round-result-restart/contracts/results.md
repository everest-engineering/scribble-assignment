# Contract: Results State

## Room Snapshot Integration

The room snapshot (GET `/api/rooms/:code`) returns results data when the room is in the `"results"` state:

```json
{
  "code": "ABC1",
  "status": "results",
  "hostId": "uuid-1",
  "drawerId": "uuid-1",
  "secretWord": "apple",
  "yourRole": "guesser",
  "participants": [
    { "id": "uuid-1", "name": "Alice", "joinedAt": "..." },
    { "id": "uuid-2", "name": "Bob", "joinedAt": "..." }
  ],
  "strokes": [],
  "clearVersion": 0,
  "guesses": [
    { "participantId": "uuid-2", "text": "apple", "isCorrect": true, "timestamp": "..." },
    { "participantId": "uuid-2", "text": "pear", "isCorrect": false, "timestamp": "..." }
  ],
  "scores": [
    { "participantId": "uuid-2", "name": "Bob", "score": 1 },
    { "participantId": "uuid-1", "name": "Alice", "score": 0 }
  ],
  "allGuessersCorrect": true
}
```

**Key behavior**: On `"results"` status, the `secretWord` is revealed to all viewers (not just the drawer). All existing snapshot fields (strokes, guesses, scores) remain readable. No new strokes, guesses, or clears are accepted.

**Status transition**: The room enters `"results"` automatically when a round ends (all guessers correct or drawer reveals). There is no separate endpoint — it's a server-side state transition.
