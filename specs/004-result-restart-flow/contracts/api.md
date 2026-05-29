# API Contracts: Result, Restart & Final Validation

## New Endpoints

### POST /rooms/:code/finish
Moves the room from `playing` to `results`.

- **Request Body**: `{ "participantId": "string" }`
- **Responses**:
  - `200 OK`: Round finished.
  - `403 Forbidden`: Requester is not the host.
  - `404 Not Found`: Room not found.

### POST /rooms/:code/restart
Moves the room from `results` to `lobby`.

- **Request Body**: `{ "participantId": "string" }`
- **Responses**:
  - `200 OK`: Game restarted.
  - `403 Forbidden`: Requester is not the host.
  - `404 Not Found`: Room not found.

## Updated Endpoints

### GET /rooms/:code
- **Behavior**: Revealed `secretWord` if `room.status === "results"`.
- **Validation**: Rejects guesses (already exists in store logic) if status is not `playing`.
