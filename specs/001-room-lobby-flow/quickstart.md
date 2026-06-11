# Quickstart: Room Setup and Lobby

## Prerequisites

- Install backend dependencies with `cd backend && npm install` if needed.
- Install frontend dependencies with `cd frontend && npm install` if needed.

## Run Locally

1. Start the backend:

   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend in a second terminal:

   ```bash
   cd frontend
   npm run dev
   ```

3. Open the frontend in a browser at `http://localhost:5173`.

## Manual Validation Flow

1. Create a room as Player A.
2. Confirm Player A lands in the lobby, sees a room code, and is identified as
   Host.
3. Confirm Start Game is unavailable while only Player A is present.
4. Open a second browser tab or window.
5. Join the room as Player B using the room code.
6. Confirm Player B appears in Player A's lobby within approximately 2 seconds.
7. Confirm Player B is not identified as Host and cannot start the game.
8. Confirm Start Game becomes available to Player A after Player B joins.
9. Start the game as Player A.
10. Confirm both Player A and Player B transition to the game screen within 3
    seconds.

## Room-Code Validation Checks

1. Attempt to join with an empty room code.
2. Confirm a clear "room code is required" style message appears.
3. Attempt to join with an invalid room-code format.
4. Confirm a clear invalid-code message appears.
5. Attempt to join with a well-formed but non-existent room code.
6. Confirm a clear room-not-found or unable-to-join message appears.

## Isolation Checks

1. Create Room A in one browser session.
2. Create Room B in another browser session.
3. Join Room A with a second player.
4. Confirm Room B does not show Room A's players.
5. Start Room A as its Host.
6. Confirm Room B remains in the lobby and is not affected.

## Automated Validation

Run focused tests after implementation:

```bash
cd backend
npm run test
npm run build
```

```bash
cd frontend
npm run test
npm run build
```
