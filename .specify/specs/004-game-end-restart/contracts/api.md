# API Contract: Game End and Restart

## New Endpoints

### POST /api/rooms/:code/end
Ends the current round manually. Available only to the host.

- **Headers**:
  - `x-participant-id`: The ID of the participant (must be host)
- **Response**:
  - `200 OK`: `{ "success": true }`
  - `400 Bad Request`: If game already ended or not active.
  - `403 Forbidden`: If not host.

### POST /api/rooms/:code/restart
Restarts the game to the lobby state. Available only to the host.

- **Headers**:
  - `x-participant-id`: The ID of the participant (must be host)
- **Response**:
  - `200 OK`: `{ "success": true }`
  - `400 Bad Request`: If game is not in 'ended' state.
  - `403 Forbidden`: If not host.

## Modified Behavior

### GET /api/rooms/:code
- **Behavior**: If `status === 'ended'`, `currentWord` is revealed to all participants.

### POST /api/rooms/:code/guess
- **Behavior**: Server checks for automatic completion after processing a correct guess. 
- **Automatic End Condition**: All active guessers in the room have a `isCorrect: true` entry in the current round's history.
- **Effect**: Room status transitions to `ended`.
