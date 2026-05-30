# Quickstart: Room Setup & Lobby

## Prerequisites

- Install dependencies in both apps if needed:

```bash
cd backend
npm install
```

```bash
cd frontend
npm install
```

## Automated Validation

Run backend checks:

```bash
cd backend
npm run test
npm run build
```

Run frontend checks:

```bash
cd frontend
npm run test
npm run build
```

## Manual Two-Browser Validation

1. Start the backend:

   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend:

   ```bash
   cd frontend
   npm run dev
   ```

3. Open the frontend in two browser tabs.
4. In tab A, create a room as `Host`.
5. Verify tab A shows `Host` as the room host and does not allow game start with only one
   player.
6. In tab B, try joining with an empty room code and verify a clear room-code-required
   error.
7. In tab B, try joining with an unknown room code and verify a clear unable-to-join or
   not-found error.
8. In tab B, join the valid room code from tab A as `Guest`.
9. Verify tab A updates automatically within about two seconds without pressing refresh.
10. Verify tab B is not allowed to start the game.
11. In tab A, start the game and verify both tabs can proceed out of the lobby after the
    next refresh.
12. Create a separate third room in another tab or browser session and verify participants
    from the first room do not appear there.

## Expected Scope Boundaries

- No WebSocket, Socket.io, SSE, or push connection appears in browser network activity.
- Restarting the backend clears rooms.
- No login, account, session, JWT, or OAuth flow appears.
