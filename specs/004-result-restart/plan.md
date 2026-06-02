# Plan: Result, Restart & Final Validation

## State Model Changes

No new fields. `revealedWord` added to snapshot during `result` status only.

Restart clears: `drawerId`, `secretWord`, `strokes`, `guesses`; resets `scores` to `{}`; sets `status = "lobby"`.

## Backend Changes

### `roomStore.ts`
- `restartGame(code, participantId)`: host + result only; clear round state; preserve participants
- `toRoomSnapshot`: include `revealedWord` when status is `result` (all viewers)

### `rooms.ts`
- `POST /:code/restart` → restartGame → return snapshot

## Frontend Changes

### `ResultPanel.tsx`
- Show revealedWord, final scores table, guess history list
- Host-only "Restart Game" button

### `GamePage.tsx`
- Show ResultPanel when status is `result`
- Disable canvas and guess form during result
- Redirect to `/lobby` when poll detects status `lobby`
- Poll during result state

### `roomStore.ts` / `api.ts`
- `restartGame(code, participantId)` method

## Data Flow

```
Correct guess → status=result → poll → ResultPanel shows word/scores/history
Host restart → POST /rooms/:code/restart → status=lobby, round cleared
Poll → status=lobby → redirect /lobby
```

## Final Validation Checklist

1. Two browsers: full game flow
2. `npm run build` in backend and frontend
3. `node .github/scripts/pre-evaluation-check.mjs`
4. Write `reflection.md`

## Testing

- Unit: restartGame clears round state, preserves participants
- Unit: revealedWord in snapshot during result
- Manual: full E2E two-browser test
