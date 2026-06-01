# Plan 002 — Game Start & Drawer Flow

## State model

- `RoomStatus`: `"lobby" | "playing" | "result"`
- `Participant.role`: `"drawer" | "guesser" | null` (null in lobby)
- `Room.drawerId`, `Room.secretWord` (server-only; filtered in snapshot)
- `Participant.score`: number, default 0 at round start

## Data flow

1. `startGame(code, hostParticipantId)` verifies host, lobby, count ≥2.
2. Set `drawerId = hostId`, assign roles on participants.
3. `secretWord = pickWord(code)` deterministic function.
4. `toRoomSnapshot(room, viewerId)` includes `secretWord` only if `viewerId === drawerId` and status is `playing`.

## Files

| File | Change |
|------|--------|
| `backend/src/models/game.ts` | Status union, roles, scores |
| `backend/src/services/roomStore.ts` | `startGame`, `pickWord`, snapshot filter |
| `backend/src/api/rooms.ts` | Start handler returns playing snapshot |
| `frontend/src/services/api.ts` | Types for playing snapshot |
| `frontend/src/pages/LobbyPage.tsx` | Navigate all clients when status changes |
| `frontend/src/pages/GamePage.tsx` | Show drawer banner and secret word for drawer |

## Testing

- Unit test: same code → same word; guesser snapshot has no word; drawer has word.

## Risks

Leaking word if snapshot filter regresses — add explicit test on `toRoomSnapshot`.
