# Room API Contracts

## POST /rooms

Create a new room.

**Request**
```json
{
  "playerName": "Alice"
}
```

**Response (201)**
```json
{
  "participantId": "uuid-string",
  "room": {
    "code": "X7K2",
    "status": "lobby",
    "hostId": "uuid-string",
    "participants": [
      { "id": "uuid-string", "name": "Alice", "joinedAt": "2026-06-01T12:00:00.000Z" }
    ],
    "availableWords": ["rocket","pizza","castle","guitar","sunflower"],
    "roles": ["drawer","guesser"]
  }
}
```

**Errors** — 400 if `playerName` is empty or whitespace-only.

---

## POST /rooms/:code/join

Join an existing room by code.

**Request**
```json
{
  "playerName": "Bob"
}
```

**Response (200)**
```json
{
  "participantId": "uuid-string",
  "room": { "...": "same snapshot shape" }
}
```

**Errors**
| Status | Condition |
|--------|-----------|
| 404 | Room code does not match any active room |
| 400 | `playerName` is empty or whitespace-only |

---

## GET /rooms/:code

Fetch current room snapshot (polling endpoint).

**Query params**: `?participantId=uuid-string` (optional, reserved for future use)

**Response (200)**
```json
{
  "room": { "...": "same snapshot shape" }
}
```

**Errors**
| Status | Condition |
|--------|-----------|
| 404 | Room code does not match any active room |

---

## POST /rooms/:code/start

Start the game (host only).

**Request**
```json
{
  "participantId": "uuid-string"
}
```

**Response (200)**
```json
{
  "room": { "...": "snapshot with status updated to in-progress" }
}
```

**Errors**
| Status | Condition |
|--------|-----------|
| 403 | `participantId` is not the room host |
| 400 | Fewer than 2 participants in the room |
| 404 | Room code does not match any active room |
