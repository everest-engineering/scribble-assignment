# Rooms API Contract: Result, Restart & Final Validation

**Feature**: 004-result-restart-validation | **Base**: [003 rooms-api](../003-gameplay-interaction/contracts/rooms-api.md)

## RoomStatus (extended)

```typescript
type RoomStatus = "lobby" | "playing" | "result";
```

## GET /rooms/:code (snapshot behavior extended)

Query: `?participantId=<uuid>` (unchanged)

### Snapshot fields by status

| Field | `lobby` | `playing` | `result` |
|-------|---------|-----------|----------|
| `status` | `"lobby"` | `"playing"` | `"result"` |
| `secretWord` | omitted | drawer viewer only | **included for all viewers** |
| `strokes` | omitted | `Stroke[]` | **omitted** |
| `guesses` | omitted | `Guess[]` | `Guess[]` (final) |
| `participants[].score` | `0` | live | final |

### Example — result state (any viewer)

```json
{
  "room": {
    "code": "ABCD",
    "status": "result",
    "hostParticipantId": "…",
    "drawerParticipantId": "…",
    "secretWord": "rocket",
    "guesses": [
      {
        "id": "…",
        "participantId": "…",
        "participantName": "Guest",
        "text": "pizza",
        "isCorrect": false,
        "submittedAt": "2026-05-30T12:00:00.000Z"
      },
      {
        "id": "…",
        "participantId": "…",
        "participantName": "Guest",
        "text": "Rocket",
        "isCorrect": true,
        "submittedAt": "2026-05-30T12:01:00.000Z"
      }
    ],
    "participants": [
      {
        "id": "…",
        "name": "Host",
        "isHost": true,
        "role": "drawer",
        "score": 0
      },
      {
        "id": "…",
        "name": "Guest",
        "isHost": false,
        "role": "guesser",
        "score": 100
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

Note: `strokes` absent in result snapshot.

---

## POST /rooms/:code/end

Host ends the active round and transitions to result state.

### Request

```json
{
  "participantId": "<host-participant-uuid>"
}
```

Validated by Zod schema (same shape as `startRoomSchema`).

### Success — 200

```json
{
  "room": { "...": "snapshot with status result, secretWord visible to all, no strokes" }
}
```

### Errors

| Status | Message | Condition |
|--------|---------|-----------|
| 400 | Unable to end round | Unknown validation failure |
| 403 | Only the host can end the round | Caller is not host |
| 404 | Unable to load room | Unknown code |
| 409 | Game not in progress | `status !== "playing"` |

### Side effects

- Set `room.status = "result"`
- Preserve `secretWord`, `guesses`, `scores`, `drawerParticipantId`, `strokes` (internal; not in snapshot)
- No further strokes, clears, or guesses accepted (`status !== "playing"`)

---

## POST /rooms/:code/restart

Host restarts from result state back to lobby with players preserved and round state cleared.

### Request

```json
{
  "participantId": "<host-participant-uuid>"
}
```

### Success — 200

```json
{
  "room": { "...": "snapshot with status lobby, no secretWord/strokes/guesses, scores 0" }
}
```

### Errors

| Status | Message | Condition |
|--------|---------|-----------|
| 400 | Unable to restart | Unknown validation failure |
| 403 | Only the host can restart | Caller is not host |
| 404 | Unable to load room | Unknown code |
| 409 | Round has not ended | `status !== "result"` |

### Side effects

- Set `room.status = "lobby"`
- Clear: `secretWord`, `drawerParticipantId`, `strokes`, `guesses`, `scoredParticipantIds`
- Reset all `participant.score = 0`
- Preserve: `participants[]`, `hostParticipantId`, `code`

---

## Existing endpoints — guard updates

### POST /rooms/:code/strokes, /canvas/clear, /guesses

Reject when `status !== "playing"` (includes `result` and `lobby`):

| Status | Message |
|--------|---------|
| 409 | Game not in progress |

### POST /rooms/:code/start

Unchanged — requires `status === "lobby"`. Works after restart for second game.

### POST /rooms/:code/join

Unchanged — rejects when `status !== "lobby"`.

---

## Unchanged endpoints

- `POST /rooms` — create
- `GET /health` — health check
