# Quickstart: Automatic Lobby Polling

**Phase**: 1 | **Date**: 2026-07-06

## Verification Steps

1. Start the backend: `cd backend && npm run dev`
2. Start the frontend: `cd frontend && npm run dev`
3. Open `http://localhost:5173` in two browser tabs.

### Test: Auto-refresh on Player Join

1. In Tab 1, create a room.
2. Note the room code shown in Tab 1.
3. In Tab 2, join the same room.
4. **Expected**: Within ~2 seconds, Tab 1's participant list updates to show the new player without clicking "Refresh Room".

### Test: Auto-navigate on Game Start

1. With both tabs in the same room, start the game from Tab 1 (host).
2. **Expected**: Tab 2 auto-navigates to the game page within ~2 seconds without user interaction.

### Test: Auto-navigate on Room Deleted

1. In Tab 1, create a room.
2. In Tab 2, join the same room.
3. Close Tab 1 (or stop the backend).
4. **Expected**: Within ~2 seconds, Tab 2 is navigated to the home page with an error message.

### Test: Manual Refresh Still Works

1. While auto-polling is active, click "Refresh Room".
2. **Expected**: The participant list updates immediately. Polling continues on schedule.

### Build Validation

```bash
cd frontend && npm run build
```

Build MUST pass before considering the feature complete.
