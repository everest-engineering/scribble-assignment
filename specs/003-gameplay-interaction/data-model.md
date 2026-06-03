# Data Model: Gameplay Interaction

## New Types

### `Stroke`

A single drawing gesture captured from a pointer event sequence.

```
Stroke {
  points:    Array<{ x: number; y: number }>  // ordered path points
  color:     string                            // CSS color string, e.g. "#000000"
  lineWidth: number                            // stroke width in pixels
}
```

### `Guess`

A single guess submission for the current round.

```
Guess {
  id:            string   // UUID
  participantId: string   // ID of the player who submitted
  text:          string   // trimmed guess text as submitted
  correct:       boolean  // true if text matches currentWord (case-insensitive)
  submittedAt:   string   // ISO 8601 timestamp
}
```

---

## Modified: `Room`

Extends the existing `Room` interface with three new fields.

```
Room {
  // --- existing fields (unchanged) ---
  code:         string
  hostId:       string
  drawerId:     string | null
  currentWord:  string | null
  status:       "lobby" | "active"
  participants: Participant[]
  createdAt:    string
  updatedAt:    string

  // --- new fields ---
  strokes: Stroke[]                    // ordered list of drawing strokes; [] on creation
  guesses: Guess[]                     // ordered list of all guesses this round; [] on creation
  scores:  Record<string, number>      // participantId → point total; populated on startRoom
}
```

**Initialization**:
- `strokes`, `guesses`: initialized to `[]` in `createRoom`.
- `scores`: initialized to `{}` in `createRoom`; all participant IDs mapped to `0` in the `startRoom` handler when the game goes active.

**Reset on start**: `startRoom` also resets `strokes: []`, `guesses: []`, and re-initializes `scores` for all current participants.

---

## Modified: `RoomSnapshot`

Extends the existing `RoomSnapshot` with the same three new fields, always fully exposed (no viewer-scoping needed for strokes, guesses, or scores).

```
RoomSnapshot {
  // --- existing fields (unchanged) ---
  code:         string
  hostId:       string
  drawerId:     string | null
  currentWord:  string | null          // null unless viewer === drawer
  status:       "lobby" | "active"
  participants: Participant[]
  availableWords: string[]
  roles:        ParticipantRole[]

  // --- new fields ---
  strokes: Stroke[]
  guesses: Guess[]
  scores:  Record<string, number>
}
```

---

## State Transitions

```
createRoom
  └─ strokes=[], guesses=[], scores={}

startRoom (status: lobby → active)
  └─ strokes=[], guesses=[]
  └─ scores = { [p.id]: 0 for each participant }

POST /rooms/:code/stroke (drawer only)
  └─ strokes = [...existing, newStroke]

POST /rooms/:code/clear (drawer only)
  └─ strokes = []

POST /rooms/:code/guess (guessers only)
  └─ guesses = [...existing, newGuess]
  └─ scores[participantId] += correct ? 100 : 0
```

---

## Validation Rules

| Field | Rule |
|-------|------|
| Stroke.points | Must have at least 1 point |
| Stroke.color | Non-empty string; defaults to "#000000" if absent |
| Stroke.lineWidth | Positive integer; defaults to 4 if absent |
| Guess.text (before trim) | After trim must be non-empty; 400 if empty |
| Guess submitter | Must not be the drawer; 403 if drawer attempts to guess |
| Stroke submitter | Must be the drawer; 403 if non-drawer attempts to draw |
