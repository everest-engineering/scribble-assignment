# Quickstart: Lobby & Host Management Validation

## Prerequisites

- Node.js 18+
- Backend and frontend running (see `backend/README.md` or `frontend/README.md`)

## Setup

```bash
# Terminal 1 — Backend
cd backend && npm install && npm run dev

# Terminal 2 — Frontend
cd frontend && npm install && npm run dev
```

## Validation Scenarios

### 1. Host Creation & Identification

1. Open `http://localhost:5173`
2. Click **Create Room**
3. Enter name "Alice" and submit
4. **Expected**: Redirected to `/lobby`. Room code badge visible. Participant list shows "Alice" with host indicator (e.g., crown icon or "(Host)" label).
5. **Contract**: `POST /rooms` returns `participants[0].isHost === true` (see [contracts/api.md](contracts/api.md#post-rooms--create-room))

### 2. Player Join with Validation

1. In a second browser window, navigate to `/join-room`
2. Submit with empty name → **Expected**: inline error "Name is required"
3. Submit with whitespace-only name ("   ") → **Expected**: inline error "Name is required"
4. Submit with a 31+ character name → **Expected**: inline error "Name must be 30 characters or less"
5. Submit with leading/trailing spaces ("  Bob  ") → **Expected**: name displays as "Bob"
6. Enter valid name + room code → **Expected**: redirected to `/lobby`, sees both "Alice" and "Bob" in list
7. **Contract**: `POST /rooms/:code/join` validates via Zod schema (see [data-model.md](../data-model.md#validation-rules))

### 3. Lobby Auto-Refresh (Polling)

1. Host is on `/lobby` (Window 1)
2. Open Window 2, join the same room
3. **Expected**: Within ~3 seconds, Window 1 shows "Bob" in the participant list without manual refresh
4. Disconnect network (DevTools → Network → Offline)
5. **Expected**: Lobby shows subtle loading indicator, existing state preserved
6. Reconnect → **Expected**: list updates again
7. **Contract**: `GET /rooms/:code` polled at 2s interval (see [data-model.md](../data-model.md#state-transitions))

### 4. Host-Only Start Game

1. Host (Alice) is on `/lobby` with at least 1 other player
2. **Expected**: Alice sees an enabled "Start Game" button
3. Bob (Window 2) is on same `/lobby`
4. **Expected**: Bob sees **no** "Start Game" button
5. Alice clicks "Start Game"
6. **Expected**: Both windows navigate to `/game`, room state shows `status: "playing"`
7. **Contract**: `POST /rooms/:code/start` validates host status server-side (see [contracts/api.md](contracts/api.md#post-roomscodestart--start-game-new))

### 5. Start Game Validation — Insufficient Players

1. Host creates room alone (only 1 participant)
2. **Expected**: "Start Game" button is **disabled** with message "At least 2 players required"
3. **Contract**: Server returns 400 if `POST /rooms/:code/start` called with <2 participants

### 6. Join Rejected — Game in Progress

1. Complete Scenario 4 (game started)
3. Open third window, try to join the same room
4. **Expected**: Error message "Game already in progress"
5. **Contract**: `POST /rooms/:code/join` checks `room.status === "lobby"` (see [contracts/api.md](contracts/api.md#post-roomscodejoin--join-room))

## Run Existing Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

New tests added for this feature will be in:
- `backend/src/api/schemas.test.ts` — name validation schemas
- `backend/src/services/roomStore.test.ts` — host assignment, host transfer, start game
- `frontend/src/services/api.test.ts` — `startGame` API call
