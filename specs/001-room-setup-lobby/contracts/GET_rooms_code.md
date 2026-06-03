# Contract: `GET /rooms/:code`

**Feature**: 001-room-setup-lobby
**Purpose**: Return the current snapshot of a room for polling clients.
**Maps to**: US3, FR-009, FR-010, FR-014, FR-008.

## Request

- **Method**: `GET`
- **Path**: `/rooms/:code`
- **URL parameter**:
  - `code` (string, required): same normalization rules as
    `POST /rooms/:code/join` — trim, upper-case, reject empty after trim.
- **Query parameter**:
  - `participantId` (string, optional): the caller's stored participant id.
    Echoed back through the service layer for forward-compatibility with
    later scenarios; this feature does not vary the snapshot based on it.

## Success: `200 OK`

```json
{
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
- `room.code` matches `/^[A-Z]{4}$/`.
- `room.hostParticipantId` is stable across consecutive polls for the same
  room (host does not rotate).
- `room.participants` is a fresh, defensively cloned array — the server
  guarantees later joiners appear here on subsequent polls within
  approximately the polling cadence on the joiner side.

## Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"message": "Enter a room code"}` | `code` is empty or only whitespace |
| `404` | `{"message": "Room not found"}` | `code` does not match any active room |
| `500` | `{"message": "Unexpected server error"}` | Anything else |

## Polling rules (client-side, normative)

- `useLobbyPolling(roomCode)`:
  - On mount: schedule `setInterval(fetchRoom, 2000)` AFTER an immediate
    initial fetch so the first paint is fresh.
  - On every interval tick: call the existing `roomStore.fetchRoom()`; do not
    spawn parallel requests if one is in flight (`isLoading` guards re-entry).
  - On unmount: `clearInterval` — no further requests for that room from
    that viewer (FR-010, SC-006).
  - On error: store the message in `RoomState.error`; the next tick retries;
    the UI does not throw.
  - Cadence target: 2000 ms; jitter up to ~3 s acceptable per spec assumptions.

## Server behavior on poll failure path

- A `404 Room not found` response while polling indicates the room was
  cleared (e.g., backend restart). The lobby surfaces the `message` to the
  user; the client does not redirect automatically in this feature (later
  scenarios may add an explicit "return to start" affordance).

## Test surface (Phase 2 reference)

- Backend (`roomStore.test.ts`):
  - `getRoom("ABCD")` after `createRoom` returns a snapshot whose
    `hostParticipantId` equals the creator's id.
  - `getRoom("UNKNOWN")` returns `null`.
  - `getRoom` returns a deep-cloned object (mutating the result does not
    mutate the stored room).
- Frontend (`useLobbyPolling.test.tsx` or co-located test):
  - With Vitest fake timers, mounting the hook triggers exactly one fetch
    immediately, then one per 2000 ms tick.
  - Unmounting stops further fetches.
  - A rejected fetch does not throw out of the hook; the next tick still runs.
