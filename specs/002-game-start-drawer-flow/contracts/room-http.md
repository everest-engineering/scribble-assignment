# HTTP Contract: Game Start & Drawer Flow

## Overview

This feature extends the existing room HTTP API. Responses are viewer-aware for
game state, and the secret word is only present for the drawer.

## Endpoints

### `POST /rooms`

Request body:

```json
{
  "playerName": "Alice"
}
```

Rules:

- `playerName` is trimmed before validation.
- Whitespace-only names are rejected.

Response `201`:

```json
{
  "participantId": "uuid",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostParticipantId": "uuid",
    "currentDrawerId": null,
    "participants": [
      {
        "id": "uuid",
        "name": "Alice",
        "joinedAt": "2026-06-05T00:00:00.000Z"
      }
    ],
    "availableWords": ["rocket", "pizza"]
  }
}
```

### `POST /rooms/:code/join`

Request body:

```json
{
  "playerName": "Bob"
}
```

Rules:

- Same trimming and empty-name rejection as room creation.

Response `200`:

```json
{
  "participantId": "uuid",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostParticipantId": "uuid",
    "currentDrawerId": null,
    "participants": [
      {
        "id": "uuid",
        "name": "Bob",
        "joinedAt": "2026-06-05T00:00:00.000Z"
      }
    ],
    "availableWords": ["rocket", "pizza"]
  }
}
```

### `GET /rooms/:code?participantId=...`

Response `200`:

- Returns the current room snapshot for the viewer.
- Includes `currentWord` only when `participantId` matches `currentDrawerId`.
- Omits `currentWord` entirely for guessers.

### `POST /rooms/:code/start`

Request body:

```json
{
  "participantId": "uuid"
}
```

Rules:

- Only the host may start the game.
- At least 2 participants are required.
- The host becomes `drawer`; all others become `guesser`.
- The selected word is deterministic per room code.

Response `200`:

- Returns the viewer-aware room snapshot.

Error responses:

- `403` when a non-host starts the game.
- `404` when the room does not exist.
- `409` when there are fewer than 2 players.

### `POST /rooms/:code/leave`

Request body:

```json
{
  "participantId": "uuid"
}
```

Rules:

- If the drawer/host leaves during `game`, the room is deleted immediately.

Response `200`:

```json
{
  "ok": true,
  "deleted": true
}
```
