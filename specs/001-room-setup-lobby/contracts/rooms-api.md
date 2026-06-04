# API Contracts: Room Setup & Lobby

Base URL: `http://localhost:3001`

All request and response bodies are JSON. Errors return `{ "message": string }`.

---

## Existing Endpoints (preserved, contracts unchanged)

### `GET /health`
**Response** `200`: `{ "ok": true }`

### `POST /rooms` (schema tightened)
**Request**: `{ "playerName": string }` — trimmed, non-empty (was optional)
**Response** `201`:
```json
{
  "participantId": "uuid",
  "room": { ...RoomSnapshot }
}
```
**Error** `400`: `{ "message": "..." }` — empty/whitespace name

### `POST /rooms/:code/join` (schema tightened)
**Request**: `{ "playerName": string }` — trimmed, non-empty (was optional)
**Response** `200`:
```json
{
  "participantId": "uuid",
  "room": { ...RoomSnapshot }
}
```
**Errors**:
- `400`: empty/whitespace name
- `404`: room not found

### `GET /rooms/:code`
**Query**: `participantId` (optional)
**Response** `200`: `{ "room": { ...RoomSnapshot } }`
**Error** `404`: room not found

---

## New Endpoint

### `POST /rooms/:code/start`

Start the game for the room. Only the host may call this; room must have ≥ 2 participants.

**Request**:
```json
{ "participantId": "uuid" }
```

**Response** `200`:
```json
{
  "room": { ...RoomSnapshot }
}
```
The returned snapshot will have `"status": "playing"`.

**Errors**:
- `400`: fewer than 2 participants — `{ "message": "At least 2 players are required to start" }`
- `403`: caller is not the host — `{ "message": "Only the host can start the game" }`
- `404`: room not found — `{ "message": "Unable to load room" }`

---

## `RoomSnapshot` Shape (updated)

```json
{
  "code": "ABCD",
  "hostId": "uuid",
  "status": "lobby" | "playing" | "finished",
  "participants": [
    { "id": "uuid", "name": "Alice", "joinedAt": "2026-06-04T15:00:00.000Z" }
  ],
  "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
  "roles": ["drawer", "guesser"]
}
```

**Changes from starter**:
- `hostId` field added
- `status` union extended to include `"playing"` and `"finished"`
