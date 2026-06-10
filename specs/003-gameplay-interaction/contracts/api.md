# API Contracts: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-10

All endpoints are relative to `http://localhost:3001`. Existing endpoints are noted where their response shape changes.

---

## New Endpoints

### POST /rooms/:code/guess

Submit a guess for the active game.

**Request**

```
POST /rooms/:code/guess
Content-Type: application/json

{
  "playerName": string,   // non-empty after trim; identifies the guesser
  "guess": string         // the guess text; trimmed server-side before processing
}
```

**Responses**

| Status | Body | Condition |
|---|---|---|
| 200 | `{ guess: Guess }` | Guess accepted and stored |
| 400 | `{ message: string }` | Trimmed guess is empty |
| 400 | `{ message: string }` | Room not in playing state |
| 404 | `{ message: string }` | Room code not found |

**Guess object** (see data-model.md):

```json
{
  "playerName": "Alice",
  "text": "rocket",
  "correct": true,
  "points": 100,
  "submittedAt": "2026-06-10T12:00:00.000Z"
}
```

---

### POST /rooms/:code/stroke

Append a completed drawing stroke to the room.

**Request**

```
POST /rooms/:code/stroke
Content-Type: application/json

{
  "points": [{ "x": number, "y": number }, ...]   // min 1 point
}
```

**Responses**

| Status | Body | Condition |
|---|---|---|
| 200 | `{ strokes: Point[][] }` | Stroke appended; full list returned |
| 400 | `{ message: string }` | Points array is empty or malformed |
| 400 | `{ message: string }` | Room not in playing state |
| 404 | `{ message: string }` | Room code not found |

---

### POST /rooms/:code/clear

Reset the room's stroke list to empty.

**Request**

```
POST /rooms/:code/clear
```
(no body required)

**Responses**

| Status | Body | Condition |
|---|---|---|
| 200 | `{ strokes: [] }` | Stroke list cleared |
| 400 | `{ message: string }` | Room not in playing state |
| 404 | `{ message: string }` | Room code not found |

---

## Modified Endpoints

### GET /rooms/:code

**No change to request shape.**

The `room` snapshot in the response is extended with three new fields:

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "participants": [...],
    "availableWords": [...],
    "roles": [...],
    "drawerName": "Alice",
    "secretWord": "rocket",       // only present for the drawer viewer
    "guesses": [
      {
        "playerName": "Bob",
        "text": "rocket",
        "correct": true,
        "points": 100,
        "submittedAt": "2026-06-10T12:00:00.000Z"
      }
    ],
    "scores": {
      "Bob": 100
    },
    "strokes": [
      [{ "x": 10, "y": 20 }, { "x": 15, "y": 25 }],
      [{ "x": 50, "y": 60 }]
    ]
  }
}
```

`guesses`, `scores`, and `strokes` are always present (empty array / empty object) once the game is in `playing` state.
