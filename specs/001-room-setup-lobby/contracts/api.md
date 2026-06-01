# API Contracts: Room Setup & Lobby

## Create Room
- **Endpoint**: `POST /api/rooms`
- **Description**: Creates a new room and assigns the requester as the host.
- **Request Body**:
  ```json
  {
    "username": "string (min 1, max 20)"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "code": "string (6 chars)",
    "players": [{"username": "string", "isHost": true}],
    "status": "lobby"
  }
  ```

## Join Room
- **Endpoint**: `POST /api/rooms/:code/join`
- **Description**: Adds a player to an existing room.
- **Path Parameter**: `code` (string, 6 chars)
- **Request Body**:
  ```json
  {
    "username": "string (min 1, max 20)"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "code": "string",
    "players": [{"username": "string", "isHost": boolean}, ...],
    "status": "lobby"
  }
  ```
- **Errors**:
  - `404 Not Found`: Room does not exist.
  - `409 Conflict`: Username already taken, or room is full (20 players).
  - `400 Bad Request`: Validation failure.

## Get Room State (Polling)
- **Endpoint**: `GET /api/rooms/:code`
- **Description**: Retrieves the current state of the room. Updates `lastActivityAt`.
- **Path Parameter**: `code` (string, 6 chars)
- **Response (200 OK)**:
  ```json
  {
    "code": "string",
    "players": [{"username": "string", "isHost": boolean}, ...],
    "status": "string"
  }
  ```
- **Errors**:
  - `404 Not Found`: Room does not exist.

## Leave Room
- **Endpoint**: `POST /api/rooms/:code/leave`
- **Description**: Removes a player from the room.
- **Path Parameter**: `code` (string, 6 chars)
- **Request Body**:
  ```json
  {
    "username": "string"
  }
  ```
- **Response (200 OK)**: `{ "success": true }`
