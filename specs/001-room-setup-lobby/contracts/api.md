# API Contracts: Room Setup and Lobby

Base URL: `http://localhost:3001`

All requests and responses use `Content-Type: application/json`.

---

## POST /rooms

Create a new room. The creator is automatically designated as host.

**Request body:**

```json
{
  "playerName": "Alice"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `playerName` | `string` | No | 1-16 alphanumeric chars. Default: `"Player"` |

**Response `201`:**

```json
{
  "participantId": "uuid-string",
  "room": {
    "code": "A3X9",
    "status": "lobby",
    "hostId": "uuid-string",
    "participants": [
      {
        "id": "uuid-string",
        "name": "Alice",
        "joinedAt": "2026-05-19T12:00:00.000Z"
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Errors:**

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Invalid player name (empty after trim, >16 chars, non-alphanumeric) | `{ "message": "Validation error", "issues": [...] }` |
| 503 | Max rooms (100) reached | `{ "message": "Maximum number of rooms reached" }` |

---

## POST /rooms/:code/join

Join an existing room by code.

**URL parameters:**

| Field | Type | Constraints |
|-------|------|-------------|
| `code` | `string` | 4-char alphanumeric. Case-insensitive. |

**Request body:**

```json
{
  "playerName": "Bob"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `playerName` | `string` | No | 1-16 alphanumeric chars. Default: `"Player"` |

**Response `200`:**

```json
{
  "participantId": "uuid-string",
  "room": {
    "code": "A3X9",
    "status": "lobby",
    "hostId": "uuid-string",
    "participants": [
      { "id": "uuid-string", "name": "Alice", "joinedAt": "..." },
      { "id": "uuid-string", "name": "Bob", "joinedAt": "..." }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Errors:**

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Invalid or empty code | `{ "message": "Room code is required" }` |
| 403 | Room is already active (game in progress) | `{ "message": "Game already in progress" }` |
| 403 | Room is full (max 8 players) | `{ "message": "Room is full" }` |
| 404 | Room code does not match any active room | `{ "message": "Room not found" }` |

---

## GET /rooms/:code

Fetch the current room snapshot.

**URL parameters:**

| Field | Type | Constraints |
|-------|------|-------------|
| `code` | `string` | Room code. Case-insensitive. |

**Query parameters:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `participantId` | `string` | No | UUID of requesting participant |

**Response `200`:**

```json
{
  "room": {
    "code": "A3X9",
    "status": "lobby",
    "hostId": "uuid-string",
    "participants": [
      { "id": "uuid-string", "name": "Alice", "joinedAt": "..." },
      { "id": "uuid-string", "name": "Bob", "joinedAt": "..." }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Errors:**

| Status | Condition | Body |
|--------|-----------|------|
| 404 | Room code not found | `{ "message": "Room not found" }` |

---

## POST /rooms/:code/start

Start the game (host only, requires 2+ participants).

**URL parameters:**

| Field | Type | Constraints |
|-------|------|-------------|
| `code` | `string` | Room code. Case-insensitive. |

**Request body:**

```json
{
  "participantId": "uuid-of-host"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `participantId` | `string` | Yes | Must match the room's `hostId` |

**Response `200`:**

```json
{
  "room": {
    "code": "A3X9",
    "status": "active",
    "hostId": "uuid-string",
    "participants": [
      { "id": "uuid-string", "name": "Alice", "joinedAt": "..." },
      { "id": "uuid-string", "name": "Bob", "joinedAt": "..." }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Errors:**

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Missing `participantId` | `{ "message": "Participant ID required" }` |
| 403 | Non-host participant tries to start | `{ "message": "Only the host can start the game" }` |
| 403 | Fewer than 2 participants | `{ "message": "At least 2 players are needed to start" }` |
| 404 | Room code not found | `{ "message": "Room not found" }` |
