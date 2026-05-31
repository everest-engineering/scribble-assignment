# API Contract: Rooms (Scenario 1 extensions)

**Base URL**: `http://localhost:3001`  
**Prefix**: `/rooms`  
**Content-Type**: `application/json`

Error envelope (unchanged):

```json
{ "message": "Human-readable error" }
```

---

## POST /rooms

Create a room. Creator becomes host.

**Request body**

```json
{ "playerName": "Alice" }
```

| Field | Type | Required |
|-------|------|----------|
| `playerName` | string | no |

**Response 201**

```json
{
  "participantId": "uuid",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostId": "uuid",
    "participants": [
      { "id": "uuid", "name": "Alice", "joinedAt": "2026-05-31T12:00:00.000Z" }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

---

## POST /rooms/:code/join

Join a room in lobby status.

**Params**: `code` — 4-character room code (normalized uppercase server-side)

**Request body**

```json
{ "playerName": "Bob" }
```

**Response 200** — same shape as create (new `participantId` for joiner)

**Errors**

| Status | Message | When |
|--------|---------|------|
| 404 | `Room not found` | Unknown code |
| 409 | `Game already in progress` | `status !== "lobby"` |
| 400 | `Invalid request payload` | Zod failure |

---

## GET /rooms/:code

Fetch room snapshot (polling target).

**Query**: `participantId` (optional string) — reserved for viewer filtering in later scenarios

**Response 200**

```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostId": "uuid",
    "participants": [ ... ],
    "availableWords": [ ... ],
    "roles": [ ... ]
  }
}
```

**Errors**

| Status | Message |
|--------|---------|
| 404 | `Unable to load room` |

---

## POST /rooms/:code/start *(new)*

Host starts the game. Transitions `lobby` → `playing`.

**Params**: `code`

**Request body**

```json
{ "participantId": "host-uuid" }
```

| Field | Type | Required |
|-------|------|----------|
| `participantId` | string | yes |

**Response 200**

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "hostId": "uuid",
    "participants": [ ... ],
    "availableWords": [ ... ],
    "roles": [ ... ]
  }
}
```

**Errors**

| Status | Message | When |
|--------|---------|------|
| 404 | `Room not found` | Unknown code |
| 403 | `Only the host can start the game` | `participantId !== hostId` |
| 400 | `At least two players are required` | `participants.length < 2` |
| 409 | `Game already started` | `status !== "lobby"` |

---

## Client-side validation (JoinRoomPage)

Before calling join API:

| Condition | User message |
|-----------|--------------|
| Empty code | `Room code is required` |
| Invalid format | `Room code must be 4 characters (A–Z, 2–9; no I, O, 0, 1)` |

Format validation MUST NOT call the API (FR-006 / US2-4).
