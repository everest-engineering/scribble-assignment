# API Contracts: Game Start & Drawer Flow

**Date**: 2026-06-11
**Base URL**: `http://localhost:3001`

## Endpoint Changes

### `GET /rooms/:code` — Get Room Snapshot (extended)

**Query**: `?participantId=<uuid>`

The existing endpoint is extended with round data when the room status is "playing".

**Response `200` (room in lobby)** — unchanged:
```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostId": "uuid-1",
    "participants": [...],
    "roundNumber": null,
    "drawerId": null,
    "yourRole": null,
    "wordForDrawer": undefined,
    "wordLength": null,
    "availableWords": [...],
    "roles": ["drawer", "guesser"]
  }
}
```

**Response `200` (viewer is the drawer)**:
```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "hostId": "uuid-1",
    "participants": [...],
    "roundNumber": 1,
    "drawerId": "uuid-1",
    "yourRole": "drawer",
    "wordForDrawer": "rocket",
    "wordLength": 6,
    "availableWords": [...],
    "roles": ["drawer", "guesser"]
  }
}
```

**Response `200` (viewer is a guesser)**:
```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "hostId": "uuid-1",
    "participants": [...],
    "roundNumber": 1,
    "drawerId": "uuid-1",
    "yourRole": "guesser",
    "wordForDrawer": undefined,
    "wordLength": 6,
    "availableWords": [...],
    "roles": ["drawer", "guesser"]
  }
}
```

**Error `404`** — unchanged:
```json
{ "message": "Unable to load room" }
```

## RoomSnapshot Shape (updated)

```typescript
interface RoomSnapshot {
  code: string;
  status: "lobby" | "playing";
  hostId: string;
  participants: Participant[];
  roundNumber: number | null;
  drawerId: string | null;
  yourRole: "drawer" | "guesser" | null;
  wordForDrawer: string | undefined;
  wordLength: number | null;
  availableWords: string[];
  roles: ParticipantRole[];
}
```

## Polling Protocol

- Reuses the existing polling mechanism (2s interval on LobbyPage → GamePage)
- The same `GET /rooms/:code?participantId=<uuid>` endpoint returns round data when status is "playing"
- The frontend detects `status === "playing"` and navigates to `/game`
- The GamePage displays role-appropriate content from the same snapshot
