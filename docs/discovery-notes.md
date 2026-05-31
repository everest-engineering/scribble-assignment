# Discovery Notes

## Existing Behaviour

- Room creation is implemented through `POST /rooms`, backed by the in-memory room store.
  The creator receives a `participantId` and a room snapshot.
- Room joining is implemented through `POST /rooms/:code/join`. Unknown room codes return
  an error, and successful joins append a participant to the room.
- Lobby participant display is wired to the current room snapshot in frontend state.
  Joined players appear after the room snapshot is refreshed.
- Manual lobby refresh exists. `LobbyPage` calls `roomStore.fetchRoom()`, which loads the
  latest snapshot through `GET /rooms/:code`.
- The game route and placeholder UI exist, including canvas, guess form, scoreboard, and
  activity/result areas.

## Incomplete Behaviour

- No host tracking is present in the backend `Room` or frontend `RoomSnapshot` types.
- No automatic polling is implemented; the lobby updates only when the user clicks
  `Refresh Room`.
- No game start endpoint or backend transition out of `lobby` exists. `RoomStatus` is
  currently only `"lobby"`.
- The lobby `Start Game` button navigates directly to `/game`; it does not call the
  backend, check host permissions, or require two players.
- No drawer assignment or secret-word visibility logic is implemented.
- No drawing state, clear-canvas action, guess submission handling, score tracking, result
  state, or restart flow is implemented.
- Player names and room codes are accepted with minimal validation; trimming and empty
  input rejection still need to be defined and implemented.

## Assumptions

- The first participant created with a room will become the host.
- The host will become the drawer when the first round starts.
- Word selection will remain deterministic and use the starter word list from
  `backend/src/seed/starterData.ts`.
- Room state remains in memory only; restarting the backend clears all rooms.
- Synchronization will use HTTP polling, not WebSockets or another push protocol.

## Relevant Files

### Backend

- `backend/src/models/game.ts` - room, participant, status, and snapshot types.
- `backend/src/services/roomStore.ts` - in-memory room creation, joining, lookup, and
  snapshot conversion.
- `backend/src/api/rooms.ts` - room create, join, and fetch routes.
- `backend/src/api/schemas.ts` - current Zod request/query schemas and HTTP error helper.
- `backend/src/seed/starterData.ts` - starter words and roles.

### Frontend

- `frontend/src/services/api.ts` - room API client and frontend snapshot types.
- `frontend/src/state/roomStore.ts` - client-side room session state and fetch logic.
- `frontend/src/pages/CreateRoomPage.tsx` - create-room form flow.
- `frontend/src/pages/JoinRoomPage.tsx` - join-room form flow.
- `frontend/src/pages/LobbyPage.tsx` - participant list, manual refresh, and start button.
- `frontend/src/pages/GamePage.tsx` - placeholder game screen.
- `frontend/src/components/GuessForm.tsx` - placeholder guess submission form.
- `frontend/src/components/Scoreboard.tsx` - placeholder scoreboard.
- `frontend/src/components/ResultPanel.tsx` - placeholder activity/result panel.
