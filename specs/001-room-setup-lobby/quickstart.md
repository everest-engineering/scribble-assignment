# Quickstart: Room Setup & Lobby

## Prerequisites

- Node.js 18+
- Backend and frontend dependencies installed (`npm install` in both `backend/` and `frontend/`)

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

### Scenario 1: Create a Room

1. Open `http://localhost:5173` in a browser.
2. Click **Create Room**.
3. Enter a player name (e.g., "Alice") and submit.
4. **Expected**: Lobby screen appears with a 4-character room code.
   Alice is identified as the host.

### Scenario 2: Join a Room

1. From Scenario 1, note the room code.
2. Open a second browser tab at `http://localhost:5173`.
3. Click **Join Room**.
4. Enter the room code and a player name (e.g., "Bob") and submit.
5. **Expected**: Both tabs show Alice and Bob in the participant list.

### Scenario 3: Lobby Auto-Refresh

1. Complete Scenario 2.
2. **Expected**: The lobby in tab A (Alice) shows Bob within ~2-3 seconds
   without any manual refresh.

### Scenario 4: Host-Only Start

1. With 2 players in the lobby (from Scenario 2), observe the host tab (Alice).
2. **Expected**: Alice sees an active **Start Game** button.
3. In Bob's tab, **Expected**: No start button is visible.
4. Alice clicks **Start Game**.
5. **Expected**: Both tabs navigate to the game screen.

### Scenario 5: Validation

1. Try creating/joining with an empty name.
   **Expected**: Clear error message, no room created.
2. Try joining a non-existent code.
   **Expected**: "Room not found" error.
3. Try starting the game with only 1 player.
   **Expected**: Start button disabled/hidden with "need 2 players" message.
4. Create two rooms in separate sessions.
   **Expected**: Each room has a unique code and independent participant lists.

## Contracts Reference

See `contracts/api.md` for full API endpoint specifications.

## Data Model Reference

See `data-model.md` for entity definitions and validation rules.
