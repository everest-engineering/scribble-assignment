# API Contracts: Game Result and Restart

## `POST /api/rooms/:roomId/restart`
Triggers the game to restart, clearing round state and returning the room to the `LOBBY` state.

**Request Header**:
- `X-Player-Id`: string (Must be the host's ID)

**Request Body**: None

**Response**:
- `200 OK`: Restart successful.
- `401 Unauthorized`: Provided player ID is not the host.
- `404 Not Found`: Room does not exist.

## `POST /api/rooms/:roomId/end-round`
*Optional explicit endpoint. Alternatively, the backend could automatically transition state when the round condition is met (e.g. time expires, or all guessed).*
If an explicit call is used to end the round early or debug:
- `X-Player-Id`: string (Must be the host's ID)

**Response**:
- `200 OK`
- `401 Unauthorized`
- `404 Not Found`

## Room State Updates
When clients poll `GET /api/rooms/:roomId`, the payload is the Room object.
The `gameState` field will return `RESULT` or `LOBBY` appropriately.
When `gameState === 'RESULT'`, `currentWord` will be populated even for non-drawers.
When `gameState === 'LOBBY'`, `currentWord` will be null, and `scores`/`guesses` will be cleared.
