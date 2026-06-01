# API Contract: Game Start & Round-One Snapshot

**Base path**: `/rooms`  
**Feature**: `002-first-round-drawer`  
**Depends on**: `001-host-join-rooms` (`POST /rooms/:code/start`, `GET /rooms/:code`)

## POST /rooms/:code/start

Host starts game; begins round 1.

**Query**: `?participantId=<uuid>` (must be host)

**Success `200`**

```json
{
  "room": {
    "code": "ABCD",
    "status": "drawing",
    "roundNumber": 1,
    "drawerParticipantId": "uuid-host",
    "participants": [
      { "id": "uuid-host", "name": "Alice", "role": "drawer", "isHost": true },
      { "id": "uuid-guest", "name": "Bob", "role": "guesser", "isHost": false }
    ],
    "viewer": {
      "participantId": "uuid-host",
      "role": "drawer",
      "secretWord": "rocket",
      "isHost": true,
      "canStart": false
    }
  }
}
```

**Guesser GET/POST response**: same shape but `viewer.role` is `guesser` and **`viewer` MUST NOT include `secretWord`**.

**Errors**

| Status | Condition |
|--------|-----------|
| 400 | Any participant name empty after trim |
| 403 | Non-host calls start |
| 409 | Fewer than 2 participants |
| 404 | Room not found |

## GET /rooms/:code (during drawing)

Same viewer-scoping rules: `secretWord` only for drawer `participantId`.
