# API Contracts: Rooms (Scenario 4 additions)

**Branch**: `assignment` | **Date**: 2026-05-31
**Base URL**: `http://localhost:3001`

---

## POST /rooms/:code/guesses — Submit Guess (updated)

Behaviour unchanged from Scenario 3, with one addition: when `isCorrect` is `true`
the response now contains `status: "result"` and `secretWord` is visible to all viewers.

**Response 200 — correct guess (round ends)**:
```json
{
  "room": {
    "code": "ABCD",
    "hostId": "host-uuid",
    "drawerId": "host-uuid",
    "secretWord": "rocket",
    "status": "result",
    "guesses": [...],
    "scores": { "guesser-uuid": 100 },
    "participants": [...],
    "availableWords": [...],
    "roles": [...]
  }
}
```

*Note*: `secretWord` is now included unconditionally when `status === "result"`,
regardless of who the viewer is.

**Response 400 — guess after round has ended**:
```json
{ "message": "Game is not active" }
```

*(Existing guard in `submitGuess()` already rejects when `status !== "game"`)*

---

## POST /rooms/:code/restart — Restart Round (new)

Resets round state to lobby. Only the host may call this endpoint.

**Request body**: `{ "participantId": "host-uuid" }`

**Response 200**:
```json
{
  "room": {
    "code": "ABCD",
    "hostId": "host-uuid",
    "drawerId": null,
    "status": "lobby",
    "guesses": [],
    "scores": {},
    "participants": [
      { "id": "host-uuid", "name": "Alice", "joinedAt": "..." },
      { "id": "guesser-uuid", "name": "Bob", "joinedAt": "..." }
    ],
    "availableWords": [...],
    "roles": [...]
  }
}
```

**Response 403** — non-host caller:
```json
{ "message": "Only the host can restart" }
```

**Response 404** — room not found:
```json
{ "message": "Room not found" }
```

*Notes*:
- `secretWord` is absent from the restart response (room is back to lobby, word not set).
- `participants` are fully preserved — same IDs, names, and join timestamps.
- `scores` resets to `{}` (not `{ each: 0 }` — initialised to 0 again when next round starts).

---

## GET /rooms/:code — Get Room Snapshot (updated)

`secretWord` is now included for all viewers when `status === "result"`.

**Response 200 — result state, any viewer**:
```json
{
  "room": {
    "code": "ABCD",
    "hostId": "host-uuid",
    "drawerId": "host-uuid",
    "secretWord": "rocket",
    "status": "result",
    "guesses": [...],
    "scores": { "host-uuid": 0, "guesser-uuid": 100 },
    "participants": [...],
    "availableWords": [...],
    "roles": [...]
  }
}
```

*Note*: During `"game"` state, the Scenario 2 rule still applies — `secretWord` only for
the drawer. In `"result"` state, `secretWord` is returned to everyone.

---

## Unchanged endpoints

`POST /rooms` and `POST /rooms/:code/join` — no change.
`POST /rooms/:code/start` — no change; still initialises `guesses: []` and `scores`.
