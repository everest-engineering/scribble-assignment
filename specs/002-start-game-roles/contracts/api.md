# API Contracts: Game Start & Role Assignment

Base URL: `http://localhost:3001`

All request and response bodies use `Content-Type: application/json`.

This document extends the contracts from `specs/001-room-setup-lobby/contracts/api.md`. Existing endpoints are modified where noted; new endpoints are added.

---

## POST /rooms/:code/start (MODIFIED)

Start the game. Only the host can call this, and only when ≥2 players are present.

**Path Parameters**:
- `code`: string, 4 alphanumeric characters

**Request Body**:

```json
{
  "participantId": "uuid-of-host"
}
```

- `participantId`: string (UUID), required

**Response** (200) — For all participants:

```json
{
  "room": {
    "code": "A3K9",
    "status": "in-progress",
    "participants": [
      { "id": "uuid-1", "name": "Sketch Captain", "joinedAt": "..." },
      { "id": "uuid-2", "name": "Second Pencil", "joinedAt": "..." }
    ],
    "hostId": "uuid-1",
    "drawerId": "uuid-2",
    "phase": "word-selection",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Note**: When requesting with a `participantId` query parameter on `GET /rooms/:code`, the response includes `wordOptions` (3 words) and `secretWord` (null during word-selection phase) only for the drawer. For guessers, these fields are `null`.

**Errors**:
- 403: `{ "message": "Only the host can start the game" }` — caller is not host
- 400: `{ "message": "Need at least 2 players to start" }` — insufficient players
- 400: `{ "message": "Game has already started" }` — room not in "lobby" status
- 404: `{ "message": "Unable to load room" }` — room not found

---

## GET /rooms/:code (MODIFIED)

Fetch current room state. The response now includes role and word information.

**Path Parameters**:
- `code`: string, 4 alphanumeric characters

**Query Parameters**:
- `participantId`: string (UUID) — used to personalize response

**Response** (200) — Drawer's view (participantId matches drawerId):

```json
{
  "room": {
    "code": "A3K9",
    "status": "in-progress",
    "participants": [
      { "id": "uuid-1", "name": "Sketch Captain", "joinedAt": "..." },
      { "id": "uuid-2", "name": "Second Pencil", "joinedAt": "..." }
    ],
    "hostId": "uuid-1",
    "drawerId": "uuid-2",
    "phase": "word-selection",
    "wordOptions": ["rocket", "pizza", "castle"],
    "secretWord": null,
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Response** (200) — Guesser's view (participantId does not match drawerId):

```json
{
  "room": {
    "code": "A3K9",
    "status": "in-progress",
    "participants": [
      { "id": "uuid-1", "name": "Sketch Captain", "joinedAt": "..." },
      { "id": "uuid-2", "name": "Second Pencil", "joinedAt": "..." }
    ],
    "hostId": "uuid-1",
    "drawerId": "uuid-2",
    "phase": "word-selection",
    "wordOptions": null,
    "secretWord": null,
    "availableWords": [],
    "roles": ["drawer", "guesser"]
  }
}
```

**Response** (200) — Drawer's view after word selected (phase: "drawing"):

```json
{
  "room": {
    "code": "A3K9",
    "status": "in-progress",
    "participants": [ ... ],
    "hostId": "uuid-1",
    "drawerId": "uuid-2",
    "phase": "drawing",
    "wordOptions": null,
    "secretWord": "pizza",
    "availableWords": [],
    "roles": ["drawer", "guesser"]
  }
}
```

**Errors**:
- 404: `{ "message": "Unable to load room" }` — room not found

---

## POST /rooms/:code/select-word (NEW)

The drawer selects their secret word from the presented options.

**Path Parameters**:
- `code`: string, 4 alphanumeric characters

**Request Body**:

```json
{
  "participantId": "uuid-of-drawer",
  "word": "pizza"
}
```

- `participantId`: string (UUID), required — must match the assigned drawerId
- `word`: string, required — must be one of the 3 wordOptions presented

**Response** (200):

```json
{
  "room": {
    "code": "A3K9",
    "status": "in-progress",
    "participants": [ ... ],
    "hostId": "uuid-1",
    "drawerId": "uuid-2",
    "phase": "drawing",
    "wordOptions": null,
    "secretWord": "pizza",
    "availableWords": [],
    "roles": ["drawer", "guesser"]
  }
}
```

**Errors**:
- 403: `{ "message": "Only the drawer can select a word" }` — caller is not the drawer
- 400: `{ "message": "Invalid word selection" }` — word not in the presented options
- 400: `{ "message": "Word already selected" }` — phase is not "word-selection"
- 404: `{ "message": "Unable to load room" }` — room not found
