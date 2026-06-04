# Plan — Game Start & Drawer Flow

## State Model
- Add `"playing"` to `RoomStatus`
- Add `isDrawer: boolean` to `Participant`
- Add `word: string | null` to `Room` and `RoomSnapshot`

## File Changes
| File | Change |
|------|--------|
| `backend/src/models/game.ts` | Add `"playing"` status, `isDrawer` to Participant, `word` to Room/RoomSnapshot |
| `backend/src/services/roomStore.ts` | Assign first participant as drawer on start, select word deterministically via room code hash, filter word per-viewer in `toRoomSnapshot` |
| `frontend/src/services/api.ts` | Update types with `isDrawer`, `word` |
| `frontend/src/pages/GamePage.tsx` | Show word to drawer, placeholder to guessers, role label |

## Data Flow
- Host starts game → POST /rooms/:code/start → server sets `isDrawer=true` on participant[0], selects word via hash(roomCode) % wordCount, sets status="playing"
- Drawer polls GET /rooms/:code?participantId=... → `word` field populated
- Guesser polls same endpoint → `word` field is null
