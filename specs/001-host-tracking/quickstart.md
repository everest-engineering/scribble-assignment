# Quickstart: Host Tracking on Room Creation

**Phase**: 1 | **Date**: 2026-07-05

## Verification Steps

1. Start the backend: `cd backend && npm run dev`
2. Start the frontend: `cd frontend && npm run dev`
3. Open `http://localhost:5173` in two browser tabs.

### Test: Room Creator Sees Host Label

1. In Tab 1, click "Create Room".
2. Enter a name and click "Create and Continue".
3. **Expected**: You land on the Lobby. Your name is displayed with a "Host"
   label next to it.

### Test: Joining Player Sees Host Label

1. Note the room code shown in Tab 1.
2. In Tab 2, click "Join Room". Enter the code and a name, then click "Join".
3. **Expected**: You land on the Lobby. The creator's name has a "Host" label.
   Your name does not have a "Host" label.

### Test: Host Label Persists to Game Screen

1. In Tab 1 (as host), click "Start Game".
2. **Expected**: On the game screen, the host label still appears next to the
   creator's name in the player info sidebar and scoreboard.

### Test: Multi-Room Isolation

1. In Tab 1, create a room.
2. In a separate incognito window, create a different room.
3. **Expected**: Each room shows its own creator as the host. No cross-room host
   leakage.

### Build Validation

```bash
cd backend && npm run build
cd ../frontend && npm run build
```

Both builds MUST pass before considering the feature complete.
