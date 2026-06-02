# Quickstart: Room Setup & Lobby

## Prerequisites

- Node.js 18+ and npm 9+
- Backend running on `http://localhost:3001`
- Frontend running on `http://localhost:5173`

## Setup

```bash
# Terminal 1 — Backend
cd backend
npm install
npm run dev

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

## Test Flow (Two Browser Tabs)

### US1: Create Room
1. Open Tab A at `http://localhost:5173`
2. Click "Create Room"
3. Enter display name (e.g., "Alice")
4. Click submit → should land on Lobby
5. Verify: room code badge visible, Alice listed as only participant, "Start Game" button present

### US2: Join Room
1. Open Tab B at `http://localhost:5173`
2. Click "Join Room"
3. Enter the room code from Tab A
4. Enter display name (e.g., "Bob")
5. Click submit → should land on Lobby
6. Verify: both tabs show "Alice" and "Bob" within ~3 seconds

### US3: Host Starts Game
1. In Tab A (Alice, host), click "Start Game"
2. Verify: both tabs navigate to Game screen
3. In Tab B (Bob, non-host), verify "Start Game" is not present/disabled

### Edge Cases
- Try joining with empty room code → error message
- Try joining with non-existent code → error message  
- Try creating a room with empty name → error message
- Try starting game with only 1 player → disabled button or error

## Validation

```bash
cd backend && npm run build
cd frontend && npm run build
```
