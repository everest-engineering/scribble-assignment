# API Contracts: Room Setup & Lobby

This document defines the HTTP endpoints, validation schemas, and expected request/response payloads for the game server.

## Endpoints

### 1. Create Game Room
Create a new game room and make the creator the host.

- **URL**: `/rooms`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "playerName": "Alice"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "participantId": "3587e6fa-90f7-4185-93df-83445831ea23",
    "room": {
      "code": "ABCD",
      "status": "lobby",
      "hostId": "3587e6fa-90f7-4185-93df-83445831ea23",
      "participants": [
        {
          "id": "3587e6fa-90f7-4185-93df-83445831ea23",
          "name": "Alice",
          "joinedAt": "2026-06-04T13:30:00.000Z"
        }
      ],
      "availableWords": ["apple", "banana", "cat"],
      "roles": ["drawer", "guesser"]
    }
  }
  ```

---

### 2. Join Game Room
Join an existing game room by its code.

- **URL**: `/rooms/:code/join`
- **Method**: `POST`
- **URL Parameters**:
  - `code`: 4-character alphanumeric room code (case-insensitive)
- **Request Body**:
  ```json
  {
    "playerName": "Bob"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "participantId": "73db4b86-4e55-4fa8-b223-28f01bde0bb2",
    "room": {
      "code": "ABCD",
      "status": "lobby",
      "hostId": "3587e6fa-90f7-4185-93df-83445831ea23",
      "participants": [
        {
          "id": "3587e6fa-90f7-4185-93df-83445831ea23",
          "name": "Alice",
          "joinedAt": "2026-06-04T13:30:00.000Z"
        },
        {
          "id": "73db4b86-4e55-4fa8-b223-28f01bde0bb2",
          "name": "Bob",
          "joinedAt": "2026-06-04T13:32:00.000Z"
        }
      ],
      "availableWords": ["apple", "banana", "cat"],
      "roles": ["drawer", "guesser"]
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request` (e.g., username already taken, or empty name)
    ```json
    { "message": "Player name already taken in this room" }
    ```
  - `404 Not Found` (e.g., room code does not exist)
    ```json
    { "message": "Unable to join room" }
    ```

---

### 3. Get Room Details
Retrieve the current snapshot of a room for polling.

- **URL**: `/rooms/:code`
- **Method**: `GET`
- **URL Parameters**:
  - `code`: 4-character alphanumeric room code
- **Query Parameters**:
  - `participantId` (optional): The ID of the participant requesting the updates.
- **Response**: `200 OK`
  ```json
  {
    "room": {
      "code": "ABCD",
      "status": "lobby",
      "hostId": "3587e6fa-90f7-4185-93df-83445831ea23",
      "participants": [
        {
          "id": "3587e6fa-90f7-4185-93df-83445831ea23",
          "name": "Alice",
          "joinedAt": "2026-06-04T13:30:00.000Z"
        }
      ],
      "availableWords": ["apple", "banana", "cat"],
      "roles": ["drawer", "guesser"]
    }
  }
  ```
- **Error Responses**:
  - `404 Not Found` (e.g., room code does not exist)
    ```json
    { "message": "Unable to load room" }
    ```

---

### 4. Start Game
Start the game from the lobby. Only the Host can call this.

- **URL**: `/rooms/:code/start`
- **Method**: `POST`
- **URL Parameters**:
  - `code`: 4-character alphanumeric room code
- **Query Parameters**:
  - `participantId` (required): The ID of the participant initiating the request. Must match the room's `hostId`.
- **Response**: `200 OK`
  ```json
  {
    "room": {
      "code": "ABCD",
      "status": "active",
      "hostId": "3587e6fa-90f7-4185-93df-83445831ea23",
      "participants": [
        {
          "id": "3587e6fa-90f7-4185-93df-83445831ea23",
          "name": "Alice",
          "joinedAt": "2026-06-04T13:30:00.000Z"
        },
        {
          "id": "73db4b86-4e55-4fa8-b223-28f01bde0bb2",
          "name": "Bob",
          "joinedAt": "2026-06-04T13:32:00.000Z"
        }
      ],
      "availableWords": ["apple", "banana", "cat"],
      "roles": ["drawer", "guesser"]
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request` (e.g., less than 2 players in lobby)
    ```json
    { "message": "Cannot start game: at least 2 players are required" }
    ```
  - `403 Forbidden` (e.g., user is not the host)
    ```json
    { "message": "Only the host can start the game" }
    ```
  - `404 Not Found` (e.g., room does not exist)
    ```json
    { "message": "Room not found" }
    ```
