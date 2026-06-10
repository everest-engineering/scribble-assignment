# API Contracts: Game Start & Drawer Flow

Base URL: `http://localhost:3001`

This document describes the contracts affected by the Game Start & Drawer Flow feature.
Contracts not listed here (e.g., `POST /rooms`, `POST /rooms/:code/join`) are unchanged from spec 001.

---

## POST /rooms/:code/start

Start the game (host only). Transitions room to `"playing"`, assigns drawer, selects secret word.

**URL Parameters:**
- `code`: 4-character room code

**Request Body:**

```json
{
  "participantId": "uuid-string"
}
```

**Response** `200 OK` (viewer is the drawer — receives `secretWord`):

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "hostId": "uuid-string",
    "drawerId": "uuid-string",
    "participants": [
      {
        "id": "uuid-string",
        "name": "string",
        "joinedAt": "ISO-8601-string"
      }
    ],
    "availableWords": ["string"],
    "roles": ["drawer", "guesser"],
    "secretWord": "pizza"
  }
}
```

**Response** `200 OK` (viewer is a guesser — `secretWord` is absent):

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "hostId": "uuid-string",
    "drawerId": "uuid-string",
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

---

## GET /rooms/:code

Fetch the current room state (used for polling during lobby AND game play).

**URL Parameters:**
- `code`: 4-character room code

**Query Parameters:**
- `participantId` (optional): Identifies the viewer; used to determine whether to include `secretWord`

**Response** `200 OK` (viewer is the drawer):

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "hostId": "uuid-string",
    "drawerId": "uuid-string",
    "participants": [
      {
        "id": "uuid-string",
        "name": "string",
        "joinedAt": "ISO-8601-string"
      }
    ],
    "availableWords": ["string"],
    "roles": ["drawer", "guesser"],
    "secretWord": "pizza"
  }
}
```

**Response** `200 OK` (viewer is a guesser):

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "hostId": "uuid-string",
    "drawerId": "uuid-string",
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

**Response** `200 OK` (room still in lobby, or no `participantId` provided):

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

## POST /rooms

Create a new room. Updated with player name validation.

**Request Body:**

```json
{
  "playerName": "string (optional, max 15 chars, alphanumeric + space/hyphen/underscore)"
}
```

- If provided, `playerName` is trimmed and must be 1-15 characters of `[A-Za-z0-9 _-]`.
- If omitted, defaults to `"Player"` (no validation applied to the default).

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
- `400` — Invalid character in name, name too long, or empty name after trimming

---

## POST /rooms/:code/join

Join an existing room. Updated with player name validation.

**URL Parameters:**
- `code`: 4-character room code (case-insensitive)

**Request Body:**

```json
{
  "playerName": "string (optional, max 15 chars, alphanumeric + space/hyphen/underscore)"
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
- `400` — Invalid character in name, name too long, or empty name after trimming
- `404` — Room code not found
- `409` — Display name already taken in this room
