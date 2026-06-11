# Quickstart: Room Setup & Lobby

**Date**: 2026-06-11
**Spec**: [spec.md](./spec.md)
**Data Model**: [data-model.md](./data-model.md)
**API Contracts**: [contracts/api.md](./contracts/api.md)

## Prerequisites

- Node.js 18+ and npm 9+
- Two browser tabs/windows (for multiplayer validation)

## Setup

```bash
# Terminal 1 — Backend
cd backend
npm install
npm run dev       # starts on http://localhost:3001

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev       # starts on http://localhost:5173
```

## Validation Scenarios

### Scenario 1: Create Room as Host

1. Open `http://localhost:5173` in Tab A.
2. Enter a name (e.g., "Alice") and click **Create Room**.
3. **Expected**: Redirected to lobby. Room code (4 uppercase chars) displayed
   prominently. "Alice" shown in participant list, marked as host.

### Scenario 2: Join Room with Valid Code

1. Note the room code from Scenario 1.
2. Open Tab B at `http://localhost:5173`, enter a name (e.g., "Bob").
3. Enter the room code from Tab A and click **Join Room**.
4. **Expected**: Redirected to lobby. "Bob" shown in participant list. No host
   marker on Bob's name.

### Scenario 3: Lobby Auto-Polling

1. With Tab A (host) and Tab B (joiner) both in the lobby:
2. **Expected**: Within ~3 seconds, Tab A's participant list updates to show
   "Bob" without pressing any refresh button.

### Scenario 4: Reject Invalid Room Codes

1. On the Join Room page, click **Join** with an empty code field.
2. **Expected**: Clear error message shown (e.g., "Please enter a room code").
   No navigation occurs.
3. Enter a non-existent code (e.g., "ZZZZ") and click **Join**.
4. **Expected**: Error message shown (e.g., "Room not found").

### Scenario 5: Host-Only Start Game

1. With Tab A (host, lobby, ≥2 players):
2. **Expected**: **Start Game** button visible and enabled.
3. With Tab B (non-host, lobby, ≥2 players):
4. **Expected**: No **Start Game** button. "Waiting for host to start..."
   message shown.
5. Tab A clicks **Start Game**.
6. **Expected**: Both tabs transition to game screen. Room status is now
   `"playing"`.

## Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

Key tests to run after implementation:
- `roomStore.test.ts` — create room, join room, start game, host validation
- `schemas.test.ts` — Zod validation for new start/join schemas
- `api.test.ts` — frontend API client methods for start game
