# Contract: Guesses

## POST `/api/rooms/:code/guesses`

Submit a guess for the current round.

**Request Body**:

```json
{
  "participantId": "string",
  "text": "string"
}
```

**Validation**:
- `participantId` must exist in the room
- Must NOT be the drawer
- Room must be in `"playing"` status
- `text`: trimmed, 1-200 chars, not empty/whitespace-only
- Case-insensitive comparison against `secretWord`

**Success Response** (200):

```json
{
  "isCorrect": true,
  "guess": {
    "participantId": "string",
    "text": "string",
    "isCorrect": true,
    "timestamp": "2026-06-01T12:00:00.000Z"
  },
  "allGuessersCorrect": false
}
```

**Notes**:
- `isCorrect`: reflects whether the guess matched the secret word
- `allGuessersCorrect`: convenience flag — true when every non-drawer participant has guessed correctly
- If the guesser has already guessed correctly, the guess is silently ignored (no error, same response as their last correct guess)
- Guesses are always appended to the room's guess history (available to all via snapshot)

**Error Responses**:
- 403: Drawer cannot guess
- 400: Room not in playing state
- 400: Empty guess or exceeds 200 chars
- 404: Room not found
