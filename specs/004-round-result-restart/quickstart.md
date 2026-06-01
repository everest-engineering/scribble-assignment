# Quickstart: Round Result and Restart Implementation

## Prerequisites

- Spec finalized (`spec.md`)
- Data model reviewed (`data-model.md`)
- API contracts reviewed (`contracts/`)
- Spec 003 (gameplay interaction) implementation is complete and working
- Backend and frontend dev servers running (`npm run dev` in each)

## Implementation Order

### Step 1: Backend Models (game.ts)

Change `RoomStatus` type from `"lobby" | "playing" | "round_ended"` to `"lobby" | "playing" | "results"`. No other structural changes needed.

### Step 2: Backend Store Logic (roomStore.ts)

Make these changes:
- In `submitGuess()`: change `room.status = "round_ended"` to `room.status = "results"`
- In `revealWord()`: change `room.status = "round_ended"` to `room.status = "results"`
- In `toRoomSnapshot()`: change `room.status === "round_ended"` check to `room.status === "results"`
- Add `playAgain(code, participantId)` function:
  - Look up room, return 404 if not found
  - Validate participantId is in room, return 404 if not
  - Set `room.status = "lobby"`, `room.drawerId = null`, `room.secretWord = null`
  - Set `room.strokes = []`, `room.clearVersion = 0`, `room.guesses = []`, `room.scores = new Map()`
  - Idempotent: if already `"lobby"`, return success with no changes
  - Save and return cloned room

### Step 3: Backend Schemas (schemas.ts)

Add `playAgainSchema`:
```typescript
export const playAgainSchema = z.object({
  participantId: z.string()
});
```

### Step 4: Backend Routes (rooms.ts)

Add route handler for `POST /:code/play-again`:
```typescript
router.post("/:code/play-again", (request, response, next) => {
  try {
    const { code } = roomCodeParamsSchema.parse(request.params);
    const { participantId } = playAgainSchema.parse(request.body);
    const result = playAgain(code.toUpperCase(), participantId);
    if (!result.ok) throw new HttpError(result.status, result.error);
    response.json({ room: toRoomSnapshot(result.room, participantId) });
  } catch (error) {
    next(error);
  }
});
```

### Step 5: Backend Tests

Write tests for:
- `playAgain()` resets room to lobby with all players preserved
- `playAgain()` clears all round data (word, strokes, guesses, scores)
- `playAgain()` is idempotent (calling twice is safe)
- Non-participant cannot trigger play again
- After restart, host can start a new game
- Guess submission rejected in `"results"` status
- Stroke submission rejected in `"results"` status

### Step 6: Frontend API Client (api.ts)

- Change `RoomSnapshot.status` type: replace `"round_ended"` with `"results"`
- Add `playAgain(code: string, participantId: string)` API function

### Step 7: Frontend RoomStore (roomStore.ts)

Add `playAgain()` method:
```typescript
async playAgain() {
  if (!this.state.room || !this.state.participantId) return;
  const response = await this.withLoading(() =>
    api.playAgain(this.state.room.code, this.state.participantId!)
  );
  this.setRoomSnapshot(response.room);
}
```

### Step 8: Frontend GamePage Integration

Update `GamePage.tsx`:
- Change `isRoundEnded` from `room.status === "round_ended"` to `room.status === "results"`
- Change "Round Ended" status display to "Round Over" or "Results"
- Add "Play Again" button visible to all players when status is `"results"`
- Wire "Play Again" button to `roomStore.playAgain()`
- Navigation to lobby happens automatically via existing `if (room.status === "lobby")` check in the polling effect

### Step 9: Frontend Two-Browser Manual Testing

- Open two browser sessions in the same room
- Play a full round (draw + guess)
- Verify both sessions see results screen (word, scores, guess history)
- Click "Play Again" from one session
- Verify both sessions land in lobby with same players
- Verify all round data is cleared (no scores, no guesses, no word)
- Host can start a new game
- Verify that during results phase, no guesses or strokes can be submitted
