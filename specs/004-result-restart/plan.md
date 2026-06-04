# Plan — Result, Restart & Final Validation

## State Changes
- Room.status = "lobby" after restart
- Round state (drawerId, secretWord, guesses, scores, drawStrokes) cleared
- Participants array preserved unchanged

## Data Flow
```
POST /rooms/:code/restart { participantId }
  → Backend validates: is host? is not already lobby?
  → Clears drawerId, secretWord, guesses, scores, drawStrokes
  → Sets status = "lobby"
  → Returns updated RoomSnapshot

Frontend polling picks up "lobby" status
  → Navigates to /lobby
  → All round state is gone, participants preserved
```

## Files
- `backend/src/services/roomStore.ts` — Add restartGame, clear drawStrokes
- `backend/src/api/schemas.ts` — Add restartGameSchema
- `backend/src/api/rooms.ts` — Add POST /:code/restart route
- `frontend/src/pages/GamePage.tsx` — Result display, restart button for host
- `frontend/src/components/ResultPanel.tsx` — Show word, scores, guess history
