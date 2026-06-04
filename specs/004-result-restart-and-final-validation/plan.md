# Plan — Result, Restart & Final Validation

## State Model
- Add `"finished"` to `RoomStatus`
- `toRoomSnapshot` reveals `word` to all participants when status is `"finished"`

## File Changes
| File | Change |
|------|--------|
| `backend/src/services/roomStore.ts` | Add `restartGame()`: host-only, reset to lobby, preserve players, clear scores/drawing/guesses/word |
| `backend/src/api/rooms.ts` | Add `POST /:code/restart` route |
| `frontend/src/services/api.ts` | Add `restartGame()` method |
| `frontend/src/state/roomStore.ts` | Add `restartGame()` method |
| `frontend/src/pages/GamePage.tsx` | Show result card with word when finished, host-only Restart button, navigate to /lobby on restart |

## Data Flow
- Correct guess → server sets status="finished" → polling shows word + scores + guesses to all
- Host clicks Restart → POST /rooms/:code/restart → server resets to lobby, clears round state → client navigates to /lobby
- Auto-poll in lobby shows all players still present
- Host can start a new game → repeat from Group 2
