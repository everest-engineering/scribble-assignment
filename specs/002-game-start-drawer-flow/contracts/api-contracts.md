# API Contracts: Game Start & Drawer Flow

## POST /rooms/:code/start (modified)

**Request**:
- Params: `code` (string, 4-char room code)
- Body: `{ participantId: string (UUID) }`

**Response 200**:
```json
{
  "room": {
    "code": "ABCD",
    "status": "active",
    "participants": [
      { "id": "uuid-1", "name": "Alice", "joinedAt": "..." },
      { "id": "uuid-2", "name": "Bob", "joinedAt": "..." }
    ],
    "hostId": "uuid-1",
    "drawerId": "uuid-1",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "currentWord": "rocket"
  }
}
```
*Note: `currentWord` is ONLY present when `participantId === drawerId`.*

**Response 200 (guesser view)**:
```json
{
  "room": {
    "code": "ABCD",
    "status": "active",
    "participants": [...],
    "hostId": "uuid-1",
    "drawerId": "uuid-1",
    "availableWords": [...],
    "roles": ["drawer", "guesser"],
    "currentWord": null
  }
}
```

**Response 404**: Room not found
**Response 403**: Only the host can start
**Response 409**: At least 2 players required
**Response 500**: No words available (word list empty)

## GET /rooms/:code (modified)

**Query params**: `participantId` (optional, string)

**Response**: Same shape as start response. `currentWord` is gated by `viewerParticipantId === drawerId`.

## Frontend Contract: RoomSnapshot type

The `RoomSnapshot` interface in both backend (`models/game.ts`) and frontend (`services/api.ts`) gains:
- `drawerId: string | null`
- `currentWord: string | null`
