# Discovery Notes: Room Setup & Lobby

## Date

2026-05-29

## Starter Gaps

1. **Player name validation is missing**
   - `CreateRoomPage` and `JoinRoomPage` accept empty or whitespace-only names.
   - The backend `createRoom` and `joinRoom` endpoints have no name validation schema.

2. **Room code validation is incomplete**
   - `JoinRoomPage` uppercases the code, but the backend does not normalize or validate codes consistently.
   - Invalid codes return generic errors; no clear "Room not found" message is surfaced.

3. **Lobby polling is not automatic**
   - `LobbyPage` exposes a manual refresh button only.
   - The spec requires automatic polling every ~2 seconds for participant updates.

4. **Host-only start logic is missing**
   - `LobbyPage` always shows `Start Game`.
   - The host is not clearly identified in the participant list.

## Assumptions

1. **Polling cadence of ~2 seconds is acceptable** for this lab because WebSockets are explicitly out of scope.
2. **Room codes are case-insensitive** and should be normalized server-side to avoid user input mismatches.
3. **Rooms are isolated in-memory** and do not need persistence beyond the backend process lifetime.
4. **Duplicate names are allowed** in a room; the same name does not need to be unique.
5. **Join re-entry semantics**: if a player joins again with the same code, they may receive a new participant entry unless we implement deduplication by participant ID or name.

## Relevant Files

- `backend/src/api/rooms.ts`
- `backend/src/api/schemas.ts`
- `backend/src/services/roomStore.ts`
- `backend/src/models/game.ts`
- `frontend/src/pages/CreateRoomPage.tsx`
- `frontend/src/pages/JoinRoomPage.tsx`
- `frontend/src/pages/LobbyPage.tsx`
- `frontend/src/state/roomStore.ts`
- `frontend/src/services/api.ts`

## Opportunities

- Add robust Zod validation for room creation and join requests.
- Normalize room codes consistently in backend logic.
- Turn lobby refresh into automated polling per requirements.
- Introduce host identification and start-game gating in the Lobby screen.
- Preserve existing page structure and minimal app footprint while adding scenario behavior.
