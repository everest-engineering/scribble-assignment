# API Contracts: Room Creation and Join

## Base URL

`http://localhost:3001` (backend dev server)

## Endpoints

### Create Room

`POST /rooms`

**Request Body** (JSON):
```json
{
  "playerName": "Alice"
}
```

**Validation**:
- `playerName`: required, non-empty after trim. Empty/whitespace → `400`.

**Response 201**:
```json
{
  "participantId": "550e8400-e29b-41d4-a716-446655440000",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": [
      { "id": "550e8400-e29b-41d4-a716-446655440000", "name": "Alice", "joinedAt": "2026-06-11T09:00:00.000Z" }
    ],
    "hostId": "550e8400-e29b-41d4-a716-446655440000",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

---

### Join Room

`POST /rooms/:code/join`

**Path Params**:
- `code`: 4-character uppercase room code.

**Request Body** (JSON):
```json
{
  "playerName": "Bob"
}
```

**Validation**:
- `playerName`: required, non-empty after trim. Empty/whitespace → `400`.
- `code`: must exist. Missing/invalid → `404`.

**Response 200**:
```json
{
  "participantId": "660e8400-e29b-41d4-a716-446655440001",
  "room": { /* RoomSnapshot, includes new participant */ }
}
```

**Error Responses**:
- `404` — Room does not exist.
- `409` — Game already in progress (`status === "playing"`).

---

### Get Room

`GET /rooms/:code?participantId={id}`

**Path Params**:
- `code`: room code.

**Query Params**:
- `participantId`: optional opaque player ID; used to derive viewer context.

**Validation**:
- `code`: must exist. Missing/invalid → `404`.

**Response 200**:
```json
{
  "room": { /* RoomSnapshot */ }
}
```

---

### Start Game

`POST /rooms/:code/start`

**Path Params**:
- `code`: room code.

**Request Body** (JSON):
```json
{
  "participantId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Validation**:
- `code`: must exist. Missing/invalid → `404`.
- `participantId`: required. Must match `room.hostParticipantId`. Mismatch → `403`.
- Room must have `status === "lobby"` and `participants.length >= 2`. Otherwise → `409`.

**Response 200**:
```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "participants": [ /* ... */ ],
    "hostId": "550e8400-e29b-41d4-a716-446655440000",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Error Responses**:
- `403` — Caller is not the host.
- `409` — Not enough players or game already started.

---

## Error Format

All errors return JSON:
```json
{
  "message": "Human-readable description"
}
```

- `400` — Invalid request payload (Zod validation failure).
- `403` — Forbidden action (e.g., non-host trying to start).
- `404` — Room or route not found.
- `409` — Conflict (game in progress, not enough players).
- `500` — Unexpected server error.
