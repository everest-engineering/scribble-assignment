# REST API Contracts: Result & Restart

## RoomSnapshot (updated type)

The `RoomSnapshot.status` field expands from `"lobby" | "playing"` to `"lobby" | "playing" | "result"`.

No new fields are added — existing `guesses`, `scores`, `participants`, `wordForDrawer`/`wordLength` contain all data needed for the result view.

When `status === "result"`:
- `guesses` contains the full guess history from the completed round
- `scores` contains final per-participant scores
- `wordForDrawer` is visible to the drawer (existing behavior)
- `wordLength` is visible to all (existing behavior)

## POST /api/rooms/:code/reveal

Manually end the round and transition to result state. Host-only.

**Request**: (no body, query param)

```
POST /api/rooms/:code/reveal?participantId=abc123
```

**Response**: `{ room: RoomSnapshot }`

**Error cases**:
- `404` — Room not found
- `403` — Only the host can reveal (non-host participantId)
- `409` — Room is not in "playing" status

## POST /api/rooms/:code/restart

Restart the game: return to lobby, clear all round data, preserve participants. Host-only. Only available in `"result"` status.

**Request**: (no body, query param)

```
POST /api/rooms/:code/restart?participantId=abc123
```

**Response**: `{ room: RoomSnapshot }`
- `room.status === "lobby"`
- `room.roundNumber === null`
- `room.drawerId === null`
- `room.strokes === []`
- `room.guesses === []`
- `room.scores === {}`

**Error cases**:
- `404` — Room not found
- `403` — Only the host can restart
- `409` — Room is not in "result" status

## Polling (unchanged)

```
GET /api/rooms/:code?participantId=abc123
```

No changes to polling contract. Frontend checks `room.status` and renders appropriate view.
