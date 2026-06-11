# Data Model: Gameplay Interaction

New entities added alongside the existing `Room`, `Participant`, `RoomSnapshot` types.

## Stroke

```typescript
interface Point {
  x: number;
  y: number;
}

interface Stroke {
  color: string;       // hex color e.g. "#000000"
  points: Point[];     // ordered coordinates from mousedown to mouseup
}
```

| Field | Type | Notes |
|-------|------|-------|
| `color` | `string` | Hex color from the 8-color palette |
| `points` | `Point[]` | At least 1 point; ordered by draw sequence within the stroke |

## CanvasState

```typescript
interface CanvasState {
  strokes: Stroke[];   // all strokes drawn so far, in draw order
}
```

| Field | Type | Notes |
|-------|------|-------|
| `strokes` | `Stroke[]` | Append-only during the round; cleared on round end |

## Guess

```typescript
interface Guess {
  participantId: string;   // who submitted
  text: string;            // the guessed word (trimmed)
  correct: boolean;        // whether it matches the secret word
  timestamp: string;       // ISO timestamp
}
```

| Field | Type | Notes |
|-------|------|-------|
| `participantId` | `string` | UUID of the guesser |
| `text` | `string` | Trimmed, case preserved as submitted |
| `correct` | `boolean` | `true` if exact match (case-insensitive after trim) |
| `timestamp` | `string` (ISO) | Set server-side at submission time |

## Score (per-participant)

Stored as `Map<string, number>` (participantId → points) on the Room model.

| Key | Value | Notes |
|-----|-------|-------|
| `participantId` | `number` | Cumulative points; only incremented by 100 on correct guess |

## Room (extended fields)

| Field | Type | Notes |
|-------|------|-------|
| `scores` | `Map<string, number>` | **NEW** — participantId → cumulative score |
| `guessLog` | `Guess[]` | **NEW** — ordered list of all submitted guesses |
| `roundEnded` | `boolean` | **NEW** — `true` when round has ended (auto or manual) |

## RoomSnapshot (extended fields)

| Field | Type | Visible To |
|-------|------|------------|
| `scores` | `Record<string, number>` | All participants (when `status === "playing"` or `"finished"`) |
| `guessLog` | `Guess[]` | All participants (when `status === "playing"` or `"finished"`) |
| `roundEnded` | `boolean` | All participants |
| `secretWord` | `string?` | All participants when `status === "finished"`; drawer only when `"playing"` |

## State Transitions

```
playing ──[all guessers correct]──► finished
  │                                    │
  └──[host clicks End Round]──────────►┘
       (scores finalized, word revealed, canvas cleared)
```

## Validation Rules

| FR | Rule |
|----|------|
| FR-001 | Stroke appended only if requester is the drawer (403 otherwise) |
| FR-002 | GET /canvas returns current strokes to any participant |
| FR-003 | DELETE /canvas accepted only from drawer (403 otherwise) |
| FR-004 | POST /guess accepted only from guesser role (403 for drawer) |
| FR-005 | `guess.text.trim().toLowerCase() === secretWord.trim().toLowerCase()` |
| FR-007 | On correct guess: `scores[participantId] += 100` |
| FR-009 | `if (correctGuessers.size >= nonDrawerParticipants.length) → endRound()` |
| FR-010 | POST /end-round accepted only from hostId (403 otherwise) |
| FR-011 | On round end: `secretWord` revealed in snapshot; `status = "finished"` |
| FR-014 | On round end: `canvasState.delete(code)` — clear all strokes |
| FR-016 | Frontend: inline error; preserve input text on fetch failure |
