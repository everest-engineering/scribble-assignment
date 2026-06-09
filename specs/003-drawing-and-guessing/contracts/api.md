# API Contracts: Drawing & Guessing

**Feature**: Drawing & Guessing | **Date**: 2026-06-09 | **Plan**: `specs/003-drawing-and-guessing/plan.md`

**Base URL**: `http://localhost:3001`

All endpoints follow the existing patterns in `backend/src/api/rooms.ts`. Errors return `{ message: string }` with appropriate HTTP status codes.

---

## POST /rooms/:code/strokes

Submit one or more strokes drawn by the drawer. The drawer must be the authenticated caller and the round must be in the "drawing" phase.

### Request

```json
{
  "participantId": "uuid-abc-123",
  "strokes": [
    {
      "points": [
        { "x": 0.1, "y": 0.2 },
        { "x": 0.3, "y": 0.4 }
      ],
      "color": "#000000",
      "width": 0.008
    }
  ]
}
```

### Response (200)

```json
{
  "room": {
    "code": "ABCD",
    "status": "in-progress",
    "participants": [...],
    "hostId": "...",
    "drawerId": "...",
    "phase": "drawing",
    "secretWord": null,
    "availableWords": [...],
    "roles": [...],
    "strokes": [...],
    "guesses": [...]
  }
}
```

### Error Responses

| Status | Condition | Message |
|--------|-----------|---------|
| 400 | Invalid stroke data (Zod validation) | Description of validation failure |
| 403 | Not the drawer | `"Only the drawer can submit strokes"` |
| 400 | Wrong phase (not "drawing") | `"Round is not in drawing phase"` |
| 404 | Room not found | `"Unable to load room"` |

---

## POST /rooms/:code/guess

Submit a guess for the secret word. The caller must be a guesser (not the drawer) and must not have already guessed correctly.

### Request

```json
{
  "participantId": "uuid-abc-456",
  "text": "cat"
}
```

### Response (200)

```json
{
  "correct": true
}
```

When incorrect:

```json
{
  "correct": false
}
```

### Error Responses

| Status | Condition | Message |
|--------|-----------|---------|
| 400 | Invalid guess text (Zod validation) | Description of validation failure |
| 403 | Caller is the drawer | `"The drawer cannot submit guesses"` |
| 400 | Guesser already answered correctly | `"You have already guessed correctly"` |
| 400 | Game not in drawing phase | `"Game is not in the drawing phase"` |
| 404 | Room not found | `"Unable to load room"` |

---

## GET /rooms/:code?participantId=uuid

Updated to include `strokes` and `guesses` in the response. This is the existing polling endpoint, now with additional fields.

### Response (200) — existing fields plus:

```json
{
  "room": {
    "... existing fields ...",
    "strokes": [
      {
        "points": [{ "x": 0.1, "y": 0.2 }, { "x": 0.3, "y": 0.4 }],
        "color": "#000000",
        "width": 0.008
      }
    ],
    "guesses": [
      {
        "participantId": "uuid-abc-456",
        "participantName": "Second Pencil",
        "text": "cat",
        "isCorrect": true,
        "guessedAt": "2026-06-09T12:00:00.000Z"
      }
    ]
  }
}
```

### Guess Visibility Rules

The `isCorrect` field in the `guesses` array is filtered per viewer:

| Viewer Role | Their own guesses | Others' guesses |
|-------------|-------------------|-----------------|
| **Drawer** | N/A (cannot guess) | `isCorrect` = `null` for ALL guesses |
| **Guesser** | `isCorrect` as stored | `isCorrect` = `null` |

The POST `/rooms/:code/guess` response remains the only reliable way for a guesser to know if their guess was correct.

---

## GET /rooms/:code/strokes (optional separate endpoint)

If the full room snapshot becomes too large, a separate endpoint can serve strokes independently. **Not implemented in v1** — strokes are included in the main room polling response.

---

## Type Definitions

These extend the existing types in `backend/src/models/game.ts` and `frontend/src/services/api.ts`.

```typescript
// Point — new
interface Point {
  x: number;  // 0-1 normalized
  y: number;  // 0-1 normalized
}

// Stroke — new
interface Stroke {
  points: Point[];    // min 2 points
  color: string;      // hex "#000000"
  width: number;      // 0.001-1 normalized
}

// Guess — new
interface Guess {
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean | null;  // null = hidden from viewer
  guessedAt: string;          // ISO 8601
}

// RoundState — extended
interface RoundState {
  drawerId: string;
  guesserIds: string[];
  wordOptions: string[];
  secretWord: string | null;
  phase: RoundPhase;
  strokes: Stroke[];     // NEW
  guesses: Guess[];      // NEW
}

// RoomSnapshot — extended
interface RoomSnapshot {
  // ... existing fields ...
  strokes: Stroke[];     // NEW
  guesses: Guess[];      // NEW
}
```
