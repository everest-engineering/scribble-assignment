# Plan: Room Setup & Lobby

## State Model Changes
- Room model: add `hostId: string` field.
- RoomSnapshot: add `hostId` field.
- No other state changes.

## Data Flow
1. Create Room: POST /rooms { playerName } → backend creates room with creator as hostId → returns snapshot.
2. Join Room: POST /rooms/:code/join { playerName } → backend validates name, finds room, adds participant.
3. Poll Lobby: GET /rooms/:code?participantId=X → returns latest snapshot including hostId.
4. Start Game (pre-check only): frontend checks if current player is host and player count ≥2 before showing button.

## File Changes

### Backend
| File | Changes |
|------|---------|
| `src/models/game.ts` | Add `hostId` to Room and RoomSnapshot |
| `src/api/schemas.ts` | Add name validation (trim, non-empty after trim) to createRoomSchema and joinRoomSchema |
| `src/services/roomStore.ts` | Set hostId on room creation; trim player names; reject empty names |
| `src/api/rooms.ts` | Validate name in create/join handlers; return appropriate errors |
| `src/services/roomStore.test.ts` | Test hostId assignment |
| `src/api/schemas.test.ts` | Test name validation |

### Frontend
| File | Changes |
|------|---------|
| `src/services/api.ts` | Fix `/bug` typo in API_BASE_URL |
| `src/state/roomStore.ts` | Add hostId to state; add polling mechanism (setInterval ~2s) |
| `src/pages/LobbyPage.tsx` | Auto-poll on mount; show Start Game only for host; disable if <2 players |
| `src/pages/CreateRoomPage.tsx` | Add name validation (trim, non-empty) |
| `src/pages/JoinRoomPage.tsx` | Add name validation; add code validation |
