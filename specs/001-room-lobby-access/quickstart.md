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
4. Wait one 2000 ms polling cycle and confirm the lobby updates without manual
   refresh.
5. Join a different room code in a third tab and confirm the participants do not
   mix between rooms.
6. Try joining with an empty or invalid code and confirm the UI shows a clear
   error.
7. With only one player in a room, verify the host cannot start the game.
8. Add a second player and verify only the host can click `Start Game`.
9. If the host leaves before the game starts, confirm the room is deleted and
   the remaining participants are redirected home on the next poll.
10. Open the room page in a tab, navigate away, and confirm polling stops.

## Expected outcomes

- Room creation returns a unique code and assigns the creator as host.
- Join failures show a clear user-facing error.
- Lobby state remains isolated per room.
- Lobby changes appear on the next polling cycle, typically within 2000 ms.
- Start is blocked until the host has at least two players in the room.
- Host departure before game start deletes the room and returns participants
  home.
- Polling stops when the participant leaves the room page or closes the tab.
