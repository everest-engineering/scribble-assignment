# Plan: Result, Restart & Final Validation

## Files to Modify

- `backend/src/services/roomStore.ts` — `submitGuess()` sets status to finished; `restartGame()` clears round state
- `backend/src/api/schemas.ts` — Add restartGame schema
- `backend/src/api/rooms.ts` — Add restart endpoint
- `frontend/src/services/api.ts` — Add restartGame method
- `frontend/src/state/roomStore.ts` — Add restartGame action
- `frontend/src/pages/GamePage.tsx` — Results view with word, scores, guess history; restart button for host

## Implementation Order

1. Implement finish state in submitGuess on correct answer
2. Implement restartGame with round data reset
3. Add restart API endpoint
4. Build results view in GamePage
5. Add restart button for host
6. Add polling redirect when status becomes lobby
7. Add restart tests
8. Run tests and verify

## Key Design Decision

Restart preserves participants but clears all round-specific state including scores. A new game starts fresh with all players still in the room.
