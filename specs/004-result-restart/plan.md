# Implementation Plan — Feature Group 4

## State Model Changes

**Backend (`game.ts`):**
- Round status "results" transition on correct guess
- All round data preserved in result state

**Backend (`roomStore.ts`):**
- `restartGame(code, participantId)` — reset round state, preserve players, set status to lobby
- Reset: clear guesses, scores, drawingData, currentRound

## API Changes

- `POST /rooms/:code/restart` — new endpoint

## Data Flow

1. A player guesses correctly -> backend sets round status to "results"
2. All players poll -> detect status "results" -> show result UI
3. Host clicks "Restart" -> POST /restart -> status back to "lobby"
4. All players poll -> detect "lobby" -> navigate to /lobby

## File-Level Changes

| File | Change |
|------|--------|
| `backend/src/services/roomStore.ts` | restartGame logic, result state |
| `backend/src/api/rooms.ts` | Add POST /:code/restart route |
| `backend/src/api/schemas.ts` | Add restart schema |
| `frontend/src/services/api.ts` | Add restartGame method |
| `frontend/src/state/roomStore.ts` | Add restart, result state handling |
| `frontend/src/pages/GamePage.tsx` | Result state display, restart button |
| `frontend/src/components/ResultPanel.tsx` | Show word, scores, guess history |
| `frontend/src/pages/LobbyPage.tsx` | Preserved players on restart |

## Polling Strategy

- Continue polling on GamePage during results
- After restart, polling on GamePage detects "lobby" -> frontend navigates to /lobby

## Validation Strategy

- Test result state visible to all players (host + non-host)
- Test restart preserves participants
- Test restart clears round data
- Test multiple restart cycles
