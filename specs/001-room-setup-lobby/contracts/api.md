# API Contracts: Room Setup & Lobby

Base URL: `http://localhost:3001`

All request and response bodies use `Content-Type: application/json`.

---

## POST /rooms

Create a new room. The creator is automatically designated as the host.

**Request Body**:

```json
{
  "playerName": "Sketch Captain"
}
```

- `playerName`: string, 1-50 chars after trim, required

**Response** (201):

```json
{
  "participantId": "uuid-string",
  "room": {
    "code": "A3K9",
    "status": "lobby",
    "participants": [
      { "id": "uuid-string", "name": "Sketch Captain", "joinedAt": "2026-06-09T12:00:00.000Z" }
    ],
    "hostId": "uuid-string",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Errors**:
- 400: `{ "message": "Name is required" }` — empty/whitespace name
- 400: `{ "message": "Name must be 50 characters or less" }` — name too long

---

## POST /rooms/:code/join

Join an existing room. Room must be in "lobby" status.

**Path Parameters**:
- `code`: string, 4 alphanumeric characters

**Request Body**:

```json
{
  "playerName": "Second Pencil"
}
```

- `playerName`: string, 1-50 chars after trim, required

**Response** (200):

```json
{
  "participantId": "uuid-string",
  "room": {
    "code": "A3K9",
    "status": "lobby",
    "participants": [
      { "id": "uuid-1", "name": "Sketch Captain", "joinedAt": "..." },
      { "id": "uuid-2", "name": "Second Pencil", "joinedAt": "..." }
    ],
    "hostId": "uuid-1",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Errors**:
- 400: `{ "message": "Name is required" }` — empty/whitespace name
- 404: `{ "message": "Room not found. Check the code and try again." }` — code doesn't match any room
- 400: `{ "message": "Game already in progress" }` — room status is not "lobby"

---

## GET /rooms/:code

Fetch current room state. Used by lobby polling.

**Path Parameters**:
- `code`: string, 4 alphanumeric characters

**Query Parameters**:
- `participantId`: string (optional) — used to personalize response

**Response** (200):

```json
{
  "room": {
    "code": "A3K9",
    "status": "lobby",
    "participants": [
      { "id": "uuid-1", "name": "Sketch Captain", "joinedAt": "..." },
      { "id": "uuid-2", "name": "Second Pencil", "joinedAt": "..." }
    ],
    "hostId": "uuid-1",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Errors**:
- 404: `{ "message": "Unable to load room" }` — room not found

---

## POST /rooms/:code/start

Start the game. Only the host can call this, and only when ≥2 players are present.

**Path Parameters**:
- `code`: string, 4 alphanumeric characters

**Request Body**:

```json
{
  "participantId": "uuid-of-host"
}
```

- `participantId`: string (UUID), required

**Response** (200):

```json
{
  "room": {
    "code": "A3K9",
    "status": "in-progress",
    "participants": [
      { "id": "uuid-1", "name": "Sketch Captain", "joinedAt": "..." },
      { "id": "uuid-2", "name": "Second Pencil", "joinedAt": "..." }
    ],
    "hostId": "uuid-1",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Errors**:
- 403: `{ "message": "Only the host can start the game" }` — caller is not host
- 400: `{ "message": "Need at least 2 players to start" }` — insufficient players
- 404: `{ "message": "Unable to load room" }` — room not found
