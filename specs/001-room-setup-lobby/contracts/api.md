# API Contract: Room Setup and Lobby

**Feature**: 001-room-setup-lobby
**Base URL**: `http://localhost:3001`
**Protocol**: HTTP/1.1, JSON bodies (`Content-Type: application/json`)

---

## Shared Types

```typescript
type RoomStatus = "lobby" | "active" | "ended";

interface Participant {
  id: string;       // UUID
  name: string;     // trimmed, 1–20 chars
  joinedAt: string; // ISO 8601
}

interface RoomSnapshot {
  code: string;
  hostId: string;           // NEW — participant ID of the host
  status: RoomStatus;
  participants: Participant[];
  availableWords: string[];
  roles: ("drawer" | "guesser")[];
}

interface RoomSessionResponse {
  participantId: string;  // caller's own ID
  room: RoomSnapshot;
}

interface ErrorResponse {
  message: string;
}
```

---

## Endpoints

### POST /rooms — Create Room

Creates a new room. The caller becomes the host.

**Request body**

```json
{
  "playerName": "Alice"
}
```

| Field | Type | Constraints |
|-------|------|-------------|
| `playerName` | `string` | Required; trimmed; 1–20 characters |

**Success — 201 Created**

```json
{
  "participantId": "<uuid>",
  "room": {
    "code": "AB3X",
    "hostId": "<same-uuid-as-participantId>",
    "status": "lobby",
    "participants": [
      { "id": "<uuid>", "name": "Alice", "joinedAt": "2026-05-29T10:00:00.000Z" }
    ],
    "availableWords": ["..."],
    "roles": ["drawer", "guesser"]
  }
}
```

**Errors**

| Status | Condition | `message` |
|--------|-----------|-----------|
| 400 | `playerName` missing, empty, or whitespace-only | "Name is required" (Zod default) |
| 400 | `playerName` > 20 chars | Zod validation message |

---

### POST /rooms/:code/join — Join Room

Adds a new participant to an existing lobby room.

**URL params**

| Param | Notes |
|-------|-------|
| `code` | Case-insensitive; normalized to uppercase server-side |

**Request body**

```json
{
  "playerName": "Bob"
}
```

| Field | Type | Constraints |
|-------|------|-------------|
| `playerName` | `string` | Required; trimmed; 1–20 characters |

**Success — 200 OK**

```json
{
  "participantId": "<uuid>",
  "room": {
    "code": "AB3X",
    "hostId": "<host-uuid>",
    "status": "lobby",
    "participants": [
      { "id": "<host-uuid>", "name": "Alice", "joinedAt": "..." },
      { "id": "<uuid>", "name": "Bob", "joinedAt": "..." }
    ],
    "availableWords": ["..."],
    "roles": ["drawer", "guesser"]
  }
}
```

**Errors**

| Status | Condition | `message` |
|--------|-----------|-----------|
| 400 | `playerName` invalid | Zod validation message |
| 404 | Room code not found | "Room not found" |
| 409 | Room status is not `"lobby"` | "Game already in progress" |

---

### POST /rooms/:code/start — Start Game *(NEW)*

Transitions a lobby room to `active` status. Only the host may call this.

**URL params**

| Param | Notes |
|-------|-------|
| `code` | Uppercase room code |

**Request body**

```json
{
  "participantId": "<host-uuid>"
}
```

| Field | Type | Constraints |
|-------|------|-------------|
| `participantId` | `string` | Required; must be a UUID |

**Success — 200 OK**

```json
{
  "room": {
    "code": "AB3X",
    "hostId": "<host-uuid>",
    "status": "active",
    "participants": [...],
    "availableWords": ["..."],
    "roles": ["drawer", "guesser"]
  }
}
```

**Errors**

| Status | Condition | `message` |
|--------|-----------|-----------|
| 400 | `participantId` missing or invalid | Zod validation message |
| 400 | Fewer than 2 participants in room | "At least 2 players are required to start" |
| 403 | `participantId` does not match `room.hostId` | "Only the host can start the game" |
| 404 | Room code not found | "Room not found" |
| 409 | Room already active or ended | "Game already in progress" |

---

### GET /rooms/:code — Get Room Snapshot

Fetches the current room state for polling.

**URL params**

| Param | Notes |
|-------|-------|
| `code` | Uppercase room code |

**Query params**

| Param | Type | Notes |
|-------|------|-------|
| `participantId` | `string` (optional) | Caller's participant ID; used for viewer-scoped responses in later scenarios |

**Success — 200 OK**

```json
{
  "room": {
    "code": "AB3X",
    "hostId": "<host-uuid>",
    "status": "lobby",
    "participants": [...],
    "availableWords": ["..."],
    "roles": ["drawer", "guesser"]
  }
}
```

**Errors**

| Status | Condition | `message` |
|--------|-----------|-----------|
| 404 | Room code not found | "Room not found" |

---

## Error response shape (all errors)

```json
{
  "message": "<human-readable description>"
}
```

Produced by the centralized `errorHandler` in `backend/src/api/router.ts`.
`HttpError` instances set `statusCode`; Zod `ZodError` maps to 400.
