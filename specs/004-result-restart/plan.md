# Plan — Scenario 4: Result, Restart & Final Validation

## State Changes
- Room model: status transitions `playing` → `result` (on correct guess), `result` → `lobby` (on restart)
- Restart: clears `drawerId`, `secretWord`, `guesses`, `scores`, `canvasData`; preserves `participants` and `code`

## File-Level Changes

### Backend
| File | Changes |
|------|---------|
| `backend/src/services/roomStore.ts` | In `submitGuess`: set `status="result"` on correct guess; implement `restartGame` (preserves participants) |
| `backend/src/api/rooms.ts` | Add `POST /:code/restart` |

### Frontend
| File | Changes |
|------|---------|
| `frontend/src/pages/GamePage.tsx` | Result view showing word, scores, guess history; host restart button |
| `frontend/src/pages/LobbyPage.tsx` | Navigate back on restart (status=lobby) |
| `frontend/src/state/roomStore.ts` | Add `restartGame` action |

## Data Flow
```
Correct guess → status=result → All players see result view → Host clicks "Play Again" → POST /restart → status=lobby → Navigate to /lobby
```
