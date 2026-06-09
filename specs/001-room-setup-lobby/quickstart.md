# Quickstart: Room Setup & Lobby

## Prerequisites

- Node.js 18+ and npm 9+
- Two browser tabs (for testing multiplayer)

## Start the Backend

```bash
cd backend
npm install    # first time only
npm run dev
```

The backend starts on `http://localhost:3001`.

## Start the Frontend

```bash
cd frontend
npm install    # first time only
npm run dev
```

The frontend starts on `http://localhost:5173`.

## Verify the Feature

### Create a Room (Tab A)

1. Open `http://localhost:5173` in Tab A
2. Click **Create Room**
3. Enter a player name (e.g., "Sketch Captain")
4. Click **Create and Continue**
5. Verify you land on the Lobby page and see your name listed
6. Verify a room code is displayed
7. Verify you are marked as the **Host**

### Join the Room (Tab B)

1. Open `http://localhost:5173` in Tab B
2. Click **Join Room**
3. Enter a player name (e.g., "Second Pencil")
4. Enter the room code from Tab A
5. Click **Join Lobby**
6. Verify you land on the Lobby page and see both players listed

### Verify Auto-Polling

1. With both tabs on the lobby, join from Tab B
2. Verify Tab A's participant list updates automatically within ~2 seconds

### Verify Start Game (Host)

1. In Tab A (as host), click **Start Game**
2. Verify the game starts and all players transition to the game screen

### Verify Start Game (Non-Host)

1. Create or join a room with 2+ players
2. In Tab B (non-host), click **Start Game**
3. Verify an error message appears: "Only the host can start the game"

### Verify Min Players Check

1. Create a room as host (1 player only)
2. Click **Start Game**
3. Verify error: "Need at least 2 players to start"

### Verify Invalid Join Codes

1. On the Join screen, submit an empty code
2. Verify error: "Room code is required"
3. Submit a non-existent code
4. Verify error: "Room not found"

## Build Validation

```bash
cd backend && npm run build
cd frontend && npm run build
```

Both must pass without errors.
