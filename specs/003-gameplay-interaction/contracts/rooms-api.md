# API Contract — Gameplay Interaction (Group 3)

Base URL: `http://localhost:3001`. Extends the Groups 1–2 room API. Errors use the existing `HttpError` +
`errorHandler` shape: `{ "message": string }`. Zod validation failures return `400`.

Only **new** endpoints and the **extended snapshot** are documented here; create/join/start are unchanged.

---

## Shared snapshot additions

Every endpoint that returns `room` now includes (in addition to the Group 1–2 fields):

```jsonc
{
  "room": {
    "code": "ABC123",
    "status": "started",
    "hostId": "p1",
    "drawerId": "p1",
    "roundEnded": false,            // NEW
    "strokes": [                    // NEW — visible to all
      { "points": [ { "x": 10, "y": 12 }, { "x": 11, "y": 14 } ] }
    ],
    "guesses": [                    // NEW — visible to all, ordered
      { "participantId": "p2", "name": "Bob", "guess": "cat", "correct": false, "at": "2026-06-05T..." }
    ],
    "participants": [
      { "id": "p1", "name": "Alice", "isHost": true, "role": "drawer", "score": 0 },   // score NEW
      { "id": "p2", "name": "Bob",   "isHost": false, "role": "guesser", "score": 100 }
    ],
    "availableWords": ["..."],
    "roles": ["drawer", "guesser"],
    "secretWord": "apple"           // present ONLY when viewer is the drawer (Group 2, unchanged)
  }
}
```

---

## POST /rooms/:code/strokes

Append one completed stroke. **Drawer only.**

**Request**

```json
{ "participantId": "p1", "stroke": { "points": [ { "x": 10, "y": 12 }, { "x": 11, "y": 14 } ] } }
```

**Validation** (`strokeSchema`): `participantId` non-empty; `stroke.points` length ≥ 1 and ≤ max (e.g. 2000).

**Responses**

| Status | When | Body |
|--------|------|------|
| 200 | Stroke appended | `{ "room": <snapshot> }` |
| 400 | Invalid payload (no points / too many / bad shape) | `{ "message": "Invalid request payload" }` |
| 403 | `participantId` is not the drawer | `{ "message": "Only the drawer can draw" }` |
| 404 | Room not found | `{ "message": "Room not found" }` |
| 409 | Round already ended | `{ "message": "The round has ended" }` |

---

## POST /rooms/:code/canvas/clear

Clear all strokes. **Drawer only.**

**Request**

```json
{ "participantId": "p1" }
```

**Validation** (`clearCanvasSchema`): `participantId` non-empty.

**Responses**

| Status | When | Body |
|--------|------|------|
| 200 | Canvas cleared (`strokes = []`) | `{ "room": <snapshot> }` |
| 400 | Invalid payload | `{ "message": "Invalid request payload" }` |
| 403 | Not the drawer | `{ "message": "Only the drawer can draw" }` |
| 404 | Room not found | `{ "message": "Room not found" }` |
| 409 | Round already ended | `{ "message": "The round has ended" }` |

---

## POST /rooms/:code/guess

Submit a guess. **Guessers only** (the drawer cannot guess).

**Request**

```json
{ "participantId": "p2", "guess": "  Apple " }
```

**Validation** (`guessSchema`): `participantId` non-empty; `guess` trimmed, non-empty after trim.

**Behavior**: server trims + lowercases both sides and compares; correct → +100 and `roundEnded = true`;
incorrect → +0. The guess is appended to `guesses` either way.

**Responses**

| Status | When | Body |
|--------|------|------|
| 200 | Guess recorded | `{ "room": <snapshot>, "correct": true }` |
| 400 | Empty/whitespace guess or bad payload | `{ "message": "Invalid request payload" }` |
| 403 | Drawer attempted to guess / not a participant | `{ "message": "Only guessers can submit guesses" }` |
| 404 | Room not found | `{ "message": "Room not found" }` |
| 409 | Round already ended | `{ "message": "The round has ended" }` |

> Client also blocks empty guesses before submitting (FR-038) for a clear message; the server `400` is the
> backstop and stays consistent with the generic Zod message used in Groups 1–2.

---

## GET /rooms/:code (extended)

Unchanged request (`?participantId=…`). Response `room` now includes `strokes`, `guesses`, `roundEnded`,
and per-participant `score`, with `secretWord` still drawer-only. This is the endpoint the game screen
polls (~2s) to converge drawing, scores, and history across tabs.
