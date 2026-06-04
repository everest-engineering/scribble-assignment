# Plan: Room Setup & Lobby

## Data Flow

```
Create Room:
  POST /rooms { playerName }
    -> createRoom() generates code, sets hostId = participant.id
    -> 201 { participantId, room: RoomSnapshot }

Join Room:
  POST /rooms/:code/join { playerName }
    -> joinRoom() validates code exists, adds participant
    -> 200 { participantId, room: RoomSnapshot }

Poll Lobby:
  GET /rooms/:code?participantId=X
    -> getRoom() returns fresh snapshot
    -> Frontend polls every 2s, updates participant list

Start Game:
  POST /rooms/:code/start { participantId }
    -> startGame() validates host + >=2 players
    -> Sets status="playing"
    -> 200 { room: RoomSnapshot }
```

## File-Level Implementation Sequence

| Order | Files | Purpose |
|-------|-------|---------|
| 1 | `backend/src/models/game.ts` | Add hostId, "playing" status |
| 2 | `backend/src/api/schemas.ts` | Add start game schema, validate empty room codes |
| 3 | `backend/src/services/roomStore.ts` | Set hostId on creation, add startGame() logic |
| 4 | `backend/src/api/rooms.ts` | POST start route |
| 5 | Backend test files | Tests for host tracking, start game, code validation |
| 6 | `frontend/src/services/api.ts` | Type updates, startGame method |
| 7 | `frontend/src/state/roomStore.ts` | startGame store method |
| 8 | `frontend/src/pages/LobbyPage.tsx` | Polling, host UI |
| 9 | `frontend/src/pages/CreateRoomPage.tsx` | Name validation |
| 10 | `frontend/src/pages/JoinRoomPage.tsx` | Name/code validation |
| 11 | `frontend/src/styles/app.css` | Host badge styles |
| 12 | Frontend test files | S1 API tests |
