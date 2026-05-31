# REST API Contract: Rooms

**Feature**: `001-room-setup-lobby`
**Base URL**: `http://localhost:3001`
**Content-Type**: `application/json` (all requests and responses)

All existing routes are preserved unchanged. One new route is added.

---

## POST /rooms — Create Room

Creates a new room and returns the creator's participant session.

**Request body**

```json
{ "playerName": "string (min 1 char, required)" }
```

**Success — 201 Created**

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

**Errors**

| Status | Condition |
|--------|-----------|
| 400 | `playerName` missing or empty |

---

## POST /rooms/:code/join — Join Room

Adds a participant to an existing room in `"lobby"` status.

**URL params**: `code` — 4-char room code (matched case-insensitively)

**Request body**

```json
{ "playerName": "string (min 1 char, required)" }
```

**Success — 200 OK**

```json
{
  "participantId": "uuid",
  "room": { "...same shape as POST /rooms response..." }
}
```

**Errors**

| Status | Condition |
|--------|-----------|
| 400 | `playerName` missing or empty |
| 404 | Room code not found |
| 409 | Room status is `"in-progress"` (game already started) |

---

## GET /rooms/:code — Fetch Room Snapshot

Returns the current snapshot of a room. Used for lobby polling.

**URL params**: `code` — 4-char room code (case-insensitive)

**Query params**: `participantId` (optional) — the viewer's participant ID

**Success — 200 OK**

```json
{
  "room": { "...same shape as RoomSnapshot above..." }
}
```

**Errors**

| Status | Condition |
|--------|-----------|
| 404 | Room code not found |

---

## POST /rooms/:code/start — Start Game *(NEW)*

Transitions a room from `"lobby"` to `"in-progress"`. Only the host may call
this endpoint. Requires at least 2 participants.

**URL params**: `code` — 4-char room code (case-insensitive)

**Request body**

```json
{ "participantId": "string (required)" }
```

**Success — 200 OK**

```json
{
  "room": {
    "code": "ABCD",
    "status": "in-progress",
    "hostId": "uuid",
    "participants": [ "...same as above..." ],
    "availableWords": ["string"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Errors**

| Status | Condition |
|--------|-----------|
| 400 | `participantId` missing; or fewer than 2 participants in the room |
| 403 | `participantId` does not match `room.hostId` |
| 404 | Room code not found |
