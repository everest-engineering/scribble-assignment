# Discovery Notes

## Section I: Existing Behaviour

### Current backend behavior
- The backend exposes HTTP room endpoints in [backend/src/api/rooms.ts](/Users/usha/Documents/AI-SESSIONS/scribble-assignment/backend/src/api/rooms.ts):
  - `POST /rooms` creates a room
  - `POST /rooms/:code/join` joins a room
  - `GET /rooms/:code` loads the current room snapshot
- Room state is stored in memory in [backend/src/services/roomStore.ts](/Users/usha/Documents/AI-SESSIONS/scribble-assignment/backend/src/services/roomStore.ts) using a `Map`, so a backend restart clears all rooms.
- Creating a room automatically creates the first participant and returns a `participantId` plus a room snapshot.
- Joining a room appends a new participant to the in-memory room and returns the updated snapshot.
- Room snapshots currently include the room code, status, participants, available starter words, and starter roles from [backend/src/seed/starterData.ts](/Users/usha/Documents/AI-SESSIONS/scribble-assignment/backend/src/seed/starterData.ts).
- The room model is defined in [backend/src/models/game.ts](/Users/usha/Documents/AI-SESSIONS/scribble-assignment/backend/src/models/game.ts).

### Current frontend behavior
- The app shell and route setup are wired through [frontend/src/App.tsx](/Users/usha/Documents/AI-SESSIONS/scribble-assignment/frontend/src/App.tsx) and [frontend/src/routes/index.tsx](/Users/usha/Documents/AI-SESSIONS/scribble-assignment/frontend/src/routes/index.tsx).
- Room actions are handled by the client store in [frontend/src/state/roomStore.ts](/Users/usha/Documents/AI-SESSIONS/scribble-assignment/frontend/src/state/roomStore.ts), which keeps the current room snapshot and `participantId` in memory.
- The API client in [frontend/src/services/api.ts](/Users/usha/Documents/AI-SESSIONS/scribble-assignment/frontend/src/services/api.ts) uses HTTP requests against the backend and defaults to `http://localhost:3001` unless `VITE_API_URL` is set.
- The start screen in [frontend/src/pages/StartPage.tsx](/Users/usha/Documents/AI-SESSIONS/scribble-assignment/frontend/src/pages/StartPage.tsx) offers navigation into create-room and join-room flows.
- The create-room and join-room screens in [frontend/src/pages/CreateRoomPage.tsx](/Users/usha/Documents/AI-SESSIONS/scribble-assignment/frontend/src/pages/CreateRoomPage.tsx) and [frontend/src/pages/JoinRoomPage.tsx](/Users/usha/Documents/AI-SESSIONS/scribble-assignment/frontend/src/pages/JoinRoomPage.tsx) submit names and room codes to the backend, then navigate into the lobby.
- The join-room form uppercases the room code as the user types, while the backend currently accepts the `playerName` and `code` fields with only minimal schema validation.
- The lobby in [frontend/src/pages/LobbyPage.tsx](/Users/usha/Documents/AI-SESSIONS/scribble-assignment/frontend/src/pages/LobbyPage.tsx) already has a manual `Refresh Room` button and a `Start Game` button.
- The game screen in [frontend/src/pages/GamePage.tsx](/Users/usha/Documents/AI-SESSIONS/scribble-assignment/frontend/src/pages/GamePage.tsx) is currently a placeholder layout with canvas, guess, scoreboard, and result panels.

## Section II: Incomplete Behaviour

1. No drawing state, clear-canvas action, guess submission handling, score tracking, result state, or restart flow is implemented.
2. No automatic polling is implemented, so the lobby updates only when the user clicks `Refresh Room`.
3. Host behavior is not enforced yet, so the current `Start Game` action does not check host-only permissions or minimum player count.
4. Player names and room codes are only minimally validated right now; trim rules and empty-input rejection still need to be defined and implemented.

## Section III: Assumptions

1. Starter words will continue to come from the existing seeded data in [backend/src/seed/starterData.ts](/Users/usha/Documents/AI-SESSIONS/scribble-assignment/backend/src/seed/starterData.ts).
2. The implementation must remain HTTP-only and must not introduce WebSockets or any other push-based transport.
3. Room and game state remain in memory only, so refreshing or restarting the backend can remove active rooms and reset gameplay state.
4. The first participant created with a room will become the host unless later spec work explicitly changes that rule.

## Relevant Files

- [backend/src/api/rooms.ts](/Users/usha/Documents/AI-SESSIONS/scribble-assignment/backend/src/api/rooms.ts)
- [backend/src/services/roomStore.ts](/Users/usha/Documents/AI-SESSIONS/scribble-assignment/backend/src/services/roomStore.ts)
- [backend/src/models/game.ts](/Users/usha/Documents/AI-SESSIONS/scribble-assignment/backend/src/models/game.ts)
- [backend/src/seed/starterData.ts](/Users/usha/Documents/AI-SESSIONS/scribble-assignment/backend/src/seed/starterData.ts)
- [frontend/src/state/roomStore.ts](/Users/usha/Documents/AI-SESSIONS/scribble-assignment/frontend/src/state/roomStore.ts)
- [frontend/src/services/api.ts](/Users/usha/Documents/AI-SESSIONS/scribble-assignment/frontend/src/services/api.ts)
- [frontend/src/pages/StartPage.tsx](/Users/usha/Documents/AI-SESSIONS/scribble-assignment/frontend/src/pages/StartPage.tsx)
- [frontend/src/pages/CreateRoomPage.tsx](/Users/usha/Documents/AI-SESSIONS/scribble-assignment/frontend/src/pages/CreateRoomPage.tsx)
- [frontend/src/pages/JoinRoomPage.tsx](/Users/usha/Documents/AI-SESSIONS/scribble-assignment/frontend/src/pages/JoinRoomPage.tsx)
- [frontend/src/pages/LobbyPage.tsx](/Users/usha/Documents/AI-SESSIONS/scribble-assignment/frontend/src/pages/LobbyPage.tsx)
- [frontend/src/pages/GamePage.tsx](/Users/usha/Documents/AI-SESSIONS/scribble-assignment/frontend/src/pages/GamePage.tsx)
