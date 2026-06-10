# API Contracts: Room Setup & Lobby

**Branch**: `001-room-setup-lobby` | **Date**: 2026-06-10

All endpoints are on the backend at `http://localhost:3001`.
Changes from the starter are marked **[CHANGED]** or **[UNCHANGED]**.

---

## POST /rooms — Create Room **[CHANGED]**

Creates a new room and marks the creator as host.

### Request

```
POST /rooms
Content-Type: application/json

{
  "playerName": string   // required; trimmed; min 1 char after trim
}
```

### Response 201

```json
{
  "participantId": "uuid-string",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": [
      {
        "id": "uuid-string",
        "name": "Ada",
        "joinedAt": "2026-06-10T12:00:00.000Z",
        "isHost": true
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

### Response 422 — Validation failure

```json
{ "message": "Player name is required" }
```

**Change from starter**: `playerName` is now required (was optional); `isHost`
added to each participant in the response.

---

## POST /rooms/:code/join — Join Room **[CHANGED]**

Adds a participant to an existing room. The joiner is never the host.

### Request

```
POST /rooms/ABCD/join
Content-Type: application/json

{
  "playerName": string   // required; trimmed; min 1 char after trim
}
```

### Response 200

```json
{
  "participantId": "uuid-string",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": [
      { "id": "...", "name": "Ada",  "joinedAt": "...", "isHost": true  },
      { "id": "...", "name": "Bo",   "joinedAt": "...", "isHost": false }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

### Response 404 — Room not found

```json
{ "message": "Unable to join room" }
```

### Response 422 — Validation failure

```json
{ "message": "Player name is required" }
```

**Change from starter**: `playerName` now required; `isHost: false` on joining
participant; `isHost` field present on all participants in response.

---

## GET /rooms/:code — Fetch Room **[CHANGED]**

Returns the current snapshot of a room.

### Request

```
GET /rooms/ABCD?participantId=uuid-string
```

`participantId` is optional (used for future viewer-scoped responses).

### Response 200

```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": [
      { "id": "...", "name": "Ada", "joinedAt": "...", "isHost": true  },
      { "id": "...", "name": "Bo",  "joinedAt": "...", "isHost": false }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

### Response 404 — Room not found

```json
{ "message": "Unable to load room" }
```

**Change from starter**: `isHost` field added to each participant.

---

## GET /health — Health Check **[UNCHANGED]**

```
GET /health
→ 200 { "ok": true }
```
