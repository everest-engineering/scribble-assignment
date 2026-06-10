# Data Model: Gameplay Interaction

## Guess (new entity)

```
Guess {
  participantId:  string    // UUID of the guesser
  text:           string    // trimmed guess text (never empty)
  isCorrect:      boolean   // true if text.toLowerCase() === secretWord.toLowerCase()
  submittedAt:    string    // ISO 8601 timestamp
}
```

**Validation rules**:
- `text` is always the trimmed value; empty or whitespace-only submissions are rejected before
  a `Guess` is created.
- `isCorrect` is determined server-side at submission time; never recomputed.

## Room (extended again)

```
Room {
  code:           string                   // 4-char uppercase, unique
  status:         "lobby" | "active" | "completed"
  hostId:         string                   // from FG1
  drawerId:       string | null            // from FG2
  secretWord:     string | null            // from FG2
  participants:   Participant[]            // from FG1
  scores:         Record<string, number>   // ← NEW: keyed by participantId, all start at 0
  guesses:        Guess[]                  // ← NEW: ordered by submittedAt ascending
  createdAt:      string                   // ISO 8601
  updatedAt:      string                   // ISO 8601
}
```

**Validation rules**:
- `scores` is initialized as `{ [participantId]: 0 }` for every participant when
  `startGame()` is called.
- A correct guess increments `scores[participantId]` by 100.
- `guesses` is initialized as `[]` at `startGame()` time.
- Guesses are appended in submission order (no sorting needed at write time).

## RoomSnapshot (extended)

```
RoomSnapshot {
  code:           string
  status:         "lobby" | "active" | "completed"
  hostId:         string
  drawerId:       string | null
  secretWord:     string | null            // viewer-gated (from FG2)
  participants:   Participant[]
  availableWords: string[]
  roles:          ParticipantRole[]
  scores:         Record<string, number>   // ← NEW: always included
  guesses:        Guess[]                  // ← NEW: always included (no viewer gating needed)
}
```

**Notes**:
- `guesses` is included in full for all viewers — the text of each guess is not sensitive.
- `scores` is included for all viewers so the scoreboard can be rendered from a single poll.

## State Transitions (updated)

```
[createRoom]  ──► lobby   (scores={}, guesses=[])
lobby         ──► active  (scores={id:0,...}, guesses=[])
active        ──► active  (scores updated on each correct guess, guesses appended)
active        ──► completed
completed     ──► lobby   (scores={}, guesses=[] on restart — out of scope for FG3)
```
