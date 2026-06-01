# Quickstart: Host and Join Lobby Flow

## Prerequisites

- Node.js and npm installed
- Backend and frontend dependencies installed

## Run the app

1. Start the backend:

```bash
cd backend
npm run dev
```

2. Start the frontend:

```bash
cd frontend
npm run dev
```

3. Open the frontend in a browser and use two tabs or windows to simulate two players.

## Manual validation checklist

1. Create a room from the first tab and confirm the creator becomes the host.
2. Join the same room from the second tab and confirm both players appear in the lobby.
3. Leave the lobby open and confirm membership changes appear without manual refresh.
4. Try to start the game before a second player is present and confirm it is blocked.
5. Confirm only the host can start the game once two players are present.

## Notes

- The backend stores room state in memory, so restarting it clears active rooms.
- Lobby updates are expected to appear through polling rather than push-based updates.
