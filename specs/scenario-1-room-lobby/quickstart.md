# Quickstart: Scenario 1 — Room Setup & Lobby

**Phase**: 1 — Design & Contracts

## Prerequisites

- Backend running: `cd backend && npm run dev`
- Frontend running: `cd frontend && npm run dev`

## Test Scenario: Full Lobby Flow

### 1. Create a Room

1. Open `http://localhost:5173` in a browser
2. Click "Create Room"
3. Enter a player name (e.g., "Alice")
4. Click "Create and Continue"
5. **Expected**: Redirected to `/lobby`. Room code displayed. Alice is listed as the only participant. "Start Game" button is visible (Alice is host) but disabled (only 1 player).

### 2. Join the Room (Second Browser)

1. Open `http://localhost:5173` in a second browser/incognito window
2. Click "Join Room"
3. Enter a player name (e.g., "Bob")
4. Enter the room code shown in Alice's lobby
5. Click "Join Lobby"
6. **Expected**: Redirected to `/lobby`. Bob is listed. Auto-polling updates within ~2 seconds — Alice's lobby shows Bob, Bob's lobby shows Alice.

### 3. Verify Host and Start

**On Bob's window**: "Start Game" button should be hidden (Bob is not host).
**On Alice's window**: "Start Game" button should be enabled (Alice is host, 2 players present).

### 4. Edge Cases

**Empty room code**:
1. On Join Room page, leave code blank and click "Join Lobby"
2. **Expected**: Error message "Room code is required" — no API call made.

**Invalid room code**:
1. Enter a non-existent code like "ZZZZ"
2. **Expected**: Error message "Unable to join room"

**Host tries to start with 1 player**:
1. Create a room but don't invite anyone
2. **Expected**: "Start Game" button disabled (or API returns 400)

## API Verification (curl)

```bash
# Create room
curl -s -X POST http://localhost:3001/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"playerName":"Alice"}' | jq

# Join room (replace CODE with actual code from above)
curl -s -X POST http://localhost:3001/api/rooms/CODE/join \
  -H "Content-Type: application/json" \
  -d '{"playerName":"Bob"}' | jq

# Start game (replace CODE and participantId)
curl -s -X POST http://localhost:3001/api/rooms/CODE/start \
  -H "Content-Type: application/json" \
  -d '{"participantId":"alice-uuid"}' | jq
```
