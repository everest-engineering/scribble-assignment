# REST API Contract: Game Start & Drawer Flow (002 delta)

**Feature**: `002-game-start-drawer-flow`
**Base URL**: `http://localhost:3001`
**Content-Type**: `application/json` (all requests and responses)

This document records only the **changes** to existing routes and the updated
`RoomSnapshot` shape. All other routes from `specs/001-room-setup-lobby/contracts/rooms-api.md`
continue to apply unchanged.

---

## Updated: RoomSnapshot shape

All endpoints that return a `RoomSnapshot` are affected. Two new optional fields are added.

```json
{
  "code": "ABCD",
  "status": "in-progress",
  "hostId": "uuid",
  "participants": [
    { "id": "uuid", "name": "string", "joinedAt": "ISO8601" }
  ],
  "availableWords": ["string"],
  "roles": ["drawer", "guesser"],
  "currentDrawerId": "uuid",
  "secretWord": "rocket"
}
```

**Field notes**:
- `currentDrawerId` — present only when `status === "in-progress"`. Identifies the current drawer.
- `secretWord` — present **only in responses where the authenticated viewer is the current drawer**.
  Omitted entirely (not `null`) for all other viewers.

---

## Updated: POST /rooms — Create Room

**Change**: `playerName` is now trimmed before storage and validation. Whitespace-only names
(e.g. `"   "`) are rejected.

**Errors (updated)**

| Status | Condition |
|--------|-----------|
| 400 | `playerName` missing, empty, or whitespace-only |

---

## Updated: POST /rooms/:code/join — Join Room

**Change**: Same name-trimming behaviour as `POST /rooms` above.

**Errors (updated)**

| Status | Condition |
|--------|-----------|
| 400 | `playerName` missing, empty, or whitespace-only |
| 404 | Room code not found |
| 409 | Room status is `"in-progress"` |

---

## Updated: POST /rooms/:code/start — Start Game

**Changes**:
1. The ≥2 participants requirement is enforced — the host cannot start with fewer than 2 players in the lobby.
2. The response now includes `currentDrawerId` and `secretWord` (since the caller is the drawer).

**Request body** — unchanged:
```json
{ "participantId": "string (required)" }
```

**Success — 200 OK**

```json
{
  "room": {
    "code": "ABCD",
    "status": "in-progress",
    "hostId": "uuid",
    "participants": [
      { "id": "uuid", "name": "Alice", "joinedAt": "ISO8601" },
      { "id": "uuid", "name": "Bob", "joinedAt": "ISO8601" }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "currentDrawerId": "uuid-of-host",
    "secretWord": "rocket"
  }
}
```

**Errors (updated)**

| Status | Condition |
|--------|-----------|
| 400 | `participantId` missing |
| 403 | `participantId` does not match `room.hostId` |
| 404 | Room code not found |
| 409 | Fewer than 2 participants in the lobby |

---

## Updated: GET /rooms/:code — Fetch Room Snapshot

**Change**: When `participantId` query param matches the current drawer, the response
includes `secretWord`. All other callers receive the snapshot without `secretWord`.

**Query params**: `participantId` (optional)

**Success — 200 OK (drawer view)**

```json
{
  "room": {
    "...all fields...",
    "currentDrawerId": "uuid-of-drawer",
    "secretWord": "rocket"
  }
}
```

**Success — 200 OK (non-drawer view)**

```json
{
  "room": {
    "...all fields...",
    "currentDrawerId": "uuid-of-drawer"
  }
}
```
