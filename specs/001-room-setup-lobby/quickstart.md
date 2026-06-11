# Quickstart: Room Setup and Lobby

**Phase**: 1 | **Feature**: Room Setup and Lobby | **Date**: 2026-06-11

## Prerequisites

- Node.js 18+
- npm installed in both `backend/` and `frontend/`

## Setup

```bash
# Terminal 1: Start backend
cd backend && npm run dev

# Terminal 2: Start frontend
cd frontend && npm run dev
```

Backend runs on `http://localhost:3001`, frontend on `http://localhost:5173`.

## Validation Scenarios

### Scenario 1: Create a Room

1. Open `http://localhost:5173` in a browser.
2. Click "Create Room".
3. Enter a display name (e.g., "Alice").
4. Click "Create and Continue".
5. **Expected**: You land on `/lobby` showing:
   - Room code badge (4 uppercase characters)
   - "Alice" in the participant list with a host indicator
   - Status card says "Ready to play"
   - Loading spinner shown briefly during creation

### Scenario 2: Join a Room

1. Open a second browser tab to `http://localhost:5173`.
2. Click "Join Room".
3. Enter the room code from Scenario 1 and a display name (e.g., "Bob").
4. Click "Join".
5. **Expected**: You land on `/lobby` showing:
   - Both "Alice" (host) and "Bob" in the participant list
   - Loading spinner shown briefly during join

### Scenario 3: Lobby Polling

1. With both tabs open in the same room (from Scenarios 1 & 2).
2. Check that Tab 2's participant list updates within ~3 seconds of Tab 1's action.
3. **Expected**: Both tabs show the same participant list without manual refresh.

### Scenario 4: Host Starts Game

1. In the host's tab (Alice), verify the "Start Game" button is visible and enabled.
2. In the non-host tab (Bob), verify the "Start Game" button is **not** visible or is disabled.
3. Click "Start Game" as Alice.
4. **Expected**: Room status changes to "playing", all participants see the game begin within 3 seconds.

### Scenario 5: Validation

1. Try creating/joining with an empty display name → error message shown.
2. Try joining with a non-existent room code → error message shown.
3. Try joining a room at max capacity → error message shown.
4. Try starting the game with only 1 participant → error message shown.

### Scenario 6: Leave Room

1. A non-host participant clicks "Leave Room".
2. **Expected**: They return to home screen. Other participants see them removed from the list within 3 seconds.
3. If the host leaves, another participant is promoted to host.

## API‑Only Testing (curl)

```bash
# Create room
curl -s -X POST http://localhost:3001/rooms \
  -H "Content-Type: application/json" \
  -d '{"playerName":"Alice"}' | jq

# Join room (replace CODE with actual room code)
curl -s -X POST "http://localhost:3001/rooms/CODE/join" \
  -H "Content-Type: application/json" \
  -d '{"playerName":"Bob"}' | jq

# Fetch room state
curl -s "http://localhost:3001/rooms/CODE" | jq

# Start game (replace CODE and PID with actual values)
curl -s -X POST "http://localhost:3001/rooms/CODE/start" \
  -H "Content-Type: application/json" \
  -d '{"participantId":"PID"}' | jq
```

## Running Tests

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

Refer to [data-model.md](data-model.md) for entity definitions and [contracts/api-v1.md](contracts/api-v1.md) for endpoint details.
