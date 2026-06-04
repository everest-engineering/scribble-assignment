# Quickstart: Room Lobby Access

## Prerequisites

- Node.js 18+
- npm 9+
- Two browser tabs or windows

## Run the app

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Validate the feature

1. Open `http://localhost:5173`.
2. Create a room and confirm the creator is marked as host.
3. Open a second tab and join the same room code.
4. Wait about 2 seconds, or within the 1500-2500 ms window, and confirm the
   lobby updates without manual refresh.
5. Join a different room code in a third tab and confirm the participants do not
   mix between rooms.
6. Try joining with an empty or invalid code and confirm the UI shows a clear
   error.
7. With only one player in a room, verify the host cannot start the game.
8. Add a second player and verify only the host can start the game.

## Expected outcomes

- Room creation returns a unique code and assigns the creator as host.
- Join failures show a clear user-facing error.
- Lobby state remains isolated per room.
- Lobby changes appear on the next polling cycle, typically within 1500-2500 ms.
- Start is blocked until the host has at least two players in the room.
