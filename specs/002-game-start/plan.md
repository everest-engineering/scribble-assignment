# Plan — Scenario 2: Game Start & Drawer Flow

## State Changes
- Room model: add `drawerId`, `secretWord` fields
- RoomSnapshot: add `drawerId`; add `secretWord` (empty for non-viewers)
- `startGame` function: assign drawer, select word, set status to `playing`

## File-Level Changes

### Backend
| File | Changes |
|------|---------|
| `backend/src/models/game.ts` | Add `drawerId`, `secretWord` |
| `backend/src/services/roomStore.ts` | Implement `selectWord` (deterministic); assign drawer=host; update `toRoomSnapshot` for viewer-based visibility |

### Frontend
| File | Changes |
|------|---------|
| `frontend/src/pages/GamePage.tsx` | Show word to drawer; show canvas/placeholder to guessers |

## Data Flow
```
Start → Backend validates → assigns drawerId=hostId → selects word → status=playing → snapshot with word hidden from non-drawers
```
