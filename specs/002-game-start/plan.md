# Scenario 2 Plan

## Work Plan
1. Update `backend/src/api/schemas.ts` to trim `playerName` and validate `participantId` for start.
2. Confirm `backend/src/services/roomStore.ts` enforces trimmed participant names on join.
3. Implement `startGame()` in `backend/src/services/roomStore.ts` to:
   - require `room.hostId === participantId`
   - set `drawerId` to the host
   - set `status` to `active`
   - choose a deterministic secret word from `room.code`
4. Extend `backend/src/services/roomStore.ts` `toRoomSnapshot()` to return masked words for non-drawers.
5. Add `api.startGame()` to `frontend/src/services/api.ts`.
6. Ensure `frontend/src/pages/GamePage.tsx` renders the drawer word only for the drawer and hides `GuessForm` when `isDrawer`.

## APIs
- `api.startGame(code, participantId)` → `RoomSessionResponse`
- `api.fetchRoom(code, participantId)` returns a snapshot with `word` and `drawerId`

## Verification
- Create a room, join a second player, start the game as host, and verify drawer user sees the word while guesser sees placeholders.
- Confirm both users see trimmed names and only the host can start the game.
