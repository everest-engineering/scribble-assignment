# API Contracts: Game Start & Drawer Flow

**Branch**: `002-game-start-drawer-flow` | **Date**: 2026-06-02

All schemas are defined in `shared/schemas/room.ts` (Zod) and must be updated before implementation.

---

## Updated: `RoomSnapshot` (wire type)

Adds two new nullable fields. All existing fields are unchanged.

```typescript
// shared/schemas/room.ts
roomSnapshotSchema = z.object({
  code: z.string(),
  status: z.enum(["lobby", "in-progress"]),
  hostId: z.string(),
  participants: z.array(participantSnapshotSchema),
  availableWords: z.array(z.string()),
  roles: z.array(z.enum(["drawer", "guesser"])),
  drawerId: z.string().nullable(),   // NEW — always present, null in lobby
  currentWord: z.string().nullable() // NEW — only non-null for the drawer client
})
```

---

## Existing: `POST /rooms/:code/start`

**No change to request shape.** Response shape gains new `RoomSnapshot` fields.

### Request

```http
POST /rooms/:code/start
Content-Type: application/json

{
  "participantId": "string (uuid)"
}
```

### Response — 200 OK (host perspective, becomes drawer)

```json
{
  "room": {
    "code": "ABCD",
    "status": "in-progress",
    "hostId": "uuid-host",
    "participants": [
      { "id": "uuid-host", "name": "Alice", "joinedAt": "2026-06-02T10:00:00.000Z" },
      { "id": "uuid-guest", "name": "Bob",  "joinedAt": "2026-06-02T10:00:05.000Z" }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "drawerId": "uuid-host",
    "currentWord": "rocket"
  }
}
```

> **Note**: The `currentWord` is only populated in responses where `participantId` (the caller) equals `drawerId`. The `/start` endpoint caller is the host who becomes the drawer, so they receive the word. Subsequent `GET /rooms/:code?participantId=<non-drawer>` calls return `"currentWord": null`.

### Response — 200 OK (non-drawer's polling perspective)

```json
{
  "room": {
    "code": "ABCD",
    "status": "in-progress",
    "hostId": "uuid-host",
    "participants": [...],
    "availableWords": [...],
    "roles": [...],
    "drawerId": "uuid-host",
    "currentWord": null
  }
}
```

### Error Responses

| Status | Reason | Message |
|--------|--------|---------|
| 400 | `too_few_players` | "At least 2 players are required to start" |
| 403 | `not_host` | "Only the host can start the game" |
| 404 | `not_found` | "Room not found" |
| 409 | `already_started` | "Game has already started" |

---

## Existing: `GET /rooms/:code`

**No change to request shape.** Response gains new `RoomSnapshot` fields. Caller passes their `participantId` as a query param for word visibility.

### Request

```http
GET /rooms/:code?participantId=<uuid>
```

### Response — 200 OK

Same `RoomSnapshot` shape as above. `currentWord` is non-null only when `participantId` matches `drawerId`.

---

## Backward Compatibility

Existing clients that do not read `drawerId` or `currentWord` are unaffected — the fields are additive. The Zod schemas on both sides will be updated together before implementation begins (Contract First, Constitution Principle VI).
