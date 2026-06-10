# API Contracts: Room Setup & Lobby

Base URL: `http://localhost:3001`

## POST /rooms

Create a new room. Creator is automatically the host.

**Request Body:**

```json
{
  "playerName": "string (optional)"
}
```

- `playerName`: Display name for the creating player. Defaults to `"Player"` if omitted.

**Response** `201 Created`:

```json
{
  "participantId": "uuid-string",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostId": "uuid-string",
    "participants": [
      {
        "id": "uuid-string",
        "name": "string",
        "joinedAt": "ISO-8601-string"
      }
    ],
    "availableWords": ["string"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Errors:**
- `400` — Invalid request body (Zod validation failure)

---

## POST /rooms/:code/join

Join an existing room by its code.

**URL Parameters:**
- `code`: 4-character room code (case-insensitive)

**Request Body:**

```json
{
  "playerName": "string (optional)"
}
```

**Response** `200 OK`:

```json
{
  "participantId": "uuid-string",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostId": "uuid-string",
    "participants": [
      {
        "id": "uuid-string",
        "name": "string",
        "joinedAt": "ISO-8601-string"
      }
    ],
    "availableWords": ["string"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Errors:**
- `400` — Invalid request body (Zod validation) or malformed room code format
- `404` — Room code not found
- `409` — Display name already taken in this room

---

## GET /rooms/:code

Fetch the current room state (used for lobby polling).

**URL Parameters:**
- `code`: 4-character room code

**Query Parameters:**
- `participantId` (optional): Used to identify the viewer in the response

**Response** `200 OK`:

```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostId": "uuid-string",
    "participants": [
      {
        "id": "uuid-string",
        "name": "string",
        "joinedAt": "ISO-8601-string"
      }
    ],
    "availableWords": ["string"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Errors:**
- `400` — Malformed room code format
- `404` — Room code not found

---

## POST /rooms/:code/start

Start the game (host only).

**URL Parameters:**
- `code`: 4-character room code

**Request Body:**

```json
{
  "participantId": "uuid-string"
}
```

**Response** `200 OK`:

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "hostId": "uuid-string",
    "participants": [
      {
        "id": "uuid-string",
        "name": "string",
        "joinedAt": "ISO-8601-string"
      }
    ],
    "availableWords": ["string"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Errors:**
- `400` — Fewer than 2 players in room, or malformed room code format
- `403` — Only the host can start the game
- `404` — Room code not found
