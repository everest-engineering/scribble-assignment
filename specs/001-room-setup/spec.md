# 001 – Room Setup & Lobby

## Acceptance Criteria

- Creator automatically becomes host (`hostId` = creator's `participantId`)
- Invalid room codes are rejected with 404 and `"Unable to join room"` / `"Unable to load room"`
- Rooms remain isolated via `Map<string, Room>` — each room's data is independent
- Lobby auto-refreshes every ~2 seconds via `setInterval` calling `roomStore.fetchRoom()`
- Only host can start the game; non-hosts do not see the Start button
- Start button is disabled when `room.participants.length < 2`

## Implementation Details

- `backend/src/services/roomStore.ts`: `createRoom()` sets `hostId` on the Room; `joinRoom()` adds participant; `startGame()` validates hostId and participant count
- `frontend/src/pages/LobbyPage.tsx`: Auto-polling via `useEffect` + `setInterval(2000)`; host detection via `roomStore.isHost()`; Start button conditional rendering
- `backend/src/models/game.ts`: Room interface includes `hostId: string`
- `backend/src/api/schemas.ts`: Name trimming via `z.string().trim().min(1).optional()`; room code param validation via `roomCodeParamsSchema`
- `backend/src/api/router.ts`: Centralized error handler returns 400 for ZodError and 404/500 for HttpError

## Dependencies

- Depends on: None (foundational)
- Used by: 002-game-start, 003-gameplay, 004-result-restart
