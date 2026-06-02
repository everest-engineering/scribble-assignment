# Quickstart: Gameplay Flow Build-Out

## Run the Backend

1. Open a terminal.
2. Navigate to the backend directory:

```bash
cd backend
```

3. Install dependencies:

```bash
npm install
```

4. Start the backend:

```bash
npm run dev
```

5. Confirm the backend is running by visiting:

```text
http://localhost:3001/health
```

## Run the Frontend

1. Open a second terminal.
2. Navigate to the frontend directory:

```bash
cd frontend
```

3. Install dependencies:

```bash
npm install
```

4. Start the frontend:

```bash
npm run dev
```

5. Open the app in the browser at the URL shown by Vite (usually `http://localhost:5173`).

## Verify the Feature Flow

- Create a room and confirm the room code appears in the lobby.
- Open a second browser tab, join with the same code, and verify the second player appears in the lobby.
- Verify the lobby auto-refresh updates participants within ~2 seconds.
- Start the game as the host and confirm the drawer sees the secret word.
- Submit a guess from a guesser tab and confirm it appears in all tabs.
- End the round, verify the result view, and restart to return to the lobby.

- After a correct guess, verify the guesser receives points (100) and the scoreboard reflects cumulative scores.
- As the host, use the Restart action in the results panel to return to the lobby and begin a new round.

## Notes

- If the backend is running on a non-default address, set `VITE_API_URL` in `frontend/.env` or your shell before launching the frontend.
- Backend room state is in-memory only; restarting the backend clears all rooms.
