# API Contracts: Gameplay Interaction

**Feature**: `003-gameplay-interaction`
**Base URL**: `http://localhost:3001`

All request and response bodies are JSON. All endpoints return `Content-Type: application/json`.
Errors follow the existing pattern: `{ "message": "<string>" }` with the appropriate HTTP status code.

---

## Modified Responses (Existing Endpoints)

### `GET /rooms/:code?participantId=<id>` — Room Poll

The response shape is unchanged. New fields are added to `RoomSnapshot` when `status === "playing"`.

**Response body additions**:

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "hostId": "...",
    "participants": [...],
    "availableWords": [...],
    "roles": [...],
    "currentDrawerId": "p1",
    "currentWord": "rocket",
    "strokes": [
      [{"x": 10, "y": 20}, {"x": 11, "y": 21}, {"x": 12, "y": 22}],
      [{"x": 50, "y": 60}, {"x": 55, "y": 65}]
    ],
    "guesses": [
      {
        "id": "uuid",
        "participantId": "p2",
        "text": "airplane",
        "correct": false,
        "submittedAt": "2026-06-03T10:00:00.000Z"
      }
    ],
    "scores": {
      "p1": 0,
      "p2": 100
    }
  }
}
```

**Notes**:

- `strokes` is `[]` until the drawer draws; replaced wholesale on each update.
- `guesses` is `[]` until the first guess is submitted; ordered oldest-first.
- `scores` maps each `participantId` to their current integer score (≥ 0).
- `currentWord` is redacted to `null` for all participants except the drawer (unchanged from feature 002).

---

## New Endpoints

### `PATCH /rooms/:code/canvas`

Update the canvas strokes for an active round. Called by the drawer after completing each stroke
and after the "Clear" action. Replaces the server's stored canvas state wholesale.

**Request**:

```
PATCH /rooms/ABCD/canvas
Content-Type: application/json

{
  "participantId": "p1",
  "strokes": [
    [{"x": 10, "y": 20}, {"x": 15, "y": 25}]
  ]
}
```

To clear the canvas, send `"strokes": []`.

**Response** (`200 OK`):

```json
{
  "room": { ...RoomSnapshot... }
}
```

**Error responses**:

| Status | Condition                                 |
| ------ | ----------------------------------------- |
| 400    | Invalid body (Zod validation failure)     |
| 400    | `participantId` is not the current drawer |
| 404    | Room not found                            |
| 409    | Room is not in `"playing"` status         |

---

### `POST /rooms/:code/guesses`

Submit a guess for the current round. Returns the evaluated guess immediately.

**Request**:

```
POST /rooms/ABCD/guesses
Content-Type: application/json

{
  "participantId": "p2",
  "text": "rocket"
}
```

**Response** (`201 Created`):

```json
{
  "guess": {
    "id": "uuid",
    "participantId": "p2",
    "text": "rocket",
    "correct": true,
    "submittedAt": "2026-06-03T10:01:00.000Z"
  }
}
```

**Error responses**:

| Status | Condition                                                    |
| ------ | ------------------------------------------------------------ |
| 400    | Invalid body (Zod validation failure)                        |
| 400    | `text` is empty or whitespace-only                           |
| 400    | `participantId` is the current drawer (drawers cannot guess) |
| 404    | Room not found                                               |
| 404    | `participantId` not found in room participants               |
| 409    | Room is not in `"playing"` status                            |

**Evaluation rules**:

1. Trim `text` before comparison.
2. Compare case-insensitively against `room.currentWord`.
3. If match and the submitter has not already scored in this round → `correct: true`, award 100 points.
4. If match but submitter has already scored → `correct: false`, award 0 points (FR-019).
5. If no match → `correct: false`, award 0 points.

---

## Zod Schema Additions (`backend/src/api/schemas.ts`)

```typescript
// For PATCH /rooms/:code/canvas
export const updateCanvasSchema = z.object({
  participantId: z.string().min(1),
  strokes: z.array(
    z.array(z.object({ x: z.number().finite(), y: z.number().finite() })),
  ),
});

// For POST /rooms/:code/guesses
export const submitGuessSchema = z.object({
  participantId: z.string().min(1),
  text: z.string().min(1, "Guess cannot be empty"),
});
```

---

## Frontend `api.ts` Additions

```typescript
// New types
export interface Point { x: number; y: number; }
export type Stroke = Point[];

export interface Guess {
  id: string;
  participantId: string;
  text: string;
  correct: boolean;
  submittedAt: string;
}

// RoomSnapshot additions (when status === "playing")
// strokes: Stroke[]
// guesses: Guess[]
// scores: Record<string, number>

// New API methods
api.updateCanvas(code: string, participantId: string, strokes: Stroke[]): Promise<{ room: RoomSnapshot }>
api.submitGuess(code: string, participantId: string, text: string): Promise<{ guess: Guess }>
```
