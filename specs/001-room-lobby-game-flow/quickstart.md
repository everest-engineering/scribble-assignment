# Quickstart: Room Setup and Lobby

## Start the backend

```bash
cd backend
npm run dev
```

Backend defaults to `http://localhost:3001`.

## Start the frontend

```bash
cd frontend
npm run dev
```

Frontend defaults to `http://localhost:5173` and uses `http://localhost:3001` for the API unless `VITE_API_URL` is set.

## Manual Validation

1. Create a room with a non-empty player name.
2. Confirm the creator appears in the lobby as host.
3. Try creating or joining with whitespace-only names and confirm clear validation messages.
4. Try joining with an empty or invalid room code and confirm clear feedback with form values preserved.
5. Join the room from a second browser tab and confirm the lobby updates within about 2 seconds.
6. Create a second room and confirm participants do not leak between rooms.
7. Confirm the host cannot start with one player.
8. Confirm a non-host cannot start.
9. Confirm the host can start once at least two players are present.
