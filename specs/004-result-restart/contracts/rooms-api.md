# API Contract — Result, Restart & Final Validation (Group 4)

Base URL: `http://localhost:3001`. Extends the Groups 1–3 room API. Errors use the existing `HttpError` +
`errorHandler` shape: `{ "message": string }`. Zod validation failures return `400`.

Only the **new** endpoint and the **changed snapshot reveal rule** are documented here; create/join/start/
strokes/canvas-clear/guess are unchanged.

---

## Snapshot reveal rule change

`GET /rooms/:code` (and every endpoint returning `room`) keeps the same shape, but the `secretWord`
projection is widened:

- **While `roundEnded` is false** (active play): `secretWord` is present **only** for the drawer
  (Group 2 behavior, unchanged).
- **When `roundEnded` is true** (round over): `secretWord` is present for **every** viewer (Group 4).
- **After restart** (`status` back to `lobby`, `round` cleared): `secretWord` is absent for everyone;
  `strokes`/`guesses` empty; participant `score` back to 0 on the next start.

```jsonc
// Example: round ended, guesser's view now includes the word
{
  "room": {
    "code": "ABC123",
    "status": "started",
    "hostId": "p1",
    "drawerId": "p1",
    "roundEnded": true,
    "secretWord": "apple",          // now present for guessers too (was drawer-only)
    "strokes": [ /* ... */ ],
    "guesses": [
      { "participantId": "p2", "name": "Bob", "guess": "apple", "correct": true, "at": "..." }
    ],
    "participants": [
      { "id": "p1", "name": "Alice", "isHost": true,  "role": "drawer",  "score": 0 },
      { "id": "p2", "name": "Bob",   "isHost": false, "role": "guesser", "score": 100 }
    ],
    "availableWords": ["..."],
    "roles": ["drawer", "guesser"]
  }
}
```

---

## POST /rooms/:code/restart

Return an ended round to the lobby. **Host only**, **only when `round.ended` is true**.

**Request**

```json
{ "participantId": "p1" }
```

**Validation** (`restartRoomSchema`): `participantId` non-empty.

**Behavior**: sets `status = "lobby"`, `round = null`, preserves participants and `hostId`. Idempotent
when the room is already `lobby` with no active round.

**Responses**

| Status | When | Body |
|--------|------|------|
| 200 | Restarted (or already in lobby — idempotent) | `{ "room": <snapshot> }` |
| 400 | Invalid payload (missing/empty `participantId`) | `{ "message": "Invalid request payload" }` |
| 403 | `participantId` is not the host | `{ "message": "Only the host can restart the game" }` |
| 404 | Room not found | `{ "message": "Room not found" }` |
| 409 | Round still active (`round.ended` is false) | `{ "message": "The round is still in progress" }` |

**Post-restart snapshot** (example):

```jsonc
{
  "room": {
    "code": "ABC123",
    "status": "lobby",
    "hostId": "p1",
    "drawerId": null,
    "roundEnded": false,
    "strokes": [],
    "guesses": [],
    "participants": [
      { "id": "p1", "name": "Alice", "isHost": true,  "role": null, "score": 0 },
      { "id": "p2", "name": "Bob",   "isHost": false, "role": null, "score": 0 }
    ],
    "availableWords": ["..."],
    "roles": ["drawer", "guesser"]
    // no secretWord
  }
}
```

---

## GET /rooms/:code (reused for convergence)

Unchanged request (`?participantId=…`). The game screen continues polling this (~2s); Group 4 relies on
it to (a) deliver the revealed word + final scores + history when `roundEnded` is true, and (b) deliver
`status === "lobby"` after restart so each game-screen tab auto-navigates back to the lobby.

## Follow-on: POST /rooms/:code/start (unchanged, reused)

After restart, the existing host-only start endpoint produces a fresh round (re-initializing roles, word,
strokes, guesses, scores, and `ended`). No change in this group.
