# API Contracts: Game Start and Drawer Flow

## GET /rooms/:code

Fetches the current state of the room. Crucial for polling.

- **Query Parameters**:
  - `participantId` (string, optional): The ID of the user requesting the state. Used to determine what payload data is visible.

- **Response `200 OK`**:
  ```json
  {
    "room": {
      "code": "ABCD",
      "status": "playing",
      "hostId": "uuid-1",
      "secretWord": "rocket", // ONLY if participantId matches the drawer's ID
      "participants": [
        { "id": "uuid-1", "name": "Alice", "role": "drawer", "joinedAt": "..." },
        { "id": "uuid-2", "name": "Bob", "role": "guesser", "joinedAt": "..." }
      ]
    }
  }
  ```
  - *If `participantId` belongs to a guesser, `secretWord` MUST be `null`.*

## POST /rooms/:code/join

Attempts to join an existing room.

- **Request Body**:
  ```json
  {
    "playerName": "Bob" // Will be trimmed. Fails with 400 if empty.
  }
  ```

- **Responses**:
  - `200 OK`: Joined successfully. Returns `RoomSnapshot`.
  - `400 Bad Request`: Validation failure (e.g., "Name cannot be empty or whitespace").
  - `403 Forbidden`: Room status is already `"playing"` or `"results"`.
  - `404 Not Found`: Room code does not exist.
