# Quickstart: Scenario 1 Room Setup & Lobby

## Prerequisites

- Node.js 18+ and npm 9+
- Two browser tabs for multiplayer validation

## Run the apps

```bash
cd backend
npm install
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

## Validate Scenario 1

1. Open the frontend in Tab A and create a room.
2. Confirm Tab A lands in the lobby and the creator is identified as the host.
3. In Tab A, confirm the start control is blocked while only one player is in
   the room.
4. Open Tab B, navigate to Join Room, and submit an empty room code.
5. Confirm Tab B stays on the join flow and shows a clear validation message.
6. In Tab B, submit an unknown room code.
7. Confirm Tab B stays on the join flow and shows a clear invalid-room message.
8. In Tab B, join the valid room created in Tab A.
9. Confirm Tab A shows the new participant within about 2 seconds without using
   a manual refresh action.
10. In Tab B, confirm the player cannot start the game.
11. In Tab A, start the game as host.
12. Confirm both tabs leave the lobby and land on the existing game placeholder.

## Validate room isolation

1. Create a second room in another tab or browser window.
2. Join only that second room with an additional tab.
3. Confirm each lobby shows only its own participant list and state.

## Automated checks

```bash
cd backend
npm test
npm run build
```

```bash
cd frontend
npm test
npm run build
```
