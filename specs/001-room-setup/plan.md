# Plan — Scenario 1: Room Setup & Lobby

## State Changes
- Room model: add `hostId` field
- RoomSnapshot: include `hostId`
- No changes to other models

## File-Level Changes

### Backend
| File | Changes |
|------|---------|
| `backend/src/models/game.ts` | Add `hostId` to Room and RoomSnapshot |
| `backend/src/services/roomStore.ts` | Store `hostId` on creation; update `toRoomSnapshot` to include `hostId` |
| `backend/src/api/schemas.ts` | Add player name trim validation |
| `backend/src/api/rooms.ts` | Add `POST /rooms/:code/start` endpoint with host check and 2-player minimum |

### Frontend
| File | Changes |
|------|---------|
| `frontend/src/services/api.ts` | Fix base URL; update RoomSnapshot type; add `startGame` method |
| `frontend/src/state/roomStore.ts` | Add `startGame` action; add polling infrastructure |
| `frontend/src/pages/LobbyPage.tsx` | Auto-poll on mount; host-only start button; navigate on status change |
| `frontend/src/pages/CreateRoomPage.tsx` | Add client-side name validation |
| `frontend/src/pages/JoinRoomPage.tsx` | Add name and code validation |

## Data Flow
```
Lobby Polling:   Frontend → GET /rooms/:code?participantId=xxx → Backend → snapshot → UI
Start Game:      Frontend → POST /rooms/:code/start { participantId } → Backend (validate host, ≥2 players) → 200 { room } → navigate /game
```
