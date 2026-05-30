# Quickstart: Scenario 2 Game Start & Drawer Flow

## Prerequisites

- Node.js 18+ and npm 9+
- At least two browser tabs
- Scenario 1 room setup and lobby behavior working locally

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

## Validate Scenario 2

1. Open the frontend in Tab A and try creating a room with a whitespace-only
   name.
2. Confirm the create flow rejects the request with a clear validation message.
3. Create a room in Tab A with a name that has leading/trailing spaces.
4. Confirm the accepted player name appears trimmed in the lobby.
5. Open Tab B and try joining the same room with a whitespace-only name.
6. Confirm the join flow rejects the request with a clear validation message.
7. Join the room in Tab B with a valid name containing extra spaces.
8. Confirm the joined player appears in the lobby with the trimmed name.
9. Start the game from Tab A.
10. Confirm the host is identified as the drawer unless host state is
    intentionally unavailable.
11. Confirm Tab A sees the actual secret word.
12. Confirm Tab B does not see the actual secret word value.
13. Repeat the same room-state start path and confirm the same drawer and word
    are selected for that state.

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
