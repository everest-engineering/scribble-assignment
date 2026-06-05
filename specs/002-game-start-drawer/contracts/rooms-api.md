# HTTP Contract: Rooms API (Group 2 changes)

Base URL: `http://localhost:3001`. JSON bodies. Errors use `{ "message": string }` via the existing
`errorHandler`. This document describes **changes layered on the Group 1 contract**
([../../001-room-setup-lobby/contracts/rooms-api.md](../../001-room-setup-lobby/contracts/rooms-api.md)).

## Snapshot shape (Group 2)

```json
{
  "code": "ABCD",
  "status": "started",
  "hostId": "uuid-host",
  "drawerId": "uuid-host",
  "participants": [
    { "id": "uuid-host", "name": "Alice", "joinedAt": "ISO", "isHost": true,  "role": "drawer" },
    { "id": "uuid-bob",  "name": "Bob",   "joinedAt": "ISO", "isHost": false, "role": "guesser" }
  ],
  "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
  "roles": ["drawer", "guesser"],
  "secretWord": "castle"
}
```

- `drawerId`: `null` while `status === "lobby"`; the host's id once `started`. (FR-024)
- `participants[].role`: `null` while in lobby; `"drawer"` for host and `"guesser"` for others once started. (FR-023/024)
- `secretWord`: **present only on the drawer's response**; the key is **absent** for every other viewer. (FR-028/029)

## Modified endpoints

### POST /rooms — create room (name now required)

- **Request**: `{ "playerName": string }` — trimmed; must be non-empty after trim.
- **Response 201**: snapshot (lobby; `drawerId: null`, each `role: null`, no `secretWord`).
- **Errors**:
  - `400 { "message": "Invalid request payload" }` — missing/empty/whitespace-only name. (FR-020/021)

### POST /rooms/:code/join — join room (name now required)

- **Request**: `{ "playerName": string }` — trimmed; must be non-empty after trim.
- **Response 200**: lobby snapshot; joiner `isHost: false`, `role: null`.
- **Errors**:
  - `400 { "message": "Invalid request payload" }` — empty/whitespace name.
  - `400 { "message": "Room code is required" }` — empty/whitespace code (Group 1).
  - `404 { "message": "Room not found" }` — unknown code (Group 1).

### POST /rooms/:code/start — start + initialize round

- **Request**: `{ "participantId": string }`.
- **Response 200** (requester is host = drawer, so includes the word):
  ```json
  {
    "room": {
      "code": "ABCD",
      "status": "started",
      "hostId": "uuid-host",
      "drawerId": "uuid-host",
      "participants": [ /* roles assigned */ ],
      "secretWord": "castle"
    }
  }
  ```
- **Side effects (NEW for Group 2)**: on first successful start, also sets
  `round = { drawerId: hostId, secretWord: selectWord(code), roles }`. (FR-023/025/026)
- **Idempotent**: if already `started`, returns the current room/round unchanged (no re-selection). (FR-025)
- **Errors** (unchanged from Group 1): `403` non-host, `422` <2 players, `404` unknown code.

### GET /rooms/:code — fetch snapshot (viewer-specific word)

- **Query**: `participantId` — now also used to decide whether to include `secretWord`.
- **Response 200**: `{ "room": { ...snapshot } }`
  - If `participantId === drawerId` and room is `started`: snapshot **includes** `secretWord`. (FR-028)
  - Otherwise: snapshot **omits** `secretWord` entirely. (FR-029/030)
- **Read-only**: GET never initializes or mutates round state. (FR-025)
- **Errors**: `404 { "message": "Room not found" }`.

## Status code summary (unchanged from Group 1)

| Endpoint | Success | Errors |
|----------|---------|--------|
| POST /rooms | 201 | 400 (invalid body incl. empty name) |
| POST /rooms/:code/join | 200 | 400 (empty name/code), 404 (not found) |
| POST /rooms/:code/start | 200 (incl. idempotent) | 422 (<2 players), 403 (non-host), 404 (not found) |
| GET /rooms/:code | 200 | 404 (not found) |
