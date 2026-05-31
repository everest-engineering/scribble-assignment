# API Contracts: Gameplay Interaction

**Feature**: 003 — Gameplay Interaction
**Date**: 2026-05-31
**Base URL**: `http://localhost:3001/api`

---

## Existing Endpoints (unchanged)

The following endpoints from specs 001–002 are **not modified** by this feature.
They are listed here for reference only.

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/rooms` | Create room |
| GET | `/rooms/:code` | Fetch room snapshot |
| POST | `/rooms/:code/join` | Join room |
| POST | `/rooms/:code/start` | Start game |

---

## New Endpoint 1 — Submit Guess

### `POST /rooms/:code/guesses`

Submit a guess for the active round. Only non-drawer participants may submit.

#### Path Parameters

| Param | Type | Description |
|-------|------|-------------|
| `code` | string | Room code (4 characters, case-insensitive) |

#### Request Body

```json
{
  "participantId": "uuid-string",
  "guessText": "  apple  "
}
```

| Field | Type | Validation |
|-------|------|------------|
| `participantId` | string | Required; must match a participant in the room |
| `guessText` | string | Required (raw); server trims before processing |

#### Success Response — `200 OK`

```json
{
  "guess": {
    "guesserName": "Alice",
    "guessText": "apple",
    "isCorrect": true,
    "submittedAt": "2026-05-31T14:22:01.000Z"
  },
  "newScore": 100
}
```

| Field | Description |
|-------|-------------|
| `guess.guessText` | The trimmed value submitted |
| `guess.isCorrect` | `true` if trimmed guess matches secret word (case-insensitive) |
| `newScore` | The guesser's updated score after this submission |

#### Error Responses

| Status | Code | Condition |
|--------|------|-----------|
| 400 | `empty-guess` | `guessText` is empty or whitespace-only after trimming |
| 403 | `drawer-cannot-guess` | `participantId` matches the current round's `drawerId` |
| 404 | `not-found` | Room with `:code` does not exist |
| 409 | `not-in-progress` | Room `status` is not `"in-progress"` |
| 422 | `unknown-participant` | `participantId` is not in the room's participant list |

Error body format (consistent with existing API):
```json
{ "error": "empty-guess" }
```

---

## New Endpoint 2 — Fetch Guess History

### `GET /rooms/:code/guesses`

Retrieve the full guess history and current scores for the active round.
Used by all clients on a polling interval (≤ 3 s) to keep the UI in sync.

#### Path Parameters

| Param | Type | Description |
|-------|------|-------------|
| `code` | string | Room code |

#### Query Parameters

None required. `participantId` may be added in a future iteration for auth.

#### Success Response — `200 OK`

```json
{
  "guesses": [
    {
      "guesserName": "Alice",
      "guessText": "apple",
      "isCorrect": true,
      "submittedAt": "2026-05-31T14:22:01.000Z"
    },
    {
      "guesserName": "Bob",
      "guessText": "rocket",
      "isCorrect": false,
      "submittedAt": "2026-05-31T14:22:10.000Z"
    }
  ],
  "scores": {
    "participant-uuid-alice": 100,
    "participant-uuid-bob": 0
  }
}
```

`guesses` is ordered by `submittedAt` ascending (submission order).
`scores` keys are participant IDs; every participant in the room has an entry.

#### Error Responses

| Status | Code | Condition |
|--------|------|-----------|
| 404 | `not-found` | Room with `:code` does not exist |
| 409 | `not-in-progress` | Room is not in-progress (no round active) |

---

## Zod Schemas (backend/src/api/schemas.ts)

```typescript
// ADD to schemas.ts

export const submitGuessSchema = z.object({
  participantId: z.string().min(1),
  guessText: z.string(),   // raw; trimmed in service layer
});
```

---

## Routing (backend/src/api/rooms.ts)

```typescript
// ADD to rooms router

router.post("/:code/guesses", async (req, res) => { /* submitGuess handler */ });
router.get("/:code/guesses",  async (req, res) => { /* getGuesses handler */ });
```

Both routes follow the same error-handling pattern as existing routes.

---

## Frontend API Client (frontend/src/services/api.ts)

```typescript
// ADD to api.ts

export async function submitGuess(
  code: string,
  participantId: string,
  guessText: string,
): Promise<{ guess: GuessEntry; newScore: number }> { /* fetch POST */ }

export async function fetchGuesses(
  code: string,
): Promise<{ guesses: GuessEntry[]; scores: Record<string, number> }> { /* fetch GET */ }
```
