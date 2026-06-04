# Plan — Room Setup & Lobby

## State Model
- Add `isHost: boolean` to `Participant`
- Add `canStart: boolean` to `RoomSnapshot`

## File Changes
| File | Change |
|------|--------|
| `backend/src/models/game.ts` | Add `isHost` to Participant, `canStart` to RoomSnapshot |
| `backend/src/api/schemas.ts` | Add name validation (trim, min 1) |
| `backend/src/api/rooms.ts` | Add `POST /rooms/:code/start` route |
| `backend/src/services/roomStore.ts` | Mark creator as host, add `startGame()`, expose `canStart` |
| `frontend/src/services/api.ts` | Update types, add `startGame()` |
| `frontend/src/state/roomStore.ts` | Add `startGame()` method |
| `frontend/src/pages/LobbyPage.tsx` | Auto-poll 2s, host-only start button |
| `frontend/src/pages/CreateRoomPage.tsx` | Client-side name validation |
| `frontend/src/pages/JoinRoomPage.tsx` | Client-side name + code validation |

## Data Flow
- Client creates room → POST /rooms → server marks creator as host → returns snapshot with `isHost: true`
- Client joins room → POST /rooms/:code/join → server adds participant → lobby shows all players
- Lobby polls GET /rooms/:code every 2s → updates participant list
- Host clicks Start → POST /rooms/:code/start → server validates (host + 2+ players) → transitions to "playing"
