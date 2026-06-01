# Data Model: Round Result and Restart

## Type Changes

### RoomStatus (modified)

```
"lobby" | "playing" | "results"
```

Renamed from `"round_ended"` to `"results"`. The behavior is identical — no new strokes or guesses accepted, secret word visible to all. The name change reflects the user-facing purpose (showing results) and enables the restart transition back to `"lobby"`.

### Room Extension (unchanged fields)

The Room interface does not need new fields. The existing `status` field changes from `"round_ended"` to `"results"`:

```typescript
interface Room {
  code: string;
  status: RoomStatus;            // "lobby" | "playing" | "results"
  hostId: string;
  drawerId: string | null;
  secretWord: string | null;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
  strokes: DrawingStroke[];      // Still readable in results
  clearVersion: number;
  guesses: Guess[];              // Still readable in results
  scores: Map<string, number>;   // Still readable in results
}
```

### RoomSnapshot (unchanged fields)

No new fields needed. The existing projection already handles results display:

```typescript
interface RoomSnapshot {
  // Existing fields...
  status: "lobby" | "playing" | "results";
  secretWord?: string;           // Visible to all when status === "results"
  // All other fields unchanged
}
```

## State Transitions

```
lobby ──[startGame]──→ playing ──[allCorrect OR reveal]──→ results ──[playAgain]──→ lobby
```

- **lobby → playing**: Existing `startGame()` logic. Initializes game state.
- **playing → results**: Triggered by `submitGuess()` (when all guessers correct) or `revealWord()` (drawer manual reveal). Previously transitioned to `"round_ended"`, now transitions to `"results"`.
- **results → lobby**: Triggered by new `playAgain()` function. Clears all round-scoped data, preserves player list and host.
- **results**: No strokes, guesses, or clears accepted. Secret word visible to all. Scores and guess history still readable.

## Validation Rules (new / modified)

| Action | Rule |
|--------|------|
| Play Again | Requester must be a participant in the room |
| Play Again (idempotency) | If room status is already `"lobby"`, return success with no changes |
| Guess submission | Rejected unless status is `"playing"` (covers `"results"` and `"lobby"`) |
| Stroke submission | Rejected unless status is `"playing"` (covers `"results"` and `"lobby"`) |
| Reveal action | Rejected unless status is `"playing"` (already covered by existing check) |
