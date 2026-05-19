# Quickstart: Phase 1 Room Lobby Setup

## Prerequisites

- Install dependencies in both apps.
- Use branch `002-room-lobby-setup`.

## Start the backend

```bash
cd backend
npm run dev
```

Backend expected URL: `http://localhost:3001`

## Start the frontend

```bash
cd frontend
npm run dev
```

Frontend expected URL: `http://localhost:5173`

## Manual Validation Flow

### Story 1: Create and join a lobby

1. Open the app and create a room with a name containing outer spaces.
   Expected: room is created, outer spaces are removed, creator lands in the lobby
   as host.
2. Try to create a room with an empty or whitespace-only name.
   Expected: clear error before entering the lobby.
3. In a second browser or private window, join with the created room code and a
   valid name.
   Expected: join succeeds and the player enters the same lobby.
4. Try joining with:
   - blank room code
   - malformed room code (wrong length or unsupported characters)
   - valid-format room code that does not exist
   Expected: each case shows clear feedback and does not enter a lobby.

### Story 2: Lobby polling and room isolation

1. Create room A in one browser and room B in another.
   Expected: players from room A never appear in room B, and vice versa.
2. Leave one client open in room A's lobby.
3. Join room A from a second client.
   Expected: the waiting client sees the new participant within about 2 seconds
   without pressing refresh.
4. Simulate a transient refresh failure by stopping the backend briefly.
   Expected: the current roster remains visible and the lobby shows refresh feedback.

### Story 3: Host-only start

1. In a one-player room, verify the Start Game control is visible but disabled.
   Expected: the disabled reason says at least 2 players are required.
2. In a two-player room, verify the non-host sees Start Game disabled.
   Expected: the disabled reason says only the host can start.
3. As the host in a two-player room, start the game.
   Expected: the room status changes to `playing` and both clients move to the
   existing `/game` screen.

## Build Validation

```bash
cd backend
npm run build
```

```bash
cd frontend
npm run build
```
