# Plan - Scenario 1 Room Setup And Lobby

## Findings From Discovery

1. Create Room currently shows "Route not found".
2. Lobby polling is not working automatically.
3. Host tracking is not available in the current flow.
4. Start game functionality is not implemented.

## Relevant Files

Frontend

- frontend/src/pages/CreateRoomPage.tsx
- frontend/src/pages/JoinRoomPage.tsx
- frontend/src/pages/LobbyPage.tsx
- frontend/src/state
- frontend/src/App.tsx

Backend

- backend/src/api
- backend/src/services
- backend/src/models

## State Model Changes

Room

- roomCode
- players
- hostPlayerId
- gameState

Player

- playerId
- playerName
- score

## Data Flow

Create Room

Player enters name

- Create room request
- Room created
- Creator becomes host
- Navigate to lobby

Join Room

Player enters room code

- Validate room
- Join room
- Navigate to lobby

Lobby

Lobby polls room data every 2 seconds

- Updates participant list automatically

Start Game

Host clicks start game

- Backend validates minimum 2 players
- Game starts

## Risks

1. Route configuration may be causing the current room creation issue.
2. Polling should be cleaned up properly when leaving the lobby page.
3. Host-only actions must be saved on backend and frontend.

## Testing Strategy

- Create room successfully.
- Join room successfully.
- Invalid room code shows error.
- Two browser tabs see updated participants.
- Only host can start game.
- Start game blocked when less than 2 players exist.
