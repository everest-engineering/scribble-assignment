# Contract: `POST /rooms/:code/start`

**Feature**: 002-game-start-drawer
**Purpose**: Transition a room from `lobby` to `playing`, designate the host
as the drawer, and choose the round's secret word.
**Maps to**: US1, FR-003, FR-004, FR-006, FR-010, FR-011.

## Request

- **Method**: `POST`
- **Path**: `/rooms/:code/start`
- **Headers**: `Content-Type: application/json`
- **URL parameter**:
  - `code` (string, required): the room code. Same normalization rules as
    every other `/rooms/:code/*` endpoint — trim, upper-case, reject empty
    after trim.
- **Body** (JSON):
  ```json
  { "participantId": "8c4f0e2b-1d23-4d6f-9bd6-1a2bcef1ab12" }
  ```
  - `participantId` (string, required): the caller's stored participant id
    (issued by `POST /rooms` at create-time). MUST equal
    `room.hostParticipantId` for the room to actually transition.

## Success: `200 OK`

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "hostParticipantId": "8c4f0e2b-1d23-4d6f-9bd6-1a2bcef1ab12",
    "participants": [
      { "id": "8c4f0e2b-1d23-4d6f-9bd6-1a2bcef1ab12", "name": "Alice", "joinedAt": "…" },
      { "id": "f1a3b2c0-5678-4d3a-8e92-aa11bb22cc33", "name": "Bob",   "joinedAt": "…" }
    ],
    "currentRound": {
      "drawerParticipantId": "8c4f0e2b-1d23-4d6f-9bd6-1a2bcef1ab12",
      "secretWord": "rocket"
    },
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Invariants on the success response**:
- `room.status === "playing"`.
- `room.currentRound.drawerParticipantId === room.hostParticipantId`.
- `room.currentRound.secretWord` is one of the values in `room.availableWords`,
  selected deterministically from `room.code` (see plan §Decision: Deterministic word selector).
- Because the caller is the host (a precondition for success), the snapshot
  in this response includes the real `secretWord`. Any subsequent
  `GET /rooms/:code?participantId=<host-id>` returns the same value;
  `GET /rooms/:code?participantId=<other-id>` returns `secretWord: null`.

## Idempotency

Calling `POST /:code/start` against a room that is already `playing`:
- If the caller IS the host → returns 200 with the existing snapshot
  unchanged (same `currentRound`, same `secretWord`). The word selector is
  NOT re-run; the existing `Round` object is reused.
- If the caller is NOT the host → returns 403 with
  `"Only the host can start the game"`. The host check runs before the
  idempotency check.

This satisfies FR-010 ("Start … MUST be a no-op") without forcing the
client to special-case re-press as an error.

## Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"message": "Enter a room code"}` | `code` empty or whitespace-only after trim |
| `400` | `{"message": "Invalid request payload"}` | Body fails Zod parsing (e.g., `participantId` missing or non-string) |
| `400` | `{"message": "Need at least 2 players to start"}` | Room exists, caller is the host, but `participants.length < 2` |
| `403` | `{"message": "Only the host can start the game"}` | `participantId !== room.hostParticipantId` |
| `404` | `{"message": "Room not found"}` | `code` does not match any active room |
| `500` | `{"message": "Unexpected server error"}` | Anything else |

## Client behavior on success

1. Update local `RoomStore` state with the returned snapshot (so the
   host's tab can render the word immediately).
2. `LobbyPage`'s status-watching effect detects `status === "playing"` and
   navigates to `/game` with `replace: true`.

## Client behavior on error

1. Render `error.message` from the response body in the LobbyPage's status
   region (no separate modal needed — these are rare paths).
2. Do NOT navigate; the host remains on the lobby.

## Test surface

- Backend (`roomStore.test.ts`):
  - `startRoom(code, hostId)` with 2+ players transitions status, sets
    `currentRound.drawerParticipantId === hostId`, sets a STARTER_WORDS word.
  - `startRoom(code, nonHostId)` returns an error sentinel (or throws an
    `HttpError`) — pick one and document; tests assert it.
  - `startRoom(code, hostId)` with 1 player returns the quorum-failure
    sentinel; status stays `lobby`.
  - `startRoom(code, hostId)` twice returns the same `currentRound`
    reference (or structurally identical clone) on the second call; the
    word selector was called exactly once.
- Backend (`schemas.test.ts`):
  - `startRoomSchema` rejects `{}`, `{participantId: ""}`, `{participantId: 42}`.
  - `startRoomSchema` accepts `{participantId: "abc"}`.
- Frontend (`api.test.ts`):
  - `api.startGame("ABCD", "host-id")` POSTs to `/rooms/ABCD/start` with
    the right body and base URL.
  - Surfaces `error.message` verbatim on non-ok responses.
