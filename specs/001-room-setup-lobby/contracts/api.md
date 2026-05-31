# API Contracts: Room Setup & Lobby

## POST /rooms — Create Room

**Request:**
```json
{
  "playerName": "Alice"           // Required, non-empty after trim
}
```

**Response (201):**
```json
{
  "participantId": "uuid-abc-123",
  "room": {
    "code": "XK4M",
    "status": "lobby",
    "hostId": "uuid-abc-123",
    "participants": [
      {
        "id": "uuid-abc-123",
        "name": "Alice",
        "joinedAt": "2026-05-31T12:00:00.000Z",
        "score": 0
      }
    ]
  }
}
```

**Error (400):**
```json
{ "error": "Player name is required" }
```

---

## POST /rooms/:code/join — Join Room

**Request:**
```json
{
  "playerName": "Bob"             // Required, non-empty after trim
}
```

**Response (200):**
```json
{
  "participantId": "uuid-def-456",
  "room": {
    "code": "XK4M",
    "status": "lobby",
    "hostId": "uuid-abc-123",
    "participants": [
      { "id": "uuid-abc-123", "name": "Alice", "joinedAt": "...", "score": 0 },
      { "id": "uuid-def-456", "name": "Bob", "joinedAt": "...", "score": 0 }
    ]
  }
}
```

**Error (404):**
```json
{ "error": "Room not found" }
```

**Error (400):**
```json
{ "error": "Player name is required" }
```

**Error (409):**
```json
{ "error": "Game already in progress" }
```

---

## GET /rooms/:code?participantId=... — Fetch Room Snapshot

**Response (200):**
```json
{
  "code": "XK4M",
  "status": "lobby",
  "hostId": "uuid-abc-123",
  "participants": [ ... ],
  "isHost": true             // Based on participantId match
}
```

Key addition: `hostId` and `isHost` so the frontend knows who can start.

---

## POST /rooms/:code/start — Start Game (NEW)

**Request:**
```json
{
  "participantId": "uuid-abc-123"
}
```

**Response (200):**
```json
{
  "code": "XK4M",
  "status": "playing",
  "hostId": "uuid-abc-123",
  "participants": [ ... ]
}
```

**Error (403):**
```json
{ "error": "Only the host can start the game" }
```

**Error (400):**
```json
{ "error": "At least 2 players required to start" }
```
