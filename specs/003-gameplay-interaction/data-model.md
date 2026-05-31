# Data Model: Gameplay Interaction

**Feature**: 003 — Gameplay Interaction
**Date**: 2026-05-31

---

## New Entity: GuessEntry

A single guess submission within a round.

```typescript
// backend/src/models/game.ts  — ADD

export interface GuessEntry {
  guesserName: string;   // Display name of the submitting player (from Participant.name)
  guessText: string;     // Trimmed guess text (never empty)
  isCorrect: boolean;    // true if guessText.toLowerCase() === secretWord.toLowerCase()
  submittedAt: string;   // ISO 8601 timestamp
}
```

**Validation rules**:
- `guessText` is the trimmed value; the raw input trim happens in the service layer
- An entry is only created for non-empty guesses after trimming (FR-005, FR-006)
- `isCorrect` is computed at submission time and stored immutably

**State transitions**: None — `GuessEntry` is append-only; entries are never
mutated after creation.

---

## Extended Entity: CurrentRound

Adds guess history and per-participant scores to the existing round context.

```typescript
// backend/src/models/game.ts  — EXTEND CurrentRound

export interface CurrentRound {
  roundNumber: number;                 // existing
  drawerId: string;                    // existing
  wordIndex: number;                   // existing
  guesses: GuessEntry[];               // NEW — append-only list; [] at round start
  scores: Record<string, number>;      // NEW — participantId → score; all 0 at round start
}
```

**Score initialization**: `startGame()` MUST initialize `scores` to
`{ [p.id]: 0 }` for every participant in the room (FR-011).

**Score update rule**: When a guess is correct, `scores[guesser.id] += 100`.
Scores only increase; repeat correct guesses each add 100 (per spec edge case).

---

## Extended Snapshot: RoomSnapshot (no change)

`RoomSnapshot` is intentionally **not modified** for this feature.
Scores and guess history are served exclusively via `GET /rooms/:code/guesses`
to avoid expanding the existing polling contract (Brownfield Awareness).

---

## New Response Shape: GuessesResponse

Returned by `GET /rooms/:code/guesses`.

```typescript
// Not a stored entity — a response DTO

interface GuessesResponse {
  guesses: GuessEntry[];
  scores: Record<string, number>;  // participantId → score
}
```

---

## Relationships

```
Room
└── CurrentRound (optional — only when status = "in-progress")
    ├── guesses: GuessEntry[]     (append-only per round)
    └── scores: Record<pid, num>  (incremented on correct guess)

Participant ──── pid appears as key in CurrentRound.scores
```

---

## Invariants

| Invariant | Enforcement |
|-----------|-------------|
| `GuessEntry.guessText` is never empty or whitespace-only | `roomStore.submitGuess()` rejects before appending |
| Drawer cannot have a `GuessEntry` | `roomStore.submitGuess()` checks `participantId !== drawerId` |
| `scores` always has an entry for every participant | `startGame()` initializes the full map |
| `guesses` is in submission order | Array append; never sorted |

---

## Migration Notes

This feature adds two new fields to `CurrentRound`. The existing `startGame()`
function must be updated to initialize them:

```typescript
// backend/src/services/roomStore.ts — diff in startGame()

const currentRound: CurrentRound = {
  roundNumber: 1,
  drawerId: room.hostId,
  wordIndex: 0,
+ guesses: [],
+ scores: Object.fromEntries(room.participants.map(p => [p.id, 0])),
};
```

No other existing code reads `CurrentRound.guesses` or `CurrentRound.scores`,
so the addition is fully backwards-compatible with the in-memory store.
