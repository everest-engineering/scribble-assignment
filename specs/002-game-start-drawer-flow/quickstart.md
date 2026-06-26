# Quickstart: Game Start & Drawer Flow

## Prerequisites

- Node.js 18+
- Backend and frontend dependencies installed (`npm install` in both `backend/` and `frontend/`)
- Scenario 1 (Room Setup & Lobby) fully implemented — rooms can be created, joined, and started

## Setup

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

Backend runs on `http://localhost:3001`, frontend on `http://localhost:5173`.

## Validation Scenarios

### Scenario 1: Drawer Assignment on Game Start

1. Open `http://localhost:5173` in browser tab A.
2. Click **Create Room**, enter "Alice", submit.
3. Open tab B at `http://localhost:5173`, click **Join Room**, enter the room code and "Bob", submit.
4. In tab A (Alice, host), click **Start Game**.
5. **Expected**: Both tabs navigate to the game screen.
6. **Expected**: Both tabs show "Drawer: Alice" or equivalent drawer identity indicator.
7. **Expected**: Tab A (Alice) sees "You are the drawer!" with the secret word "rocket".
8. **Expected**: Tab B (Bob) sees "Waiting for Alice to draw..." without any secret word.

### Scenario 2: Word Visibility — Server-Side Filtering

1. Complete Scenario 1.
2. In tab A (Alice, drawer), **Expected**: Secret word "rocket" is visible in the UI.
3. Open browser DevTools in tab B (Bob, guesser).
4. Check the Network tab for the `GET /rooms/:code` response.
5. **Expected**: The response for Bob does NOT contain a `secretWord` field.
6. **Expected**: Tab B shows no trace of the word in the DOM or page source.

### Scenario 3: Page Refresh Recovery

1. Complete Scenario 1 with a game in progress.
2. In tab A (Alice), refresh the browser page.
3. **Expected**: Alice returns to the game screen as the drawer, still seeing "rocket".
4. In tab B (Bob), refresh the browser page.
5. **Expected**: Bob returns to the game screen as a guesser, word not visible.

### Scenario 4: Multi-Player Drawer Labeling

1. Open tab A at `http://localhost:5173`, create room as "Alice".
2. Open tab B, join as "Bob".
3. Open tab C, join as "Charlie".
4. In tab A, start the game.
5. **Expected**: All three tabs show Alice as the drawer. Bob and Charlie are labeled as guessers.

### Scenario 5: Backend Restart During Game

1. Complete Scenario 1 to have a game in progress.
2. Stop and restart the backend (`Ctrl+C`, then `npm run dev`).
3. In any tab, refresh the page.
4. **Expected**: The app shows "Room no longer available" (or error) and navigates to the home screen.

## Verification

Run the test suite:

```bash
cd backend && npm test
cd frontend && npm test
```

All existing tests must pass. New tests should cover:
- `startGame()` assigns drawer (host) and secret word (round 1 → "rocket")
- `toRoomSnapshot()` includes `secretWord` for drawer, excludes for others
- `toRoomSnapshot()` includes `currentRound` and `drawerId` when status is "playing"
- GamePage renders drawer view vs. guesser view correctly
- sessionStorage read/write integration

## Contracts Reference

See `contracts/api.md` for full API endpoint specifications and sessionStorage contract.

## Data Model Reference

See `data-model.md` for entity extensions and field definitions.
