# API Contract: Result, Restart, and Final Validation

**Feature**: `specs/004-result-restart`
**Date**: 2026-05-31

---

## POST /rooms/:code/restart

Resets a room from `"ended"` status back to `"lobby"`. Clears all round state while preserving
participants. Only the host may call this endpoint.

### Request

```
POST /rooms/:code/restart
Content-Type: application/json
```

**Path Parameters**:

| Parameter | Type | Constraints |
|---|---|---|
| `code` | string | Room code; normalized to uppercase by server |

**Body**:

```json
{
  "participantId": "550e8400-e29b-41d4-a716-446655440001"
}
```

| Field | Type | Constraints |
|---|---|---|
| `participantId` | string | UUID v4; must be the host's participant ID |

### Success Response

**Status**: `200 OK`

```json
{
  "room": {
    "code": "ABCD",
    "hostId": "550e8400-e29b-41d4-a716-446655440001",
    "status": "lobby",
    "participants": [
      { "id": "550e8400-e29b-41d4-a716-446655440001", "name": "Alice" },
      { "id": "550e8400-e29b-41d4-a716-446655440002", "name": "Bob" }
    ],
    "drawerId": "",
    "guesses": [],
    "scores": {},
    "availableWords": ["apple", "bicycle", "castle"],
    "roles": ["Drawer", "Guesser"]
  }
}
```

Note: `secretWord` and `wordPlaceholder` are absent from the lobby snapshot. `guesses` is
`[]` and `scores` is `{}` after reset.

### Error Responses

| Status | Condition | Body |
|---|---|---|
| `400 Bad Request` | `participantId` is missing or not a valid UUID | `{ "message": "..." }` |
| `403 Forbidden` | `participantId` is not the host of this room | `{ "message": "Only the host can restart" }` |
| `404 Not Found` | Room with given code does not exist | `{ "message": "Room not found" }` |
| `409 Conflict` | Room status is not `"ended"` | `{ "message": "Room is not ended" }` |

---

## Inherited: GET /rooms/:code (polling — unchanged)

The result view and lobby-navigation behavior rely on the existing polling endpoint. After a
restart, the next poll response will include `status: "lobby"` — this is what triggers
automatic navigation for all participants.

See `specs/001-room-setup-lobby/contracts/api.md` for the full `GET /rooms/:code` contract.

---

## Inherited: POST /rooms/:code/guess (unchanged)

If a participant submits a guess after the host has restarted (i.e., the room is now `"lobby"`
or `"active"` again), the server will return `409` ("Game is not active"). The participant's
screen will update to the lobby on the next poll.

See `specs/003-gameplay-interaction/contracts/api.md` for the full guess endpoint contract.
