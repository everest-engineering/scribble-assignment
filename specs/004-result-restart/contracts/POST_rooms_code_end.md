# Contract: `POST /rooms/:code/end`

**Feature**: 004-result-restart
**Purpose**: Transition the room from the in-play state to the result state.
**Maps to**: US1, FR-001, FR-002, FR-003, FR-004, FR-015.

## Request

- **Method**: `POST`
- **Path**: `/rooms/:code/end`
- **Headers**: `Content-Type: application/json`
- **URL parameter**:
  - `code` (string, required): the room code. Same normalization rules as
    every other `/rooms/:code/*` endpoint — trim, upper-case, reject empty
    after trim.
- **Body** (JSON):
  ```json
  { "participantId": "8c4f0e2b-1d23-4d6f-9bd6-1a2bcef1ab12" }
  ```
  - `participantId` (string, required, non-empty): the caller's stored
    participant id. MUST equal `room.hostParticipantId` for the
    transition to succeed.

## Success: `200 OK`

```json
{
  "room": {
    "code": "ABCD",
    "status": "result",
    "hostParticipantId": "host-id",
    "participants": [
      { "id": "host-id", "name": "Alice", "joinedAt": "…", "score": 0 },
      { "id": "guest-id", "name": "Bob", "joinedAt": "…", "score": 100 },
      { "id": "carol-id", "name": "Carol", "joinedAt": "…", "score": 0 }
    ],
    "currentRound": {
      "drawerParticipantId": "host-id",
      "secretWord": "rocket"
    },
    "guesses": [
      {
        "id": "g1",
        "guesserParticipantId": "guest-id",
        "text": "rocket",
        "isCorrect": true,
        "submittedAt": "…",
        "order": 0
      },
      {
        "id": "g2",
        "guesserParticipantId": "carol-id",
        "text": "banana",
        "isCorrect": false,
        "submittedAt": "…",
        "order": 1
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Invariants on the response**:
- `room.status === "result"`.
- `room.currentRound.secretWord` is the real word — because the room is
  now in result state, the snapshot delivers it to every viewer including
  the caller (who is the host).
- Every `room.guesses[i].text` is the real trimmed text — even for entries
  that were marked correct and previously redacted. The result-state
  reveal applies to every entry.
- `room.participants[*].score` carries the same final scores the in-play
  scoreboard last displayed.

## Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"message": "Enter a room code"}` | `code` empty after trim |
| `400` | `{"message": "Invalid request payload"}` | Body fails Zod (missing or non-string `participantId`) |
| `403` | `{"message": "Only the host can end the round"}` | `participantId !== room.hostParticipantId` |
| `404` | `{"message": "Room not found"}` | Code does not match any room |
| `409` | `{"message": "Cannot end a round that is not in progress"}` | Room exists but `status !== "playing"` |
| `500` | `{"message": "Unexpected server error"}` | Anything else |

**Error precedence**: code params (400) → body Zod (400) → room lookup
(404) → host check (403) → state check (409) → service success (200).

## Client behavior on success

1. Update local `RoomStore` state with the returned snapshot. The host's
   own tab now sees `room.status === "result"`.
2. `GamePage`'s status-watching effect detects `status === "result"` and
   navigates to `/result` with `replace: true`.

## Client behavior on error

1. Render `error.message` from the response body in the GamePage's status
   region.
2. Do NOT navigate.

## Test surface

- Backend (`roomStore.test.ts`):
  - `endRound(code, hostId)` from `playing` returns `{room}` with
    `room.status === "result"`; `currentRound`, `guesses`, scores all
    preserved.
  - `endRound(code, nonHostId)` from `playing` returns
    `{error: "not-host"}`.
  - `endRound(code, hostId)` from `lobby` returns
    `{error: "wrong-state"}`.
  - `endRound(code, hostId)` from already-`result` returns
    `{error: "wrong-state"}`.
  - `endRound("ZZZZ", anyId)` returns `null`.
- Frontend (`api.test.ts`):
  - `api.endRound("ABCD", "host-id")` POSTs to `/rooms/ABCD/end` with the
    right body and base URL.
  - Surfaces server `message` verbatim on non-ok responses.
