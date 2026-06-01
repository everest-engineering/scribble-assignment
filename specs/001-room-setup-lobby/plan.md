# Plan 001 — Room Setup & Lobby

## State model changes

Extend `Room` with `hostId: string`. Extend `RoomSnapshot` with `hostId`, `isHost: boolean`, `canStart: boolean` (host && lobby && participants.length >= 2).

`RoomStatus` remains `lobby` until feature 002 adds `playing` and `result`.

## Data flow

1. Create room → `hostId = participant.id` → snapshot includes `isHost: true` for creator.
2. Join room → validate trimmed name and code → append participant.
3. Lobby mount → `setInterval(2000)` → `fetchRoom(code, participantId)` → update store.
4. Start → host POST → on success navigate `/game`; non-hosts detect `status !== lobby` via polling and navigate.

## File-level plan

| File | Change |
|------|--------|
| `backend/src/models/game.ts` | Add `hostId`, snapshot flags |
| `backend/src/services/roomStore.ts` | Set host on create; `normalizePlayerName`; `canStartGame`; `startGame` stub or full in 002 |
| `backend/src/api/schemas.ts` | Stricter `playerName`, `roomCode` validation |
| `backend/src/api/rooms.ts` | `POST /:code/start` route |
| `frontend/src/services/api.ts` | Fix base URL; `startRoom` |
| `frontend/src/state/roomStore.ts` | `startGame` action |
| `frontend/src/pages/LobbyPage.tsx` | Polling, host-only start |
| `frontend/src/pages/CreateRoomPage.tsx` | Display validation errors |
| `frontend/src/pages/JoinRoomPage.tsx` | Client-side code trim/validate |

## Testing

- `roomStore`: host assignment, join null for bad code, name validation throws/returns error.
- Manual: two tabs, second player appears within ~2s without refresh.

## Risks

- Polling continues after leave — mitigate with `clearInterval` on unmount.
- Race if host starts before second player polls — start endpoint re-validates count.
