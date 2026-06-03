# API Contracts: Result, Restart & Final Validation

## Updated Shape: `RoomSnapshot`

All endpoints that return a `RoomSnapshot` now include `"ended"` as a possible `status` value. When `status === "ended"`, `currentWord` is always the actual word (not `null`) regardless of the requesting player's role.

```json
{
  "room": {
    "code": "ABCD",
    "hostId": "<uuid>",
    "drawerId": "<uuid>",
    "currentWord": "rocket",
    "status": "ended",
    "participants": [...],
    "availableWords": [...],
    "roles": ["drawer", "guesser"],
    "strokes": [...],
    "guesses": [
      {
        "id": "<uuid>",
        "participantId": "<uuid>",
        "text": "rocket",
        "correct": true,
        "submittedAt": "2026-06-03T10:00:00.000Z"
      }
    ],
    "scores": {
      "<participantId-1>": 100,
      "<participantId-2>": 0
    }
  }
}
```

---

## New Endpoint: End Round

**`POST /rooms/:code/end`**

Transitions the room from `"active"` to `"ended"`. Only the host may call this endpoint. Once ended, the correct word is visible to all players in the snapshot.

**Request**

```json
{
  "participantId": "<uuid>"
}
```

**Response `200 OK`**

```json
{
  "room": { ...RoomSnapshot with status="ended" and currentWord revealed }
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| 400    | Room is not currently `"active"` |
| 403    | Caller is not the host |
| 404    | Room not found |

---

## New Endpoint: Restart Round

**`POST /rooms/:code/restart`**

Transitions the room from `"ended"` back to `"lobby"`. Only the host may call this endpoint. All round state is cleared; participants are preserved.

**Cleared on restart**: `currentWord`, `drawerId`, `strokes`, `guesses`, `scores`

**Preserved on restart**: `participants`, `hostId`, `code`

**Request**

```json
{
  "participantId": "<uuid>"
}
```

**Response `200 OK`**

```json
{
  "room": {
    "code": "ABCD",
    "hostId": "<uuid>",
    "drawerId": null,
    "currentWord": null,
    "status": "lobby",
    "participants": [...],
    "availableWords": [...],
    "roles": ["drawer", "guesser"],
    "strokes": [],
    "guesses": [],
    "scores": {}
  }
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| 400    | Room is not currently `"ended"` |
| 403    | Caller is not the host |
| 404    | Room not found |

---

## Unchanged Endpoints

The following endpoints are unchanged. Their response shapes now reflect the extended `status` union (`"lobby" | "active" | "ended"`) and the updated `currentWord` visibility rule for `"ended"` rooms.

- `GET /health`
- `POST /rooms`
- `POST /rooms/:code/join`
- `GET /rooms/:code`
- `POST /rooms/:code/start`
- `POST /rooms/:code/stroke`
- `POST /rooms/:code/clear`
- `POST /rooms/:code/guess`
