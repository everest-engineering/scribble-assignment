# Plan — Room Setup & Lobby

## State Changes
- Room model gets `hostId: string` field
- `createRoom` returns room with `hostId` set to first participant's id
- `joinRoom` validates room existence and player name
- RoomSnapshot includes `hostId` for frontend to identify host

## Data Flow
```
POST /rooms { playerName: "Alice" }
  → Backend validates name (trim, min length)
  → Creates Room with hostId = participantId, status = "lobby"
  → Returns RoomSnapshot with hostId

POST /rooms/:code/join { playerName: "Bob" }
  → Backend validates name, looks up room
  → Adds participant, returns RoomSnapshot

GET /rooms/:code?participantId=xxx (every ~2s)
  → Backend returns current RoomSnapshot
  → Frontend updates participant list
  → When status changes to "playing", navigate to /game
```

## Files
- `backend/src/models/game.ts` — Add hostId to Room and RoomSnapshot
- `backend/src/api/schemas.ts` — Add name validation (trim, min(1))
- `backend/src/services/roomStore.ts` — Track host on create, validate names
- `frontend/src/services/api.ts` — Fix base URL, update types
- `frontend/src/pages/LobbyPage.tsx` — Auto-polling, host controls
- `frontend/src/pages/CreateRoomPage.tsx` — Name validation
- `frontend/src/pages/JoinRoomPage.tsx` — Name validation
