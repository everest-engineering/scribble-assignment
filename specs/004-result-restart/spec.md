# Scenario 4: Results and Restart

## Objective
Provide a shared results screen and a host-controlled restart action that clears game state while keeping the connected player list intact.

## Acceptance Criteria
- The results panel displays current scores and recent guesses.
- The host sees a `Restart Game` action in the shared results panel.
- Restarting the game clears `drawerId`, `secretWord`, `guesses`, and round-specific state.
- Restart preserves `participants[]` and `scores{}` if scoring carries over, or resets appropriately if only round state is cleared.
- After restart, the room returns to `status: lobby` and players remain connected.

## Contracts
- Backend contract: `POST /api/rooms/:code/restart` accepts `{ participantId }` and returns updated room snapshot.
- Backend contract: room snapshot after restart includes player list and `status: lobby`.
- Frontend contract: `ResultPanel` triggers restart through `roomStore.restartGame()`.
- Frontend contract: `GamePage` and `LobbyPage` update according to the refreshed snapshot.

## Files
- `frontend/src/components/ResultPanel.tsx`
- `frontend/src/pages/GamePage.tsx`
- `frontend/src/pages/LobbyPage.tsx`
- `frontend/src/services/api.ts`
- `frontend/src/state/roomStore.ts`
- `backend/src/services/roomStore.ts`
- `backend/src/api/rooms.ts`
- `backend/src/api/schemas.ts`
- `backend/src/models/game.ts`
