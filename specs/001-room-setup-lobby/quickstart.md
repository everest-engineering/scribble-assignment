# Quickstart: Room Setup & Lobby

## Prerequisites

- Node.js 18+, npm 9+
- Backend and frontend running (see root README)

## Running the Feature

1. Start the backend:
   ```bash
   cd backend && npm run dev
   ```

2. Start the frontend:
   ```bash
   cd frontend && npm run dev
   ```

3. Open `http://localhost:5173` in two browser tabs.

## Testing the Feature

### Manual Test (Two Browser Tabs)

**Tab 1 — Create Room**:
1. Enter a name (e.g., "Alice") and click "Create Room"
2. Verify you land on the lobby showing room code and "Alice" in the list
3. Verify the "Start Game" button is visible but says "Waiting for players..."

**Tab 2 — Join Room**:
1. Click "Join Room" and enter the code from Tab 1
2. Enter a name (e.g., "Bob") and click "Join"
3. Verify you land on the same lobby showing both "Alice" and "Bob"
4. Verify no "Start Game" button is visible (non-host)

**Back to Tab 1**:
1. Verify participant list now shows both "Alice" and "Bob" (within ~2s)
2. Verify "Start Game" button is now enabled
3. Click "Start Game"
4. Verify you transition to the game screen

**Validation**:
- Try creating a room with an empty name → error message
- Try joining with an empty code → error message
- Try joining a non-existent code → error message
- Open a third tab and create a different room → verify isolation

### Automated Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## Key Files

| File | Purpose |
|------|---------|
| `backend/src/api/rooms.ts` | Room creation, join, start endpoints |
| `backend/src/services/roomService.ts` | Room business logic |
| `backend/src/models/types.ts` | Room, Participant types |
| `frontend/src/pages/CreateRoomPage.tsx` | Create room form |
| `frontend/src/pages/JoinRoomPage.tsx` | Join room form |
| `frontend/src/pages/LobbyPage.tsx` | Lobby with polling |
| `frontend/src/services/api.ts` | API client |
| `frontend/src/state/roomStore.ts` | Room state management |
