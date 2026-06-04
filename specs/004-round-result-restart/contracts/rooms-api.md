# API Contracts: Round Result, Restart & Final Validation

**Feature**: `004-round-result-restart` | **Date**: 2026-06-04

---

## Modified: `POST /rooms/:code/guess`

On a correct guess, the server now atomically sets `room.status = "finished"` before
`saveRoom()`. The response shape is unchanged (`{ correct: boolean; score: number }`),
but the next poll will return `status: "finished"` with `currentWord` visible.

---

## Modified: `GET /rooms/:code`

Snapshot `currentWord` behaviour updated:

- If `room.status === "finished"`: `currentWord` is ALWAYS included (no viewer-gating).
- If `room.status === "playing"`: existing viewer-gating applies (drawer sees word,
  others see `null`).

---

## New: `POST /rooms/:code/end`

Manually end the round (host only).

### Request

```
POST /rooms/:code/end
Content-Type: application/json

{ "participantId": "<uuid>" }
```

### Response — 200 OK

```json
{ "room": { ...RoomSnapshot with status: "finished" } }
```

### Error responses

| Status | Condition |
|--------|-----------|
| 400 | `room.status` is already `"finished"` or `"lobby"` |
| 403 | `participantId !== room.hostId` |
| 404 | Room not found |
| 422 | Zod validation failure |

---

## New: `POST /rooms/:code/restart`

Restart the room to lobby state (host only).

### Request

```
POST /rooms/:code/restart
Content-Type: application/json

{ "participantId": "<uuid>" }
```

### Response — 200 OK

```json
{
  "room": {
    "code": "ABCD",
    "hostId": "<uuid>",
    "drawerId": null,
    "currentWord": null,
    "strokes": [],
    "guesses": [],
    "status": "lobby",
    "participants": [
      { "id": "<uuid>", "name": "Alice", "joinedAt": "...", "score": 0 },
      { "id": "<uuid>", "name": "Bob", "joinedAt": "...", "score": 0 }
    ],
    "availableWords": ["rocket","pizza","castle","guitar","sunflower"],
    "roles": ["drawer","guesser"]
  }
}
```

### Error responses

| Status | Condition |
|--------|-----------|
| 400 | `room.status === "lobby"` |
| 403 | `participantId !== room.hostId` |
| 404 | Room not found |
| 422 | Zod validation failure |

---

## Unchanged endpoints

All other endpoints (`POST /rooms`, `POST /:code/join`, `POST /:code/start`,
`POST /:code/strokes`, `GET /:code`) continue to work as in Scenario 3. The only
modification is `toRoomSnapshot` gating for `"finished"` status.
