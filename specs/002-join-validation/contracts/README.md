# API Contracts: Join Validation

## POST /rooms/:code/join

**Request**:
- Method: `POST`
- Path: `/rooms/:code/join`
- Params: `code` — room code (string, trimmed, min 1 char after trim)
- Body: `{ "playerName": string }` (optional, defaults to "Player")

**Success Response** (200):
```json
{
  "participantId": "uuid-string",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": [
      {
        "id": "uuid-string",
        "name": "Alice",
        "joinedAt": "2026-07-06T00:00:00.000Z",
        "isHost": true
      },
      {
        "id": "uuid-string",
        "name": "Bob",
        "joinedAt": "2026-07-06T00:00:00.000Z",
        "isHost": false
      }
    ]
  }
}
```

**Error Response** (400 — empty/whitespace-only room code):
```json
{
  "message": "Invalid room code. Please try again with correct one."
}
```

**Error Response** (404 — non-existent room code):
```json
{
  "message": "Invalid room code. Please try again with correct one."
}
```

**Notes**:
- Room code is case-insensitive: input is uppercased before lookup
- Whitespace-only codes are treated as empty (trimmed and rejected)
- The same message is returned for both 400 and 404 to avoid leaking room code validity
