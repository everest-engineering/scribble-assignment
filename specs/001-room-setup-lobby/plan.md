# Implementation Plan: Room Setup & Lobby

**Branch**: `assignment`

## Summary

Implement host tracking, name validation, lobby polling, and host-only start preconditions for the room setup and lobby phase.

## State Model Changes

### Backend — `Room` (src/models/game.ts)
```typescript
interface Room {
  // existing fields...
  hostId: string;  // participantId of the host
}
```

### Frontend — `RoomSnapshot` (src/services/api.ts)
```typescript
interface RoomSnapshot {
  // existing fields...
  hostId: string;
}
```

## File-Level Plan

### Backend
| File | Changes |
|------|---------|
| `src/models/game.ts` | Add `hostId` to Room and RoomSnapshot |
| `src/api/schemas.ts` | Add name validation (trim, reject empty) to create and join schemas |
| `src/services/roomStore.ts` | Set `hostId` on room creation; remove dead `saveRoom` code; expose `hostId` in snapshot |
| `src/api/rooms.ts` | No changes needed |

### Frontend
| File | Changes |
|------|---------|
| `src/services/api.ts` | Fix `/bug` typo in API base URL; add `hostId` to types |
| `src/pages/LobbyPage.tsx` | Add auto-polling (~2s); host-only Start button; disable if <2 players |
| `src/pages/CreateRoomPage.tsx` | Add client-side name validation |
| `src/pages/JoinRoomPage.tsx` | Add client-side name validation |

## Implementation Sequence
1. Fix `/bug` typo in `api.ts`
2. Add `hostId` to models
3. Add name validation to Zod schemas
4. Update roomStore to set hostId and expose in snapshot
5. Add auto-polling to LobbyPage
6. Add host-only Start button with 2-player minimum
7. Add client-side form validation
8. Build and test
