# API Contracts: Result, Restart & Final Validation

**Feature**: 004-result-restart — Scenario 4
**Base URL**: `http://localhost:3001`

---

## Modified Endpoint

### GET /rooms/:code (modified — result state)

During `"result"` status, `currentWord` is now included for ALL viewers (secret is
revealed on the result screen). The snapshot shape is otherwise unchanged.

**Response 200 — result state (any viewer)**

```json
{
  "room": {
    "code": "A3KP",
    "status": "result",
    "hostId": "uuid-host",
    "drawerId": "uuid-host",
    "currentWord": "rocket",
    "participants": [ ... ],
    "canvasStrokes": [ ... ],
    "guesses": [ ... ],
    "scores": { "uuid-host": 0, "uuid-bob": 100 },
    "availableWords": [ ... ],
    "roles": [ ... ]
  }
}
```

---

## New Endpoints

### POST /rooms/:code/end

End the active round. Host only.

**Request body**

```json
{ "participantId": "uuid-host" }
```

| Field           | Validation |
|-----------------|------------|
| `participantId` | Required; must equal `room.hostId` |

**Response 200**

```json
{ "ok": true }
```

**Error 400** — room is not active.
**Error 403** — caller is not the host.
**Error 404** — room not found.

---

### POST /rooms/:code/restart

Restart the game from the result screen. Host only. Clears all round state and returns
to lobby.

**Request body**

```json
{ "participantId": "uuid-host" }
```

| Field           | Validation |
|-----------------|------------|
| `participantId` | Required; must equal `room.hostId` |

**Response 200**

```json
{ "ok": true }
```

**Error 400** — room is not in result state.
**Error 403** — caller is not the host.
**Error 404** — room not found.

---

## Navigation Contract (Frontend)

| Screen | Status detected on poll | Action |
|--------|-------------------------|--------|
| `GamePage` | `"result"` | `navigate("/result")` |
| `ResultPage` | `"lobby"` | `navigate("/lobby")` |
| `ResultPage` | Any (keep polling) | Stay on result screen |
