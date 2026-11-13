# HTTP Interface Contracts: Rooms API

All API paths are prefixed with `/rooms`. This document defines the request/response payloads, validation rules, and error codes for rooms endpoints.

## Endpoints Overview

- [Create Room (`POST /rooms`)](#1-create-room-post-rooms)
- [Join Room (`POST /rooms/:code/join`)](#2-join-room-post-roomscodejoin)
- [Get Room Status (`GET /rooms/:code`)](#3-get-room-status-get-roomscode)
- [Start Game (`POST /rooms/:code/start`)](#4-start-game-post-roomscodestart)
- [Leave Room (`POST /rooms/:code/leave`)](#5-leave-room-post-roomscodeleave)

---

## Shared Data Types

### `Participant`
```json
{
  "id": "e30e1681-42ab-472d-862d-0b6b0c20141f",
  "name": "Alice",
  "joinedAt": "2026-06-01T12:00:00.000Z",
  "isHost": true
}
```

### `RoomSnapshot`
```json
{
  "code": "A9BC",
  "status": "lobby",
  "participants": [
    {
      "id": "e30e1681-42ab-472d-862d-0b6b0c20141f",
      "name": "Alice",
      "joinedAt": "2026-06-01T12:00:00.000Z",
      "isHost": true
    }
  ],
  "availableWords": ["apple", "banana", "cat"],
  "roles": ["drawer", "guesser"]
}
```

---

## Endpoint Details

### 1. Create Room (`POST /rooms`)
Creates a new game session and designates the creator as the room host.

- **Request Body**:
  ```json
  {
    "playerName": "Alice"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "participantId": "e30e1681-42ab-472d-862d-0b6b0c20141f",
    "room": {
      "code": "A9BC",
      "status": "lobby",
      "participants": [
        {
          "id": "e30e1681-42ab-472d-862d-0b6b0c20141f",
          "name": "Alice",
          "joinedAt": "2026-06-01T12:00:00.000Z",
          "isHost": true
        }
      ],
      "availableWords": ["apple", "banana", "cat"],
      "roles": ["drawer", "guesser"]
    }
  }
  ```
- **Errors**:
  - `400 Bad Request` (Empty name or missing field)
    ```json
    { "message": "Name is required" }
    ```

---

### 2. Join Room (`POST /rooms/:code/join`)
Adds a participant to an existing room's lobby.

- **URL Params**: `code` (4-character alphanumeric string)
- **Request Body**:
  ```json
  {
    "playerName": "Bob"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "participantId": "d54d1982-f8ab-432d-962d-1b6b0c20251f",
    "room": {
      "code": "A9BC",
      "status": "lobby",
      "participants": [
        {
          "id": "e30e1681-42ab-472d-862d-0b6b0c20141f",
          "name": "Alice",
          "joinedAt": "2026-06-01T12:00:00.000Z",
          "isHost": true
        },
        {
          "id": "d54d1982-f8ab-432d-962d-1b6b0c20251f",
          "name": "Bob",
          "joinedAt": "2026-06-01T12:00:05.000Z",
          "isHost": false
        }
      ],
      "availableWords": ["apple", "banana", "cat"],
      "roles": ["drawer", "guesser"]
    }
  }
  ```
- **Errors**:
  - `400 Bad Request` (Empty name or invalid code format)
  - `404 Not Found` (Room code does not exist)
    ```json
    { "message": "Unable to join room" }
    ```

---

### 3. Get Room Status (`GET /rooms/:code`)
Retrieves the current room snapshot. Primarily called via HTTP polling from the client at ~2s intervals.

- **URL Params**: `code` (4-character alphanumeric string)
- **Query Params**: `participantId` (optional, used to verify viewer context)
- **Response**: `200 OK`
  ```json
  {
    "room": {
      "code": "A9BC",
      "status": "lobby",
      "participants": [
        {
          "id": "e30e1681-42ab-472d-862d-0b6b0c20141f",
          "name": "Alice",
          "joinedAt": "2026-06-01T12:00:00.000Z",
          "isHost": true
        }
      ],
      "availableWords": ["apple", "banana", "cat"],
      "roles": ["drawer", "guesser"]
    }
  }
  ```
- **Errors**:
  - `404 Not Found` (Room not found or destroyed)
    ```json
    { "message": "Unable to load room" }
    ```

---

### 4. Start Game (`POST /rooms/:code/start`)
Transitions the room state from `"lobby"` to `"game"`. Restricted to the host.

- **URL Params**: `code` (4-character alphanumeric string)
- **Request Body**:
  ```json
  {
    "participantId": "e30e1681-42ab-472d-862d-0b6b0c20141f"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "status": "game"
  }
  ```
- **Errors**:
  - `400 Bad Request` (Fewer than 2 players in room)
    ```json
    { "message": "At least 2 players are required to start the game" }
    ```
  - `403 Forbidden` (Participant ID does not match host ID)
    ```json
    { "message": "Only the host can start the game" }
    ```
  - `404 Not Found` (Room not found)

---

### 5. Leave Room (`POST /rooms/:code/leave`)
Removes a participant from the room. If the host leaves, the room is deleted/destroyed.

- **URL Params**: `code` (4-character alphanumeric string)
- **Request Body**:
  ```json
  {
    "participantId": "d54d1982-f8ab-432d-962d-1b6b0c20251f"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Left room successfully"
  }
  ```
- **Errors**:
  - `404 Not Found` (Room not found or participant not found)
