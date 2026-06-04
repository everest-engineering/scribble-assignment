# API Contracts: Gameplay Interaction

**Feature**: `003-gameplay-interaction` | **Date**: 2026-06-04

---

## New: `POST /rooms/:code/strokes`

Submit a drawing stroke (or clear) from the drawer.

### Request

```
POST /rooms/:code/strokes
Content-Type: application/json

// Draw stroke:
{ "type": "draw", "participantId": "<uuid>", "x0": 10, "y0": 20, "x1": 50, "y1": 80, "color": "#ff0000", "lineWidth": 4 }

// Clear stroke:
{ "type": "clear", "participantId": "<uuid>" }
```

### Response — 200 OK

```json
{ "room": { ...RoomSnapshot } }
```

### Error responses

| Status | Condition |
|--------|-----------|
| 400 | `room.status !== "playing"` |
| 403 | `participantId !== room.drawerId` |
| 404 | Room not found |
| 422 | Zod validation failure (malformed payload) |

---

## New: `POST /rooms/:code/guess`

Submit a text guess from a non-drawer participant.

### Request

```
POST /rooms/:code/guess
Content-Type: application/json

{ "participantId": "<uuid>", "guess": "rocket" }
```

### Response — 200 OK

```json
{ "correct": true, "score": 100 }
```

or

```json
{ "correct": false, "score": 0 }
```

(`score` is the participant's updated total score.)

### Error responses

| Status | Condition |
|--------|-----------|
| 400 | Guess empty/whitespace after trim |
| 400 | `room.status !== "playing"` or `room.currentWord === null` |
| 400 | Participant has already submitted a correct guess this round |
| 403 | `participantId === room.drawerId` (drawer cannot guess) |
| 404 | Room not found |
| 404 | `participantId` not found in `room.participants` |
| 422 | Zod validation failure |

---

## Modified: `GET /rooms/:code`

No request change. Snapshot now includes `strokes` and `guesses` and `score` on participants.

### Response — 200 OK (full snapshot shape after this feature)

```json
{
  "room": {
    "code": "ABCD",
    "hostId": "<uuid>",
    "drawerId": "<uuid>",
    "currentWord": "rocket",
    "strokes": [
      { "type": "draw", "x0": 10, "y0": 20, "x1": 50, "y1": 80, "color": "#ff0000", "lineWidth": 4 },
      { "type": "clear" }
    ],
    "guesses": [
      { "participantName": "Alice", "text": "rocket", "correct": true },
      { "participantName": "Bob", "text": "banana", "correct": false }
    ],
    "status": "playing",
    "participants": [
      { "id": "<uuid>", "name": "Alice", "joinedAt": "...", "score": 100 },
      { "id": "<uuid>", "name": "Bob", "joinedAt": "...", "score": 0 }
    ],
    "availableWords": ["rocket","pizza","castle","guitar","sunflower"],
    "roles": ["drawer","guesser"]
  }
}
```

Note: `currentWord` is still viewer-gated (drawer sees actual word, others see `null`).
`strokes` and `guesses` are NOT viewer-gated — all players receive the full lists.
`participantId` is NOT included in `guesses` entries in the snapshot.

---

## Unchanged endpoints

`POST /rooms`, `POST /rooms/:code/join`, `POST /rooms/:code/start` — no breaking changes.
These now return snapshots that include `strokes: []`, `guesses: []`, and `score: 0` on
each participant. Existing callers are unaffected.
