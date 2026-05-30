# REST Contract: Rooms API (Scenario 2 deltas)

**Base URL**: `http://localhost:3001` (or `VITE_API_URL` on frontend)

**Builds on**: [001-room-setup-lobby/contracts/rooms-api.md](../../001-room-setup-lobby/contracts/rooms-api.md)

Scenario 2 extends existing endpoints. All snapshots are **viewer-aware**: pass
`participantId` on GET (and receive it on create/join/start responses) so the server can
omit `secretWord` for guessers.

---

## POST /rooms

### Request (updated)

```json
{
  "playerName": "Alice"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `playerName` | string | yes | Trimmed server-side; empty/whitespace-only → `400` |

### Response `201 Created` (unchanged shape; stricter name validation)

Snapshot in lobby omits `drawerParticipantId` value (`null`) and participant `role` values (`null`).

### Errors (added)

| Status | Message (example) | When |
|--------|-------------------|------|
| 400 | Player name is required | Trimmed name empty |

---

## POST /rooms/:code/join

### Request (updated)

Same as create — `playerName` required after trim.

### Errors (added)

| Status | Message (example) | When |
|--------|-------------------|------|
| 400 | Player name is required | Trimmed name empty |

---

## GET /rooms/:code

### Query

| Param | Required | Notes |
|-------|----------|-------|
| `participantId` | recommended | Required for viewer-specific `secretWord`; omitting yields no `secretWord` field |

### Response `200 OK` when `status === "playing"` (drawer viewer)

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "hostParticipantId": "host-uuid",
    "drawerParticipantId": "host-uuid",
    "participants": [
      {
        "id": "host-uuid",
        "name": "Host",
        "joinedAt": "2026-05-30T12:00:00.000Z",
        "isHost": true,
        "role": "drawer"
      },
      {
        "id": "guest-uuid",
        "name": "Guest",
        "joinedAt": "2026-05-30T12:00:01.000Z",
        "isHost": false,
        "role": "guesser"
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "secretWord": "rocket"
  }
}
```

### Response `200 OK` when `status === "playing"` (guesser viewer)

Same as above **without** the `secretWord` property.

### Snapshot field rules

| Field | Lobby | Playing |
|-------|-------|---------|
| `drawerParticipantId` | `null` | host uuid |
| `participants[].role` | `null` | `"drawer"` or `"guesser"` |
| `secretWord` | absent | present only for drawer viewer |

---

## POST /rooms/:code/start

### Response `200 OK` (extended)

Returns viewer-aware snapshot for the requesting `participantId` (host sees `secretWord` on
start response; guest polling GET will omit it).

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "hostParticipantId": "host-uuid",
    "drawerParticipantId": "host-uuid",
    "participants": [ "..." ],
    "availableWords": [ "..." ],
    "roles": [ "drawer", "guesser" ],
    "secretWord": "rocket"
  }
}
```

`secretWord` present only when caller is the drawer.

### Side effects on success

- Sets `status` to `"playing"`
- Sets `drawerParticipantId` to `hostParticipantId`
- Sets internal `secretWord` to `"rocket"` (first starter word)

---

## GET /health

Unchanged.
