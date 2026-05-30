# API Contract: Round End — Results Display and Lobby Restart

**Branch**: `005-round-end-restart` | **Date**: 2026-05-30

## New Endpoints

### POST /rooms/:code/end

End the current round. Only the host may call this while the room is active.

**Request**

```
POST /rooms/:code/end
Content-Type: application/json

{ "participantId": "550e8400-e29b-41d4-a716-446655440000" }
```

**Success Response — 200 OK**

```json
{
  "room": {
    "code": "AB3D",
    "status": "ended",
    "hostId": "550e8400-...",
    "participants": [...],
    "availableWords": ["rocket", ...],
    "roles": ["drawer", "guesser"],
    "guesses": [...],
    "scores": [...]
  }
}
```

**Error Responses**

| Status | Condition | Body |
|--------|-----------|------|
| 403 | Caller is not the host | `{ "message": "Only the host can end the round" }` |
| 404 | Room not found | `{ "message": "Room not found" }` |
| 409 | Room is not active | `{ "message": "Round is not active" }` |

---

### POST /rooms/:code/restart

Reset the room to lobby. Only the host may call this while the room is ended.

**Request**

```
POST /rooms/:code/restart
Content-Type: application/json

{ "participantId": "550e8400-e29b-41d4-a716-446655440000" }
```

**Success Response — 200 OK**

```json
{
  "room": {
    "code": "AB3D",
    "status": "lobby",
    "hostId": "550e8400-...",
    "participants": [...],
    "availableWords": ["rocket", ...],
    "roles": ["drawer", "guesser"],
    "guesses": [],
    "scores": [
      { "participantId": "550e8400-...", "score": 0 },
      { "participantId": "b6d9e1a2-...", "score": 0 }
    ]
  }
}
```

**Error Responses**

| Status | Condition | Body |
|--------|-----------|------|
| 403 | Caller is not the host | `{ "message": "Only the host can restart the game" }` |
| 404 | Room not found | `{ "message": "Room not found" }` |
| 409 | Room is not ended | `{ "message": "Round is not ended" }` |

---

## Modified: GET /rooms/:code

No change to the request. The response now includes `"ended"` as a possible `status` value (alongside `"lobby"` and `"active"`). Clients must handle all three.

---

## Frontend API Client Additions

New methods in `frontend/src/services/api.ts`:

```
endRound(code: string, participantId: string)
  → Promise<{ room: RoomSnapshot }>

restartRoom(code: string, participantId: string)
  → Promise<{ room: RoomSnapshot }>
```

Updated type in `frontend/src/services/api.ts`:

```typescript
// RoomSnapshot.status gains "ended":
status: "lobby" | "active" | "ended"
```
