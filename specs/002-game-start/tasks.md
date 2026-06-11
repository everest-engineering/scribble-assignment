# Scenario 2 Tasks

- [ ] Trim `playerName` on create and join requests in `backend/src/api/schemas.ts`.
- [ ] Trim stored participant names in `backend/src/services/roomStore.ts`.
- [ ] Add deterministic `chooseWord(code)` in `backend/src/services/roomStore.ts`.
- [ ] Implement `POST /api/rooms/:code/start` in `backend/src/api/rooms.ts`.
- [ ] Add `startGameSchema` validation in `backend/src/api/schemas.ts`.
- [ ] Extend `backend/src/services/roomStore.ts` to set `drawerId`, `secretWord`, and `status`.
- [ ] Update `frontend/src/services/api.ts` with `startGame()`.
- [ ] Update `frontend/src/state/roomStore.ts` with `startGame()` and session updates.
- [ ] Render drawer-specific game view in `frontend/src/pages/GamePage.tsx`.
- [ ] Confirm non-drawers see masked words and drawer sees actual secret.
