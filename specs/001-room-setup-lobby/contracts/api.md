# API Contracts: Room Setup & Lobby

**Base URL**: `http://localhost:3001`
**Content-Type**: `application/json`

---

## Existing Endpoints (Updated)

### POST /rooms

Create a new room. The requesting player becomes the host.

**Request**
```json
{ "playerName": "Alice" }
```
- `playerName`: non-empty string after trimming; 400 if empty/whitespace.

**Response 201**
```json
{
  "participantId": "uuid-v4",
  "room": {
    "code": "ABCD",
    "hostId": "uuid-v4",
    "status": "lobby",
    "participants": [
      { "id": "uuid-v4", "name": "Alice", "joinedAt": "ISO8601" }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```
- `hostId` is the same as `participantId` returned at the root.

**Response 400** — invalid/empty name
```json
{ "message": "playerName is required" }
```

---

### POST /rooms/:code/join

Join an existing room by code.

**Request**
```json
{ "playerName": "Bob" }
```
- `playerName`: non-empty string after trimming; 400 if empty/whitespace.
- `:code`: trimmed and uppercased before lookup; 400 if empty after trim or if it contains non-alphanumeric characters.

**Response 200**
```json
{
  "participantId": "uuid-v4",
  "room": {
    "code": "ABCD",
    "hostId": "uuid-v4-of-alice",
    "status": "lobby",
    "participants": [
      { "id": "uuid-v4-of-alice", "name": "Alice", "joinedAt": "ISO8601" },
      { "id": "uuid-v4-of-bob",   "name": "Bob",   "joinedAt": "ISO8601" }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Response 400** — invalid/empty name or code
```json
{ "message": "playerName is required" }
```

**Response 404** — room not found
```json
{ "message": "Room not found" }
```

---

### GET /rooms/:code

Fetch the current room snapshot. Used by lobby polling.

**Query params** (optional): `participantId=<uuid>` — reserved for future viewer-specific filtering; currently unused.

**Response 200**
```json
{
  "room": {
    "code": "ABCD",
    "hostId": "uuid-v4-of-alice",
    "status": "lobby",
    "participants": [...],
    "availableWords": [...],
    "roles": [...]
  }
}
```

**Response 404** — room not found
```json
{ "message": "Room not found" }
```

---

## New Endpoint

### POST /rooms/:code/start

Start the game. Host only. Requires at least 2 participants in the room.

**Request**
```json
{ "participantId": "uuid-v4-of-host" }
```

**Response 200**
```json
{
  "room": {
    "code": "ABCD",
    "hostId": "uuid-v4-of-alice",
    "status": "active",
    "participants": [...],
    "availableWords": [...],
    "roles": [...]
  }
}
```

**Response 400** — fewer than 2 participants
```json
{ "message": "At least 2 players are required to start the game" }
```

**Response 403** — caller is not the host
```json
{ "message": "Only the host can start the game" }
```

**Response 404** — room not found
```json
{ "message": "Room not found" }
```
