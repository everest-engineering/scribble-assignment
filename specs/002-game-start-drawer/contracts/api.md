# API Contracts: Game Start & Drawer Flow

**Feature**: 002-game-start-drawer — Scenario 2
**Base URL**: `http://localhost:3001`

---

## Modified Endpoint

### POST /rooms/:code/start (modified)

No change to the request shape. The response now includes `drawerId` and `currentWord`
in the room snapshot (drawer receives the word; this endpoint is only called by the
host, who is also the drawer, so `currentWord` is always present here).

**Response 200 — after this change**

```json
{
  "room": {
    "code": "A3KP",
    "status": "active",
    "hostId": "uuid-of-host",
    "drawerId": "uuid-of-host",
    "participants": [
      { "id": "uuid-of-host", "name": "Alice", "joinedAt": "..." },
      { "id": "uuid-of-bob",  "name": "Bob",   "joinedAt": "..." }
    ],
    "currentWord": "rocket",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

---

## Modified Endpoint

### GET /rooms/:code (modified)

`drawerId` is now always included in the snapshot when the room is active.
`currentWord` is conditionally included based on the viewer.

**Response 200 — drawer's view** (`?participantId=<drawerId>`)

```json
{
  "room": {
    "code": "A3KP",
    "status": "active",
    "hostId": "uuid-of-host",
    "drawerId": "uuid-of-host",
    "participants": [ ... ],
    "currentWord": "rocket",
    "availableWords": [ ... ],
    "roles": [ ... ]
  }
}
```

**Response 200 — guesser's view** (`?participantId=<guesserId>` or no participantId)

```json
{
  "room": {
    "code": "A3KP",
    "status": "active",
    "hostId": "uuid-of-host",
    "drawerId": "uuid-of-host",
    "participants": [ ... ],
    "availableWords": [ ... ],
    "roles": [ ... ]
  }
}
```

*Note: `currentWord` is absent from the guesser response — not null, not empty string,
simply omitted.*

---

## Navigation Contract (Frontend)

The lobby polling that was already running detects `status: "active"` and navigates to
`/game`. No change to this contract. On the game screen:

| Condition | What `GamePage` renders |
|-----------|-------------------------|
| `participantId === room.drawerId` | Shows secret word + "You are drawing" label |
| `participantId !== room.drawerId` | Shows drawer's name + no secret word |
| `room.drawerId` present | All players see drawer's display name |
