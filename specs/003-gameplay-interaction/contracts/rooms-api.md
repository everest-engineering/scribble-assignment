# API Contract: Rooms (Scenario 3 additions)

Base URL: `http://localhost:3001`  
Content-Type: `application/json`

Builds on Scenarios 1–2 endpoints.

## POST /rooms/:code/strokes

Append a stroke; drawer-only; playing state only.

**Request body**

```json
{
  "participantId": "<drawer-uuid>",
  "points": [{ "x": 10, "y": 20 }, { "x": 15, "y": 25 }],
  "color": "#000000",
  "width": 2
}
```

**Validation**

- `participantId`: required string
- `points`: array length 2–250
- `color`: optional string, default `#000000`
- `width`: optional positive number, default `2`
- Caller must be drawer; `status === "playing"`
- `strokes.length < 500`

**Response 200**: `{ "room": RoomSnapshot }` with updated strokes

| Status | Condition | Message |
|--------|-----------|---------|
| 400 | Invalid body / empty points | Zod or validation message |
| 403 | Not drawer | `"Only the drawer can draw"` |
| 404 | Unknown code | `"Unable to update room"` |
| 409 | Not playing / cap | `"Round is not active"` / `"Stroke limit reached"` / `"Stroke has too many points"` |

## POST /rooms/:code/strokes/clear

Clear all strokes; drawer-only; playing only.

**Request body**

```json
{
  "participantId": "<drawer-uuid>"
}
```

**Response 200**: `{ "room": RoomSnapshot }` with `strokes: []`

Same error table as strokes (403/404/409).

## POST /rooms/:code/guess

Submit a guess; guessers only; playing only.

**Request body**

```json
{
  "participantId": "<guesser-uuid>",
  "text": "  Rocket  "
}
```

**Validation**

- Trim `text`; reject empty → 400 `"Guess is required"`
- Caller must not be drawer
- `status === "playing"`
- `guesses.length < 200`

**Response 200**: `{ "room": RoomSnapshot }`

- Incorrect guess: `status` stays `"playing"`
- First correct guess: `status` becomes `"result"`, guesser `score` +100

| Status | Condition | Message |
|--------|-----------|---------|
| 400 | Empty guess | `"Guess is required"` |
| 403 | Drawer guesses | `"Drawer cannot guess"` |
| 404 | Unknown code | `"Unable to submit guess"` |
| 409 | Not playing / cap | `"Round is not active"` / `"Guess limit reached"` |

## GET /rooms/:code (extended snapshot)

When `currentRound` present, include:

```json
{
  "currentRound": {
    "roundIndex": 0,
    "drawerParticipantId": "...",
    "secretWord": null,
    "strokes": [...],
    "guesses": [
      {
        "id": "...",
        "participantId": "...",
        "participantName": "Bob",
        "text": "pizza",
        "isCorrect": false,
        "createdAt": "..."
      }
    ],
    "scores": [
      { "participantId": "...", "name": "Alice", "score": 0 },
      { "participantId": "...", "name": "Bob", "score": 100 }
    ],
    "winnerParticipantId": null
  }
}
```

`secretWord` still masked per Scenario 2.

## Out of scope

- `POST /rooms/:code/restart` — Scenario 4
