# API Contracts: Room Setup & Lobby

## Base URL

`http://localhost:3001`

## Endpoints

### Health Check

```
GET /health
```

**Response** `200`:
```json
{ "ok": true }
```

---

### Create Room

```
POST /rooms
Content-Type: application/json

{
  "playerName": "Alice"
}
```

**Response** `201`:
```json
{
  "participantId": "p1",
  "room": {
    "code": "ABCD",
    "participants": [
      { "id": "p1", "name": "Alice", "joinedAt": "2026-06-26T00:00:00.000Z" }
    ],
    "status": "lobby",
    "hostId": "p1",
    "availableWords": ["apple", "banana", "cat", "dog", "elephant"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Error** `400` (empty/whitespace name):
```json
{ "message": "Player name is required" }
```

---

### Join Room

```
POST /rooms/:code/join
Content-Type: application/json

{
  "playerName": "Bob"
}
```

**Response** `200`:
```json
{
  "participantId": "p2",
  "room": {
    "code": "ABCD",
    "participants": [
      { "id": "p1", "name": "Alice", "joinedAt": "2026-06-26T00:00:00.000Z" },
      { "id": "p2", "name": "Bob", "joinedAt": "2026-06-26T00:00:01.000Z" }
    ],
    "status": "lobby",
    "hostId": "p1",
    "availableWords": ["apple", "banana", "cat", "dog", "elephant"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Error** `400` (empty/whitespace name):
```json
{ "message": "Player name is required" }
```

**Error** `404` (room not found):
```json
{ "message": "Room not found" }
```

---

### Get Room

```
GET /rooms/:code?participantId=p1
```

**Response** `200`:
```json
{
  "room": {
    "code": "ABCD",
    "participants": [
      { "id": "p1", "name": "Alice", "joinedAt": "2026-06-26T00:00:00.000Z" },
      { "id": "p2", "name": "Bob", "joinedAt": "2026-06-26T00:00:01.000Z" }
    ],
    "status": "lobby",
    "hostId": "p1",
    "availableWords": ["apple", "banana", "cat", "dog", "elephant"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Error** `404` (room not found):
```json
{ "message": "Room not found" }
```

---

### Start Game (NEW)

```
POST /rooms/:code/start
Content-Type: application/json

{
  "playerId": "p1"
}
```

**Response** `200`:
```json
{
  "room": {
    "code": "ABCD",
    "participants": [
      { "id": "p1", "name": "Alice", "joinedAt": "2026-06-26T00:00:00.000Z" },
      { "id": "p2", "name": "Bob", "joinedAt": "2026-06-26T00:00:01.000Z" }
    ],
    "status": "playing",
    "hostId": "p1",
    "availableWords": ["apple", "banana", "cat", "dog", "elephant"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Error** `403` (non-host attempts start):
```json
{ "message": "Only the host can start the game" }
```

**Error** `400` (less than 2 players):
```json
{ "message": "At least 2 players are required to start" }
```

## Polling Contract

- Frontend polls `GET /rooms/:code` at ~2s intervals while on the lobby page.
- On network error: retry at 2s → 4s → 8s (exponential back-off).
- After 3 consecutive failures: frontend shows error notification, continues polling at 8s.
- When room status transitions to `"playing"`: frontend navigates to game screen.
