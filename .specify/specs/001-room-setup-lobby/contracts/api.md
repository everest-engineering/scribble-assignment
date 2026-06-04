# API Contracts: Room Setup & Lobby

## Base URL: `/api/rooms`

### 1. Create Room
`POST /`
- **Request**: `{ "playerName": string }`
- **Response (201)**: `{ "participantId": string, "room": RoomSnapshot }`

### 2. Join Room
`POST /:code/join`
- **Request**: `{ "playerName": string }`
- **Response (200)**: `{ "participantId": string, "room": RoomSnapshot }`
- **Errors**: 
  - `400`: "Room is full", "Name already taken"
  - `404`: "Room not found"

### 3. Fetch Room (Polling)
`GET /:code?participantId=uuid`
- **Response (200)**: `{ "room": RoomSnapshot }`

### 4. Start Game
`POST /:code/start`
- **Headers**: `x-participant-id: uuid`
- **Response (200)**: `{ "success": true }`
- **Errors**:
  - `403`: "Only the host can start the game"
  - `400`: "At least 2 players required"

---

## RoomSnapshot Object
```typescript
interface RoomSnapshot {
  code: string;
  status: "lobby" | "game";
  hostId: string;
  isHost: boolean; // Derived for the viewer
  participants: Array<{ id: string, name: string }>;
}
```
