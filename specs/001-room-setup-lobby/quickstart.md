# Quickstart: Room Setup & Lobby

**Feature**: `001-room-setup-lobby`  
**Branch**: `001-room-setup-lobby`

## Prerequisites

- Node.js 18+ installed
- Repo cloned; you are on branch `001-room-setup-lobby`

## Running the App

```bash
# Terminal 1 — backend
cd backend && npm run dev
# Starts on http://localhost:3001

# Terminal 2 — frontend
cd frontend && npm run dev
# Starts on http://localhost:5173
```

## Verifying the Feature

### Create a Room

1. Open `http://localhost:5173`
2. Click **Create Room**
3. Enter a player name → click **Create**
4. Lobby appears showing your name; you are the host

### Join a Room

1. Open a second browser tab/window at `http://localhost:5173`
2. Click **Join Room**
3. Enter the 4-character room code and a player name → click **Join**
4. Both tabs now show 2 participants in the lobby

### Polling Verification

- The participant list in the lobby updates automatically (no manual refresh)
- If the backend server is stopped, the lobby should redirect to `/` within ~2 seconds

### Start the Game

1. From the host's lobby tab (Tab 1), click **Start Game** (enabled once ≥2 players)
2. Tab 1 navigates immediately to `/game`
3. Tab 2 navigates to `/game` within the next polling cycle (~2s)

### Mid-Game Join Rejection

1. With a game in progress, attempt to join from a third tab using the same room code
2. The join form should display: **"Game already in progress"**

## Running Tests

```bash
# Backend unit tests
cd backend && npm test

# Frontend unit tests
cd frontend && npm test
```

## Key Files Modified by This Feature

| File                                | Change                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------- |
| `backend/src/models/game.ts`        | Added `hostId`, `"playing"`                                               |
| `backend/src/services/roomStore.ts` | `createRoom` sets `hostId`; `joinRoom` rejects non-lobby; new `startRoom` |
| `backend/src/api/schemas.ts`        | `startRoomSchema`                                                         |
| `backend/src/api/rooms.ts`          | `POST /:code/start` handler                                               |
| `frontend/src/services/api.ts`      | Fixed URL defect; added `startRoom()`                                     |
| `frontend/src/state/roomStore.ts`   | Added `startRoom()` action                                                |
| `frontend/src/pages/LobbyPage.tsx`  | Polling; host-only Start button                                           |

## Environment

No `.env` file is required for local development — the API base URL fallback is fixed in `api.ts`. If you prefer to override it:

```bash
# frontend/.env.local
VITE_API_URL=http://localhost:3001/api
```
