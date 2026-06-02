# API Contracts: Room Setup & Lobby

**Feature**: `001-room-setup-lobby`  
**Branch**: `001-room-setup-lobby`  
**Base URL**: `http://localhost:3001/api`  
**Date**: 2026-06-03

---

## Existing Endpoints (updated response shapes)

### `POST /api/rooms`

Create a new room. The caller becomes the host.

**Request**

```json
{ "playerName": "Alice" }
```

**Response — 201 Created**

```json
{
  "participantId": "a1b2c3d4-...",
  "room": {
    "code": "XKCD",
    "status": "lobby",
    "hostId": "a1b2c3d4-...",
    "participants": [
      {
        "id": "a1b2c3d4-...",
        "name": "Alice",
        "joinedAt": "2026-06-03T10:00:00.000Z"
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

> `hostId` is **new** in this feature. It always matches `participantId`.

**Response — 400 Bad Request**

```json
{ "message": "Validation error", "errors": { "playerName": "Required" } }
```

---

### `POST /api/rooms/:code/join`

Join an existing room. Rejected if the game is already in progress.

**Request**

```json
{ "playerName": "Bob" }
```

**URL parameter**: `code` — 4-character room code (case-insensitive; backend normalises)

**Response — 200 OK**

```json
{
  "participantId": "e5f6g7h8-...",
  "room": {
    "code": "XKCD",
    "status": "lobby",
    "hostId": "a1b2c3d4-...",
    "participants": [
      {
        "id": "a1b2c3d4-...",
        "name": "Alice",
        "joinedAt": "2026-06-03T10:00:00.000Z"
      },
      {
        "id": "e5f6g7h8-...",
        "name": "Bob",
        "joinedAt": "2026-06-03T10:00:05.000Z"
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Response — 404 Not Found**

```json
{ "message": "Room not found" }
```

**Response — 409 Conflict** ← NEW

```json
{ "message": "Game already in progress" }
```

---

### `GET /api/rooms/:code`

Poll for current room state. Called every ~2 seconds from the Lobby.

**Query parameter**: `participantId` — caller's participant ID (used by `toRoomSnapshot` for viewer context)

**Response — 200 OK**

```json
{
  "room": {
    "code": "XKCD",
    "status": "lobby",
    "hostId": "a1b2c3d4-...",
    "participants": [ ... ],
    "availableWords": [ ... ],
    "roles": [ ... ]
  }
}
```

> When `status` transitions to `"playing"`, the frontend navigates all clients to `/game`.

**Response — 404 Not Found**

```json
{ "message": "Room not found" }
```

---

## New Endpoints

### `POST /api/rooms/:code/start` ← NEW

Transition room status from `"lobby"` to `"playing"`. No request body required. No caller identity check (host enforcement is frontend-only per spec clarification Q2).

**URL parameter**: `code` — 4-character room code

**Request body**: empty / `{}`

**Response — 200 OK**

```json
{
  "room": {
    "code": "XKCD",
    "status": "playing",
    "hostId": "a1b2c3d4-...",
    "participants": [ ... ],
    "availableWords": [ ... ],
    "roles": [ ... ]
  }
}
```

**Response — 404 Not Found**

```json
{ "message": "Room not found" }
```

---

## Error Envelope

All error responses follow a consistent shape:

```json
{ "message": "Human-readable description" }
```

Validation errors include an additional `errors` map:

```json
{
  "message": "Validation error",
  "errors": {
    "fieldName": "Error message"
  }
}
```

---

## Frontend API Service (`frontend/src/services/api.ts`)

| Method                           | Signature                         | HTTP call                            |
| -------------------------------- | --------------------------------- | ------------------------------------ |
| `createRoom(playerName)`         | `Promise<RoomSessionResponse>`    | `POST /rooms`                        |
| `joinRoom(code, playerName)`     | `Promise<RoomSessionResponse>`    | `POST /rooms/:code/join`             |
| `fetchRoom(code, participantId)` | `Promise<RoomSnapshot>`           | `GET /rooms/:code?participantId=...` |
| `startRoom(code)` ← NEW          | `Promise<{ room: RoomSnapshot }>` | `POST /rooms/:code/start`            |

**URL defect fix**: The default fallback `"http://localhost:3001/bug"` must be corrected to `"http://localhost:3001/api"`.
