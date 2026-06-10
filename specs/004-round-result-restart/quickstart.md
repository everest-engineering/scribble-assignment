# Quickstart: Round Result & Restart

## What This Feature Does

1. When a round ends (all guessers guess correctly), the game transitions to a **results** phase
2. Players see the correct word, final scores, and full guess history
3. The host can click a **Restart** button to return everyone to the lobby
4. All players remain in the room; all round data is cleared for a fresh start

## Files to Modify

### Backend

| File | Change |
|------|--------|
| `backend/src/models/game.ts` | Add `"results"` to `RoomStatus` type |
| `backend/src/services/roomStore.ts` | Add `endRound()` auto-transition in `submitGuess()`; add `restartGame()`; update `toRoomSnapshot()` |
| `backend/src/api/rooms.ts` | Add `POST /:code/restart` route handler |
| `backend/src/api/schemas.ts` | Add `restartGameSchema` |
| `backend/src/api/rooms.test.ts` | Add tests for restart endpoint |
| `backend/src/services/roomStore.test.ts` | Add tests for round-end transition and restart |

### Frontend

| File | Change |
|------|--------|
| `frontend/src/services/api.ts` | Update `RoomSnapshot.status` union; add `restartRoom()` to API object |
| `frontend/src/state/roomStore.ts` | Add `restartRoom()` action |
| `frontend/src/pages/GamePage.tsx` | Navigate to `/results` when `status === "results"` |
| `frontend/src/pages/ResultsPage.tsx` | **NEW**: Results screen with correct word, scores, guess history, restart button |
| `frontend/src/routes/index.tsx` | Add `/results` route |
| `frontend/src/pages/LobbyPage.tsx` | Handle navigation from results → lobby when poll shows `status === "lobby"` |

## Test Strategy

1. **Backend unit tests** (`roomStore.test.ts`):
   - `submitGuess` with last guesser scoring 100 → room status becomes `"results"`
   - `restartGame` from results → lobby with preserved participants, cleared round data
   - `restartGame` rejected for non-host
   - `restartGame` rejected if room not in `"results"` status
   
2. **Backend integration tests** (`rooms.test.ts`):
   - `POST /rooms/:code/restart` happy path
   - `POST /rooms/:code/restart` 403 non-host
   - `POST /rooms/:code/restart` 400 wrong status

3. **Frontend**: Update `GamePage.test.tsx` for new navigation behavior

## Running

```bash
# Backend
cd backend && npm run dev    # Development
cd backend && npm test       # Tests

# Frontend
cd frontend && npm run dev   # Development
cd frontend && npm test      # Tests
```
