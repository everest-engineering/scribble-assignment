# Data Model: Gameplay Interaction

**Feature**: `003-gameplay-interaction`

---

## New Types

### `Point`

A single `{x, y}` coordinate in canvas space (pixels, relative to the canvas element's top-left corner).

```typescript
interface Point {
  x: number; // pixels from canvas left edge
  y: number; // pixels from canvas top edge
}
```

**Validation**: `x` and `y` MUST be finite numbers. No negative-value constraint — the canvas element's
coordinate system starts at `(0, 0)` top-left.

---

### `Stroke`

An ordered list of `Point` objects captured from one `pointerdown → pointermove* → pointerup` sequence.
An empty array is valid (e.g., a tap with no movement).

```typescript
type Stroke = Point[];
```

---

### `CanvasState`

The full set of strokes drawn during the current round. Stored on the `Room` object.
Reset to `[]` when the drawer activates "Clear".

```typescript
type CanvasState = Stroke[];
```

---

### `Guess`

A single guess submission. Stored in the `Room.guesses` array; included in `RoomSnapshot`.

```typescript
interface Guess {
  id: string; // UUID — uniquely identifies this guess
  participantId: string; // submitter's participant ID
  text: string; // trimmed, original-case submission text
  correct: boolean; // true if text (case-insensitive) matches currentWord AND submitter has not already scored
  submittedAt: string; // ISO-8601 timestamp
}
```

**Validation rules**:

- `text` (before trimming): MUST NOT be empty or whitespace-only → 400 error
- `participantId`: MUST match a participant in the room → 404 / 400 error
- `participantId` MUST NOT be `room.currentDrawerId` — drawers cannot guess (enforced server-side; form hidden client-side)

---

## Modified Types

### `Room` — additions

```typescript
interface Room {
  // ... existing fields (code, status, hostId, participants, createdAt, updatedAt,
  //     currentDrawerId, currentWord, roundNumber) ...
  strokes: CanvasState; // [] on startRoom(), replaced wholesale on PATCH canvas
  guesses: Guess[]; // [] on startRoom(), appended on each submission
  scores: Record<string, number>; // { [participantId]: 0 } for all participants on startRoom()
}
```

**State transitions**:

- `startRoom()`: initialises `strokes = []`, `guesses = []`, `scores = { [id]: 0, ... }` for all participants
- `updateCanvas()`: replaces `strokes` wholesale (or sets `[]` on clear)
- `submitGuess()`: appends new `Guess` to `guesses`; increments `scores[participantId]` by 100 if `correct === true`

---

### `RoomSnapshot` — additions

```typescript
interface RoomSnapshot {
  // ... existing fields ...
  strokes: CanvasState; // included when status === "playing"
  guesses: Guess[]; // included when status === "playing"
  scores: Record<string, number>; // included when status === "playing"
}
```

No redaction — `strokes`, `guesses`, and `scores` are public game information visible to all participants.
(`currentWord` remains redacted to `null` for non-drawers as implemented in feature 002.)

---

## Entity Relationships

```
Room 1 ── * Participant     (room.participants array)
Room 1 ── 1 CanvasState     (room.strokes — list of Stroke[])
Room 1 ── * Guess            (room.guesses array)
Room 1 ── 1 ScoreMap         (room.scores — Record<participantId, score>)
Guess * ── 1 Participant     (guess.participantId → participant.id)
```

---

## Validation Summary

| Entity     | Rule                                      | Enforced By            |
| ---------- | ----------------------------------------- | ---------------------- |
| Guess.text | Non-empty after trim                      | Zod schema + client    |
| Guess      | submitter ≠ currentDrawerId               | Service layer          |
| Guess      | participantId exists in room.participants | Service layer          |
| Guess      | correct once per guesser per round        | Service layer (FR-019) |
| Stroke     | Array of finite `{x, y}` points           | Zod schema             |
| scores     | Initialized 0 for all participants        | `startRoom()` function |
