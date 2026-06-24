# Quickstart: Room Setup & Lobby

## Prerequisites

- Node.js 18+
- npm

## Setup

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

## Running

```bash
# Terminal 1: Start backend (port 3001)
cd backend && npm run dev

# Terminal 2: Start frontend (port 5173)
cd frontend && npm run dev
```

Open `http://localhost:5173` in two browser tabs.

## Manual Testing

### Test: Host creates a room
1. Tab 1: Navigate to `/create-room`
2. Enter "Alice" and click "Create Room"
3. Verify: Redirect to `/lobby`, see "Alice" in participant list with host badge, room code displayed

### Test: Player joins a room
1. Tab 2: Navigate to `/join-room`
2. Enter room code from Tab 1, enter "Bob", click "Join Room"
3. Verify: Redirect to `/lobby`, see both "Alice" (host) and "Bob" in participant list

### Test: Auto-polling shows new joiner
1. After Bob joins, wait up to 3 seconds on Tab 1
2. Verify: Tab 1 auto-updates to show "Bob" without clicking refresh

### Test: Host starts game
1. With 2+ participants in lobby, Tab 1 shows enabled "Start Game" button
2. Click "Start Game"
3. Verify: Both tabs redirect to game view, room status is "playing"

### Test: Host-only start enforcement
1. Tab 2 (Bob, non-host) should show no "Start Game" button
2. Verify: Tab 2 attempts to hit POST /rooms/:code/start directly return 403

### Test: Empty name validation
1. Navigate to `/create-room`, leave name blank, click "Create Room"
2. Verify: Inline error message, not redirected
3. Repeat on `/join-room` with blank name or blank code

### Test: Invalid room code
1. Navigate to `/join-room`, enter "ZZZZ", any name, click "Join Room"
2. Verify: Error message "Room code does not exist", not redirected

### Test: Duplicate display names
1. Alice creates room, Bob joins with name "Alice"
2. Verify: Second Alice appears as "Alice (2)" in participant list

### Test: Rate limiting
1. Rapidly create 6 rooms (within 1 minute)
2. Verify: 6th attempt returns 429 with rate limit message

### Test: Room isolation
1. Create Room A (Tab 1) and Room B (Tab 3)
2. Join Room A with Bob (Tab 2)
3. Verify: Room B's participant list does not include Bob

## Running Automated Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## Key Files

| File | Purpose |
|------|---------|
| `backend/src/services/roomStore.ts` | In-memory store: createRoom, joinRoom, startGame, rate limiting, duplicate-name handling |
| `backend/src/models/game.ts` | Types: Participant (isHost), Room, RoomSnapshot, RoomStatus ("playing") |
| `backend/src/api/rooms.ts` | Routes: POST /rooms, POST /rooms/:code/join, GET /rooms/:code, POST /rooms/:code/start |
| `frontend/src/state/roomStore.ts` | Store: auto-poll interval, startGame action, host-aware state |
| `frontend/src/pages/CreateRoomPage.tsx` | Create form with inline name validation |
| `frontend/src/pages/JoinRoomPage.tsx` | Join form with inline name + code validation |
| `frontend/src/pages/LobbyPage.tsx` | Lobby: participant list, host badge, start button, auto-poll |
