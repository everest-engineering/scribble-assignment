# Quickstart: Host Start Control

**Phase**: 1 | **Date**: 2026-07-06

## Verification Steps

1. Start the backend: `cd backend && npm run dev`
2. Start the frontend: `cd frontend && npm run dev`
3. Open `http://localhost:5173` in two browser tabs.

### Test: Host Sees Start Game Button

1. In Tab 1, create a room.
2. **Expected**: The "Start Game" button is visible but disabled, since only 1 player is present.

### Test: Button Enables With 2+ Players

1. In Tab 2, join the room created in Tab 1.
2. **Expected**: Within ~2 seconds (auto-poll), Tab 1's "Start Game" button becomes enabled.

### Test: Non-Host Does Not See Button

1. In Tab 2 (non-host joiner), check the Lobby page.
2. **Expected**: No "Start Game" button is visible. The status card shows "Waiting for the host to start the game."

### Test: Button Disables When Player Leaves

1. With both tabs in the room, close Tab 2.
2. **Expected**: Tab 1's "Start Game" button becomes disabled again within ~2 seconds.

### Build Validation

```bash
cd frontend && npm run build
```

Build MUST pass before considering the feature complete.
