# Quickstart: Verify 003 Round Draw, Guess, and Score

## Prerequisites

- Features `001` and `002` implemented (lobby, start, drawer, secret word).
- Two browsers on game screen (`/game`).

## Manual checklist

1. **Scores at 0**: After round start, scoreboard shows 0 for all players.
2. **Drawer draws**: Host draws on canvas; strokes appear immediately on host screen.
3. **Guesser sync**: Guest sees drawing update within ~2s without refresh.
4. **Clear**: Host clears canvas; guest sees empty canvas on next poll.
5. **Empty guess**: Guest submits whitespace — rejected with message, not in history.
6. **Correct guess**: Guest submits case variant of word — history shows correct; score +100.
7. **Incorrect guess**: Wrong word — history shows incorrect; score unchanged.
8. **Drawer cannot guess**: Host has no guess submit (disabled/hidden).
9. **No word leak**: Guest never sees secret word in history or UI.

## Automated tests

```bash
cd backend && npm test
```

## Key files

| Area | Path |
|------|------|
| Guess logic | `backend/src/services/guessLogic.ts` |
| Game state | `backend/src/services/roomStore.ts` |
| Canvas UI | `frontend/src/components/DrawingCanvas.tsx` |
| Game page | `frontend/src/pages/GamePage.tsx` |
