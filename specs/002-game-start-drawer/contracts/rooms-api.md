# Contract: Rooms API — Game Start & Drawer delta

Extends [`specs/001-room-setup-lobby/contracts/rooms-api.md`](../../001-room-setup-lobby/contracts/rooms-api.md). Only the **changes** and the **new payload shapes** are documented here.

Base URL: `http://localhost:3001`. All responses are JSON.

---

## `POST /rooms/:code/start`

Existing endpoint from `001`. Behavior delta:

### On success (lobby → round)

- **Status**: `200 OK`
- **Body**: full `RoomSnapshot` (see below). `status` flips to `"round"` and `round` becomes a `RoundView` payload.
- **Side effects**: `room.status` becomes `"round"`; `room.round` is created exactly once.

### On success (round → round, idempotent retry)

- **Status**: `200 OK`
- **Body**: the **same** `RoomSnapshot` as the first successful call (same `drawerParticipantId`, same `secretWord` for the drawer).
- **Side effects**: none.

### On failure

Unchanged from `001`:

| Code | Body | Trigger |
|---|---|---|
| `400` | `{ "message": "Invalid request payload" }` | missing/empty `participantId` |
| `403` | `{ "message": "Only the host can start the game" }` | requester is not the host (also during an active round) |
| `404` | `{ "message": "Room not found" }` | unknown room code |
| `409` | `{ "message": "Need at least 2 players to start" }` | host requested with `< 2` participants |
| `500` | `{ "message": "Internal server error" }` | `STARTER_WORDS` is empty (FR-010) |

### Request schema

Unchanged:

```ts
const startRoomSchema = z.object({ participantId: z.string().min(1) });
```

---

## `GET /rooms/:code?participantId=<id>`

Existing endpoint from `001`. **Response shape changes**:

### New `RoomSnapshot` shape (in TypeScript)

```ts
type ParticipantRole = "drawer" | "guesser";

interface ParticipantView {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
  isDrawer: boolean;          // NEW
}

interface RoundView {
  roundNumber: number;        // 1 in this feature's scope
  drawerParticipantId: string;
  maskedWord: string;         // length-only mask; e.g. "______" for "rocket"
  secretWord?: string;        // ONLY present when the viewer is the drawer
}

interface RoomSnapshot {
  code: string;
  status: "lobby" | "round";  // was: "lobby" only
  participants: ParticipantView[];
  hostParticipantId: string;
  viewerIsHost: boolean;
  canStart: boolean;
  availableWords: string[];
  roles: ParticipantRole[];
  round: RoundView | null;    // NEW — null in lobby, populated in round
}
```

### Viewer-dependent fields

The same room, polled at the same moment, returns different JSON depending on the supplied `participantId`:

#### Drawer view (round 1, host = drawer)

```json
{
  "code": "ABCD",
  "status": "round",
  "participants": [
    { "id": "p-alice", "name": "Alice", "joinedAt": "…", "isHost": true,  "isDrawer": true  },
    { "id": "p-bob",   "name": "Bob",   "joinedAt": "…", "isHost": false, "isDrawer": false }
  ],
  "hostParticipantId": "p-alice",
  "viewerIsHost": true,
  "canStart": true,
  "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
  "roles": ["drawer", "guesser"],
  "round": {
    "roundNumber": 1,
    "drawerParticipantId": "p-alice",
    "maskedWord": "______",
    "secretWord": "rocket"
  }
}
```

#### Guesser view (same room, `participantId=p-bob`)

```json
{
  "code": "ABCD",
  "status": "round",
  "participants": [ /* …same identities, isDrawer=true on Alice, false on Bob… */ ],
  "hostParticipantId": "p-alice",
  "viewerIsHost": false,
  "canStart": false,
  "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
  "roles": ["drawer", "guesser"],
  "round": {
    "roundNumber": 1,
    "drawerParticipantId": "p-alice",
    "maskedWord": "______"
  }
}
```

**Hard guarantee**: the substring `"secretWord"` MUST NOT appear anywhere in the guesser's response body (FR-005). Tests assert this by string match on the raw JSON payload.

#### Lobby view (no round yet)

`round: null`, `status: "lobby"`, every `participants[i].isDrawer === false`. Identical to `001`'s shape with the new fields zeroed out.

---

## Idempotency contract for `POST /:code/start`

1. **Call 1** (host, 2 players): `200`, `status="round"`, `round.secretWord="rocket"`.
2. **Call 2** within the same room (host, same body): `200`, **identical** body to call 1.
3. **Call 3** (Bob's id during active round): `403`, unchanged room state.
4. **Call 4** (host, with 3rd player having joined after call 1): `200`, **still** the same round and word from call 1. The new participant simply appears in `participants[]` with `isDrawer=false`.

---

## Non-goals (explicitly out of contract)

- Ending a round (no `POST /:code/end`).
- Changing the drawer (no `POST /:code/round/next`).
- Submitting a guess.
- Round timers.
- Re-rolling the word.
