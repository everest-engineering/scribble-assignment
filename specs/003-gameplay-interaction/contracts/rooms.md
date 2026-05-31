# API Contracts: Rooms (Scenario 3 additions)

**Branch**: `assignment` | **Date**: 2026-05-31
**Base URL**: `http://localhost:3001`

---

## POST /rooms/:code/guesses — Submit Guess (new)

Validates and scores a guess submission, appends it to the room's guess history,
and updates the submitter's score.

**Request body**:
```json
{
  "participantId": "guesser-uuid",
  "text": "rocket"
}
```

**Response 200** — guess recorded:
```json
{
  "room": {
    "code": "ABCD",
    "hostId": "host-uuid",
    "drawerId": "host-uuid",
    "status": "game",
    "guesses": [
      {
        "id": "guess-uuid",
        "participantId": "guesser-uuid",
        "participantName": "Alice",
        "text": "rocket",
        "isCorrect": true,
        "submittedAt": "2026-05-31T12:00:00.000Z"
      }
    ],
    "scores": {
      "guesser-uuid": 100
    },
    "participants": [...],
    "availableWords": [...],
    "roles": [...]
  }
}
```

**Response 400** — empty/whitespace-only guess:
```json
{ "message": "Guess cannot be empty" }
```

**Response 403** — drawer attempting to guess:
```json
{ "message": "Drawer cannot submit guesses" }
```

**Response 404** — room not found:
```json
{ "message": "Room not found" }
```

*Notes*:
- `text` is trimmed server-side before comparison and storage.
- Comparison is case-insensitive: `"ROCKET"` and `"rocket"` both produce `isCorrect: true`.
- `secretWord` is NOT included in this response (participantId is the guesser, not the drawer).
- Score for the guesser is cumulative — each correct guess adds 100 to their existing total.

---

## GET /rooms/:code — Get Room Snapshot (updated)

Now includes `guesses` and `scores` in all responses.

**Query params**: `participantId` (optional)

**Response 200** — any viewer:
```json
{
  "room": {
    "code": "ABCD",
    "hostId": "host-uuid",
    "drawerId": "host-uuid",
    "status": "game",
    "guesses": [
      {
        "id": "guess-uuid",
        "participantId": "guesser-uuid",
        "participantName": "Alice",
        "text": "rocket",
        "isCorrect": true,
        "submittedAt": "2026-05-31T12:00:00.000Z"
      }
    ],
    "scores": {
      "host-uuid": 0,
      "guesser-uuid": 100
    },
    "participants": [...],
    "availableWords": [...],
    "roles": [...]
  }
}
```

*Notes*:
- `guesses` and `scores` are included for all viewers — no secrets.
- `secretWord` is still conditionally included only for the drawer (unchanged from Scenario 2).
- Scores reflect the state at time of request; clients update within one poll cycle (≤2s).

---

## Unchanged endpoints

`POST /rooms` and `POST /rooms/:code/join` now return `guesses: []` and `scores: {}`
in the room snapshot (initial empty state). No functional change.

`POST /rooms/:code/start` now returns `guesses: []` and `scores: { <all-participant-ids>: 0 }`
reflecting the initialisation done by `startRoom()`.
