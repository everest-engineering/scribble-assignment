# Quickstart: Game Rounds Validation

## Prerequisites

- Node.js 18+
- Backend and frontend running (see `backend/README.md` or `frontend/README.md`)
- Feature 001 (Lobby & Host Management) implemented and working

## Setup

```bash
# Terminal 1 — Backend
cd backend && npm install && npm run dev

# Terminal 2 — Frontend
cd frontend && npm install && npm run dev
```

## Validation Scenarios

### 1. Role Assignment on Game Start

1. Create a room with 2+ players (see [quickstart 001](../001-lobby-host-management/quickstart.md))
2. Host clicks **Start Game**
3. Both players are redirected to `/game`
4. **Expected**:
   - Host sees role "Drawer" in the Player Info panel
   - Other players see role "Guesser"
   - Exactly one drawer exists
5. **Contract**: `POST /rooms/:code/start` returns roles populated (see [contracts/api.md](contracts/api.md#post-roomscodestart--start-game-updated))

### 2. Secret Word Visibility — Drawer

1. Complete Scenario 1 (game started)
2. Host (drawer) looks at the game page
3. **Expected**: The drawer sees the secret word displayed (e.g., "pizza") — not "Waiting for drawer..." or a placeholder
4. **Contract**: `GET /rooms/:code?participantId=<drawer-id>` returns `word` field (see [contracts/api.md](contracts/api.md#get-roomscode--get-room-state-role-aware-word-visibility))

### 3. Secret Word Hidden from Guessers

1. Complete Scenario 1 (game started)
2. Non-host player (guesser) looks at the game page
3. **Expected**: The guesser does **not** see the secret word. They see a message like "Drawer is drawing..." or a placeholder
4. **Contract**: `GET /rooms/:code?participantId=<guesser-id>` omits `word` field (see [contracts/api.md](contracts/api.md#get-roomscode--get-room-state-role-aware-word-visibility))

### 4. Drawer Identity Visible to All

1. Complete Scenario 1 (game started)
2. Both players look at their game page
3. **Expected**: Both players see who the drawer is (e.g., "Alice is drawing" in the Player Info panel)
4. **Contract**: All participants have `role` populated in snapshot (see [data-model.md](data-model.md#participantsnapshot-added-role-population))

### 5. Room Status Transitions to "playing"

1. Complete Scenario 1 (game started)
2. Check the room code badge or status display
3. **Expected**: Room status shows "playing" or equivalent
4. **Contract**: `GET /rooms/:code` returns `status: "playing"` (see [data-model.md](data-model.md#state-transitions))

### 6. Join Rejected During Active Game (regression)

1. Complete Scenario 1 (game started)
2. Open a third browser window, try to join the same room
3. **Expected**: Error "Game already in progress" (unchanged from 001)

## Run Existing Tests

```bash
cd backend && npm test
cd frontend && npm test
```
