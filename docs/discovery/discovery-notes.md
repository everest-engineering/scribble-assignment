# Discovery Notes

## Incomplete Behaviors

1. Create Room is showing a "Route not found" message after entering a player name and clicking "Create and Continue".

2. Host functionality and game start flow are not visible while exploring the current application.

3. Drawing, guessing functionality, scoring, result screen, restart flow are not available in the current application and appear to be incomplete.

## Assumptions

1. The backend APIs are running correctly because the health endpoint returns a successful response.

2. The "Route not found" message is likely caused by incomplete frontend routing or navigation configuration.

## Relevant Files To Explore

- frontend/src/App.tsx
- frontend/src/pages/CreateRoomPage.tsx
- frontend/src/pages/JoinRoomPage.tsx
- frontend/src/pages/LobbyPage.tsx
- frontend/src/pages/GamePage.tsx
- backend/src/api
- backend/src/services
