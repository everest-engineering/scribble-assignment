# API Contracts: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-04

All endpoints use `Content-Type: application/json`. The base URL is `http://localhost:3001`.

---

## New Endpoint: Submit Guess

### `POST /rooms/:code/guess`

Submits a guess from a guesser. Trims the text, compares case-insensitively against the
secret word, awards 100 points if correct, and returns the updated room snapshot.

**Request**

```json
{
  "participantId": "uuid-of-the-guesser",
  "guessText": " Rocket "
}
```

| Field | Type | Constraint |
|-------|------|-----------|
| `participantId` | `string` | Required — must be a non-drawer participant |
| `guessText` | `string` | Required — trimmed value must not be empty |

**Success Response** — `200 OK`

```json
{
  "room": {
    "code": "AB12",
    "status": "playing",
    "participants": [...],
    "hostId": "uuid",
    "drawerId": "uuid",
    "guesses": [
      {
        "participantId": "uuid-of-the-guesser",
        "participantName": "Bob",
        "text": "rocket",
        "correct": true,
        "submittedAt": "2026-06-04T12:00:00.000Z"
      }
    ],
    "scores": {
      "uuid-of-alice": 0,
      "uuid-of-bob": 100
    },
    "availableWords": [...],
    "roles": ["drawer", "guesser"]
  }
}
```

Note: `secretWord` is omitted from the response snapshot (guesser is not the drawer).

**Error Responses**

| Status | Condition |
|--------|-----------|
| `400 Bad Request` | `guessText` is missing or empty after trimming |
| `403 Forbidden` | `participantId` matches `room.drawerId` (drawer cannot guess) |
| `404 Not Found` | Room with `code` does not exist |

---

## Modified Endpoint: Fetch Room (polling)

### `GET /rooms/:code?participantId=<uuid>`

No request body changes. The response `RoomSnapshot` now includes `guesses` and `scores`.

**Response additions** (to the existing `room` object):

```json
{
  "room": {
    "...existing fields...",
    "guesses": [
      {
        "participantId": "string",
        "participantName": "string",
        "text": "string",
        "correct": true,
        "submittedAt": "ISO 8601 string"
      }
    ],
    "scores": {
      "<participantId>": 0
    }
  }
}
```

---

## Unchanged Endpoints (reference)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/rooms` | Create room + host participant |
| `POST` | `/rooms/:code/join` | Join existing room |
| `POST` | `/rooms/:code/start` | Start game (host only) |

---

## Zod Schema (backend validation)

```typescript
// backend/src/api/schemas.ts  (addition)
export const guessSchema = z.object({
  participantId: z.string(),
  guessText: z.string()
});
```

Server-side trimming and empty-check are performed in `submitGuess` (not in the Zod schema)
so that the 400 error message is domain-specific rather than a generic validation message.
