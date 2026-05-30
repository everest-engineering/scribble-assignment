# Quickstart: Room Lobby Game Flow

## Start the backend

```bash
cd backend
npm run dev
```

- The backend runs on `http://localhost:3001` by default.
- It exposes room creation, join, fetch, start, drawing, guess, and restart endpoints.

## Start the frontend

```bash
cd frontend
npm run dev
```

- The frontend runs on `http://localhost:5173` by default.
- It uses `VITE_API_URL` from environment variables or defaults to `http://localhost:3001`.

## Manual flow validation

1. Open the app and create a room with a display name.
2. Confirm the lobby page shows the generated room code and participant list.
3. Open a second browser tab, join the room with the code, and confirm both players appear.
4. Confirm the lobby participant list updates automatically within about 2 seconds.
5. As the host, press `Start Game` and confirm both players reach `/game`.
6. Confirm only the drawer sees the secret word during active play.
7. Draw on the canvas as the drawer and confirm the guesser sees the drawing after polling.
8. Submit an incorrect guess and confirm it appears in the guess history.
9. Submit the correct word and confirm both players see the results screen with the correct word, winner, and all scores.
10. As the host, press `Restart Game` and confirm both players return to the lobby with scores, guesses, and drawing cleared.

## Error flow validation

- Submit a join request with an invalid room code to confirm an error message appears.
- Submit blank player names or blank guesses to confirm validation messages appear.
- Refresh the lobby when the backend is unavailable to confirm a retryable error state.
- Navigate directly to `/lobby` or `/game` without room state to verify the app redirects to `/`.
