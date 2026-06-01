# Plan — Scenario 4 Results And Restart

## Files To Update

Backend:
- backend/src/models/game.ts
- backend/src/services/roomStore.ts
- backend/src/api/schemas.ts
- backend/src/api/rooms.ts

Frontend:
- frontend/src/pages/GamePage.tsx (or a new ResultPage)
- frontend/src/pages/LobbyPage.tsx
- frontend/src/state/roomStore.ts
- frontend/src/services/api.ts
- frontend/src/styles/app.css

## Backend Changes

- Add a "results" status to the room status type alongside "lobby" and "playing".
- Add a restartGame function that:
  - Checks the requester is the host. Reject non-host attempts.
  - Clears the current word, guesses, scores, and roles.
  - Resets all participant roles to "guesser".
  - Sets room status back to "lobby".
  - Returns the updated room.
- Add a POST /:code/restart route that accepts participantId and calls restartGame.
- When returning room data in "results" status, always send the correct word to all viewers (not hidden like during gameplay).
- Make sure guesses and scores from the finished round are included in the snapshot so the result screen can display them.

## Frontend Changes

- Update the RoomSnapshot type to include the "results" status.
- In GamePage, detect when room status changes to "results". Switch to a result view showing:
  - The correct word (visible to all).
  - Final scores for each player.
  - Full guess history from the round.
- Add a "Restart Game" button that only appears if the current player is the host.
- Wire the restart button to call a new restartGame method on the room store.
- On successful restart, navigate everyone back to the lobby page.
- The existing 2s polling in both LobbyPage and GamePage keeps data in sync during results and after restart.

## Data Flow

1. The round ends somehow (future scenario). Backend sets room status to "results".
2. Players poll room data and see status = "results". Frontend shows the result screen.
3. All players see the correct word, final scores, and full guess history.
4. The host clicks "Restart Game".
5. Frontend sends POST /rooms/:code/restart with the host's participant ID.
6. Backend clears round data and sets status back to "lobby".
7. Frontend navigates to the lobby page.
8. All players poll and see the lobby with players preserved.

## Testing

Backend:
- Restart clears the current word, guesses, scores, and roles.
- All players remain in the room after restart.
- Non-host players cannot restart. Returns an error.
- Room code stays the same after restart.
- Restart works even if called a second time.
- Room status changes to "results" when the round ends (once end-round logic exists).

Frontend:
- Result screen shows the correct word to all players.
- Result screen shows final scores and guess history.
- Only the host sees the restart button.
- Non-host players cannot restart.
- Restart navigates to lobby with all players still in the room.
