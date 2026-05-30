# API Contracts: Rooms

**Branch**: `001-room-setup-lobby` | **Date**: 2026-05-31
**Base URL**: `http://localhost:3001`

---

## POST /rooms — Create Room

Creates a new room. The requesting player becomes the host.

**Request body**:
```json
{ "playerName": "Alice" }
```

| Field | Type | Rules |
|-------|------|-------|
| `playerName` | string | Required. Trimmed. Min 1 char after trim. |

**Response 201**:
```json
{
  "participantId": "uuid-string",
  "room": {
    "code": "ABCD",
    "hostId": "uuid-string",
    "status": "lobby",
    "participants": [
      { "id": "uuid-string", "name": "Alice", "joinedAt": "ISO-timestamp" }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Response 400**: `{ "message": "Player name is required" }` — empty/whitespace name.

---

## POST /rooms/:code/join — Join Room

Adds a player to an existing room.

**Request body**:
```json
{ "playerName": "Bob" }
```

| Field | Type | Rules |
|-------|------|-------|
| `playerName` | string | Required. Trimmed. Min 1 char after trim. |

**Response 200**:
```json
{
  "participantId": "uuid-string",
  "room": {
    "code": "ABCD",
    "hostId": "uuid-string",
    "status": "lobby",
    "participants": [
      { "id": "host-uuid", "name": "Alice", "joinedAt": "..." },
      { "id": "joiner-uuid", "name": "Bob", "joinedAt": "..." }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Response 400**: `{ "message": "Player name is required" }` — empty/whitespace name.
**Response 404**: `{ "message": "Unable to join room" }` — code does not exist.

---

## GET /rooms/:code — Get Room Snapshot

Returns the current room state. Used for lobby polling.

**Query params**:

| Param | Type | Notes |
|-------|------|-------|
| `participantId` | string (optional) | Forwarded for future viewer-specific logic |

**Response 200**:
```json
{
  "room": {
    "code": "ABCD",
    "hostId": "uuid-string",
    "status": "lobby",
    "participants": [...],
    "availableWords": [...],
    "roles": [...]
  }
}
```

**Response 404**: `{ "message": "Unable to load room" }` — code does not exist.

---

## POST /rooms/:code/start — Start Game *(new)*

Transitions the room from `"lobby"` to `"game"`. Host only.

**Request body**:
```json
{ "participantId": "host-uuid-string" }
```

| Field | Type | Rules |
|-------|------|-------|
| `participantId` | string | Required. Must match `room.hostId`. |

**Response 200**:
```json
{
  "room": {
    "code": "ABCD",
    "hostId": "uuid-string",
    "status": "game",
    "participants": [...],
    "availableWords": [...],
    "roles": [...]
  }
}
```

**Response 400**: `{ "message": "Need at least 2 players to start" }` — fewer than 2 participants.
**Response 403**: `{ "message": "Only the host can start the game" }` — `participantId` does not match `hostId`.
**Response 404**: `{ "message": "Room not found" }` — code does not exist.
