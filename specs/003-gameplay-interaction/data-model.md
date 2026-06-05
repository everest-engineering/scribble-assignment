# Data Model: Gameplay Interaction

**Feature**: 003-gameplay-interaction — Scenario 3
**Date**: 2026-06-05

---

## New Types (`backend/src/models/game.ts`)

### Point

```
{ x: number; y: number }
```

A single coordinate captured from a mouse event.

### Stroke

```
Point[]   (alias: array of Points)
```

All coordinates from a single mouse-down-to-mouse-up gesture, in order.

### Guess

| Field           | Type      | Notes                                       |
|-----------------|-----------|---------------------------------------------|
| `participantId` | `string`  | Who submitted the guess                     |
| `text`          | `string`  | Trimmed guess text                          |
| `isCorrect`     | `boolean` | `true` if text matches currentWord (case-insensitive) |
| `submittedAt`   | `string`  | ISO 8601 timestamp                          |

---

## Extended Room (`backend/src/models/game.ts`)

Fields added by Scenario 3 (all optional to stay backwards-compatible with lobby state):

| Field              | Type                       | Added by    | Notes                               |
|--------------------|----------------------------|-------------|-------------------------------------|
| `canvasStrokes`    | `Point[][]`                | Scenario 3  | Append-only; `[]` on start; `[]` on clear |
| `guesses`          | `Guess[]`                  | Scenario 3  | Ordered by submission time          |
| `scores`           | `Record<string, number>`   | Scenario 3  | participantId → score; all `0` on start |

---

## Extended RoomSnapshot (`backend/src/models/game.ts` + `frontend/src/services/api.ts`)

| Field           | Type                     | Notes                                              |
|-----------------|--------------------------|----------------------------------------------------|
| `canvasStrokes` | `Point[][]`              | Full stroke array; always included when active     |
| `guesses`       | `Guess[]`                | Full history; always included when active          |
| `scores`        | `Record<string, number>` | All participants; always included when active      |

*`currentWord` filtering from Scenario 2 is unchanged.*

---

## Validation Rules

| Rule | Location | Behaviour |
|------|----------|-----------|
| Only drawer can add strokes | `POST /rooms/:code/stroke` | 403 if `participantId !== drawerId` |
| Only drawer can clear canvas | `POST /rooms/:code/clear` | 403 if `participantId !== drawerId` |
| Guess text non-empty after trim | `POST /rooms/:code/guess` | 400 "Guess cannot be empty" |
| Only guessers can guess | `POST /rooms/:code/guess` | 403 if `participantId === drawerId` |
| Room must be active | All three new endpoints | 400 if `room.status !== "active"` |

---

## Initialisation in `startRoom()`

```
room.canvasStrokes = []
room.guesses       = []
room.scores        = Object.fromEntries(room.participants.map(p => [p.id, 0]))
```

---

## State after each mutation

| Action | canvasStrokes | guesses | scores |
|--------|---------------|---------|--------|
| `startRoom` | `[]` | `[]` | all `0` |
| `addStroke(points)` | append `points` | unchanged | unchanged |
| `clearCanvas` | `[]` | unchanged | unchanged |
| `submitGuess(correct)` | unchanged | append `{..., isCorrect:true}` | `scores[guesser] += 100` |
| `submitGuess(wrong)` | unchanged | append `{..., isCorrect:false}` | unchanged |
