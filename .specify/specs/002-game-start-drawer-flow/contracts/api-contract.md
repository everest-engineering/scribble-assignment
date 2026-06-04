# API Contract: Game Start & Drawer Flow

## Endpoints

### POST /api/rooms/:roomId/start
- **Description**: Starts the game.
- **Request**:
  - `roomId` (params)
- **Response**:
  - `200 OK`: `{ "status": "success" }`
  - `400 Bad Request`: `{ "error": "Invalid request" }`
  - `404 Not Found`: `{ "error": "Room not found" }`

### GET /api/rooms/:roomId/state
- **Description**: Polls the current room state.
- **Request**:
  - `roomId` (params)
- **Response**:
  - `200 OK`: `RoomSnapshot`
  - `404 Not Found`: `{ "error": "Room not found" }`

## Data Structures

### RoomSnapshot
```typescript
interface RoomSnapshot {
  id: string;
  status: 'lobby' | 'in-game' | 'ended';
  participants: Participant[];
  drawerId: string | null;
  currentWord: string | null; // Filtered by backend for non-drawers
  hostId: string;
}
```
