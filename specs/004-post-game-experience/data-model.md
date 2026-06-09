# Data Model: Post Game Experience

**Feature**: Post Game Experience | **Date**: 2026-06-09 | **Plan**: `specs/004-post-game-experience/plan.md`

## Entities

### RoundPhase (extended)

The existing `RoundPhase` type gains a new value:

```typescript
type RoundPhase = "word-selection" | "drawing" | "finished";
```

| Value | Meaning |
|-------|---------|
| `"word-selection"` | Existing — drawer choosing a word |
| `"drawing"` | Existing — drawer draws, guessers guess |
| `"finished"` | **NEW** — round has ended (correct guess submitted), result screen is shown |

### Room

No structural changes to the `Room` interface. The existing fields are sufficient:
- `status`: transitions `"in-progress"` → (stays `"in-progress"` during result) — actually, this should remain `"in-progress"` since the game is still in progress. The phase differentiates between drawing and finished.
- `round`: contains the full RoundState with strokes, guesses, secretWord
- `round.phase`: transitions `"drawing" → "finished"` on correct guess

Wait — let me reconsider. The existing code has:
- `Room.status`: `"lobby" | "in-progress" | "finished"`
- `RoundState.phase`: `"word-selection" | "drawing"`

The "finished" room status was intended for when the entire game is over. The RoundPhase is for within a round.

For this feature, I need:
- `RoundState.phase` gets `"finished"` → means the current round ended (someone guessed correctly)
- `Room.status` stays `"in-progress"` during the result screen
- When host clicks "Play Again", `Room.status` goes back to `"lobby"` and `room.round` becomes `null`

Let me update this.

### State Transitions

```text
Room.status:      lobby ──[startGame]──→ in-progress ──[restart]──→ lobby
                                              │
RoundState.phase:         word-selection ──→ drawing ──[correct guess]──→ finished
```

- **RoundState.phase: `"word-selection"` → `"drawing"`**: Existing — drawer selects a word.
- **RoundState.phase: `"drawing"` → `"finished"`**: NEW — triggered by correct guess in `submitGuess()`.
- **Room.status: `"in-progress"` → `"lobby"`**: NEW — triggered by host restart. Clears `room.round`.

### Player Standing (computed, not stored)

Derived client-side from the `guesses[]` array in the room snapshot when phase is `"finished"`:

| Field | Source |
|-------|--------|
| Player name | `participants[].name` |
| Role | drawer or guesser (from `drawerId` comparison) |
| Guessed correctly (guessers) | `guesses.some(g => g.participantId === playerId && g.isCorrect)` |
| Correct guess count (drawer) | Number of distinct guessers with a correct guess |

### Secret Word Visibility

| Viewer | During drawing phase | During finished phase |
|--------|---------------------|----------------------|
| Drawer | Visible | Visible |
| Guesser | Hidden (`null`) | Visible |

### Validation Rules

| Action | Rule |
|--------|------|
| Submit guess | Rejected if phase is `"finished"` (no longer drawing) |
| Submit stroke | Rejected if phase is `"finished"` (no longer drawing) |
| Restart game | Only host can restart. Only valid when phase is `"finished"`. |
