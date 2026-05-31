## Scenario 2 — Game Start & Drawer Flow

### Findings
- No drawer assignment logic exists
- No secret word selection exists
- No role-based filtering in snapshots
- Player names not validated before game start

### State Model Changes

**Backend — Room type additions:**
```
drawerId: string | null
secretWord: string | null
round: number
```

**Frontend — RoomSnapshot type additions:**
```
drawerId: string | null
secretWord: string | null
round: number
```

### File-Level Changes

| File | Change |
|------|--------|
| `backend/src/models/game.ts` | Add `drawerId`, `secretWord`, `round` to Room and RoomSnapshot |
| `backend/src/services/roomStore.ts` | Update `startGame()` to assign drawer + word; word visibility logic in `toRoomSnapshot()` |
| `frontend/src/services/api.ts` | Update types |
| `frontend/src/pages/GamePage.tsx` | Show role, word, drawer badge; conditional rendering based on drawer/guesser |
| `frontend/src/pages/LobbyPage.tsx` | Validate all names before starting |
