# API Contracts: Room Setup And Lobby

Base URL: `http://localhost:3001`

All requests and responses use `Content-Type: application/json`.

## POST /rooms

Create a new room. The creator is automatically designated as host.

**Request Body:**
```json
{
  "playerName": "string (optional, defaults to 'Player')"
}
```

**Response (201):**
```json
{
  "participantId": "uuid",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostId": "uuid",
    "participants": [
      { "id": "uuid", "name": "string", "joinedAt": "ISO8601" }
    ],
    "availableWords": ["string"],
    "roles": ["drawer", "guesser"]
  }
}
```

## POST /rooms/:code/join

Join an existing room by its code.

**Path Parameters:** `code` — room code (case-insensitive, normalized to uppercase)

**Request Body:**
```json
{
  "playerName": "string (optional, defaults to 'Player')"
}
```

**Response (200):**
```json
{
  "participantId": "uuid",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostId": "uuid",
    "participants": [
      { "id": "uuid", "name": "string", "joinedAt": "ISO8601" }
    ],
    "availableWords": ["string"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Error (404):**
```json
{
  "message": "Room not found. Please check the code and try again"
}
```

## GET /rooms/:code

Fetch the current state of a room (used for lobby polling).

**Path Parameters:** `code` — room code

**Query Parameters:** `participantId` (optional) — used to tailor the response perspective

**Response (200):**
```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostId": "uuid",
    "participants": [
      { "id": "uuid", "name": "string", "joinedAt": "ISO8601" }
    ],
    "availableWords": ["string"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Error (404):**
```json
{
  "message": "Unable to load room"
}
```

## POST /rooms/:code/start

Start the game. Only the host can start, and at least 2 players must be present.

**Path Parameters:** `code` — room code

**Request Body:**
```json
{
  "participantId": "uuid"
}
```

**Response (200):**
```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "hostId": "uuid",
    "participants": [
      { "id": "uuid", "name": "string", "joinedAt": "ISO8601" }
    ],
    "availableWords": ["string"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Error (403) — Not the host:**
```json
{
  "message": "Only the host can start the game"
}
```

**Error (400) — Not enough players:**
```json
{
  "message": "At least 2 players are needed to start the game"
}
```

## Error Responses (common)

**Empty code (400):**
```json
{
  "message": "Room code is required"
}
```

**Invalid payload (400) — Zod validation failure:**
```json
{
  "message": "Invalid request payload"
}
```
