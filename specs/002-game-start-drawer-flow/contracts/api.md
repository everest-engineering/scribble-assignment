# API Contracts: Game Start & Drawer Flow

## GET /rooms/:code?participantId=... — Updated Room Snapshot

**Response (200) — For the Drawer:**
```json
{
  "room": {
    "code": "XK4M",
    "status": "playing",
    "hostId": "uuid-abc-123",
    "currentRound": 1,
    "drawerId": "uuid-abc-123",
    "secretWord": "rocket",
    "participants": [
      { "id": "uuid-abc-123", "name": "Alice", "score": 0 },
      { "id": "uuid-def-456", "name": "Bob", "score": 0 }
    ],
    "isHost": true
  }
}
```

**Response (200) — For a Guesser:**
```json
{
  "room": {
    "code": "XK4M",
    "status": "playing",
    "hostId": "uuid-abc-123",
    "currentRound": 1,
    "drawerId": "uuid-abc-123",
    "secretWord": null,
    "participants": [ ... ],
    "isHost": false
  }
}
```

## POST /rooms/:code/start — Updated (now also creates round 1)

No request/response changes, but internally creates Round 1 with drawer assignment.

**New fields in response**: `currentRound`, `drawerId`, `secretWord`
