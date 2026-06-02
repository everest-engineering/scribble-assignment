# Contract: `POST /rooms/:code/join`

**Feature**: 001-room-setup-lobby
**Purpose**: Join an existing room by code, with strict input validation.
**Maps to**: US2, FR-004, FR-005, FR-006, FR-007, FR-008, FR-015.

## Request

- **Method**: `POST`
- **Path**: `/rooms/:code/join`
- **Headers**: `Content-Type: application/json`
- **URL parameter**:
  - `code` (string, required): the room code.
    - Normalized server-side: leading/trailing whitespace is trimmed and the
      result is upper-cased before lookup, so `/rooms/  abcd  /join` and
      `/rooms/ABCD/join` resolve identically.
    - Must be non-empty after trim; an empty or whitespace-only code yields
      `400`.
- **Body** (JSON):
  ```json
  { "playerName": "Bob" }
  ```
  - `playerName` (string, optional): same semantics as `POST /rooms`.

## Success: `200 OK`

```json
{
  "participantId": "f1a3b2c0-5678-4d3a-8e92-aa11bb22cc33",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostParticipantId": "8c4f0e2b-1d23-4d6f-9bd6-1a2bcef1ab12",
    "participants": [
      {"id": "8c4f0e2b-1d23-4d6f-9bd6-1a2bcef1ab12", "name": "Alice", "joinedAt": "…"},
      {"id": "f1a3b2c0-5678-4d3a-8e92-aa11bb22cc33", "name": "Bob",   "joinedAt": "…"}
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Invariants on the response**:
- `participantId` is the newly issued id for the joiner — never the host's id.
- `room.hostParticipantId` is unchanged from creation — the joiner does not
  become host.
- `room.participants` includes the new joiner appended at the end.
- No upper bound on `participants.length` (spec Q2 clarification).

## Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"message": "Enter a room code"}` | `code` is empty or only whitespace after trim |
| `400` | `{"message": "Invalid request payload"}` | Body fails Zod parsing |
| `404` | `{"message": "Room not found"}` | `code` does not match any active room after normalization |
| `500` | `{"message": "Unexpected server error"}` | Anything else |

## Client behavior on success

1. Store `localStorage["scribble:identity:" + room.code]` =
   `{participantId, role: "guest"}`.
2. Navigate to `/lobby`.

## Client behavior on error

1. Display `error.message` from the response body in `form__error` under the
   relevant field.
2. Do NOT navigate away from the Join screen on any 4xx error.
3. Do NOT write to `localStorage` on any error (no half-state).

## Test surface (Phase 2 reference)

- Backend (`roomStore.test.ts`):
  - `joinRoom("ZZZZ", "Bob")` → `null` (unknown code path).
  - After `createRoom`, `joinRoom(code, "Bob")` returns a participant whose id
    differs from `hostParticipantId`.
  - Two rooms created in parallel do not see each other's participants.
- Backend (`schemas.test.ts`):
  - `roomCodeParamsSchema` rejects `""` and `"   "`.
  - `roomCodeParamsSchema` accepts `"ABCD"` and `"  abcd  "` (rejection is at
    emptiness, not casing).
  - Empty body and missing fields produce `Invalid request payload`.
- Backend (route integration if added):
  - `POST /rooms//join` (no code) returns `404` from Express routing — this
    edge case is *not* the schema's responsibility.
- Frontend (`api.test.ts`):
  - `api.joinRoom("abcd", "Bob")` uppercases the URL before posting (already
    handled in `JoinRoomPage` via `roomCode.toUpperCase()` before calling api;
    api itself does not normalize).
  - Surfaces the server `message` string verbatim into the thrown `Error`.
