# API Contracts: Room Setup & Lobby

This document defines the HTTP request/response payloads and status codes for the game room APIs.

## API Base Path
`http://localhost:3001`

---

## 1. Create Room
Creates a new game room with the creator as the initial player (host).

- **Method**: `POST`
- **Path**: `/rooms`
- **Headers**:
  - `Content-Type: application/json`

### Request Body Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "playerName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20
    }
  },
  "required": ["playerName"]
}
```

### Response (201 Created)
```json
{
  "participantId": "3589b251-2ef3-460d-8386-3ad8f325e64e",
  "room": {
    "code": "3x8F2P",
    "status": "lobby",
    "participants": [
      {
        "id": "3589b251-2ef3-460d-8386-3ad8f325e64e",
        "name": "Sketch captain",
        "joinedAt": "2026-06-03T12:00:00.000Z"
      }
    ],
    "availableWords": ["apple", "banana", "cat"],
    "roles": ["drawer", "guesser"],
    "hostId": "3589b251-2ef3-460d-8386-3ad8f325e64e"
  }
}
```

---

## 2. Join Room
Adds a new player to an existing lobby.

- **Method**: `POST`
- **Path**: `/rooms/:code/join`
- **Headers**:
  - `Content-Type: application/json`

### Request Body Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "playerName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20
    }
  },
  "required": ["playerName"]
}
```

### Response (200 OK)
```json
{
  "participantId": "8f82ad90-1cba-4e94-9130-9dfd6e42b260",
  "room": {
    "code": "3x8F2P",
    "status": "lobby",
    "participants": [
      {
        "id": "3589b251-2ef3-460d-8386-3ad8f325e64e",
        "name": "Sketch captain",
        "joinedAt": "2026-06-03T12:00:00.000Z"
      },
      {
        "id": "8f82ad90-1cba-4e94-9130-9dfd6e42b260",
        "name": "Second pencil",
        "joinedAt": "2026-06-03T12:01:00.000Z"
      }
    ],
    "availableWords": ["apple", "banana", "cat"],
    "roles": ["drawer", "guesser"],
    "hostId": "3589b251-2ef3-460d-8386-3ad8f325e64e"
  }
}
```

### Error Responses
- **400 Bad Request**: If the room is full (capacity = 12) or the nickname is already taken in the room.
- **404 Not Found**: If the room code is invalid or does not correspond to an active room.

---

## 3. Fetch/Poll Room State
Retrieves the latest room state. Also serves as a heartbeat mechanism for tracking active players.

- **Method**: `GET`
- **Path**: `/rooms/:code`
- **Query Parameters**:
  - `participantId` (string, optional): The ID of the participant polling. If provided, the server updates their `lastActiveAt` timestamp.

### Response (200 OK)
```json
{
  "room": {
    "code": "3x8F2P",
    "status": "lobby",
    "participants": [
      {
        "id": "3589b251-2ef3-460d-8386-3ad8f325e64e",
        "name": "Sketch captain",
        "joinedAt": "2026-06-03T12:00:00.000Z"
      }
    ],
    "availableWords": ["apple", "banana", "cat"],
    "roles": ["drawer", "guesser"],
    "hostId": "3589b251-2ef3-460d-8386-3ad8f325e64e"
  }
}
```

### Error Responses
- **404 Not Found**: If the room code does not exist.

---

## 4. Start Game
Transitions the room state from lobby to playing. Can only be invoked by the host.

- **Method**: `POST`
- **Path**: `/rooms/:code/start`
- **Headers**:
  - `Content-Type: application/json`

### Request Body Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "participantId": {
      "type": "string"
    }
  },
  "required": ["participantId"]
}
```

### Response (200 OK)
```json
{
  "room": {
    "code": "3x8F2P",
    "status": "playing",
    "participants": [
      {
        "id": "3589b251-2ef3-460d-8386-3ad8f325e64e",
        "name": "Sketch captain",
        "joinedAt": "2026-06-03T12:00:00.000Z"
      },
      {
        "id": "8f82ad90-1cba-4e94-9130-9dfd6e42b260",
        "name": "Second pencil",
        "joinedAt": "2026-06-03T12:01:00.000Z"
      }
    ],
    "availableWords": ["apple", "banana", "cat"],
    "roles": ["drawer", "guesser"],
    "hostId": "3589b251-2ef3-460d-8386-3ad8f325e64e"
  }
}
```

### Error Responses
- **400 Bad Request**: If the room has fewer than 2 players or is not in `"lobby"` state.
- **403 Forbidden**: If the `participantId` provided in the body is not the host (i.e. is not the player at index 0).
- **404 Not Found**: If the room code does not exist.
