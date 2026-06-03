# Contract: `POST /rooms`

**Feature**: 001-room-setup-lobby
**Purpose**: Create a new room and immediately make the caller the host.
**Maps to**: US1, FR-001, FR-002, FR-003, FR-008.

## Request

- **Method**: `POST`
- **Path**: `/rooms`
- **Headers**: `Content-Type: application/json`
- **Body** (JSON):
  ```json
  { "playerName": "Alice" }
  ```
  - `playerName` (string, optional): the creator's display name. Name
    validation (trim, reject empty) is owned by Scenario 2; this feature
    accepts it as-is and falls back to the literal `"Player"` when omitted or
    empty.

## Success: `201 Created`

```json
{
  "participantId": "8c4f0e2b-1d23-4d6f-9bd6-1a2bcef1ab12",
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostParticipantId": "8c4f0e2b-1d23-4d6f-9bd6-1a2bcef1ab12",
    "participants": [
      {
        "id": "8c4f0e2b-1d23-4d6f-9bd6-1a2bcef1ab12",
        "name": "Alice",
        "joinedAt": "2026-06-02T18:55:01.234Z"
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Invariants on the response**:
- `room.code` matches `/^[A-Z]{4}$/` and is unique among active rooms.
- `room.hostParticipantId === participantId` — the creator is always the host.
- `room.participants.length === 1` and the single entry is the creator.
- `room.status === "lobby"`.
- `availableWords` and `roles` echo the starter seed; this feature does not
  consume them.

## Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"message": "Invalid request payload"}` | Body fails Zod parsing (e.g., wrong shape, non-string `playerName`) |
| `500` | `{"message": "Unexpected server error"}` | Anything else — must NOT contain stack traces or framework names |

## Client behavior on success

1. Store `localStorage["scribble:identity:" + room.code]` =
   `{participantId, role: "host"}`.
2. Navigate to `/lobby`.

## Client behavior on error

1. Display `error.message` from the response body under the form's error
   region (`form__error`); never display raw HTTP status codes to the user.

## Test surface (Phase 2 reference)

- Backend (`roomStore.test.ts`):
  - `createRoom("Alice")` returns a room with `hostParticipantId ===
    participantId`.
  - `createRoom().room.code` matches `/^[A-Z]{4}$/`.
  - Two `createRoom()` calls produce different codes (statistical, not
    guaranteed; use a small loop and assert uniqueness).
- Backend (`schemas.test.ts`):
  - `createRoomSchema` accepts `{playerName: "Alice"}` and `{}`.
  - `createRoomSchema` rejects `{playerName: 123}` (non-string).
- Frontend (`api.test.ts`):
  - `api.createRoom("Alice")` POSTs to `/rooms` with the right body and base
    URL (verifies the sabotage fix).
