# Data Model: Game Result and Restart

## Entities

### `Room`
- `roomId` (string)
- `gameState` (`'LOBBY' | 'PLAYING' | 'RESULT'`) - Note the new `RESULT` state.
- `hostId` (string)
- `players` (Array of `Player`)
- `currentWord` (string | null) - The word being drawn, revealed to everyone in `RESULT` state.
- `scores` (Record<string, number>) - Maps `playerId` to score.
- `guesses` (Array of `Guess`) - Chat history and guess attempts.
- `drawingData` (Array of `DrawAction`) - Current canvas state.

## State Transitions

- **End of Round**: `PLAYING` -> `RESULT`. When time expires or all players guess correctly (or host manually ends round), the room transitions to `RESULT`.
- **Restart Game**: `RESULT` -> `LOBBY`. Host clicks restart. The backend clears `currentWord`, `scores`, `guesses`, `drawingData`, and sets state to `LOBBY`.

## Validation Rules
- Only the player whose ID matches `hostId` can trigger the `restartGame` action.
- The `restartGame` action is typically valid only when `gameState` is `RESULT`, but technically could be allowed from `PLAYING` if the host wants to abort.

## Disconnect Handling
- If `hostId` leaves the room, the backend reassigns `hostId` to another player. If no players remain, the room is deleted.
- If a normal player leaves, they are removed from the `players` array.
