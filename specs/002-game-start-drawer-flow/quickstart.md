# Quickstart: Game Start & Drawer Flow

## Prerequisites

- Backend dependencies installed.
- Frontend dependencies installed.
- Two browser tabs or windows available for manual verification.

## Run the app

1. Start the backend:

```bash
cd backend && npm run dev
```

2. Start the frontend:

```bash
cd frontend && npm run dev
```

## Validate the flow

### 1. Trimmed names

- Open the create-room flow.
- Submit a name with surrounding spaces, for example `"  Alice  "`.
- Expected: the stored/displayed name is `Alice`.
- Submit a blank or whitespace-only name.
- Expected: the request is rejected with a clear empty-name error.

### 2. Start game and role assignment

- Create a room in tab A.
- Join the same room from tab B.
- Start the game from tab A.
- Expected in both tabs: the room transitions to `game`, the host is labeled as
  the drawer, and everyone else is labeled as a guesser.

### 3. Drawer-only secret word

- Inspect the game state response in the network tab for both viewers.
- Expected for the drawer: the response includes `currentWord`.
- Expected for a guesser: the response omits `currentWord` entirely.

### 4. Host/drawer leaves mid-game

- Start a game, then close the drawer tab or trigger leave on the drawer.
- Expected: the room is deleted, polling clients clear state, and the room no
  longer loads on refresh.

## References

- Data model: [data-model.md](./data-model.md)
- HTTP contract: [contracts/room-http.md](./contracts/room-http.md)

