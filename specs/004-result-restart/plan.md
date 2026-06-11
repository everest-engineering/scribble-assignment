# Scenario 4 Plan

## Work Plan
1. Verify `backend/src/services/roomStore.ts` `restartGame()` clears only game-specific fields.
2. Ensure `backend/src/services/roomStore.ts` preserves `participants[]` and optionally `scores` according to the chosen restart logic.
3. Add `restartGameSchema` validation in `backend/src/api/schemas.ts`.
4. Add `POST /api/rooms/:code/restart` in `backend/src/api/rooms.ts`.
5. Add `api.restartRoom()` to `frontend/src/services/api.ts`.
6. Add `restartGame()` to `frontend/src/state/roomStore.ts`.
7. Update `frontend/src/components/ResultPanel.tsx` to show scores and display a `Restart Game` button for the host.
8. Ensure `frontend/src/pages/GamePage.tsx` and `frontend/src/pages/LobbyPage.tsx` respond to the restarted snapshot.

## Verification
- Start a round, score at least one guess, then restart as the host.
- Confirm the game returns to `lobby` state with the same connected participants.
- Confirm the result panel and lobby UI update immediately after restart.
- Confirm the host-only action is available only when `room.hostId === participantId`.
