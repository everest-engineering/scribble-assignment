# Implementation Plan: Game Start & Drawer Flow

**Date**: 2026-06-03 | **Spec**: `specs/002-game-start-drawer/spec.md`

## Summary

When the host starts a game, the host becomes the drawer. A secret word ("rocket") is assigned and only revealed to the drawer. The frontend shows drawer identity to all and the word only to the drawer.

## State Model Changes

### Backend: `backend/src/models/game.ts`

```typescript
export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  drawerId: string;        // NEW — participant ID of the drawer
  secretWord: string;       // NEW — current round's secret word
  round: number;            // NEW — current round number (starts at 1)
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  drawerId: string;         // NEW — always visible
  secretWord?: string;      // NEW — only populated for the drawer
  round: number;            // NEW
  availableWords: string[];
  roles: ParticipantRole[];
}
```

## Data Flow

```
START GAME:
  Host clicks Start → POST /rooms/:code/start { participantId }
  → startGame() in roomStore:
     - assigns drawer = host (participants[0])
     - sets secretWord = STARTER_WORDS[0] ("rocket")
     - sets round = 1
     - sets status = "playing"
  → returns RoomSnapshot with drawerId, secretWord, round

FETCH ROOM (game polling):
  GET /rooms/:code?participantId=xxx
  → toRoomSnapshot():
     - always includes drawerId, round
     - includes secretWord ONLY if participantId === drawerId
```

## Files Changed

### Backend (3 files)
| File | Change |
|------|--------|
| `backend/src/models/game.ts` | Add `drawerId`, `secretWord`, `round` to Room and RoomSnapshot |
| `backend/src/services/roomStore.ts` | Assign drawer + word in `startGame`; filter word in `toRoomSnapshot` |
| `backend/src/api/rooms.ts` | No changes needed (routes already call startGame + toRoomSnapshot) |

### Frontend (2 files)
| File | Change |
|------|--------|
| `frontend/src/services/api.ts` | Add `drawerId`, `secretWord?`, `round` to RoomSnapshot type |
| `frontend/src/pages/GamePage.tsx` | Show drawer name, show secret word if viewer is drawer |

## Implementation Sequence

1. Backend model + store changes
2. Frontend types + UI
3. Verify with two browser tabs
