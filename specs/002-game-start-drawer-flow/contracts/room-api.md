# Room API Contracts — Game Start & Drawer Flow

**Extends**: [Scenario 1 contracts](../../001-room-setup-lobby/contracts/room-api.md)

Changes from Scenario 1: name trimming on create/join, role/word assignment on start, per-participant word filtering on fetch.

---

## POST /rooms

**Change**: `playerName` is now trimmed server-side before processing.

**Request**
```json
{
  "playerName": "  Alice  "
}
```

**Response (201)** — name is trimmed to `"Alice"` in the response.

**Errors** — 400 if `playerName` is empty or whitespace-only after trimming.

---

## POST /rooms/:code/join

**Change**: `playerName` is now trimmed server-side before processing.

**Request**
```json
{
  "playerName": "  Bob  "
}
```

**Response (200)** — name is trimmed to `"Bob"` in the response.

**Errors** — 400 if `playerName` is empty or whitespace-only after trimming.

---

## GET /rooms/:code

**Change**: When room status is `"playing"`, the response includes per-participant filtering of the secret word. The `participantId` query param is now required for game-state responses (optional in lobby).

**Query params**: `?participantId=uuid-string`

**Response (200)** — drawer's view:
```json
{
  "room": {
    "code": "X7K2",
    "status": "playing",
    "hostId": "uuid-host",
    "currentDrawerId": "uuid-host",
    "roundNumber": 1,
    "participants": [
      { "id": "uuid-host", "name": "Alice", "joinedAt": "..." },
      { "id": "uuid-guest", "name": "Bob", "joinedAt": "..." }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "secretWord": "rocket"
  }
}
```

**Response (200)** — guesser's view (same room, different participantId):
```json
{
  "room": {
    "...": "same fields, except:",
    "secretWord": null
  }
}
```

---

## POST /rooms/:code/start

**Change**: Now also initializes round 1 — assigns the drawer role, selects the secret word, and sets the round number.

**Request**
```json
{
  "participantId": "uuid-host"
}
```

**Response (200)** — room snapshot with `status: "playing"`, roles populated, and secret word for drawer:
```json
{
  "room": {
    "code": "X7K2",
    "status": "playing",
    "hostId": "uuid-host",
    "currentDrawerId": "uuid-host",
    "roundNumber": 1,
    "participants": [ "..." ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "secretWord": "rocket"
  }
}
```

**Errors** — unchanged from Scenario 1.

| Status | Condition |
|--------|-----------|
| 403 | `participantId` is not the room host |
| 400 | Fewer than 2 participants in the room |
| 404 | Room code does not match any active room |
