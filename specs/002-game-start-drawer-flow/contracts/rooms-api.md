# API Contracts: Game Start & Drawer Flow

**Feature**: `002-game-start-drawer-flow` | **Date**: 2026-06-04

---

## Modified: `POST /rooms/:code/start`

**Existing behaviour**: sets `room.status = "playing"`, saves, returns snapshot.

**New behaviour** (additions only — no breaking change):
- Sets `room.drawerId = room.hostId`
- Sets `room.currentWord = STARTER_WORDS[wordIndex]` where `wordIndex = sum(charCodes of code) % 5`
- Returns snapshot with `drawerId` and `currentWord` (drawer sees actual word)

### Request

```
POST /rooms/:code/start
Content-Type: application/json

{ "participantId": "<uuid>" }
```

### Response — 200 OK (caller is host/drawer)

```json
{
  "room": {
    "code": "ABCD",
    "hostId": "<uuid>",
    "drawerId": "<uuid>",
    "currentWord": "rocket",
    "status": "playing",
    "participants": [...],
    "availableWords": ["rocket","pizza","castle","guitar","sunflower"],
    "roles": ["drawer","guesser"]
  }
}
```

### Error responses (unchanged)

| Status | Condition |
|--------|-----------|
| 400 | `participants.length < 2` |
| 403 | `participantId !== room.hostId` |
| 404 | Room not found |
| 422 | Zod validation failure |

---

## Modified: `GET /rooms/:code`

**Existing behaviour**: returns snapshot. `viewerParticipantId` ignored (`void`).

**New behaviour** (additions only — no breaking change):
- `drawerId` always present in response (not viewer-gated)
- `currentWord` is viewer-gated: actual word when `participantId === drawerId`, `null` otherwise

### Request

```
GET /rooms/:code?participantId=<uuid>
```

### Response — 200 OK (viewer is drawer)

```json
{
  "room": {
    "code": "ABCD",
    "hostId": "<uuid>",
    "drawerId": "<uuid>",
    "currentWord": "rocket",
    "status": "playing",
    "participants": [...],
    "availableWords": [...],
    "roles": [...]
  }
}
```

### Response — 200 OK (viewer is non-drawer or no participantId)

```json
{
  "room": {
    "code": "ABCD",
    "hostId": "<uuid>",
    "drawerId": "<uuid>",
    "currentWord": null,
    "status": "playing",
    "participants": [...],
    "availableWords": [...],
    "roles": [...]
  }
}
```

---

## Unchanged endpoints

`POST /rooms` and `POST /rooms/:code/join` now return snapshots that include `drawerId: null`
and `currentWord: null` (lobby state). No behavioural change; existing callers are unaffected.

---

## `RoomSnapshot` shape (full — after this feature)

```typescript
{
  code: string;
  hostId: string;
  drawerId: string | null;    // null in lobby; hostId during playing
  currentWord: string | null; // viewer-gated; null for non-drawers always
  status: "lobby" | "playing" | "finished";
  participants: Array<{ id: string; name: string; joinedAt: string }>;
  availableWords: string[];
  roles: Array<"drawer" | "guesser">;
}
```
