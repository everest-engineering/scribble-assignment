# API Contract — Result & Restart Endpoints

**Feature**: `004-result-restart`

**Base**: `http://localhost:3001`

**Content-Type**: `application/json` on every request and response.

**Error envelope** (every 4xx): `{ "message": "<human-readable reason>" }`. Matches the contract established by features 001–003.

---

## Status code matrix

| Endpoint | 200 | 400 | 403 | 404 | 409 |
|---|---|---|---|---|---|
| `POST /rooms/:code/end` | Host called from `"round"` (transition) OR Host called from `"result"` (idempotent no-op) | Missing / empty `participantId` | Caller is not the host | Room not found | Room is in `"lobby"` (no active round) |
| `POST /rooms/:code/restart` | Host called from `"result"` (transition) OR Host called from `"lobby"` (idempotent no-op) | Missing / empty `participantId` | Caller is not the host | Room not found | Room is in `"round"` (round still active) |
| `POST /rooms/:code/guesses` *(extended)* | unchanged | unchanged | unchanged | unchanged | NOW also returns `409 "No round in progress"` when `status === "result"` |

---

## `POST /rooms/:code/end`

End the active round and reveal the secret word to every viewer.

### Request

```http
POST /rooms/ABCD/end HTTP/1.1
Content-Type: application/json

{
  "participantId": "p-alice"
}
```

### Path parameters

| Param | Type | Notes |
|---|---|---|
| `code` | string | Room code. Trim + uppercase per existing `roomCodeParamsSchema`. |

### Body

| Field | Type | Notes |
|---|---|---|
| `participantId` | string, min length 1 | The caller's opaque ID. MUST equal `room.hostParticipantId` server-side. |

### Responses

**200 OK** *(transition: `"round" → "result"`)*

```json
{
  "room": {
    "code": "ABCD",
    "status": "result",
    "participants": [/* … unchanged from the round */],
    "hostParticipantId": "p-alice",
    "viewerIsHost": true,
    "canStart": false,
    "availableWords": [],
    "roles": ["drawer", "guesser"],
    "round": {
      "roundNumber": 1,
      "drawerParticipantId": "p-alice",
      "maskedWord": "______",
      "secretWord": "rocket",
      "guesses": [
        { "id": "…", "participantId": "p-bob", "displayName": "Bob", "text": "cat", "isCorrect": false, "submittedAt": "…" },
        { "id": "…", "participantId": "p-bob", "displayName": "Bob", "text": "RoCkEt", "isCorrect": true, "submittedAt": "…" }
      ],
      "scores": { "p-alice": 0, "p-bob": 100 },
      "lockedParticipantIds": ["p-bob"]
    }
  }
}
```

**Notes on the 200 body in `"result"`:**

- `round.secretWord` is now present **for every viewer** (drawer, guesser, anonymous) — this is the final reveal per FR-003.
- `round.guesses` and `round.scores` are byte-identical to what they were at the moment End Round was called.
- A subsequent `GET /rooms/:code?participantId=<anyone>` will return the same shape.

**200 OK** *(idempotent re-call when already `"result"`)*

Same body as the transition 200 above. The `room.updatedAt` is **not** bumped on the idempotent path.

**400 Bad Request** — missing / empty `participantId`

```json
{ "message": "Invalid request" }
```

**403 Forbidden** — caller is not the host

```json
{ "message": "Only the host can end the round" }
```

**404 Not Found** — unknown room code

```json
{ "message": "Room not found" }
```

**409 Conflict** — room is in `"lobby"` (no active round)

```json
{ "message": "No active round to end" }
```

---

## `POST /rooms/:code/restart`

Restart the room from the result state back to the lobby. Participants and host identity are preserved; round state is discarded.

### Request

```http
POST /rooms/ABCD/restart HTTP/1.1
Content-Type: application/json

{
  "participantId": "p-alice"
}
```

### Path parameters

| Param | Type | Notes |
|---|---|---|
| `code` | string | Room code. Trim + uppercase per existing `roomCodeParamsSchema`. |

### Body

| Field | Type | Notes |
|---|---|---|
| `participantId` | string, min length 1 | The caller's opaque ID. MUST equal `room.hostParticipantId` server-side. |

### Responses

**200 OK** *(transition: `"result" → "lobby"`)*

```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "participants": [
      { "id": "p-alice", "name": "Alice", "joinedAt": "…", "isHost": true,  "isDrawer": false },
      { "id": "p-bob",   "name": "Bob",   "joinedAt": "…", "isHost": false, "isDrawer": false }
    ],
    "hostParticipantId": "p-alice",
    "viewerIsHost": true,
    "canStart": true,
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "round": null
  }
}
```

**Notes on the 200 body in `"lobby"` after Restart:**

- `round: null` — every field that lived under `round` (secretWord, guesses, scores, lockedParticipantIds, drawerParticipantId) is gone.
- `participants` array is unchanged from `"result"` (same IDs, same names, same join order, same `hostParticipantId`).
- `participants[].isDrawer` is `false` for every participant.
- `canStart` is `true` again for the host (assuming `participants.length >= 2`).
- `availableWords` is populated again (it was empty during `"round"` and `"result"`).

**200 OK** *(idempotent re-call when already `"lobby"`)*

Same body as the transition 200 above. `room.updatedAt` is **not** bumped.

**400 Bad Request** — missing / empty `participantId`

```json
{ "message": "Invalid request" }
```

**403 Forbidden** — caller is not the host

```json
{ "message": "Only the host can restart the room" }
```

**404 Not Found** — unknown room code

```json
{ "message": "Room not found" }
```

**409 Conflict** — room is in `"round"` (round still active)

```json
{ "message": "End the active round before restarting" }
```

---

## Extension to existing `POST /rooms/:code/guesses`

No request-shape change. The only behaviour change is that submissions during `"result"` are now rejected:

| Pre-condition | Status | Message |
|---|---|---|
| `room.status === "round"` | 200 (existing happy path) | n/a |
| `room.status === "lobby"` *(existing)* | 409 | `"No round in progress"` |
| `room.status === "result"` *(NEW)* | 409 | `"No round in progress"` |

The error message is intentionally identical for both lobby- and result-state rejections. The client never needs to distinguish them — both mean "this room cannot accept a guess right now". *(See research D6.)*

---

## Wire-type changes summary

| Type | Old | New |
|---|---|---|
| `RoomStatus` (TS union, backend + frontend) | `"lobby" \| "round"` | `"lobby" \| "round" \| "result"` |
| `RoomSnapshot.round.secretWord` *(when present)* | drawer-only | drawer-only **during `"round"`**; everyone **during `"result"`** |

No new types are introduced. The frontend `api.ts` file gains two new functions (`api.endRound`, `api.restartRoom`) that mirror `api.startRoom`.
