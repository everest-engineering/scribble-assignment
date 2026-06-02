# API Contract: Room Setup & Lobby

**Feature**: 001-room-setup-lobby
**Base URL**: `http://localhost:3001`
**Date**: 2026-06-02

All request and response bodies are JSON. All endpoints return `Content-Type:
application/json`.

---

## Existing Endpoints (unchanged interface, behaviour changes noted)

### `POST /rooms`

Creates a new room. The requesting player becomes the host.

**Request body**

```json
{ "playerName": "Alice" }
```

| Field | Type | Validation |
|-------|------|------------|
| `playerName` | `string` | Required; non-empty after trim |

**Success — 201 Created**

```json
{
  "participantId": "uuid-v4",
  "room": {
    "code": "AB3K",
    "status": "lobby",
    "participants": [
      { "id": "uuid-v4", "name": "Alice", "joinedAt": "2026-06-02T10:00:00.000Z" }
    ],
    "hostId": "uuid-v4",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Behaviour change from starter**: `playerName` now required (non-empty). `hostId` now
included in `RoomSnapshot`.

**Error — 400 Bad Request** (empty / whitespace-only name)

```json
{ "message": "Player name is required" }
```

---

### `POST /rooms/:code/join`

Joins an existing room. The joining player is NOT the host.

**URL param**: `code` — case-insensitive (server normalises to uppercase).

**Request body**

```json
{ "playerName": "Bob" }
```

| Field | Type | Validation |
|-------|------|------------|
| `playerName` | `string` | Required; non-empty after trim |

**Success — 200 OK**

```json
{
  "participantId": "uuid-v4-bob",
  "room": {
    "code": "AB3K",
    "status": "lobby",
    "participants": [
      { "id": "uuid-v4-alice", "name": "Alice", "joinedAt": "..." },
      { "id": "uuid-v4-bob",   "name": "Bob",   "joinedAt": "..." }
    ],
    "hostId": "uuid-v4-alice",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Error — 400** (empty name) | **404** (room not found)

```json
{ "message": "Player name is required" }
{ "message": "Unable to join room" }
```

---

### `GET /rooms/:code?participantId=<uuid>`

Returns the current snapshot of a room. Used by lobby polling.

**Query param**: `participantId` — optional; used by `toRoomSnapshot` for future
viewer-specific filtering.

**Success — 200 OK**

```json
{
  "room": {
    "code": "AB3K",
    "status": "lobby",
    "participants": [ ... ],
    "hostId": "uuid-v4-alice",
    "availableWords": [...],
    "roles": [...]
  }
}
```

**Error — 404**

```json
{ "message": "Unable to load room" }
```

---

## New Endpoint

### `POST /rooms/:code/start`

Starts the game. Transitions `status` from `"lobby"` to `"active"`.

**URL param**: `code` — case-insensitive.

**Request body**

```json
{ "participantId": "uuid-v4-alice" }
```

| Field | Type | Validation |
|-------|------|------------|
| `participantId` | `string` | Required; must be a valid UUID |

**Success — 200 OK**

```json
{
  "room": {
    "code": "AB3K",
    "status": "active",
    "participants": [ ... ],
    "hostId": "uuid-v4-alice",
    "availableWords": [...],
    "roles": [...]
  }
}
```

**Error — 400** (invalid UUID)

```json
{ "message": "Invalid participant ID" }
```

**Error — 403** (caller is not the host)

```json
{ "message": "Only the host can start the game" }
```

**Error — 409** (fewer than 2 participants)

```json
{ "message": "At least 2 players are required to start" }
```

**Error — 404** (room not found)

```json
{ "message": "Unable to load room" }
```

---

## Frontend API Client Changes (`frontend/src/services/api.ts`)

| Change | Detail |
|--------|--------|
| Fix `API_BASE_URL` | Remove `/bug` typo → `"http://localhost:3001"` |
| Extend `RoomSnapshot` | Add `hostId: string`; widen `status` to `"lobby" \| "active"` |
| Add `api.startRoom(code, participantId)` | `POST /rooms/:code/start` |

---

## Error Response Shape

All errors follow the same shape, handled by the existing Express error middleware:

```json
{ "message": "<human-readable description>" }
```
