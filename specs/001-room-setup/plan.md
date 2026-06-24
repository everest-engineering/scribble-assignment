# Plan: Room Setup & Lobby (Scenario 1)

## Findings from Discovery

The starter provides working create/join/fetch flows with in-memory storage. Key gaps: no hostId, no polling, no start endpoint, viewerParticipantId ignored in snapshots. Frontend API URL has a `/bug` suffix bug.

## State Model Changes

### Room (backend)
```typescript
interface Room {
  code: string;
  status: "lobby" | "playing" | "result";  // extend from "lobby" only
  hostId: string;                           // NEW: creator's participantId
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}
```

### RoomSnapshot (shared)
Add `hostId: string` to snapshot. Status union extended. No game-round fields yet (Phase 2).

## Data Flow

```
Create Room:
  POST /rooms { playerName } → createRoom() → sets hostId = participant.id → snapshot

Join Room:
  POST /rooms/:code/join { playerName } → validates code exists → adds participant

Lobby Polling (frontend):
  useEffect interval 2000ms → fetchRoom(code, participantId) → update store → re-render participant list

Start Game:
  POST /rooms/:code/start { participantId } → validates host + lobby + ≥2 players
  → room.status = "playing" → all pollers detect status change → navigate to /game
```

## File-Level Changes

### Backend
| File | Change |
|------|--------|
| `models/game.ts` | Add `hostId` to Room/RoomSnapshot; extend RoomStatus |
| `services/roomStore.ts` | Set hostId on create; add `startGame(code, participantId)` |
| `api/schemas.ts` | Add room code format validation; add startGameSchema |
| `api/rooms.ts` | Add POST `/:code/start`; improve join error messages |

### Frontend
| File | Change |
|------|--------|
| `services/api.ts` | Fix API URL; add `startRoom()`; extend RoomSnapshot type |
| `state/roomStore.ts` | Add `startGame()` method |
| `pages/LobbyPage.tsx` | Add 2s polling; host-only start button; host badge; auto-navigate on status change |
| `pages/JoinRoomPage.tsx` | Validate room code format before submit |

## Implementation Sequence

1. Fix frontend API base URL
2. Extend backend model with hostId and status union
3. Update createRoom to set hostId
4. Add startGame service function with validation
5. Add start endpoint and improve join validation
6. Update backend tests
7. Extend frontend types and API client
8. Add lobby polling and host-only start UI
9. Add join form validation
10. Manual two-tab validation

## Risks

| Risk | Mitigation |
|------|------------|
| Polling continues after unmount | Clear interval in useEffect cleanup |
| Race: start + poll | Status check is atomic in single-threaded Node |
| Type drift frontend/backend | Mirror types in api.ts from backend model |

## Testing Strategy

- Backend unit tests: hostId set on create, startGame rejects non-host, startGame rejects <2 players
- Frontend: existing API tests extended for startRoom
- Manual: two-tab lobby flow per acceptance criteria
