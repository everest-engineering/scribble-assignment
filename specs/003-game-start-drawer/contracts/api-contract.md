# API Contract: Game Start & Drawer Flow

**Phase 1 output** | **Date**: 2026-05-30

## Overview

Extends the existing room API with game-start name validation and round 1 response. All existing endpoints (`POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code`) remain unchanged except for added fields in their responses.

## Endpoint Changes

### POST /rooms/:code/start

**Purpose**: Start the game from the lobby. Extended to validate player names before transitioning to playing state.

**Request** (unchanged):

```json
{
  "participantId": "string"
}
```

**Response: Success (all names valid)** — `200 OK`

```json
{
  "status": "playing",
  "roundNumber": 1,
  "drawerId": "participant-uuid",
  "drawerName": "HostName",
  "currentWord": "rocket",
  "participants": [ /* full participant list with isHost flags */ ],
  "message": "Game started"
}
```

- `currentWord` is included because the requester IS the host (only the host can call start), and the host is the drawer for round 1.

**Response: Awaiting rename** — `200 OK` (room state changed)

```json
{
  "status": "awaiting_rename",
  "invalidParticipantIds": ["player-uuid-with-bad-name"],
  "message": "Game cannot start until all players have valid names"
}
```

- `invalidParticipantIds` lists which players need to update their names.
- The frontend should show rename inputs for those players.

**Response: Not host** — `403 Forbidden`

```json
{
  "error": "Only the host can start the game"
}
```

(Defensive — the start button is already hidden from non-hosts per FR-008.)

**Response: Not enough players** — `400 Bad Request`

```json
{
  "error": "At least 2 players are required to start the game"
}
```

**Validation**: Zod schema validates `participantId` is a non-empty string.

---

### POST /rooms/:code/rename

**New endpoint** — allows a player to rename themselves during `"awaiting_rename"` state.

**Request**:

```json
{
  "participantId": "string",
  "name": "string"
}
```

**Validation**: `name` trimmed, must be non-empty after trimming (same Zod schema as create/join).

**Response: Success** — `200 OK`

```json
{
  "status": "awaiting_rename",
  "allNamesValid": false,
  "message": "Name updated"
}
```

When all names become valid, the response auto-transitions:

```json
{
  "status": "playing",
  "roundNumber": 1,
  "drawerId": "participant-uuid",
  "drawerName": "HostName",
  "currentWord": "rocket",
  "participants": [ /* full list */ ],
  "message": "All names valid — game started"
}
```

**Response: Not in awaiting_rename state** — `400 Bad Request`

```json
{
  "error": "Room is not in awaiting_rename state"
}
```

**Response: Name still invalid** — `400 Bad Request`

```json
{
  "error": "Name cannot be empty or whitespace-only"
}
```

---

### GET /rooms/:code (with `?participantId=`)

**Extended response** — new fields added to the existing `RoomSnapshot`.

**When status is `"playing"`** — new fields added:

```json
{
  "code": "ABCD",
  "status": "playing",
  "participants": [ /* full list */ ],
  "createdAt": "2026-05-30T...",
  "updatedAt": "2026-05-30T...",
  "roundNumber": 1,
  "drawerId": "participant-uuid",
  "drawerName": "HostName",
  "currentWord": "rocket",           // ONLY present when viewerParticipantId === drawerId
  "availableWords": [],               // REMOVED — no longer sent to any client
  "roles": { /* same as before */ }
}
```

- `currentWord` is conditionally included: the server adds it only when the `viewerParticipantId` query parameter matches the drawer's ID.
- Non-drawer players see `roundNumber`, `drawerId`, and `drawerName` but NOT `currentWord`.
- `availableWords` is removed to prevent word list leakage.

**When status is `"awaiting_rename"`**:

```json
{
  "code": "ABCD",
  "status": "awaiting_rename",
  "participants": [ /* full list */ ],
  "createdAt": "2026-05-30T...",
  "updatedAt": "2026-05-30T...",
  "invalidParticipantIds": ["player-uuid-with-bad-name"],
  "roundNumber": null,
  "drawerId": null
}
```

**When status is `"lobby"`**: Response unchanged from existing implementation.

---

### POST /rooms/:code/disband

**New endpoint** — allows host to disband a stuck room (e.g., nobody fixes their name in awaiting_rename state).

**Request**:

```json
{
  "participantId": "string"
}
```

**Response: Success** — `200 OK`

```json
{
  "message": "Room disbanded"
}
```

The room is removed from the store. Subsequent polling returns 404.

## Error Responses (all endpoints)

All errors follow the existing pattern:

```json
{
  "error": "Human-readable error message"
}
```

Error codes: 400 (validation), 403 (host-only action), 404 (room not found), 500 (server error).
