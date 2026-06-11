# API Contract — Gameplay Interaction

Extends the contract from feature 002 (`specs/002-game-start-drawer/contracts/rooms-api.md`). Only the new and changed surface is documented here.

## New endpoint

### `POST /rooms/:code/guesses`

Submit a guess for the current round.

**Path params**:

- `code` — 4-char room code (case-insensitive, whitespace-tolerant per feature 001).

**Request body**:

```json
{
  "participantId": "uuid-of-guesser",
  "text": "Rocket"
}
```

**Validation (Zod `submitGuessSchema`)**:

- `participantId`: required, non-empty string.
- `text`: required, string; **server applies `.trim()`**; after trim length must be `1..50`.

**Responses**:

| Status | When | Body |
|---|---|---|
| `200 OK` | Eligible submission accepted (correct or incorrect) | `{ "room": <RoomSnapshot from the submitter's perspective> }` |
| `400 Bad Request` | Validation failure (empty / whitespace-only / >50 chars / missing `participantId`) | `{ "message": string }` |
| `403 Forbidden` | `participantId` is not a current participant of the room **OR** equals `room.round.drawerParticipantId` | `{ "message": "Drawers cannot guess in their own round" }` or `{ "message": "Participant is not in the room" }` |
| `404 Not Found` | Unknown `code` | `{ "message": "Room not found" }` |
| `409 Conflict` | No round in progress **OR** participant has already guessed correctly this round | `{ "message": "No round in progress" }` or `{ "message": "You have already guessed correctly this round" }` |

**Side effects on success**:

1. A new `Guess` is appended to `room.round.guesses` (chronological order).
2. If `isCorrect === true`:
   - `room.round.scores[participantId] += 100`.
   - `participantId` is added to `room.round.lockedParticipantIds`.
3. `room.updatedAt` is bumped.

**Idempotency**: The endpoint is **not** idempotent — every successful submission appends a new entry to the feed. Idempotency was considered and rejected in favour of an explicit `409` lockout for already-correct guessers, which prevents the only dangerous case (double-scoring).

### Example — guesser submits a correct guess

Request:

```http
POST /rooms/ABCD/guesses
Content-Type: application/json

{
  "participantId": "p-bob",
  "text": "  Rocket  "
}
```

Response `200 OK`:

```json
{
  "room": {
    "code": "ABCD",
    "status": "round",
    "hostParticipantId": "p-alice",
    "viewerIsHost": false,
    "canStart": false,
    "availableWords": [],
    "roles": ["drawer", "guesser"],
    "participants": [
      { "id": "p-alice", "name": "Alice", "joinedAt": "...", "isHost": true,  "isDrawer": true },
      { "id": "p-bob",   "name": "Bob",   "joinedAt": "...", "isHost": false, "isDrawer": false }
    ],
    "round": {
      "roundNumber": 1,
      "drawerParticipantId": "p-alice",
      "maskedWord": "______",
      "guesses": [
        {
          "id": "g-001",
          "participantId": "p-bob",
          "displayName": "Bob",
          "text": "Rocket",
          "isCorrect": true,
          "submittedAt": "2026-06-11T11:00:00.000Z"
        }
      ],
      "scores": { "p-alice": 0, "p-bob": 100 },
      "lockedParticipantIds": ["p-bob"]
    }
  }
}
```

### Example — same room polled by the drawer one tick later

```http
GET /rooms/ABCD?participantId=p-alice
```

The drawer additionally sees `round.secretWord: "rocket"`. Everything else is identical (because feed and scoreboard are viewer-agnostic).

## Changed endpoint shapes

### `GET /rooms/:code?participantId=...`

The response's `room.round` now always includes the three new fields documented above when `room.round !== null`. In the lobby (`room.round === null`), the response is unchanged from feature 002.

### `POST /rooms/:code/start`

Unchanged on the wire **except** that the returned `room.round` includes:

- `guesses: []`
- `scores: { "<participantId>": 0, ... }` — one zero per current participant.
- `lockedParticipantIds: []`

These default initial values land in the same snapshot the route already returned.

## Error envelope

Unchanged from feature 001: every 4xx response is `{ "message": string }` with no nested error objects.

## Polling expectations

- The frontend continues to poll `GET /rooms/:code?participantId=...` every ~2 seconds via the existing `useLobbyPolling` hook. No new polling channel is introduced.
- After a successful `POST /rooms/:code/guesses`, the client should optimistically render the new feed entry from the response **and** allow the next poll tick to reconcile (the response already contains the authoritative snapshot, so optimistic UI is straightforward).

## Out of scope (explicit)

- Editing or deleting an existing guess.
- A bulk-guess endpoint.
- Server-sent events / WebSockets for low-latency push.
- A canvas-strokes endpoint.
