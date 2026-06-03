# Quickstart: Game Result and Restart

## Backend Implementation
1. Add `RESULT` to the `GameState` enum/union in the data model.
2. In `RoomService`, add a method `restartGame()` that resets `gameState = 'LOBBY'`, sets `currentWord = null`, and clears `scores`, `guesses`, `drawingData`.
3. Add an Express API route `POST /api/rooms/:roomId/restart` that calls `restartGame()`. Ensure it checks if the request is from the host.
4. When a round finishes (end-of-round condition), transition `gameState` to `RESULT`.
5. Ensure `currentWord` is serialized and sent to all clients when `gameState === 'RESULT'`, even if they are not the drawer.

## Frontend Implementation
1. Update frontend React states and `roomStore` to handle `RESULT` state.
2. Create a new component `ResultScreen` that renders:
   - The correct word (`currentWord`).
   - The player leaderboard sorted by scores.
   - The chat/guess history.
   - A "Restart Game" button (only visible/enabled for the host).
3. Wire the "Restart Game" button to call `POST /api/rooms/:roomId/restart`.
4. Ensure the main `GameRoom` component switches correctly between `Lobby`, `Canvas/Playing`, and `ResultScreen` based on `gameState`.
5. Check that HTTP polling naturally transitions everyone to `LOBBY` and `RESULT` simultaneously.
