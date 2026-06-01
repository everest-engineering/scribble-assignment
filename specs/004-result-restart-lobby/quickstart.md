# Quickstart: Verify 004 Result and Restart

## Prerequisites

- Features 001–003 implemented (lobby, start, draw, guess, score).

## Manual checklist (two browsers)

1. **End round**: Guest submits correct guess → both auto-navigate to `/results` within ~2s.
2. **Result content**: Both see same revealed word, session scores, full guess list.
3. **No more guesses**: Further guess attempts rejected after round end.
4. **Late join**: Third browser joins with code during result → sees same summary.
5. **Restart**: Host clicks restart → both auto-navigate to `/lobby` within ~2s; scores 0; no word/canvas/history in lobby.
6. **Play again**: Host can start new game with ≥2 players.
7. **Non-host restart**: Guest cannot restart (message or disabled control).

## Automated tests

```bash
cd backend && npm test
```

## Key files

| Area | Path |
|------|------|
| End round | `backend/src/services/roomStore.ts` (`submitGuess` / `endRound`) |
| Restart | `backend/src/services/roomStore.ts` (`restartGame`) |
| Result UI | `frontend/src/pages/ResultPage.tsx` |
