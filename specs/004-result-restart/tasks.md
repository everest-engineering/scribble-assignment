# Scenario 4 Tasks

- [ ] Add `restartGameSchema` in `backend/src/api/schemas.ts`.
- [ ] Create `POST /api/rooms/:code/restart` in `backend/src/api/rooms.ts`.
- [ ] Implement `restartGame(code, participantId)` in `backend/src/services/roomStore.ts`.
- [ ] Ensure `restartGame` clears `drawerId`, `secretWord`, `guesses`, and `roundWon`, but retains `participants[]`.
- [ ] Update `frontend/src/services/api.ts` with `restartRoom()`.
- [ ] Add `restartGame()` to `frontend/src/state/roomStore.ts`.
- [ ] Render host restart UI in `frontend/src/components/ResultPanel.tsx`.
- [ ] Verify `GamePage` and `LobbyPage` navigate or refresh cleanly after restart.
- [ ] Add a host-only restart validation check to prevent non-hosts from restarting.
