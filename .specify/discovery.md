# Discovery Notes

## Incomplete Behaviors (≥3)

1. **Host tracking**: The starter does not identify which participant created the room. The `Room` model has no `hostId` field, so any participant could theoretically start the game or perform host-only actions.

2. **Lobby polling**: The lobby has only a manual "Refresh Room" button. There is no automatic polling mechanism, so players must manually refresh to see new participants join.

3. **Start game flow**: The "Start Game" button on the lobby navigates directly to `/game` without any backend validation. There is no `POST /rooms/:code/start` endpoint, no drawer assignment, no word selection, and no status transition from "lobby" to "playing".

## Assumptions (≥2)

1. **Participant identity via participantId**: The frontend stores a `participantId` in the room store but never sends it to the backend for ownership checks. The backend's `toRoomSnapshot` currently ignores `viewerParticipantId`. We assume this pattern will be extended for host validation and drawer-only word visibility.

2. **Polling over WebSockets**: Given the explicit constraint that WebSockets are out of scope, all real-time sync (lobby updates, guess history, game state) must use HTTP polling. We assume a ~2s polling interval as specified in Scenario 1.

## Relevant Files

### Backend
- `backend/src/models/game.ts` — Data types (Room, Participant, RoomSnapshot)
- `backend/src/services/roomStore.ts` — In-memory store, CRUD operations
- `backend/src/api/rooms.ts` — Route handlers
- `backend/src/api/schemas.ts` — Zod validation schemas
- `backend/src/seed/starterData.ts` — Starter words and roles

### Frontend
- `frontend/src/state/roomStore.ts` — Client-side state management
- `frontend/src/services/api.ts` — API client
- `frontend/src/pages/LobbyPage.tsx` — Lobby UI
- `frontend/src/pages/CreateRoomPage.tsx` — Create room form
- `frontend/src/pages/JoinRoomPage.tsx` — Join room form
- `frontend/src/pages/GamePage.tsx` — Game screen (placeholder)
- `frontend/src/components/GuessForm.tsx` — Guess input (placeholder)
- `frontend/src/components/Scoreboard.tsx` — Score display (placeholder)
- `frontend/src/components/ResultPanel.tsx` — Activity panel (placeholder)
