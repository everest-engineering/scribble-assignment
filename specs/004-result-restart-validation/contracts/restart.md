# Contract: Restart

## `POST /rooms/:code/restart`

Transitions a room from `"finished"` back to `"lobby"`, clearing all round state.
Host-only. Idempotent if the room is already in `"lobby"`.

---

### Request

**Path parameter**: `code` — the 4-character room code

**Headers**: `Content-Type: application/json`

**Body**:
```json
{
  "participantId": "<uuid>"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `participantId` | string (UUID) | Yes | Caller's participant ID; must match `room.hostId` |

---

### Responses

#### 200 OK — Restart successful (or already in lobby — no-op)
```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostId": "<uuid>",
    "participants": [
      { "id": "<uuid>", "name": "Alice", "joinedAt": "<iso-date>" },
      { "id": "<uuid2>", "name": "Bob", "joinedAt": "<iso-date>" }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

Note: `currentDrawerId`, `secretWord`, and `result` are absent — they are only present
during `"in-progress"` and `"finished"` states.

#### 403 Forbidden — Caller is not the host
```json
{ "error": "Only the host can restart the game" }
```

#### 404 Not Found — Room does not exist
```json
{ "error": "Room not found" }
```

---

### Side Effects

- `room.currentRound` is set to `undefined` (all round data cleared)
- `room.status` changes to `"lobby"`
- `room.updatedAt` is refreshed
- `room.participants` is unchanged — all players remain in the room
- All participants polled by `GET /rooms/:code` will receive a clean lobby snapshot
  with no `secretWord`, no `result`, and no `currentDrawerId`

### Idempotency

If `room.status` is already `"lobby"` when this endpoint is called by the host, the
request is treated as a no-op and the current lobby snapshot is returned with HTTP 200.
No error is returned.
