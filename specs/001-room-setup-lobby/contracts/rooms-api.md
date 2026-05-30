# REST Contract: Rooms API (Scenario 1 deltas)

**Base URL**: `http://localhost:3001` (or `VITE_API_URL` on frontend)

**Existing endpoints** (behavior extended, not replaced):

---

## POST /rooms

Create a room; creator becomes host.

### Request

```json
{
  "playerName": "Alice"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `playerName` | string | no | Defaults to `"Player"` if omitted |

### Response `201 Created`

```json
{
  "participantId": "uuid",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostParticipantId": "uuid",
    "participants": [
      {
        "id": "uuid",
        "name": "Alice",
        "joinedAt": "2026-05-30T12:00:00.000Z",
        "isHost": true
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

### Errors

| Status | When |
|--------|------|
| 400 | Invalid body (Zod) |

---

## POST /rooms/:code/join

Join an existing lobby.

### Params

| Param | Notes |
|-------|-------|
| `code` | Case-insensitive; normalized to uppercase server-side |

### Request

```json
{
  "playerName": "Bob"
}
```

### Response `200 OK`

Same shape as create response; new participant has `isHost: false`.

### Errors

| Status | Message (example) | When |
|--------|-------------------|------|
| 404 | Unable to join room | Unknown code |
| 400 | Invalid body | Zod failure |
| 409 | Game already started | Optional: reject join when `status !== "lobby"` |

---

## GET /rooms/:code

Fetch room snapshot (used for lobby polling).

### Query

| Param | Required | Notes |
|-------|----------|-------|
| `participantId` | no | Echoed for future viewer-specific fields; required client-side for session continuity |

### Response `200 OK`

```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostParticipantId": "host-uuid",
    "participants": [ "..." ],
    "availableWords": [ "..." ],
    "roles": [ "drawer", "guesser" ]
  }
}
```

### Errors

| Status | When |
|--------|------|
| 404 | Unable to load room |

---

## POST /rooms/:code/start *(new)*

Host starts the game when at least two participants are present.

### Params

| Param | Notes |
|-------|-------|
| `code` | Case-insensitive room code |

### Request

```json
{
  "participantId": "host-uuid"
}
```

| Field | Type | Required |
|-------|------|----------|
| `participantId` | string | yes |

### Response `200 OK`

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "hostParticipantId": "host-uuid",
    "participants": [ "..." ],
    "availableWords": [ "..." ],
    "roles": [ "drawer", "guesser" ]
  }
}
```

### Errors

| Status | Message (example) | When |
|--------|-------------------|------|
| 404 | Unable to load room | Unknown code |
| 403 | Only the host can start the game | `participantId` is not host |
| 403 | At least two players are required | Fewer than 2 participants |
| 409 | Game already started | `status !== "lobby"` |
| 400 | Invalid body | Missing `participantId` |

---

## GET /health

Unchanged — `{ "ok": true }` for smoke checks.
