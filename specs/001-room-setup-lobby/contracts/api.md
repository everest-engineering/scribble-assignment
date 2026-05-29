# API Contracts: Room Setup and Lobby

## New Endpoints

### POST /rooms/:code/start
Transitions the room from `lobby` to `playing`.

- **Request Body**:
  ```json
  {
    "participantId": "string"
  }
  ```
- **Responses**:
  - `200 OK`: Success. Returns `RoomSnapshot`.
  - `403 Forbidden`: Requester is not the host or insufficient players.
  - `404 Not Found`: Room code invalid.

## Updated Endpoints

### POST /rooms
Updated to initialize host and status.
- **Request Body**: `{ "playerName": "string" }`
- **Response**: `{ "participantId": "string", "room": RoomSnapshot }`

### POST /rooms/:code/join
Updated to return `hostId` in the snapshot.
- **Request Body**: `{ "playerName": "string" }`
- **Response**: `{ "participantId": "string", "room": RoomSnapshot }`

### GET /rooms/:code
Used for polling.
- **Query Params**: `participantId` (optional)
- **Response**: `{ "room": RoomSnapshot }`
