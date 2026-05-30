# API Contract: Guess Submission, Scoring, and History Sync

**Branch**: `004-guess-scoring-sync` | **Date**: 2026-05-30

## New Endpoint

### POST /rooms/:code/guesses

Submit a guess for the active round.

**Request**

```
POST /rooms/:code/guesses
Content-Type: application/json

{
  "guesserId": "550e8400-e29b-41d4-a716-446655440000",
  "text": "  Rocket  "
}
```

| Field       | Type   | Required | Notes                                      |
|-------------|--------|----------|--------------------------------------------|
| `guesserId` | string | Yes      | UUID of the guesser participant            |
| `text`      | string | Yes      | Raw guess text; server trims before storing|

**Success Response — 201 Created**

```json
{
  "guess": {
    "id": "7f1d3fea-...",
    "guesserId": "550e8400-...",
    "text": "rocket",
    "isCorrect": true,
    "submittedAt": "2026-05-30T14:23:01.123Z"
  }
}
```

**Error Responses**

| Status | Condition                              | Body                                       |
|--------|----------------------------------------|--------------------------------------------|
| 400    | Missing or empty `text` after trim     | `{ "message": "Guess text is required" }`  |
| 400    | Invalid `guesserId` (not a UUID)       | `{ "message": "Invalid request payload" }` |
| 404    | Room not found                         | `{ "message": "Room not found" }`          |
| 409    | Room not in `active` status            | `{ "message": "Game is not active" }`      |

---

## Modified Endpoint

### GET /rooms/:code

Returns the current room snapshot. Two new fields are added to the response.

**Unchanged request signature** — see existing contract.

**Extended Response** (additions only):

```json
{
  "room": {
    "code": "AB3D",
    "status": "active",
    "hostId": "...",
    "participants": [...],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "guesses": [
      {
        "id": "7f1d3fea-...",
        "guesserId": "550e8400-...",
        "text": "rocket",
        "isCorrect": true,
        "submittedAt": "2026-05-30T14:23:01.123Z"
      }
    ],
    "scores": [
      { "participantId": "550e8400-...", "score": 100 },
      { "participantId": "b6d9e1a2-...", "score": 0 }
    ]
  }
}
```

**Backward compatibility**: Existing clients that do not read `guesses` or `scores` are unaffected — both fields are additive.

---

## Frontend API Client Additions

New method in `frontend/src/services/api.ts`:

```
submitGuess(code: string, guesserId: string, text: string)
  → Promise<{ guess: Guess }>
```

New types added to `frontend/src/services/api.ts`:

```
interface Guess {
  id: string
  guesserId: string
  text: string
  isCorrect: boolean
  submittedAt: string
}

interface Score {
  participantId: string
  score: number
}

// RoomSnapshot gains two new optional fields:
guesses: Guess[]
scores: Score[]
```
