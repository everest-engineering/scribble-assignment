# Quickstart: Room Setup And Lobby

## Prerequisites

- Node.js 22+
- Dependencies installed: `cd backend && npm install` and `cd frontend && npm install`

## Running the App

```bash
# Terminal 1: Start the backend
cd backend && npm run dev

# Terminal 2: Start the frontend
cd frontend && npm run dev
```

Backend runs on `http://localhost:3001`, frontend on `http://localhost:5173`.

## Testing the Feature

### Create a Room (Host)

1. Open `http://localhost:5173` in a browser
2. Click **Create Room**
3. Enter a player name (optional) and click **Create and Continue**
4. You arrive in the lobby showing your room code and player list
5. Your name has a **Host** badge

### Join a Room (Player)

1. Open a second browser/incognito window to `http://localhost:5173`
2. Click **Join Room**
3. Enter the room code from the host's lobby
4. Enter a player name and click **Join Lobby**
5. You arrive in the lobby — both players are visible in the participant list

### Auto-Polling Verification

- After joining, the lobby refreshes automatically every ~2 seconds
- New joiners appear in the player list within ~3 seconds without manual refresh
- The status indicator shows "Refreshing players..." during polls

### Start the Game

1. As the host, ensure at least 1 other player is in the lobby
2. Click **Start Game**
3. The game begins for all players (room status changes to `playing`)

### Edge Cases

- **Empty code**: Submit the join form with an empty code → see "Please enter a room code"
- **Invalid code**: Enter a non-existent code → see "Room not found. Please check the code and try again"
- **Non-host start**: A non-host player tries to start → request is rejected with 403
- **Solo start**: Host tries to start with only 1 player → start button is disabled
