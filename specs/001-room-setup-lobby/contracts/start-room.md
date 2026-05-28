# Contract: POST /rooms/:code/start

## Purpose

Transitions a room from `lobby` to `playing`. Only callable by the host when
≥2 participants are present.

## Request

```
POST /rooms/:code/start
Content-Type: application/json

Path params:
  code  — 4-char uppercase room code

Body:
  { "participantId": "<uuid>" }
```

## Responses

### 200 OK — game started

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "hostId": "<uuid>",
    "participants": [
      { "id": "<uuid>", "name": "Alice", "joinedAt": "<iso>" },
      { "id": "<uuid>", "name": "Bob",   "joinedAt": "<iso>" }
    ],
    "availableWords": ["rocket","pizza","castle","guitar","sunflower"],
    "roles": ["drawer","guesser"]
  }
}
```

### 403 Forbidden — not the host

```json
{ "message": "Only the host can start the game" }
```

### 403 Forbidden — not enough players

```json
{ "message": "Need at least 2 players to start" }
```

### 404 Not Found — room does not exist

```json
{ "message": "Unable to load room" }
```

## Side Effects

- `room.status` is set to `"playing"` in the in-memory store
- `room.updatedAt` is updated to current timestamp
- No other fields are mutated by this endpoint
