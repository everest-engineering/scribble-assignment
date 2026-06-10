# API Contracts: Room Setup & Lobby

## POST /api/rooms

Create a new room. The caller becomes the host.

**Request body**
```json
{ "playerName": "Alice" }
```
- `playerName`: string, required, trimmed, non-empty (422 if empty after trim)

**Response 201**
```json
{
  "participantId": "<uuid>",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostId": "<uuid>",
    "participants": [{ "id": "<uuid>", "name": "Alice", "joinedAt": "<iso>" }],
    "availableWords": ["rocket","pizza","castle","guitar","sunflower"],
    "roles": ["drawer","guesser"]
  }
}
```

**Error responses**
| Status | Body | Condition |
|--------|------|-----------|
| 422 | `{ "message": "Name cannot be empty." }` | name missing or whitespace-only |

---

## POST /api/rooms/:code/join

Join an existing room.

**URL param**: `code` — case-insensitive, uppercased before lookup.

**Request body**
```json
{ "playerName": "Bob" }
```
- `playerName`: string, required, trimmed, non-empty

**Response 200**
```json
{
  "participantId": "<uuid>",
  "room": { ... same shape as POST /api/rooms ... }
}
```

**Error responses**
| Status | Body | Condition |
|--------|------|-----------|
| 422 | `{ "message": "Name cannot be empty." }` | name missing or whitespace-only |
| 404 | `{ "message": "Room not found." }` | code not in store |

---

## GET /api/rooms/:code

Fetch current room snapshot (used by lobby polling).

**Query param**: `participantId` (optional) — reserved for future viewer-specific responses.

**Response 200**
```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostId": "<uuid>",
    "participants": [...],
    "availableWords": [...],
    "roles": [...]
  }
}
```

**Error responses**
| Status | Body | Condition |
|--------|------|-----------|
| 404 | `{ "message": "Room not found." }` | code not in store |
