# Quickstart: Game Start & Drawer Flow

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

### Game Start & Drawer Assignment

1. Open `http://localhost:5173` in two browser tabs
2. **Tab 1**: Create room with a valid name, e.g. "Alice"
3. **Tab 2**: Join room with a different valid name, e.g. "Bob"
4. Both tabs see both players in the lobby
5. **Tab 1** (host) clicks "Start Game"
6. Both tabs navigate to the game screen
7. **Tab 1** (host) sees they are the drawer and the secret word is displayed
8. **Tab 2** sees Alice is the drawer but does NOT see the secret word

### Name Validation

1. Try creating a room with an empty name → rejected with error message
2. Try creating a room with whitespace-only name → rejected
3. Try creating a room with name "  Alice  " → trimmed to "Alice", accepted
4. Try creating a room with name containing `@` or `!` → rejected
5. Try creating a room with name longer than 15 characters → rejected
6. Same validation applies when joining a room

## Key Implementation Notes

- Secret word is deterministically selected via DJB2 hash of room code modulo word list length
- Drawer is always the host for round 1 (no rotation)
- Secret word is only included in API responses when the requesting participant is the drawer
- `drawerId` is exposed to ALL participants so the UI can identify the drawer
- Player names are trimmed, validated against `[A-Za-z0-9 _-]+`, max 15 chars
- Backend state is in-memory and lost on restart
- Game state sync via ~2s polling (consistent with existing lobby mechanism)
- Room cleanup of idle rooms runs every 5 minutes (existing)
