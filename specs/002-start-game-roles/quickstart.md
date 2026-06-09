# Quickstart: Game Start & Role Assignment

## Prerequisites

- Node.js 18+ and npm 9+
- Two browser tabs (for testing multiplayer)
- The Room Setup & Lobby feature must be fully implemented and running

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

### Setup: Create a Room with Two Players

1. Open `http://localhost:5173` in Tab A
2. Click **Create Room**, enter a name (e.g., "Sketch Captain"), and create
3. Note the room code displayed in the lobby
4. Open `http://localhost:5173` in Tab B
5. Click **Join Room**, enter a name (e.g., "Second Pencil"), enter the room code, and join

### Verify Host Starts Game

1. In Tab A (host), verify the **Start Game** button is visible and clickable
2. Click **Start Game**
3. Verify both tabs transition from the lobby to a game screen
4. In Tab A, verify you see your role ("You are a Guesser" or "You are the Drawer")
5. In Tab B, verify you see your role

### Verify Drawer Sees Word Options

1. Identify which tab is the drawer (look for "You are the Drawer" message)
2. In the drawer's tab, verify 3 word options are displayed
3. In the guesser's tab, verify no word options or secret word is visible

### Verify Drawer Selects a Word

1. In the drawer's tab, click on one of the 3 word options
2. Verify the selected word is now displayed prominently as the secret word
3. Verify the guesser's tab still shows no word

### Verify Start Game Errors

1. Create a new room as host (1 player only)
2. Click **Start Game**
3. Verify error: "Need at least 2 players to start"

### Verify Non-Host Cannot Start

1. Create a room with 2+ players
2. In the non-host's tab, click **Start Game** (if button is present)
3. Verify an error message appears: "Only the host can start the game"

### Verify Already Started Prevention

1. With a game already in progress, attempt to start again from any player
2. Verify error: "Game has already started"

## Build Validation

```bash
cd backend && npm run build
cd frontend && npm run build
```

Both must pass without errors.
