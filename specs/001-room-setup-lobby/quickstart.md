# Quickstart: Room Setup & Lobby

## Prerequisites

- Node.js 20+
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

## Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## Manual Testing Flow

1. Open `http://localhost:5173` in two browser tabs
2. **Tab 1**: Click "Create Room", enter a name, click "Create and Continue"
3. Note the room code displayed in the lobby
4. **Tab 2**: Click "Join Room", enter a different name, enter the room code
5. Both tabs should show both players in the lobby
6. Tab 1 (host) sees "Start Game" button; Tab 2 does not
7. Tab 1 clicks "Start Game" → game starts for both

## Key Implementation Notes

- Backend state is in-memory and lost on restart
- Lobby polls every ~2 seconds for fresh state
- 5-minute idle room cleanup runs automatically
- Room codes are case-insensitive (uppercased server-side)
