# Quickstart: Testing Game Start & Drawer Flow

## Prerequisites
- Node.js installed (version from `.nvmrc`)
- Backend and frontend dependencies installed

## Steps

1. **Start backend**:
   ```bash
   cd backend && npm run dev
   ```

2. **Start frontend** (new terminal):
   ```bash
   cd frontend && npm run dev
   ```

3. **Create a room** (Player 1 / Host):
   - Open `http://localhost:5173`
   - Enter a player name (e.g., "Alice") and click "Create Room"
   - You are redirected to the lobby

4. **Join the room** (Player 2):
   - Open `http://localhost:5173` in an incognito window
   - Click "Join Room"
   - Enter a player name (e.g., "Bob") and the room code shown in the lobby
   - You are redirected to the same lobby

5. **Start the game** (as host):
   - In the host's window, click "Start Game"
   - Both players are redirected to `/game`
   - **Drawer (Alice)**: Should see "rocket" displayed prominently as the secret word
   - **Guesser (Bob)**: Should NOT see the word; should see "Guess the word!" prompt

6. **Verify name validation**:
   - Try joining with an empty name → error message displayed
   - Try joining with whitespace-only name (e.g., "   ") → error message displayed
   - Try joining with "  Charlie  " → name trimmed to "Charlie"

7. **Verify drawer identification**:
   - All players should see who the drawer is (e.g., "Alice is drawing" header)
