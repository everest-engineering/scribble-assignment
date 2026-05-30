# API Contract: Game Room Lobby

**Branch**: `002-game-room-lobby` | **Date**: 2026-05-30  
**Base URL**: `http://localhost:3001` (backend Express server)

All request and response bodies are JSON. All error responses follow the shape `{ "message": string }`.

---

## Existing Endpoints (unchanged behaviour, schema tightened)

### `POST /rooms` — Create Room

Creates a new room. The calling player becomes the host.

**Request body**:
```json
{ "playerName": "Alice" }
```

| Field        | Type     | Constraints                        | Required |
|--------------|----------|------------------------------------|----------|
| `playerName` | `string` | Non-empty, non-whitespace-only     | Yes ✱    |

> ✱ **Change from starter**: `playerName` was optional. It is now required and must not be blank.

**Success response** — `201 Created`:
```json
{
  "participantId": "uuid-of-alice",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostId": "uuid-of-alice",
    "participants": [
      { "id": "uuid-of-alice", "name": "Alice", "joinedAt": "2026-05-30T10:00:00.000Z" }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

> ✱ **Change from starter**: `room` now includes `hostId`.

**Error responses**:
| Status | Condition |
|--------|-----------|
| `400`  | `playerName` is missing, empty, or whitespace-only |

---

### `POST /rooms/:code/join` — Join Room

Adds a player to an existing room.

**URL params**:
| Param  | Type     | Constraints                                   |
|--------|----------|-----------------------------------------------|
| `code` | `string` | 4 uppercase characters from `[A-Z2-9]` ✱     |

> ✱ **Change from starter**: `roomCodeParamsSchema` now validates the code format.

**Request body**:
```json
{ "playerName": "Bob" }
```

| Field        | Type     | Constraints                        | Required |
|--------------|----------|------------------------------------|----------|
| `playerName` | `string` | Non-empty, non-whitespace-only     | Yes ✱    |

**Success response** — `200 OK`:
```json
{
  "participantId": "uuid-of-bob",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostId": "uuid-of-alice",
    "participants": [
      { "id": "uuid-of-alice", "name": "Alice", "joinedAt": "..." },
      { "id": "uuid-of-bob",   "name": "Bob",   "joinedAt": "..." }
    ],
    "availableWords": ["..."],
    "roles": ["drawer", "guesser"]
  }
}
```

**Error responses**:
| Status | Condition |
|--------|-----------|
| `400`  | `playerName` missing/blank, or `code` malformed (not 4 chars from valid alphabet) |
| `404`  | No room exists with that code |

---

### `GET /rooms/:code` — Fetch Room (lobby polling)

Returns the current snapshot of a room. Called by the frontend poll every ~2 seconds.

**URL params**: same as join.

**Query params**:
| Param           | Type     | Required |
|-----------------|----------|----------|
| `participantId` | `string` | No       |

**Success response** — `200 OK`:
```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostId": "uuid-of-alice",
    "participants": [ ... ],
    "availableWords": [ ... ],
    "roles": [ ... ]
  }
}
```

**Error responses**:
| Status | Condition |
|--------|-----------|
| `404`  | Room not found |

---

## New Endpoint

### `POST /rooms/:code/start` — Start Game

Transitions the room from `"lobby"` to `"active"`. Only the host may call this when at least 2 players are present.

**URL params**: same `code` validation as join.

**Request body**:
```json
{ "participantId": "uuid-of-alice" }
```

| Field           | Type            | Constraints | Required |
|-----------------|-----------------|-------------|----------|
| `participantId` | `string` (UUID) | Valid UUID  | Yes      |

**Success response** — `200 OK`:
```json
{
  "room": {
    "code": "ABCD",
    "status": "active",
    "hostId": "uuid-of-alice",
    "participants": [ ... ],
    "availableWords": [ ... ],
    "roles": [ ... ]
  }
}
```

**Error responses**:
| Status | Condition |
|--------|-----------|
| `400`  | Missing or invalid `participantId` in body |
| `403`  | `participantId` is not the room's `hostId` |
| `404`  | Room not found |
| `409`  | Fewer than 2 participants in the room |

---

## Frontend API Client (`frontend/src/services/api.ts`)

| Method         | Signature                                                    | Calls                             |
|----------------|--------------------------------------------------------------|-----------------------------------|
| `createRoom`   | `(playerName: string) => Promise<RoomSessionResponse>`       | `POST /rooms`                     |
| `joinRoom`     | `(code: string, playerName: string) => Promise<RoomSessionResponse>` | `POST /rooms/:code/join` |
| `fetchRoom`    | `(code: string, participantId?: string) => Promise<{ room: RoomSnapshot }>` | `GET /rooms/:code` |
| `startRoom` ✱  | `(code: string, participantId: string) => Promise<{ room: RoomSnapshot }>` | `POST /rooms/:code/start` |

> ✱ New method added in this feature.

**Base URL fix**: `API_BASE_URL` in `api.ts` must be `http://localhost:3001` (the current starter value `http://localhost:3001/bug` is a known bug).
