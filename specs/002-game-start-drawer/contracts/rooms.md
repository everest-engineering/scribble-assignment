# API Contracts: Rooms (Scenario 2 additions)

**Branch**: `assignment` | **Date**: 2026-05-31
**Base URL**: `http://localhost:3001`

---

## POST /rooms/:code/start — Start Game (updated)

Transitions room to `"game"`, assigns drawer and secret word.

**Request body**: unchanged — `{ "participantId": "host-uuid" }`

**Response 200** (updated — now includes `drawerId`; `secretWord` only for host/drawer):
```json
{
  "room": {
    "code": "ABCD",
    "hostId": "host-uuid",
    "drawerId": "host-uuid",
    "secretWord": "rocket",
    "status": "game",
    "participants": [...],
    "availableWords": [...],
    "roles": [...]
  }
}
```

*Note*: The start response always returns `secretWord` because the caller is always the host who is also the drawer.

---

## GET /rooms/:code — Get Room Snapshot (updated)

`secretWord` is now conditionally included based on `participantId` query param.

**Query params**: `participantId` (optional)

**Response 200 — drawer's view** (`participantId` matches `drawerId`):
```json
{
  "room": {
    "code": "ABCD",
    "hostId": "host-uuid",
    "drawerId": "host-uuid",
    "secretWord": "rocket",
    "status": "game",
    "participants": [...],
    "availableWords": [...],
    "roles": [...]
  }
}
```

**Response 200 — guesser's view** (`participantId` does not match `drawerId` or is absent):
```json
{
  "room": {
    "code": "ABCD",
    "hostId": "host-uuid",
    "drawerId": "host-uuid",
    "status": "game",
    "participants": [...],
    "availableWords": [...],
    "roles": [...]
  }
}
```

*Note*: `secretWord` key is entirely absent from the guesser response — not `null`, not `""`.

---

## Unchanged endpoints

`POST /rooms` and `POST /rooms/:code/join` responses now include `drawerId: null` in the room snapshot (lobby state). `secretWord` is absent (not yet set).
