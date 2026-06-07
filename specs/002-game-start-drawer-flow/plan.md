# Implementation Plan: Game Start & Drawer Flow

**Branch**: `assignment`

## Summary

Implement game start endpoint, drawer assignment, deterministic word selection, and word visibility rules.

## State Model Changes

### Backend — `Room` (src/models/game.ts)
```typescript
RoomStatus = "lobby" | "playing" | "roundEnd"

interface Room {
  // existing + hostId...
  status: RoomStatus;
  currentDrawerId: string | null;
  currentWord: string | null;
  guesses: Guess[];
  scores: Record<string, number>;
  canvasData: string;
}
```

### Frontend — `RoomSnapshot` (src/services/api.ts)
```typescript
interface RoomSnapshot {
  status: "lobby" | "playing" | "roundEnd";
  currentDrawerId: string | null;
  currentWord: string | null;
  // other fields...
}
```

## Data Flow

### Game Start Flow
1. Host clicks "Start Game" → `POST /rooms/:code/start`.
2. Backend: validates host, sets drawer (first participant), selects word (deterministic index), sets status to `"playing"`.
3. All clients detect `status === "playing"` on next poll.

## File-Level Plan

### Backend
| File | Changes |
|------|---------|
| `src/models/game.ts` | Add `currentDrawerId`, `currentWord`, `guesses`, `scores`, `canvasData`; extend RoomStatus |
| `src/api/schemas.ts` | Add `startGameSchema` |
| `src/services/roomStore.ts` | Add `startGame` method; update `toRoomSnapshot` to hide word from guessers |
| `src/api/rooms.ts` | Add `POST /:code/start` route |

### Frontend
| File | Changes |
|------|---------|
| `src/services/api.ts` | Add `startGame()` method; add new fields to types |
| `src/state/roomStore.ts` | Add `startGame()` method |
| `src/pages/LobbyPage.tsx` | Wire Start Game button to API; navigate on success |
| `src/pages/GamePage.tsx` | Detect role; show word to drawer; add polling |

## Implementation Sequence
1. Update Room model with new fields
2. Add startGame endpoint
3. Add drawer assignment and word selection logic
4. Update toRoomSnapshot for word visibility
5. Add startGame to API client and room store
6. Wire Start Game button in LobbyPage
7. Update GamePage with role detection
8. Build and test
