# Implementation Plan: Result, Restart & Final Validation

**Date**: 2026-06-03 | **Spec**: `specs/004-result-restart/spec.md`

## Summary

When a correct guess is submitted, the round ends (status → "finished") and all players see the result. The host can restart, which clears round state and returns everyone to the lobby.

## State Model Changes

### Backend: `backend/src/models/game.ts`

```typescript
export type RoomStatus = "lobby" | "playing" | "finished";  // UPDATED
```

`RoomSnapshot`: secretWord is now always revealed when status is "finished".

### Store: `backend/src/services/roomStore.ts`

- `submitGuess`: if guess is correct, set status to "finished"
- Add `restartGame(code, participantId)`: verify host, reset round state, set status to "lobby"
- `toRoomSnapshot`: reveal secretWord if status is "lobby" or "finished", not just for drawer

## Data Flow

```
CORRECT GUESS:
  Guesser → POST /rooms/:code/guess { participantId, text }
  → matches secretWord → status = "finished"
  → snapshot returned with secretWord revealed to ALL

FETCH ROOM (polling):
  → if status is "finished", include secretWord for all viewers

RESTART:
  Host → POST /rooms/:code/restart { participantId }
  → verify host
  → clear: guesses[], scores{}, drawerId="", secretWord="", round=0
  → status = "lobby"
  → return snapshot
```

## Files Changed

### Backend (4 files)
| File | Change |
|------|--------|
| `backend/src/models/game.ts` | Extend RoomStatus to include "finished" |
| `backend/src/api/schemas.ts` | Add restartSchema |
| `backend/src/services/roomStore.ts` | End round on correct guess, add restartGame, reveal word in snapshot for finished state |
| `backend/src/api/rooms.ts` | Add POST /:code/restart route |

### Frontend (4 files)
| File | Change |
|------|--------|
| `frontend/src/services/api.ts` | Extend RoomStatus, add restartGame API |
| `frontend/src/state/roomStore.ts` | Add restartGame method |
| `frontend/src/pages/GamePage.tsx` | Show result view when finished, disable canvas/guess, show Play Again button |
| `frontend/src/pages/LobbyPage.tsx` | No changes needed (already handles lobby) |

## Implementation Sequence

1. Backend model + schema
2. Backend store + routes
3. Frontend types + store
4. Frontend GamePage result view
5. Verify with two browser tabs
