# Implementation Plan — Feature Group 1

## State Model Changes

**Backend (`game.ts`):**
- Add `hostId: string` to `Room`
- Expand `RoomStatus` to `"lobby" | "drawing" | "results"`

**Backend (`roomStore.ts`):**
- `createRoom` stores hostId as the creator's participant ID
- Validation helpers: `validateName(name)` returns error or sanitized name
- `toRoomSnapshot` includes `hostId` field
- `startGame(code, participantId)` — validates host, validates min 2 players, transitions status

**Frontend (`api.ts`):**
- Add `startGame(code, participantId)` method
- Fix base URL bug (`/bug` -> should be base URL without path)

**Frontend (`roomStore.ts`):**
- Add `startGame(code)` method
- Add polling interval (useEffect with setInterval ~2s)
- Expose `isHost` computed state

**Frontend (`LobbyPage.tsx`):**
- Show "You are the host" indicator
- Use hostId to gate "Start Game" button
- Disable start when < 2 players
- Replace manual refresh with automatic polling
- Navigate to /game on successful start

## API Changes

- `POST /rooms` — unchanged signature, now stores hostId
- `POST /rooms/:code/join` — validate name, reject empty/whitespace
- `GET /rooms/:code` — returns hostId in snapshot
- `POST /rooms/:code/start` — new endpoint

## Data Flow

1. Player creates room -> backend returns hostId + room with status "lobby"
2. Players join -> name validated on backend
3. Lobby polls GET /rooms/:code every 2s -> updates participant list
4. Host clicks Start -> POST /rooms/:code/start -> status becomes "drawing"
5. On next poll, frontend detects status change -> navigates to /game

## File-Level Changes

| File | Change |
|------|--------|
| `backend/src/models/game.ts` | Add `hostId` to Room, expand RoomStatus |
| `backend/src/services/roomStore.ts` | Host tracking, name validation, startGame, toRoomSnapshot update |
| `backend/src/api/schemas.ts` | Add startGameSchema, update joinRoomSchema with required name |
| `backend/src/api/rooms.ts` | Add POST /:code/start route, update join validation |
| `frontend/src/services/api.ts` | Add startGame, fix base URL |
| `frontend/src/state/roomStore.ts` | Add polling, startGame, isHost |
| `frontend/src/pages/LobbyPage.tsx` | Host gating, auto-polling, navigate on start |

## Polling Strategy

- Poll interval: 2000ms
- Start on LobbyPage mount, clear on unmount
- On each poll response, check if `room.status` changed from "lobby" to "drawing" -> navigate to /game
- Frontend only polls when on LobbyPage

## Validation Strategy

- Backend zod schemas enforce name requirements
- Unit tests for name validation (empty, whitespace, valid)
- Integration: two tabs, verify host-only start, verify min 2 players
- Edge case: single player cannot start
