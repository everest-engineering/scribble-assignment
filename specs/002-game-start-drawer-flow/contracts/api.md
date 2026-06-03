# API Contracts: Game Start & Drawer Flow

**Feature**: `002-game-start-drawer-flow`
**Date**: 2026-06-03
**Base URL**: `http://localhost:3001`

---

## Changed Endpoints

### `GET /rooms/:code`

Fetches the current state of a room. The `participantId` query parameter now actively gates `currentWord` inclusion.

**Query Parameters**

| Parameter       | Type     | Required | Description                                                                                                          |
| --------------- | -------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `participantId` | `string` | No       | The requesting participant's id. When provided and matches `currentDrawerId`, the response includes the secret word. |

**Response — `200 OK`** (unchanged envelope, extended `RoomSnapshot`)

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "hostId": "uuid-host",
    "participants": [
      {
        "id": "uuid-host",
        "name": "Alice",
        "joinedAt": "2026-06-03T10:00:00.000Z"
      },
      { "id": "uuid-p2", "name": "Bob", "joinedAt": "2026-06-03T10:00:05.000Z" }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "currentDrawerId": "uuid-host",
    "currentWord": "rocket"
  }
}
```

> `currentWord` is `"rocket"` only when `participantId=uuid-host` (the drawer).

**Response — `200 OK`** (guesser or no `participantId`)

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "hostId": "uuid-host",
    "participants": [...],
    "availableWords": [...],
    "roles": [...],
    "currentDrawerId": "uuid-host",
    "currentWord": null
  }
}
```

---

### `POST /rooms/:code/start`

No request body changes. Response `RoomSnapshot` is extended with round fields.

**Response — `200 OK`** (extended `RoomSnapshot`)

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "hostId": "uuid-host",
    "participants": [...],
    "availableWords": [...],
    "roles": [...],
    "currentDrawerId": "uuid-host",
    "currentWord": null
  }
}
```

> `currentWord` is `null` here because the start route does not pass `participantId` to `toRoomSnapshot`. The host (drawer) obtains the word on the first polling fetch: `GET /rooms/:code?participantId=uuid-host`.

---

## `RoomSnapshot` Schema (updated)

```typescript
interface RoomSnapshot {
  code: string;
  status: "lobby" | "playing";
  hostId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ("drawer" | "guesser")[];
  // NEW in 002:
  currentDrawerId?: string; // present when status = "playing"
  currentWord?: string | null; // non-null only when viewer is the drawer
}
```

---

## Unchanged Endpoints

| Endpoint                 | Reason unchanged                                      |
| ------------------------ | ----------------------------------------------------- |
| `POST /rooms` (create)   | Returns snapshot at lobby state — no round fields yet |
| `POST /rooms/:code/join` | Returns snapshot at lobby state — no round fields yet |
