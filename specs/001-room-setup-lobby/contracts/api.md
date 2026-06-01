# API Contracts: Room Setup & Lobby

## POST /rooms — Create Room

Creates a new room and assigns the creator as host.

**Request**:
```json
{
  "playerName": "Alice"
}
```

**Response** (201):
```json
{
  "participantId": "uuid-string",
  "room": {
    "code": "A3X9K2",
    "status": "lobby",
    "participants": [
      { "id": "uuid-string", "name": "Alice", "joinedAt": "2026-06-01T12:00:00Z" }
    ],
    "hostId": "uuid-string",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Error** (400):
```json
{ "message": "Player name is required" }
```

---

## POST /rooms/:code/join — Join Room

Adds a player to an existing room.

**Request**:
```json
{
  "playerName": "Bob"
}
```

**Response** (200):
```json
{
  "participantId": "uuid-string",
  "room": {
    "code": "A3X9K2",
    "status": "lobby",
    "participants": [
      { "id": "uuid-1", "name": "Alice", "joinedAt": "2026-06-01T12:00:00Z" },
      { "id": "uuid-2", "name": "Bob", "joinedAt": "2026-06-01T12:01:00Z" }
    ],
    "hostId": "uuid-1",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Errors**:
- 400: `{ "message": "Room code is required" }` (empty code)
- 400: `{ "message": "Player name is required" }` (empty name)
- 404: `{ "message": "Room not found" }` (invalid code)

---

## GET /rooms/:code — Fetch Room Snapshot

Fetches the current state of a room. Used for lobby polling.

**Query params**: `?participantId=uuid-string` (optional, for future
per-participant filtering)

**Response** (200):
```json
{
  "room": {
    "code": "A3X9K2",
    "status": "lobby",
    "participants": [
      { "id": "uuid-1", "name": "Alice", "joinedAt": "2026-06-01T12:00:00Z" },
      { "id": "uuid-2", "name": "Bob", "joinedAt": "2026-06-01T12:01:00Z" }
    ],
    "hostId": "uuid-1",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Error** (404):
```json
{ "message": "Room not found" }
```

---

## POST /rooms/:code/start — Start Game

Starts the game. Only the host can start. Requires ≥2 players.

**Request**:
```json
{
  "participantId": "uuid-1"
}
```

**Response** (200):
```json
{
  "room": {
    "code": "A3X9K2",
    "status": "playing",
    "participants": [
      { "id": "uuid-1", "name": "Alice", "joinedAt": "..." },
      { "id": "uuid-2", "name": "Bob", "joinedAt": "..." }
    ],
    "hostId": "uuid-1",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Errors**:
- 403: `{ "message": "Only the host can start the game" }` (non-host)
- 400: `{ "message": "At least 2 players are required to start" }` (<2
  players)
- 404: `{ "message": "Room not found" }` (invalid code)
