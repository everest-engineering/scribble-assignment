# API Contracts: Game Start and Drawer Flow

Base URL: `http://localhost:3001`

All requests and responses use `Content-Type: application/json`.

## Changes from Phase 1

- `RoomSnapshot` gains `currentRound` field
- `RoundSnapshot` is a new type included in the snapshot
- `POST /rooms/:code/start` returns the extended snapshot with round info
- `GET /rooms/:code` returns the extended snapshot with word filtered per viewer

---

## POST /rooms/:code/start

Start the game (host only, requires 2+ participants). Atomically creates Round 1, assigns host as drawer, selects secret word.

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

**Response `200` (drawer's view):**

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
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower", ...],
    "roles": ["drawer", "guesser"],
    "currentRound": {
      "number": 1,
      "drawerId": "uuid-of-alice",
      "secretWord": "rocket",
      "status": "drawing"
    }
  }
}
```

**Response `200` (guesser's view — word is undefined):**

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
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower", ...],
    "roles": ["drawer", "guesser"],
    "currentRound": {
      "number": 1,
      "drawerId": "uuid-of-alice",
      "secretWord": undefined,
      "status": "drawing"
    }
  }
}
```

**Errors:**

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Missing `participantId` | `{ "message": "Participant ID required" }` |
| 400 | Any participant has invalid name | `{ "message": "All players must have a valid name to start the game" }` |
| 403 | Non-host participant tries to start | `{ "message": "Only the host can start the game" }` |
| 403 | Fewer than 2 participants | `{ "message": "At least 2 players are needed to start" }` |
| 404 | Room code not found | `{ "message": "Room not found" }` |
| 503 | Word list is empty | `{ "message": "Game cannot start: word list is unavailable" }` |

---

## GET /rooms/:code

Fetch the current room snapshot. Extended to include round info with word filtered per viewer.

**URL parameters:**

| Field | Type | Constraints |
|-------|------|-------------|
| `code` | `string` | Room code. Case-insensitive. |

**Query parameters:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `participantId` | `string` | No | UUID of requesting participant |

**Response `200` (game active, drawer viewing):**

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
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower", ...],
    "roles": ["drawer", "guesser"],
    "currentRound": {
      "number": 1,
      "drawerId": "uuid-of-alice",
      "secretWord": "rocket",
      "status": "drawing"
    }
  }
}
```

**Response `200` (game active, guesser viewing — word undefined):**

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
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower", ...],
    "roles": ["drawer", "guesser"],
    "currentRound": {
      "number": 1,
      "drawerId": "uuid-of-alice",
      "secretWord": undefined,
      "status": "drawing"
    }
  }
}
```

**Response `200` (game in lobby — no currentRound):**

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
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower", ...],
    "roles": ["drawer", "guesser"],
    "currentRound": null
  }
}
```

**Errors:**

| Status | Condition | Body |
|--------|-----------|------|
| 404 | Room code not found | `{ "message": "Room not found" }` |

---

## Unchanged Endpoints

The following endpoints remain unchanged from Phase 1:
- `POST /rooms` — Create room
- `POST /rooms/:code/join` — Join room
