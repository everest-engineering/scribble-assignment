# API Contracts: Gameplay Interaction

**Feature**: 003-gameplay-interaction — Scenario 3
**Base URL**: `http://localhost:3001`

---

## Modified Endpoint

### GET /rooms/:code (modified)

Response now includes `canvasStrokes`, `guesses`, and `scores` when the room is active.

**Response 200 — active room**

```json
{
  "room": {
    "code": "A3KP",
    "status": "active",
    "hostId": "uuid-host",
    "drawerId": "uuid-host",
    "participants": [ ... ],
    "canvasStrokes": [
      [{"x": 10, "y": 20}, {"x": 15, "y": 25}],
      [{"x": 50, "y": 60}, {"x": 55, "y": 65}]
    ],
    "guesses": [
      { "participantId": "uuid-bob", "text": "castle", "isCorrect": false, "submittedAt": "..." },
      { "participantId": "uuid-bob", "text": "rocket", "isCorrect": true,  "submittedAt": "..." }
    ],
    "scores": {
      "uuid-host": 0,
      "uuid-bob": 100
    },
    "currentWord": "rocket",
    "availableWords": [...],
    "roles": [...]
  }
}
```

*`currentWord` is still filtered — only present when `participantId` matches `drawerId`.*

---

## New Endpoints

### POST /rooms/:code/stroke

Append a completed stroke to the canvas. Drawer only.

**Request body**

```json
{ "participantId": "uuid-host", "points": [{"x": 10, "y": 20}, {"x": 15, "y": 25}] }
```

| Field           | Validation |
|-----------------|------------|
| `participantId` | Required; must equal `room.drawerId` |
| `points`        | Required array; min 1 point |

**Response 200**

```json
{ "ok": true }
```

**Error 400** — `points` empty or missing.
**Error 403** — caller is not the drawer.
**Error 404** — room not found.
**Error 400** — room not active.

---

### POST /rooms/:code/clear

Clear all canvas strokes. Drawer only.

**Request body**

```json
{ "participantId": "uuid-host" }
```

**Response 200**

```json
{ "ok": true }
```

**Error 403** — caller is not the drawer.
**Error 404** — room not found.
**Error 400** — room not active.

---

### POST /rooms/:code/guess

Submit a guess. Guessers only; drawer cannot guess.

**Request body**

```json
{ "participantId": "uuid-bob", "text": "  ROCKET  " }
```

| Field           | Validation |
|-----------------|------------|
| `participantId` | Required; must NOT equal `room.drawerId` |
| `text`          | Required string; trimmed value must be non-empty |

**Response 200**

```json
{ "guess": { "participantId": "uuid-bob", "text": "rocket", "isCorrect": true, "submittedAt": "..." } }
```

**Error 400** — trimmed `text` is empty.
**Error 403** — caller is the drawer.
**Error 404** — room not found.
**Error 400** — room not active.
