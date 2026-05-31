# API Contract: Rooms — Result & Restart

**Feature**: `004-result-restart` | **Extends**: Scenarios 1–3 rooms API | **Date**: 2026-05-31

## Status values

Room `status` is now `"lobby" | "playing" | "result"`.

---

## Modified behavior

### `POST /rooms/:code/guess`

On **correct** guess while `playing`:

- Records guess, applies +100 score
- Sets `room.status` to `"result"`
- Returns snapshot with `status: "result"` and `secretWord` visible to all viewers in that response

**New error case** (unchanged code): When `status === "result"`, returns **409** `Game is not in progress` (same as other non-playing mutations).

---

### `GET /rooms/:code?participantId={id}`

When `status === "result"`, response includes:

```json
{
  "room": {
    "code": "ABCD",
    "status": "result",
    "hostId": "uuid-host",
    "drawerId": "uuid-drawer",
    "participants": [],
    "secretWord": "rocket",
    "scores": { "uuid-a": 0, "uuid-b": 100 },
    "strokes": [],
    "guesses": [],
    "roles": ["drawer", "guesser"]
  }
}
```

- `secretWord` included for **every** viewer (not drawer-filtered).
- `availableWords` omitted.

---

### `POST /rooms/:code/join`

Returns **409** when `status === "result"` (same as `playing`).

---

## New endpoint

### `POST /rooms/:code/restart`

Return room to lobby after round ends. **Host only**; **result state only**.

**Body**:

```json
{
  "participantId": "uuid-host"
}
```

**Success `200`**:

```json
{
  "room": {
    "code": "ABCD",
    "status": "lobby",
    "hostId": "uuid-host",
    "drawerId": null,
    "participants": [],
    "scores": {},
    "strokes": [],
    "guesses": [],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

Round fields cleared; participants preserved.

**Errors**:

| Status | Condition |
|--------|-----------|
| 403 | Caller is not host |
| 404 | Room not found |
| 409 | Room not in `result` status |

---

## Client mirror (`frontend/src/services/api.ts`)

```text
restartRoom(code, participantId)
```

## Polling during result

Clients on `/result` poll `GET /rooms/:code?participantId=…` every ~2000 ms until status changes to `lobby` (after restart).

## Test expectations (Vitest)

- Correct guess transitions status to `result`
- Draw/guess after `result` → rejected
- `restartRoom` clears round fields, preserves participants
- Non-host restart → rejected
- Snapshot exposes `secretWord` to all when `result`
