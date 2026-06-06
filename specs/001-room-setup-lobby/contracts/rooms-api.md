# HTTP Contract: Rooms API (Group 1)

Base URL: `http://localhost:3001`. All bodies are JSON. Errors use `{ "message": string }` with an
appropriate status (existing `errorHandler` convention).

## Existing endpoints (modified responses)

### POST /rooms

Create a room; creator becomes host.

- **Request**: `{ "playerName": string }`
- **Response 201**:
  ```json
  {
    "participantId": "uuid",
    "room": {
      "code": "ABCD",
      "status": "lobby",
      "hostId": "uuid",
      "participants": [{ "id": "uuid", "name": "Alice", "joinedAt": "ISO", "isHost": true }],
      "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
      "roles": ["drawer", "guesser"]
    }
  }
  ```
- **Change vs starter**: snapshot now includes `hostId` and per-participant `isHost`. (FR-002, FR-003)

### POST /rooms/:code/join

Join an existing room by code.

- **Path**: `:code` is trimmed + uppercased before lookup. (FR-005)
- **Request**: `{ "playerName": string }`
- **Response 200**: same snapshot shape as above (joiner has `isHost: false`).
- **Errors**:
  - `404 { "message": "Room not found" }` — unknown code. (FR-006)
  - `400 { "message": "Room code is required" }` — empty/whitespace code. (FR-007)

### GET /rooms/:code

Fetch a room snapshot (used by lobby polling).

- **Query**: `participantId` (optional) — used to compute the viewer's `isHost`.
- **Response 200**: `{ "room": { ...snapshot } }`
- **Errors**: `404 { "message": "Room not found" }`.
- **Usage**: Lobby polls this ~every 2s; when `room.status === "started"`, clients navigate to
  `/game`. (FR-009, FR-017)

## New endpoint

### POST /rooms/:code/start

Host starts the game once at least 2 players are present.

- **Path**: `:code` trimmed + uppercased.
- **Request**: `{ "participantId": string }` — the requester's identity.
- **Response 200**:
  ```json
  { "room": { "code": "ABCD", "status": "started", "hostId": "uuid", "participants": [ ... ] } }
  ```
- **Errors**:
  - `403 { "message": "Only the host can start the game" }` — `participantId !== room.hostId`. (FR-014)
  - `422 { "message": "At least 2 players are required to start" }` — fewer than 2 participants. (FR-015)
  - `404 { "message": "Unable to start room" }` — unknown code.
- **Idempotent**: If room is already `started`, returns `200` with current snapshot (no error).
- **Side effects**: sets `status = "started"` on first successful start. MUST NOT assign a drawer role
  or select a secret word. (FR-017, FR-018)

## Status code summary

| Endpoint | Success | Errors |
|----------|---------|--------|
| POST /rooms | 201 | 400 (invalid body) |
| POST /rooms/:code/join | 200 | 400 (empty code), 404 (not found) |
| GET /rooms/:code | 200 | 404 (not found) |
| POST /rooms/:code/start | 200 (incl. idempotent) | 422 (<2 players), 403 (non-host), 404 (not found) |
