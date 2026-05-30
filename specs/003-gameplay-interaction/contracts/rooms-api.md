# REST Contract: Rooms API (Scenario 3 deltas)

**Base URL**: `http://localhost:3001` (or `VITE_API_URL` on frontend)

**Builds on**: [002-game-start-drawer-flow/contracts/rooms-api.md](../002-game-start-drawer-flow/contracts/rooms-api.md)

Scenario 3 adds gameplay mutation endpoints and extends the room snapshot with canvas strokes,
guess history, and per-participant scores. Polling remains `GET /rooms/:code?participantId=`.

---

## Shared types

### Stroke

```json
{
  "id": "stroke-uuid",
  "points": [{ "x": 120, "y": 45 }, { "x": 130, "y": 50 }],
  "color": "#111827",
  "width": 3
}
```

### Guess

```json
{
  "id": "guess-uuid",
  "participantId": "guest-uuid",
  "participantName": "Guest",
  "text": "rocket",
  "isCorrect": true,
  "submittedAt": "2026-05-30T12:05:00.000Z"
}
```

---

## GET /rooms/:code (extended snapshot)

When `status === "playing"`, response includes:

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "hostParticipantId": "host-uuid",
    "drawerParticipantId": "host-uuid",
    "participants": [
      {
        "id": "host-uuid",
        "name": "Host",
        "joinedAt": "2026-05-30T12:00:00.000Z",
        "isHost": true,
        "role": "drawer",
        "score": 0
      },
      {
        "id": "guest-uuid",
        "name": "Guest",
        "joinedAt": "2026-05-30T12:00:01.000Z",
        "isHost": false,
        "role": "guesser",
        "score": 100
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "strokes": [],
    "guesses": [
      {
        "id": "guess-uuid",
        "participantId": "guest-uuid",
        "participantName": "Guest",
        "text": "Rocket",
        "isCorrect": true,
        "submittedAt": "2026-05-30T12:05:00.000Z"
      }
    ],
    "secretWord": "rocket"
  }
}
```

| Field | Lobby | Playing | Notes |
|-------|-------|---------|-------|
| `participants[].score` | `0` | current score | Always present |
| `strokes` | absent or `[]` | stroke array | Shared to all viewers |
| `guesses` | absent or `[]` | guess array | Shared to all viewers |
| `secretWord` | absent | drawer viewer only | Unchanged from Scenario 2 |

---

## POST /rooms/:code/strokes

Append one completed stroke to the room canvas. **Drawer only.**

### Request

```json
{
  "participantId": "host-uuid",
  "stroke": {
    "points": [{ "x": 10, "y": 20 }, { "x": 15, "y": 25 }],
    "color": "#111827",
    "width": 3
  }
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `participantId` | string | yes | Must be current drawer |
| `stroke.points` | array | yes | Min 2 points; server assigns `stroke.id` |

### Response `200 OK`

```json
{
  "room": { "...": "viewer-aware snapshot with updated strokes" }
}
```

### Errors

| Status | Message (example) | When |
|--------|-------------------|------|
| 400 | Invalid stroke | Missing/invalid points |
| 403 | Only the drawer can draw | Non-drawer participant |
| 404 | Unable to load room | Unknown code |
| 409 | Game not in progress | `status !== "playing"` |

---

## POST /rooms/:code/canvas/clear

Clear all strokes from the canvas. **Drawer only.**

### Request

```json
{
  "participantId": "host-uuid"
}
```

### Response `200 OK`

Returns viewer-aware snapshot with `strokes: []`. Guesses and scores unchanged.

### Errors

Same role/status errors as stroke endpoint.

---

## POST /rooms/:code/guesses

Submit a guess during an active round. **Guessers only** (non-drawer participants).

### Request

```json
{
  "participantId": "guest-uuid",
  "guessText": "  Rocket  "
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `participantId` | string | yes | Must not be drawer |
| `guessText` | string | yes | Trimmed server-side; empty → `400` |

### Response `200 OK`

```json
{
  "room": {
    "...": "snapshot with new guess appended and score updated if first correct match"
  }
}
```

### Side effects on success

1. Append `Guess` to `room.guesses` (trimmed text, `isCorrect` computed)
2. If correct and participant not in `scoredParticipantIds`, add `100` to participant score
   and record id in `scoredParticipantIds`
3. If incorrect, score unchanged

### Errors

| Status | Message (example) | When |
|--------|-------------------|------|
| 400 | Guess is required | Trimmed guess empty |
| 403 | The drawer cannot submit guesses | Drawer participant |
| 404 | Unable to load room | Unknown code |
| 409 | Game not in progress | `status !== "playing"` |

---

## POST /rooms/:code/start (side effects extended)

On successful start (unchanged auth/preconditions):

- Initialize `strokes = []`, `guesses = []`, `scoredParticipantIds = []`
- Set each participant `score = 0`

Response shape unchanged except for new snapshot fields above.

---

## Unchanged endpoints

- `POST /rooms` — create (participants get `score: 0`)
- `POST /rooms/:code/join` — join
- `GET /health` — health check

Round end and restart endpoints are Scenario 4.
