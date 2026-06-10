# API Contracts: Game Start & Drawer Flow

## POST /api/rooms/:code/start (extended)

This endpoint was added in Feature Group 1. Feature Group 2 extends its behaviour: on success
it now also sets `drawerId` and `secretWord` on the room before returning the snapshot.

**No change to request shape.**

**Response 200 (extended)**
```json
{
  "room": {
    "code": "ABCD",
    "status": "active",
    "hostId": "<uuid>",
    "drawerId": "<uuid>",
    "secretWord": "rocket",
    "participants": [...],
    "availableWords": ["rocket","pizza","castle","guitar","sunflower"],
    "roles": ["drawer","guesser"]
  }
}
```

Note: `secretWord` is included in the start response because the caller IS the host/drawer.

---

## GET /api/rooms/:code?participantId=<id> (viewer-specific extension)

**Existing endpoint** — behaviour changes based on `participantId`.

**Response 200 when viewer IS the drawer** (`participantId === room.drawerId`)
```json
{
  "room": {
    "code": "ABCD",
    "status": "active",
    "hostId": "<uuid>",
    "drawerId": "<uuid>",
    "secretWord": "rocket",
    "participants": [...],
    "availableWords": [...],
    "roles": [...]
  }
}
```

**Response 200 when viewer is a guesser** (`participantId !== room.drawerId`)
```json
{
  "room": {
    "code": "ABCD",
    "status": "active",
    "hostId": "<uuid>",
    "drawerId": "<uuid>",
    "secretWord": null,
    "participants": [...],
    "availableWords": [...],
    "roles": [...]
  }
}
```

**Key rule**: `secretWord` is `null` unless the requesting participant is the drawer.
`drawerId` is always included so guessers can see who is drawing.
