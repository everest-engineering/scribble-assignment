# Plan — Game Start & Drawer Flow

## State Changes
- Room.status transitions from "lobby" → "playing"
- Room.drawerId set to first participant's id
- Room.secretWord set deterministically from word list
- RoomSnapshot.viewerRole computed per-viewer
- RoomSnapshot.secretWord populated only for drawer

## Data Flow
```
POST /rooms/:code/start { participantId }
  → Backend validates: is host? has 2+ players? is lobby?
  → Assigns drawer = participants[0].id
  → Picks word: STARTER_WORDS[code.charCodeAt(0) % 5]
  → Sets status = "playing"
  → Returns RoomSnapshot (word visible only to drawer)
```

## Files
- `backend/src/models/game.ts` — Add drawerId, secretWord, viewerRole to types
- `backend/src/api/schemas.ts` — Add startGameSchema
- `backend/src/services/roomStore.ts` — Add startGame function, role-based snapshot filtering
- `backend/src/api/rooms.ts` — Add POST /:code/start route
