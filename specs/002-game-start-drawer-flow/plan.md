# Plan: Game Start & Drawer Flow

## Data Flow

```
Name Validation:
  Zod .trim().min(1) on createRoomSchema & joinRoomSchema
  Frontend also trims and rejects empty before submit

Drawer Assignment:
  startGame() sets drawerId = hostId

Word Selection:
  selectWord(code) = STARTER_WORDS[sum(charCodes) % 5]

Snapshot Gating:
  toRoomSnapshot(room, viewerId):
    secretWord = (viewerId === room.drawerId) ? room.secretWord : undefined
```

## File-Level Implementation Sequence

| Order | Files | Purpose |
|-------|-------|---------|
| 1 | `backend/src/models/game.ts` | Add drawerId, secretWord, round |
| 2 | `backend/src/api/schemas.ts` | Require playerName with trim, reject empty/whitespace |
| 3 | `backend/src/services/roomStore.ts` | Add selectWord(), assign drawer on start, gate secretWord |
| 4 | Backend test files | Tests for drawer assignment, word selection, gating |
| 5 | `frontend/src/services/api.ts` | Add drawerId, secretWord?, round to RoomSnapshot type |
| 6 | `frontend/src/pages/CreateRoomPage.tsx` | Add client-side name validation |
| 7 | `frontend/src/pages/JoinRoomPage.tsx` | Add client-side name/code validation |
| 8 | `frontend/src/pages/GamePage.tsx` | Drawer display, secret word, role |
