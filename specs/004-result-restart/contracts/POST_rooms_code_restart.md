# Contract: `POST /rooms/:code/restart`

**Feature**: 004-result-restart
**Purpose**: Transition the room from the result state back to the lobby
state, clearing all round-scoped data.
**Maps to**: US2, FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, FR-015.

## Request

- **Method**: `POST`
- **Path**: `/rooms/:code/restart`
- **Headers**: `Content-Type: application/json`
- **URL parameter**:
  - `code` (string, required): the room code, same normalization rules.
- **Body** (JSON):
  ```json
  { "participantId": "host-id" }
  ```
  - `participantId` (string, required, non-empty): MUST equal
    `room.hostParticipantId` for the transition to succeed.

## Success: `200 OK`

```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostParticipantId": "host-id",
    "participants": [
      { "id": "host-id", "name": "Alice", "joinedAt": "…", "score": 0 },
      { "id": "guest-id", "name": "Bob", "joinedAt": "…", "score": 0 },
      { "id": "carol-id", "name": "Carol", "joinedAt": "…", "score": 0 }
    ],
    "currentRound": null,
    "guesses": [],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Invariants on the response**:
- `room.status === "lobby"`.
- `room.currentRound === null`.
- `room.guesses` is an empty array.
- Every `room.participants[i].score === 0`.
- `room.participants` is the SAME participants array as before the
  restart, in the SAME order, with the SAME ids and names.
- `room.hostParticipantId` is unchanged.

## Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"message": "Enter a room code"}` | `code` empty after trim |
| `400` | `{"message": "Invalid request payload"}` | Body fails Zod |
| `403` | `{"message": "Only the host can restart"}` | `participantId !== room.hostParticipantId` |
| `404` | `{"message": "Room not found"}` | Code does not match any room |
| `409` | `{"message": "Cannot restart from this state"}` | Room exists but `status !== "result"` |
| `500` | `{"message": "Unexpected server error"}` | Anything else |

**Error precedence**: same as `/end` — code params → body Zod → room
lookup → host check → state check → service success.

## Client behavior on success

1. Update local `RoomStore` state with the returned snapshot. The host's
   own tab now sees `room.status === "lobby"`.
2. `ResultPage`'s status-watching effect detects `status === "lobby"`
   and navigates to `/lobby` with `replace: true`.

## Client behavior on error

1. Render `error.message` from the response body in the ResultPage's
   status region.
2. Do NOT navigate.

## Test surface

- Backend (`roomStore.test.ts`):
  - `restartRoom(code, hostId)` from `result` returns `{room}` with
    `status === "lobby"`, `currentRound === null`, `guesses === []`,
    every `participant.score === 0`.
  - `restartRoom(code, hostId)` preserves `participants` (length, order,
    ids, names) and `hostParticipantId` verbatim.
  - `restartRoom(code, nonHostId)` from `result` returns
    `{error: "not-host"}`.
  - `restartRoom(code, hostId)` from `lobby` returns
    `{error: "wrong-state"}`.
  - `restartRoom(code, hostId)` from `playing` returns
    `{error: "wrong-state"}`.
  - `restartRoom("ZZZZ", anyId)` returns `null`.
- Frontend (`api.test.ts`):
  - `api.restart("ABCD", "host-id")` POSTs to `/rooms/ABCD/restart` with
    the right body and base URL.
  - Surfaces server `message` verbatim on non-ok responses.
