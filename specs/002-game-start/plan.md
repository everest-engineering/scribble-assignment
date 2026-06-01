# Plan: Game Start & Drawer Flow

## State Model Changes
- Room: add `status: "playing" | "round_end"`, `drawerId`, `secretWord`, `round`.
- RoomSnapshot: add `drawerId`, `secretWord`, `round`.

## Data Flow
1. Host clicks Start → POST /rooms/:code/start { participantId }
2. Backend validates: is host? are ≥2 players?
3. Backend assigns drawer = first participant, selects word via deterministic formula, sets status=playing
4. Backend returns updated snapshot (word filtered per viewer role)
5. Frontend navigates to /game

## File Changes

### Backend
| File | Changes |
|------|---------|
| `src/models/game.ts` | Add `playing`, `round_end` to RoomStatus; add `drawerId`, `secretWord`, `round` to Room; add to RoomSnapshot |
| `src/api/schemas.ts` | Add `startGameSchema` { participantId } |
| `src/api/rooms.ts` | Add POST /rooms/:code/start route |
| `src/services/roomStore.ts` | Add `startGame()`: validate host, assign drawer, select word; update `toRoomSnapshot()` to filter word per viewer |
| `src/services/roomStore.test.ts` | Test start game logic |
| `src/api/schemas.test.ts` | Test start game schema |

### Frontend
| File | Changes |
|------|---------|
| `src/services/api.ts` | Add `startGame()` |
| `src/state/roomStore.ts` | Add `startGame()` method; add drawerId, secretWord, round to state |
| `src/pages/LobbyPage.tsx` | Wire Start Game button to API call; navigate to /game on success |
| `src/pages/GamePage.tsx` | Show "You are the DRAWER" badge for drawer; show word or "???" based on role |
