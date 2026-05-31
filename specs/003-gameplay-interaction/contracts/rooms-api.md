# API Contract: Rooms — Gameplay Extensions

**Feature**: `003-gameplay-interaction` | **Base**: existing `/rooms` routes | **Date**: 2026-05-31

All endpoints use JSON bodies, Zod validation, and centralized error handling. Room codes are 4-character uppercase alphanumeric (existing schema).

## Existing snapshot (extended)

### `GET /rooms/:code?participantId={id}`

**Response `room` additions when `status === "playing"`**:

```json
{
  "code": "ABCD",
  "status": "playing",
  "hostId": "uuid",
  "drawerId": "uuid",
  "participants": [],
  "scores": { "uuid-a": 0, "uuid-b": 100 },
  "strokes": [
    {
      "id": "stroke-1",
      "color": "#111827",
      "width": 4,
      "points": [{ "x": 10, "y": 20 }, { "x": 15, "y": 25 }]
    }
  ],
  "guesses": [
    {
      "id": "guess-1",
      "participantId": "uuid-b",
      "participantName": "Bob",
      "text": "pizza",
      "correct": false,
      "submittedAt": "2026-05-31T12:00:00.000Z"
    }
  ],
  "roles": ["drawer", "guesser"]
}
```

- `secretWord` present only when `participantId === drawerId` (Scenario 2).
- `availableWords` omitted when `playing`.

---

## New endpoints

### `POST /rooms/:code/drawing/strokes`

Append one stroke (drawer only, round active).

**Params**: `code` — room code

**Body**:

```json
{
  "participantId": "uuid-drawer",
  "stroke": {
    "id": "optional-client-id",
    "color": "#111827",
    "width": 4,
    "points": [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }]
  }
}
```

**Success `200`**:

```json
{
  "room": { }
}
```

Returns full viewer-filtered snapshot (same shape as GET).

**Errors**:

| Status | Condition |
|--------|-----------|
| 400 | Invalid payload / empty points |
| 403 | Not the drawer |
| 404 | Room not found |
| 409 | Room not in `playing` status |

---

### `POST /rooms/:code/drawing/clear`

Clear all strokes (drawer only, round active).

**Body**:

```json
{
  "participantId": "uuid-drawer"
}
```

**Success `200`**: `{ "room": { … } }` with `strokes: []`

**Errors**: Same as stroke append (403 if not drawer, 409 if not playing).

---

### `POST /rooms/:code/guess`

Submit a guess (guesser only, round active).

**Body**:

```json
{
  "participantId": "uuid-guesser",
  "guess": "  Rocket  "
}
```

**Success `200`**:

```json
{
  "room": { }
}
```

Server trims guess, evaluates, updates `guesses` and `scores`, returns snapshot.

**Errors**:

| Status | Condition |
|--------|-----------|
| 400 | Empty/whitespace guess |
| 403 | Caller is drawer or not a participant |
| 404 | Room not found |
| 409 | Room not in `playing` status |

---

## Client API mirror (`frontend/src/services/api.ts`)

```text
appendStroke(code, participantId, stroke)
clearDrawing(code, participantId)
submitGuess(code, participantId, guess)
```

## Polling contract

Game clients poll `GET /rooms/:code?participantId=…` every ~2000 ms. No separate endpoints for history or canvas sync.

## Test expectations (Vitest)

- Correct guess adds 100; incorrect adds 0.
- Case-insensitive match after trim.
- Drawer cannot submit guess (403).
- Non-drawer cannot append stroke (403).
- Clear removes all strokes.
