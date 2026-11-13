# API Contracts: Rooms API

## 1. Create Room
Creates a new room with the host as the first participant.

* **Endpoint**: `POST /rooms`
* **Request Headers**:
  - `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "playerName": "Alice"
  }
  ```
* **Success Response** (`201 Created`):
  ```json
  {
    "participantId": "uuid-string",
    "room": {
      "code": "ABCD",
      "status": "lobby",
      "participants": [
        {
          "id": "uuid-string",
          "name": "Alice",
          "joinedAt": "2026-06-01T12:00:00.000Z"
        }
      ],
      "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
      "roles": ["drawer", "guesser"]
    }
  }
  ```

---

## 2. Join Room
Adds a participant to an existing room.

* **Endpoint**: `POST /rooms/:code/join`
* **URL Params**:
  - `code` (string, required): The 4-character room code.
* **Request Body**:
  ```json
  {
    "playerName": "Bob"
  }
  ```
* **Success Response** (`200 OK`):
  ```json
  {
    "participantId": "uuid-string",
    "room": {
      "code": "ABCD",
      "status": "lobby",
      "participants": [
        {
          "id": "uuid-string",
          "name": "Alice",
          "joinedAt": "2026-06-01T12:00:00.000Z"
        },
        {
          "id": "uuid-string",
          "name": "Bob",
          "joinedAt": "2026-06-01T12:05:00.000Z"
        }
      ],
      "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
      "roles": ["drawer", "guesser"]
    }
  }
  ```
* **Error Response** (`404 Not Found`):
  ```json
  {
    "message": "Unable to join room"
  }
  ```

---

## 3. Fetch Room Details
Retrieves the current state of a room.

* **Endpoint**: `GET /rooms/:code`
* **URL Params**:
  - `code` (string, required): The 4-character room code.
* **Query Params**:
  - `participantId` (string, optional): The ID of the participant viewing the room.
* **Success Response** (`200 OK`):
  ```json
  {
    "room": {
      "code": "ABCD",
      "status": "lobby",
      "participants": [
        {
          "id": "uuid-string",
          "name": "Alice",
          "joinedAt": "2026-06-01T12:00:00.000Z"
        }
      ],
      "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
      "roles": ["drawer", "guesser"]
    }
  }
  ```
* **Error Response** (`404 Not Found`):
  ```json
  {
    "message": "Unable to load room"
  }
  ```
