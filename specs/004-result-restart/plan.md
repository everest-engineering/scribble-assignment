# Plan — Result, Restart & Final Validation

## Data Flow

```
[All guessers correct → status → "finished"]
  → Poll detects status === "finished"
  → ResultPanel shows: secretWord (now visible to all), final scores, guess history

[Host clicks Restart]
  → POST /rooms/:code/restart { participantId }
  ← 200 { room: RoomSnapshot { status: "lobby", drawerId: null, ... } }
  → Navigate to /lobby
  → Polling resumes in lobby
```

---

## File-Level Plan

| Step | File | Change |
|------|------|--------|
| 4.1 | `backend/src/services/roomStore.ts` | Auto-transition to `"finished"` when all guessers have guessed correctly; add `restartGame()` |
| 4.2 | `backend/src/api/rooms.ts` | Add `POST /rooms/:code/restart` endpoint |
| 4.3 | `frontend/src/services/api.ts` | Add `api.restartGame()` |
| 4.4 | `frontend/src/state/roomStore.ts` | Add `restartGame()` method |
| 4.5 | `frontend/src/components/ResultPanel.tsx` | Render final word, scores, guess history |
| 4.6 | `frontend/src/pages/GamePage.tsx` | Detect `"finished"` status; show ResultPanel; show Restart button for host |
| 4.7 | `frontend/src/pages/LobbyPage.tsx` | After restart, lobby shows preserved players, Start Game works again |

---

## Testing Strategy

- **Backend unit tests**: Test `submitGuess()` (trim, case-insensitive, scoring, duplicate correct), `restartGame()` (state reset, players preserved).
- **Frontend unit tests**: Test API methods for correct request URLs and bodies.
- **Manual tests**: Two browser tabs — create room, join, verify polling, start game, draw, guess, see result, restart.

## Risks

| Risk | Mitigation |
|------|------------|
| Canvas drawing data could grow large | Store as array of strokes; each stroke is array of points |
| Polling delay (~2s) creates stale state | Acceptable per spec; no real-time requirement |
| Race condition: host clicks start while guesser polls | Atomic backend operations; frontend re-fetches after navigates |
| Multiple correct guesses by same player | Track `hasGuessedCorrectly` per round per participant; only first correct scores 100 |
