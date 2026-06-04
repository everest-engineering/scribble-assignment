# API Contract: Room Setup & Lobby

## Base URL: `/api/rooms`

### 1. Create Room
`POST /`

**Request Body**:
```json
{
  "playerName": "string (optional)"
}
```

**Response (201 Created)**:
```json
{
  "participantId": "string (UUID)",
  "room": {
    "code": "string",
    "status": "lobby",
    "hostId": "string",
    "participants": [
      { "id": "uuid", "name": "name", "joinedAt": "iso" }
    ],
    "isHost": true
  }
}
```

---

### 2. Join Room
`POST /:code/join`

**Request Body**:
```json
{
  "playerName": "string"
}
```

**Response (200 OK)**:
```json
{
  "participantId": "string (UUID)",
  "room": {
    "code": "string",
    "status": "lobby",
    "hostId": "string",
    "participants": [...],
    "isHost": false
  }
}
```

**Errors**:
- `400 Bad Request`: "Player name is required", "Room is full (max 8 players)"
- `404 Not Found`: "Room not found"

---

### 3. Fetch Room (Polling)
`GET /:code?participantId=uuid`

**Response (200 OK)**:
```json
{
  "room": {
    "code": "string",
    "status": "lobby | game",
    "hostId": "string",
    "participants": [...],
    "isHost": "boolean"
  }
}
```

---

### 4. Start Game
`POST /:code/start`

**Headers**:
- `x-participant-id`: `uuid` (must be the `hostId`)

**Response (200 OK)**:
```json
{
  "success": true
}
```

**Errors**:
- `403 Forbidden`: "Only the host can start the game"
- `400 Bad Request`: "At least 2 players are required to start"
