# API Contracts: Gameplay Interaction

**Date**: 2026-06-11
**Base URL**: `http://localhost:3001`

## Endpoint Changes

### `POST /rooms/:code/stroke` — Submit Stroke

**Request Body**:
```json
{
  "participantId": "uuid",
  "points": [{ "x": 10, "y": 20 }, { "x": 15, "y": 25 }]
}
```

**Response `200`**:
```json
{
  "ok": true
}
```

**Error `403`** — Not the drawer:
```json
{ "message": "Only the drawer can submit strokes" }
```

### `POST /rooms/:code/clear` — Clear Canvas

**Request Body**:
```json
{
  "participantId": "uuid"
}
```

**Response `200`**:
```json
{
  "ok": true
}
```

**Error `403`** — Not the drawer:
```json
{ "message": "Only the drawer can clear the canvas" }
```

### `POST /rooms/:code/guess` — Submit Guess

**Request Body**:
```json
{
  "participantId": "uuid",
  "text": "rocket"
}
```

**Response `200` (correct)**:
```json
{
  "result": "correct",
  "message": "Correct! You scored 100 points."
}
```

**Response `200` (incorrect)**:
```json
{
  "result": "incorrect",
  "message": "Incorrect guess. Try again!"
}
```

**Response `200` (already correct)**:
```json
{
  "result": "already_correct",
  "message": "Already guessed correctly"
}
```

**Error `400`** — Empty guess:
```json
{ "message": "Guess cannot be empty" }
```

**Error `403`** — Not a guesser in this round:
```json
{ "message": "Only guessers can submit guesses" }
```

### `GET /rooms/:code` — Get Room Snapshot (extended)

**Query**: `?participantId=<uuid>`

Extended with canvas and game state fields:

**Response `200` (round active, viewer is drawer)**:
```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "hostId": "uuid-1",
    "participants": [...],
    "roundNumber": 1,
    "drawerId": "uuid-1",
    "yourRole": "drawer",
    "wordForDrawer": "rocket",
    "wordLength": 6,
    "strokes": [{ "points": [{ "x": 10, "y": 20 }] }],
    "guesses": [{ "participantId": "uuid-2", "text": "rocket", "result": "correct", "timestamp": "..." }],
    "scores": { "uuid-2": 100 },
    "availableWords": [...],
    "roles": ["drawer", "guesser"]
  }
}
```

**Response `200` (round active, viewer is guesser)**:
```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "hostId": "uuid-1",
    "participants": [...],
    "roundNumber": 1,
    "drawerId": "uuid-1",
    "yourRole": "guesser",
    "wordForDrawer": undefined,
    "wordLength": 6,
    "strokes": [{ "points": [{ "x": 10, "y": 20 }] }],
    "guesses": [{ "participantId": "uuid-2", "text": "rocket", "result": "correct", "timestamp": "..." }],
    "scores": { "uuid-2": 100 },
    "availableWords": [...],
    "roles": ["drawer", "guesser"]
  }
}
```

## RoomSnapshot Shape (updated)

```typescript
interface StrokePoint {
  x: number;
  y: number;
}

interface Stroke {
  points: StrokePoint[];
}

interface Guess {
  participantId: string;
  text: string;
  result: "correct" | "incorrect";
  timestamp: string;
}

interface RoomSnapshot {
  code: string;
  status: "lobby" | "playing";
  hostId: string;
  participants: Participant[];
  roundNumber: number | null;
  drawerId: string | null;
  yourRole: "drawer" | "guesser" | null;
  wordForDrawer: string | undefined;
  wordLength: number | null;
  strokes: Stroke[];
  guesses: Guess[];
  scores: Record<string, number>;
  availableWords: string[];
  roles: ParticipantRole[];
}
```

## Polling Protocol

- Reuses the existing 2s polling on `GET /rooms/:code?participantId=<uuid>`
- The snapshot includes strokes (drawing canvas), guesses (history), and scores
- The drawer submits strokes/clear via dedicated POST endpoints (not via polling)
- Guessers submit guesses via dedicated POST endpoint (not via polling)
- All participants see canvas updates, guess results, and score changes within one polling cycle
