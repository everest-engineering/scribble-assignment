---
description: "API contracts for First Round — Drawer Assignment and Secret Word"
---

# API Contracts: First Round — Drawer Assignment and Secret Word

**Feature**: specs/002-first-round-drawer/spec.md
**Date**: 2026-06-02

## Overview

This feature adds two fields (`drawerId`, `currentWord`) to the `RoomSnapshot` shape returned by all existing endpoints. No new endpoints are introduced.

---

## Updated `RoomSnapshot` Shape

All endpoints that return a `RoomSnapshot` are updated. The new fields are:

| Field | Type | Notes |
|-------|------|-------|
| `drawerId` | `string \| null` | `null` in lobby; equals `hostId` once active |
| `currentWord` | `string \| null` | Actual word for drawer; `null` for guessers and during lobby |

### Full shape (active game, drawer's view)

```json
{
  "code": "ABCD",
  "hostId": "uuid-host",
  "drawerId": "uuid-host",
  "status": "active",
  "currentWord": "rocket",
  "participants": [
    { "id": "uuid-host", "name": "Alice", "joinedAt": "2026-06-02T10:00:00Z" },
    { "id": "uuid-bob",  "name": "Bob",   "joinedAt": "2026-06-02T10:00:05Z" }
  ],
  "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
  "roles": ["drawer", "guesser"]
}
```

### Full shape (active game, guesser's view)

Same as above except:
```json
{
  "currentWord": null
}
```

### Full shape (lobby, any viewer)

```json
{
  "drawerId": null,
  "currentWord": null,
  ...
}
```

---

## `POST /rooms/:code/start`

**No change to request shape.**

Response now includes `drawerId` and `currentWord` in the `room` snapshot:

```
POST /rooms/:code/start
Body: { "participantId": "<uuid>" }

200 OK
{
  "room": {
    "code": "ABCD",
    "hostId": "uuid-host",
    "drawerId": "uuid-host",
    "status": "active",
    "currentWord": "rocket",       ← actual word (requester is the host/drawer)
    "participants": [...],
    "availableWords": [...],
    "roles": [...]
  }
}
```

Error responses are unchanged (403 non-host, 400 too few players, 404 room not found).

---

## `GET /rooms/:code?participantId=<uuid>`

Response now includes `drawerId` and `currentWord` in the `room` snapshot. `currentWord` is the actual word only when the `participantId` query param matches `drawerId`:

```
GET /rooms/ABCD?participantId=uuid-host

200 OK
{
  "room": {
    "drawerId": "uuid-host",
    "currentWord": "rocket",       ← actual word (requester IS the drawer)
    ...
  }
}
```

```
GET /rooms/ABCD?participantId=uuid-bob

200 OK
{
  "room": {
    "drawerId": "uuid-host",
    "currentWord": null,           ← hidden (requester is NOT the drawer)
    ...
  }
}
```

---

## `POST /rooms` and `POST /rooms/:code/join`

Both return `RoomSnapshot` in lobby state:

```json
{
  "drawerId": null,
  "currentWord": null,
  ...
}
```

No functional change; the new fields are always `null` during lobby.
