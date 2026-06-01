# Contract: Game Actions

## POST `/api/rooms/:code/reveal`

Manually end the round (drawer reveals the word).

**Request Body**:

```json
{
  "participantId": "string"
}
```

**Validation**:
- `participantId` must be the current drawer
- Room must be in `"playing"` status

**Success Response** (200):

```json
{
  "status": "round_ended",
  "secretWord": "apple",
  "scores": [
    { "participantId": "abc", "name": "Alice", "score": 1 },
    { "participantId": "def", "name": "Bob", "score": 0 }
  ]
}
```

**Notes**:
- Transitions room status from `"playing"` to `"round_ended"`
- After reveal, no more strokes, clears, or guesses are accepted
- The secret word is revealed to ALL participants in the response
- Scores are final at this point

**Error Responses**:
- 403: Not the drawer
- 400: Room not in playing state

## Room Snapshot Integration

The room snapshot (GET `/api/rooms/:code`) is extended with:

```json
{
  "status": "playing" | "round_ended",
  "strokes": [],
  "clearVersion": 0,
  "guesses": [],
  "scores": [ /* sorted by score descending */ ],
  "allGuessersCorrect": false,
  "secretWord": "apple"  // Only present when viewer is drawer (playing) OR when round_ended (all)
}
```

**Key behavior**: On `round_ended`, the `secretWord` is revealed to all viewers (not just the drawer). This is the only change to the role-aware projection logic.
