# Contract: POST /rooms/:code/start

## Purpose

Transitions a room from the lobby/waiting state to the active playing state,
assigns the first-joined participant as the drawer, and fixes the secret word.

---

## Request

```
POST /rooms/:code/start
Content-Type: application/json

(no request body required)
```

| Part       | Name   | Type   | Required | Description                        |
|------------|--------|--------|----------|------------------------------------|
| Path param | `code` | string | yes      | Room code (case-insensitive, uppercased by server) |

---

## Success Response — 200 OK

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "participants": [
      { "id": "uuid-1", "name": "Alice", "joinedAt": "2026-06-10T10:00:00.000Z", "isHost": true },
      { "id": "uuid-2", "name": "Bob",   "joinedAt": "2026-06-10T10:01:00.000Z", "isHost": false }
    ],
    "availableWords": ["rocket","pizza","castle","guitar","sunflower"],
    "roles": ["drawer","guesser"],
    "drawerName": "Alice"
  }
}
```

> `secretWord` is NOT included in the start response. Players retrieve it via `GET /rooms/:code`.

---

## Error Responses

| HTTP Status | Condition                                              | Response body                                     |
|-------------|--------------------------------------------------------|---------------------------------------------------|
| 404         | Room code does not exist                               | `{ "message": "Room not found" }`                 |
| 409         | Room is already in playing state                       | `{ "message": "Game has already started" }`       |
| 400         | Fewer than 2 participants in the room                  | `{ "message": "At least 2 players are required to start" }` |
| 400         | Any participant name is empty or whitespace-only       | `{ "message": "All player names must be non-empty" }` |

---

## Updated: GET /rooms/:code

The existing `GET /rooms/:code?participantId=<id>` endpoint is extended.

**When `status === "playing"` and viewer is the drawer**:

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "participants": [...],
    "availableWords": [...],
    "roles": [...],
    "drawerName": "Alice",
    "secretWord": "rocket"
  }
}
```

**When `status === "playing"` and viewer is NOT the drawer** (or no `participantId` supplied):

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "participants": [...],
    "availableWords": [...],
    "roles": [...],
    "drawerName": "Alice"
  }
}
```

> `secretWord` is absent from the response — not `null`, simply not present.
