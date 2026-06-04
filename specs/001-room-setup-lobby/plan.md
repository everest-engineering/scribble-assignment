# Implementation Plan: Room Setup & Lobby

**Date**: 2026-06-03 | **Spec**: `specs/001-room-setup-lobby/spec.md`

## Summary

Add host tracking, player name validation, room code normalization, lobby polling, minimum-player guard, and host-only start-game to the existing room system. The backend drives all game state; the frontend polls and renders.

## Technical Context

**Language/Version**: TypeScript 5.x (backend + frontend)
**Runtime**: Node.js 18+ (backend), Vite (frontend)
**Backend**: Express + Zod
**Frontend**: React 18 + react-router-dom v6
**Storage**: In-memory Map (no databases)
**Testing**: Vitest (both projects)

## State Model Changes

### Backend: `backend/src/models/game.ts`

```typescript
// Participant — add isHost flag
export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;        // NEW
}

// RoomStatus — extend with "playing"
export type RoomStatus = "lobby" | "playing";   // UPDATED
```

### Frontend: `frontend/src/services/api.ts`

```typescript
// Participant — mirror backend
export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;        // NEW
}

// RoomSnapshot — extend status
export interface RoomSnapshot {
  code: string;
  status: "lobby" | "playing";  // UPDATED
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
}

// Add startGame method
export const api = {
  // ... existing methods
  startGame(code: string, participantId: string): Promise<{ room: RoomSnapshot }>  // NEW
};
```

## Data Flow

```
CREATE ROOM:
  CreateRoomPage → POST /rooms { playerName }
  → backend validates name (non-empty, trimmed)
  → createRoom() marks participant[0].isHost = true
  → returns RoomSnapshot with isHost flag

JOIN ROOM:
  JoinRoomPage → POST /rooms/:code/join { playerName }
  → backend normalizes code (uppercase + trim)
  → validates name (non-empty)
  → 404 if room not found
  → returns RoomSnapshot

LOBBY POLLING:
  LobbyPage mount → setInterval(2s) → GET /rooms/:code?participantId=xxx
  → updates roomStore state
  → unmount → clearInterval

START GAME:
  Host clicks Start → POST /rooms/:code/start { participantId }
  → backend checks: participant is host (403), ≥2 players (400)
  → transitions status to "playing"
  → returns updated RoomSnapshot
```

## Files Changed

### Backend (5 files)
| File | Change |
|------|--------|
| `backend/src/models/game.ts` | Add `isHost` to Participant, extend RoomStatus |
| `backend/src/api/schemas.ts` | Make playerName required (min-length), add startGameSchema |
| `backend/src/api/rooms.ts` | Add POST /:code/start route, normalize code, validate names |
| `backend/src/services/roomStore.ts` | Mark creator as host, add startGame() function, validate names |
| `backend/src/index.ts` | Register error handler if missing |

### Frontend (5 files)
| File | Change |
|------|--------|
| `frontend/src/services/api.ts` | Add isHost to Participant, extend status, add startGame API call |
| `frontend/src/state/roomStore.ts` | Add startGame(), clearSession(), track host status |
| `frontend/src/pages/LobbyPage.tsx` | Add polling, host-only start, leave button, show host badge |
| `frontend/src/pages/CreateRoomPage.tsx` | Add client-side name validation |
| `frontend/src/pages/JoinRoomPage.tsx` | Add client-side name + code validation |

## Implementation Sequence

1. Backend model + validation (schemas, game.ts)
2. Backend store + routes (roomStore.ts, rooms.ts)
3. Frontend API + store (api.ts, roomStore.ts)
4. Frontend UI (pages)
5. Verify with two browser tabs

## Risks

- Polling interval too aggressive → 2s is conservative for a turn-based game
- No cleanup for abandoned rooms → acceptable for lab scope
- Browser refresh loses state → known limitation, out of scope for this scenario
